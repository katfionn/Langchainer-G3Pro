export type Language = 'en' | 'zh' | 'es' | 'pt';

export interface Version {
  id: string;
  message: string;
  timestamp: string;
  files: ProjectFile[];
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'generating' | 'completed' | 'error';
  description: string;
  createdAt: string;
  files: ProjectFile[];
  versions: Version[];
  activeVersionId?: string | null; // Track which version we are currently "sitting" on
}

export interface ProjectFile {
  name: string;
  content: string;
  language: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'system';
  message: string;
  phase?: string; // e.g., "Intake", "Decomposition"
}

export enum AppPhase {
  IDLE = 'IDLE',
  INTAKE = 'INTAKE',
  PLANNING = 'PLANNING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
}

export interface GenerationRequest {
  intent: string;
  mode: 'new' | 'repair';
  useParallelism: boolean;
}