import { GoogleGenAI } from "@google/genai";
import { AUTO_PLANNER_SYSTEM_PROMPT } from "../constants";

export type AIChannel = 'google' | 'openai' | 'compatible' | 'openrouter';

/**
 * 网络请求配置：控制重试次数与探测频率
 */
export const NETWORK_CONFIG = {
  MIN_CHECK_INTERVAL: 30000,   // 两次检查之间的最小强制间隔 (30秒)
  REQUEST_TIMEOUT: 10000,      // 请求超时 (10秒)
  PENALTY_DELAY: 45000         // 遇到 429 后的额外惩罚延迟 (45秒)
};

// 内部状态追踪
let lastCheckTime = 0;
let cachedReport: ConnectivityReport | null = null;

export interface ModelInstance {
  id: string;
  name: string;
  modelId: string;
  isPrimary: boolean;
  isSecondary: boolean;
  customParams?: string; // JSON string
}

export interface AIConfig {
  id: string;
  channel: AIChannel;
  apiKey: string;
  baseUrl?: string;
  models: ModelInstance[];
  isInternal?: boolean; // 标识是否为 aistudio 平台内置
}

export interface ConnectivityReport {
  success: boolean;
  message: string;
  latency?: number;
  modelId?: string;
  channel?: string;
  timestamp: number;
}

const INTERNAL_CONFIG: AIConfig = {
  id: 'google-internal',
  channel: 'google',
  apiKey: '', 
  isInternal: true,
  models: [
    { id: 'm-internal', name: 'Studio Native (Gemini 3 Pro)', modelId: 'gemini-3-pro-preview', isPrimary: true, isSecondary: false }
  ]
};

export const getConfigs = (): AIConfig[] => {
  const saved = localStorage.getItem('ai_planner_configs_v5');
  let parsed: AIConfig[] = [];
  if (saved) {
    try {
      parsed = JSON.parse(saved);
    } catch (e) {
      parsed = [];
    }
  }

  const internalInList = parsed.find(c => c.id === INTERNAL_CONFIG.id);
  
  if (!internalInList) {
    return [INTERNAL_CONFIG, ...parsed];
  } else {
    return parsed.map(c => c.id === INTERNAL_CONFIG.id ? { 
      ...INTERNAL_CONFIG, 
      models: INTERNAL_CONFIG.models.map(m => ({
        ...m,
        isPrimary: c.models.some(cm => cm.isPrimary && cm.id === m.id)
      }))
    } : c);
  }
};

export const getActiveModel = () => {
  const configs = getConfigs();
  const userPrimary = configs.find(c => c.models.some(m => m.isPrimary));
  if (userPrimary) {
    const model = userPrimary.models.find(m => m.isPrimary)!;
    return { config: userPrimary, model };
  }
  return { config: INTERNAL_CONFIG, model: INTERNAL_CONFIG.models[0] };
};

/**
 * 带有冷却机制的连通性检查，防止 429 报错无限产生
 * @param force 是否忽略频率限制强制发起请求
 */
export const checkConnectivity = async (force: boolean = false): Promise<ConnectivityReport> => {
  const now = Date.now();
  
  // 冷却判定：如果未强制且未过冷却期，直接返回上一次缓存
  if (!force && cachedReport && (now - lastCheckTime < NETWORK_CONFIG.MIN_CHECK_INTERVAL)) {
    console.debug('Connectivity check skipped due to cooling period.');
    return { ...cachedReport, timestamp: now };
  }

  const { config, model } = getActiveModel();
  const start = Date.now();
  
  try {
    let report: ConnectivityReport;
    if (config.channel === 'google') {
      const key = (config.isInternal ? process.env.API_KEY : config.apiKey) || process.env.API_KEY || '';
      if (!key) return { success: false, message: "API Key missing", channel: 'Google', timestamp: now };
      
      const ai = new GoogleGenAI({ apiKey: key });
      // 这里的 generateContent 是受限的，不要频繁调用
      await ai.models.generateContent({
        model: model.modelId,
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        config: { maxOutputTokens: 1 }
      });
      
      report = { 
        success: true, 
        message: "Handshake Successful", 
        latency: Date.now() - start, 
        modelId: model.modelId, 
        channel: config.isInternal ? 'Studio Internal' : 'Google Cloud',
        timestamp: Date.now()
      };
    } else {
      const url = config.channel === 'openrouter' 
        ? "https://openrouter.ai/api/v1/chat/completions" 
        : `${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
      
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), NETWORK_CONFIG.REQUEST_TIMEOUT);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model.modelId, messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 }),
        signal: controller.signal
      });
      clearTimeout(tId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      report = { 
        success: true, 
        message: "Gateway Response OK", 
        latency: Date.now() - start, 
        modelId: model.modelId, 
        channel: config.channel,
        timestamp: Date.now()
      };
    }

    lastCheckTime = Date.now();
    cachedReport = report;
    return report;

  } catch (e: any) {
    const isRateLimit = e.message?.includes('429') || e.status === 429;
    
    // 如果是 429 速率限制，人为向后推迟下一次允许检查的时间点
    if (isRateLimit) {
        lastCheckTime = Date.now() + NETWORK_CONFIG.PENALTY_DELAY;
    } else {
        lastCheckTime = Date.now();
    }

    const errorReport = { 
        success: false, 
        message: isRateLimit ? "Rate Limit (429): Retrying in 45s" : (e.message || "Unknown error"), 
        channel: config.channel,
        timestamp: Date.now()
    };
    cachedReport = errorReport;
    return errorReport;
  }
};

export const generateProjectPlan = async (
  userIntent: string, 
  existingFileSummary: string | null,
  onStream: (chunk: string) => void
) => {
  const { config, model } = getActiveModel();
  const systemPrompt = AUTO_PLANNER_SYSTEM_PROMPT;
  const prompt = existingFileSummary ? `[CONTEXT]\n${existingFileSummary}\n\n[USER]\n${userIntent}` : userIntent;

  if (config.channel === 'google') {
    const key = (config.isInternal ? process.env.API_KEY : config.apiKey) || process.env.API_KEY || '';
    if (!key) throw new Error("API Key is missing.");

    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContentStream({
      model: model.modelId,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: systemPrompt, temperature: 0.7 }
    });
    
    for await (const chunk of result) {
      if (chunk.text) onStream(chunk.text);
    }
  } else {
    const baseUrl = config.channel === 'openrouter' ? "https://openrouter.ai/api/v1" : (config.baseUrl || "https://api.openai.com/v1");
    const headers: Record<string, string> = { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' };
    
    let extraParams = {};
    if (model.customParams) {
      try { extraParams = JSON.parse(model.customParams); } catch (e) {}
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model.modelId,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
        stream: true,
        ...extraParams
      }),
    });

    if (!response.ok) throw new Error(`Provider error: ${response.status}`);
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        const data = line.replace("data: ", "");
        if (data === "[DONE]") break;
        try {
          const json = JSON.parse(data);
          const content = json.choices[0]?.delta?.content;
          if (content) onStream(content);
        } catch {}
      }
    }
  }
};