
import { Language, Project, LogEntry } from './types';

export const AUTO_PLANNER_SYSTEM_PROMPT = `
You are the "LangChain AutoPlanner Generator" (Version 3.0).
Your core goal is to transform user requirements into modular LangChain workflows with intelligent task decomposition.

Logic Engine Phases:
1. Parse user requirement -> Extract core intent.
2. Identify required AI models.
3. Auto-split into N primary modules.
4. Generate parallel node variants if needed.
5. Generate complete LangChain code structure.

Output Rules:
- Output MUST be structured Markdown.
- Explain the logic before showing code.
- When generating files, YOU MUST follow this EXACT format for EVERY file so the system can parse it:

**File: path/to/filename.ext**
\`\`\`language
<code content here>
\`\`\`

- Do not use "FILE:" or "Filename:" or other variations. Use "**File: path**" (bold).
- Provide a file tree structure summary at the end.
- Assume the user is non-technical but needs a robust result.

Config System:
- Use ai_models.yml for configuration.
- Support multi-model routing.
`;

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: 'RAG-PDF-Analyzer',
    status: 'completed',
    description: 'Autonomous PDF ingestion and QA system using vector store.',
    createdAt: '2023-10-27T10:00:00Z',
    files: [
      { name: 'main.py', content: 'print("Hello World")', language: 'python' }
    ],
    versions: []
  },
  {
    id: 'p-2',
    name: 'Marketing-Agent-Swarm',
    status: 'active',
    description: 'Multi-agent system for generating social media content.',
    createdAt: '2023-10-28T14:30:00Z',
    files: [],
    versions: []
  }
];

