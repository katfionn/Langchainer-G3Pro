
import { GoogleGenAI } from "@google/genai";
import { AUTO_PLANNER_SYSTEM_PROMPT } from "../constants";

export type AIChannel = 'google' | 'openai' | 'compatible' | 'openrouter';

/**
 * 网络请求配置：控制重试次数与探测频率
 */
export const NETWORK_CONFIG = {
  MIN_CHECK_INTERVAL: 20000,   
  REQUEST_TIMEOUT: 15000,      
  PENALTY_DELAY: 60000         
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
  isInternal?: boolean; 
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
  const userPrimaryConfig = configs.find(c => c.models.some(m => m.isPrimary));
  if (userPrimaryConfig) {
    const model = userPrimaryConfig.models.find(m => m.isPrimary)!;
    return { config: userPrimaryConfig, model };
  }
  return { config: INTERNAL_CONFIG, model: INTERNAL_CONFIG.models[0] };
};

/**
 * 带有跨域优化的连通性检查
 */
export const checkConnectivity = async (force: boolean = false): Promise<ConnectivityReport> => {
  const now = Date.now();
  
  if (!force && cachedReport && (now - lastCheckTime < NETWORK_CONFIG.MIN_CHECK_INTERVAL)) {
    return { ...cachedReport, timestamp: now };
  }

  const { config, model } = getActiveModel();
  const start = Date.now();
  
  try {
    if (!model.modelId && !config.isInternal) {
      throw new Error("Missing Model ID");
    }

    let report: ConnectivityReport;
    if (config.channel === 'google') {
      const key = (config.isInternal ? process.env.API_KEY : config.apiKey) || process.env.API_KEY || '';
      if (!key) return { success: false, message: "API Key missing", channel: 'Google', timestamp: now };
      
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({
        model: model.modelId || 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
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
      // 核心修正点：根据 channel 决定基础 URL
      let base = "";
      if (config.channel === 'openrouter') {
        base = "https://openrouter.ai/api/v1";
      } else if (config.channel === 'openai') {
        base = config.baseUrl || "https://api.openai.com/v1";
      } else {
        base = config.baseUrl || "";
      }
      
      base = base.trim().replace(/\/+$/, '');
      const url = `${base}/chat/completions`;
      
      const controller = new AbortController();
      const tId = setTimeout(() => controller.abort(), NETWORK_CONFIG.REQUEST_TIMEOUT);

      // 极致跨域优化：手动清理 Headers 确保简单请求特征
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: headers,
        body: JSON.stringify({ 
          model: model.modelId, 
          messages: [{ role: 'user', content: 'hi' }], 
          max_tokens: 5,
          stream: false 
        }),
        signal: controller.signal
      });
      clearTimeout(tId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = errData.error?.message || `Status: ${res.status}`;
        throw new Error(msg);
      }

      report = { 
        success: true, 
        message: "Connect OK", 
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
    let errorMsg = e.message || "Network Error";
    if (e.name === 'AbortError') errorMsg = "Request Timeout (Check Proxy/CORS)";
    if (e.message === 'Failed to fetch') errorMsg = "CORS Blocked. Ensure your proxy allows current Origin.";

    const errorReport = { 
        success: false, 
        message: errorMsg, 
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
    const ai = new GoogleGenAI({ apiKey: key });
    const result = await ai.models.generateContentStream({
      model: model.modelId || 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: systemPrompt, temperature: 0.7 }
    });
    
    for await (const chunk of result) {
      if (chunk.text) onStream(chunk.text);
    }
  } else {
    // 核心修正点：确保生成计划时也使用最新的 channel 对应 URL
    let base = "";
    if (config.channel === 'openrouter') {
      base = "https://openrouter.ai/api/v1";
    } else if (config.channel === 'openai') {
      base = config.baseUrl || "https://api.openai.com/v1";
    } else {
      base = config.baseUrl || "";
    }
    base = base.trim().replace(/\/+$/, '');
    
    let extraParams = {};
    if (model.customParams) {
      try { extraParams = JSON.parse(model.customParams); } catch (e) {}
    }

    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`, 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.modelId,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
        stream: true,
        ...extraParams
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine === "data: [DONE]") continue;
        if (cleanLine.startsWith("data: ")) {
          try {
            const json = JSON.parse(cleanLine.substring(6));
            const content = json.choices[0]?.delta?.content;
            if (content) onStream(content);
          } catch (e) {}
        }
      }
    }
  }
};