export const INITIAL_LOGS: LogEntry[] = [
  { id: 'l-0', timestamp: new Date().toISOString(), level: 'system', message: 'System initialized. Environment: Production.' },
  { id: 'l-1', timestamp: new Date().toISOString(), level: 'info', message: 'LangChain Core v0.2.14 loaded.' },
  { id: 'l-2', timestamp: new Date().toISOString(), level: 'info', message: 'Gemini 3 Pro Preview adapter ready.' },
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    projects: "Projects",
    newProject: "New Project",
    noProjects: "No projects yet.",
    createFirst: "Create your first planner",
    aiArchitect: "AI Architect",
    expand: "Expand",
    collapse: "Collapse",
    describeReq: "Describe your LangChain requirement...",
    stop: "Stop",
    execute: "Execute",
    continue: "Continue",
    planPreview: "Plan Preview",
    rawOutput: "Raw Output",
    downloadPlan: "Download Plan",
    readyToGen: "Ready to generate",
    initializing: "Initializing AutoPlanner...",
    terminal: "TERMINAL",
    secure: "SECURE CONNECTION",
    online: "ONLINE",
    files: "Files",
    commit: "Commit",
    revert: "Revert",
    download: "Download",
    downloadAll: "Download All",
    preview: "Preview",
    rename: "Rename",
    delete: "Delete",
    versionMsg: "Version message...",
    saveVersion: "Save Version",
    restore: "Restore",
    emptyFiles: "No files generated yet.",
    language: "Language",
    // Config Modal
    aiOrchestrator: "AI Orchestrator",
    configModels: "Configure primary and secondary reasoning engines",
    channels: "Channels",
    providerType: "Provider Type",
    apiKey: "API Access Key",
    baseUrl: "Base API URL",
    modelInventory: "Model Inventory",
    addModel: "Add Model Instance",
    primary: "PRIMARY",
    secondary: "SECONDARY",
    extraPayload: "Extra Payload (JSON)",
    saveConfig: "Save Configuration",
    internalWarning: "Studio channel uses Gemini 3 Pro with managed keys.",
    managedKey: "Platform API Key (Managed)"
  },
  zh: {
    projects: "项目列表",
    newProject: "新建项目",
    noProjects: "暂无项目",
    createFirst: "创建您的第一个规划器",
    aiArchitect: "AI 架构师",
    expand: "展开",
    collapse: "折叠",
    describeReq: "描述您的 LangChain 需求...",
    stop: "停止",
    execute: "执行",
    continue: "继续",
    planPreview: "方案预览",
    rawOutput: "原始输出",
    downloadPlan: "下载方案",
    readyToGen: "准备生成",
    initializing: "正在初始化 AutoPlanner...",
    terminal: "系统终端",
    secure: "安全连接",
    online: "在线",
    files: "文件列表",
    commit: "提交版本",
    revert: "回滚版本",
    download: "下载",
    downloadAll: "下载全部",
    preview: "预览",
    rename: "重命名",
    delete: "删除",
    versionMsg: "版本描述...",
    saveVersion: "保存版本",
    restore: "恢复",
    emptyFiles: "尚未生成文件。",
    language: "语言",
    // Config Modal
    aiOrchestrator: "AI 编排器",
    configModels: "配置主/备推理引擎及路由规则",
    channels: "渠道列表",
    providerType: "服务商类型",
    apiKey: "API 访问密钥",
    baseUrl: "接口代理地址 (Base URL)",
    modelInventory: "模型清单",
    addModel: "添加模型实例",
    primary: "主模型",
    secondary: "备用模型",
    extraPayload: "额外参数 (JSON)",
    saveConfig: "保存配置",
    internalWarning: "内置 Studio 渠道使用 Gemini 3 Pro，支持免 Key 测试。",
    managedKey: "平台托管密钥"
  },
  es: {
    projects: "Proyectos",
    newProject: "Nuevo Proyecto",
    noProjects: "No hay proyectos.",
    createFirst: "Crea tu primer planificador",
    aiArchitect: "Arquitecto IA",
    expand: "Expandir",
    collapse: "Colapsar",
    describeReq: "Describe tu requerimiento LangChain...",
    stop: "Detener",
    execute: "Ejecutar",
    continue: "Continuar",
    planPreview: "Vista Previa",
    rawOutput: "Salida Bruta",
    downloadPlan: "Descargar Plan",
    readyToGen: "Listo para generar",
    initializing: "Inicializando AutoPlanner...",
    terminal: "TERMINAL",
    secure: "CONEXIÓN SEGURA",
    online: "EN LÍNEA",
    files: "Archivos",
    commit: "Confirmar",
    revert: "Revertir",
    download: "Descargar",
    downloadAll: "Descargar Todo",
    preview: "Vista Previa",
    rename: "Renombrar",
    delete: "Eliminar",
    versionMsg: "Mensaje de versión...",
    saveVersion: "Guardar Versión",
    restore: "Restaurar",
    emptyFiles: "Aún no se han generado archivos.",
    language: "Idioma",
    aiOrchestrator: "Orquestador de IA",
    configModels: "Configurar motores de razonamiento",
    channels: "Canales",
    providerType: "Tipo de proveedor",
    apiKey: "Clave de API",
    baseUrl: "URL base",
    modelInventory: "Inventario de modelos",
    addModel: "Agregar modelo",
    primary: "PRIMARIO",
    secondary: "SECUNDARIO",
    extraPayload: "JSON adicional",
    saveConfig: "Guardar configuración",
    internalWarning: "Canal Studio usa Gemini 3 Pro gestionado.",
    managedKey: "Clave gestionada"
  },
  pt: {
    projects: "Projetos",
    newProject: "Novo Projeto",
    noProjects: "Nenhum projeto ainda.",
    createFirst: "Crie seu primeiro planejador",
    aiArchitect: "Arquiteto IA",
    expand: "Expandir",
    collapse: "Colapsar",
    describeReq: "Descreva seu requisito LangChain...",
    stop: "Parar",
    execute: "Executar",
    continue: "Continuar",
    planPreview: "Prévia do Plano",
    rawOutput: "Saída Bruta",
    downloadPlan: "Baixar Plano",
    readyToGen: "Pronto para gerar",
    initializing: "Inicializando AutoPlanner...",
    terminal: "TERMINAL",
    secure: "CONEXÃO SEGURA",
    online: "ONLINE",
    files: "Arquivos",
    commit: "Commit",
    revert: "Reverter",
    download: "Baixar",
    downloadAll: "Baixar Tudo",
    preview: "Visualizar",
    rename: "Renomear",
    delete: "Excluir",
    versionMsg: "Mensagem da versão...",
    saveVersion: "Salvar Versão",
    restore: "Restaurar",
    emptyFiles: "Nenhum arquivo gerado ainda.",
    language: "Idioma",
    aiOrchestrator: "Orquestrador de IA",
    configModels: "Configurar motores de raciocínio",
    channels: "Canais",
    providerType: "Tipo de provedor",
    apiKey: "Chave API",
    baseUrl: "URL Base",
    modelInventory: "Modelos",
    addModel: "Adicionar modelo",
    primary: "PRIMÁRIO",
    secondary: "SECUNDÁRIO",
    extraPayload: "JSON extra",
    saveConfig: "Salvar configuração",
    internalWarning: "Canal Studio usa Gemini 3 Pro gerenciado.",
    managedKey: "Chave gerenciada"
  }
};
