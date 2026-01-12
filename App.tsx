import React, { useState, useEffect } from 'react';
import ProjectManager from './components/ProjectManager';
import AIWorkspace from './components/AIWorkspace';
import SystemTerminal from './components/SystemTerminal';
import FileExplorer from './components/FileExplorer';
import AIConfigModal from './components/AIConfigModal';
import { Project, LogEntry, Language, Version, ProjectFile } from './types';
import { MOCK_PROJECTS, INITIAL_LOGS, TRANSLATIONS } from './constants';
import { generateProjectPlan, checkConnectivity } from './services/geminiService';
import { parseFilesFromMarkdown } from './utils/fileHelpers';

type ViewMode = 'architect' | 'explorer';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  
  const [language, setLanguage] = useState<Language>('en');
  const [viewMode, setViewMode] = useState<ViewMode>('architect');
  const [lastParsedFileCount, setLastParsedFileCount] = useState(0);
  
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const t = TRANSLATIONS[language];

  const addLog = (message: string, level: LogEntry['level'] = 'info', phase?: string) => {
    setLogs(prev => [...prev, {
      id: `l-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      phase
    }]);
  };

  const runConnectivityTest = async () => {
    addLog('Testing AI Orchestrator connectivity...', 'system', 'Network');
    const report = await checkConnectivity();
    
    if (report.success) {
      const banner = `
╔══════════════════════════════════════════╗
║  API CONNECTION VERIFIED: ONLINE         ║
╚══════════════════════════════════════════╝
CHANNEL : ${report.channel}
MODEL   : ${report.modelId}
LATENCY : ${report.latency}ms
STATUS  : ${report.message}
      `.trim();
      addLog(banner, 'success', 'Verified');
    } else {
      addLog(`CRITICAL: Connection failed to ${report.channel}.\nREASON: ${report.message}`, 'error', 'Failed');
    }
  };

  const handleNewProject = () => {
    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: `Untitled-Project-${projects.length + 1}`,
      status: 'active',
      description: 'New empty project',
      createdAt: new Date().toISOString(),
      files: [],
      versions: []
    };
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setGeneratedContent('');
    setViewMode('architect');
    addLog(`Created new project: ${newProject.name}`, 'info', 'System');
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    addLog(`Deleted project ${id}`, 'warn', 'System');
  };

  const handleRenameProject = (id: string, newName: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, name: newName };
      }
      return p;
    }));
    addLog(`Renamed project to ${newName}`, 'info', 'System');
  };

  const handleCommit = (projectId: string, message: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newVersion: Version = {
          id: `v-${Date.now()}`,
          message,
          timestamp: new Date().toISOString(),
          files: JSON.parse(JSON.stringify(p.files)) 
        };
        return {
          ...p,
          versions: [...p.versions, newVersion],
          activeVersionId: newVersion.id
        };
      }
      return p;
    }));
    addLog('Version committed successfully', 'success', 'VCS');
  };

  const handleRevert = (projectId: string, versionId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const target = p.versions.find(v => v.id === versionId);
        if (target) {
          return {
            ...p,
            files: JSON.parse(JSON.stringify(target.files)),
            activeVersionId: versionId
          };
        }
      }
      return p;
    }));
    addLog('Reverted to selected version', 'warn', 'VCS');
  };

  const handleDeleteVersion = (projectId: string, versionId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          versions: p.versions.filter(v => v.id !== versionId)
        };
      }
      return p;
    }));
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setGeneratedContent('');
    setViewMode('explorer');
  };

  const handleAIRequest = async (intent: string) => {
    if (isGenerating || !activeProject) return;
    setIsGenerating(true);
    setGeneratedContent('');
    setViewMode('architect');

    const visibleFiles = activeProject.files.filter(f => !f.name.startsWith('.'));
    const isNewProject = visibleFiles.length === 0;
    
    let existingFileSummary = null;
    if (!isNewProject) {
        existingFileSummary = visibleFiles.map(f => `- ${f.name} (${f.language})`).join('\n');
    }

    addLog(`Initializing request: ${intent.substring(0, 40)}...`, 'info', 'Intake');

    try {
      let fullContent = '';
      await generateProjectPlan(intent, existingFileSummary, (chunk) => {
        fullContent += chunk;
        setGeneratedContent(fullContent);
      });
      
      const parsedFiles = parseFilesFromMarkdown(fullContent);
      setLastParsedFileCount(parsedFiles.length);

      if (parsedFiles.length > 0 || fullContent.length > 0) {
         setProjects(prev => prev.map(p => {
             if (p.id === activeProjectId) {
                 const newFilesMap = new Map<string, ProjectFile>(p.files.map(f => [f.name, f]));
                 parsedFiles.forEach(f => newFilesMap.set(f.name, f));
                 
                 const timestamp = new Date().toISOString();
                 const historyFile = newFilesMap.get('.conversation_history');
                 let historyContent = historyFile ? historyFile.content : '';
                 historyContent += `\n\n--- ${timestamp} ---\nUSER: ${intent}\n`;
                 newFilesMap.set('.conversation_history', { name: '.conversation_history', content: historyContent, language: 'text' });

                 return {
                     ...p,
                     files: Array.from(newFilesMap.values()),
                     status: 'completed',
                     description: intent.substring(0, 50) + (intent.length > 50 ? '...' : '')
                 };
             }
             return p;
         }));
         addLog(`Successfully generated ${parsedFiles.length} modules.`, 'success', 'Generator');
      } 
    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error', 'System');
      addLog(`Try re-checking configuration in Terminal.`, 'warn', 'Fix');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col text-slate-200 overflow-hidden font-sans">
      <div className="h-1/2 flex border-b border-slate-700/50">
        <div className="w-1/3 min-w-[300px] h-full border-r border-slate-700/50">
          <ProjectManager 
            projects={projects}
            activeProjectId={activeProjectId}
            currentLanguage={language}
            onSelectProject={handleSelectProject}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
            onRenameProject={handleRenameProject}
            onLanguageChange={setLanguage}
          />
        </div>
        <div className="flex-1 h-full relative flex">
           {activeProject && (
               <div className={`flex-1 h-full ${viewMode === 'explorer' ? 'block' : 'hidden'}`}>
                   <FileExplorer 
                     project={activeProject}
                     language={language}
                     onCommit={handleCommit}
                     onRevert={handleRevert}
                     onDeleteVersion={handleDeleteVersion}
                   />
               </div>
           )}
           <div className={`${viewMode === 'architect' ? 'flex-1 relative h-full' : 'absolute top-0 right-0 pointer-events-none'}`}>
               <div className={`${viewMode === 'architect' ? 'h-full' : 'pointer-events-auto'}`}>
                    <AIWorkspace 
                        isGenerating={isGenerating}
                        generatedContent={generatedContent}
                        onGenerate={handleAIRequest}
                        onCancel={() => setIsGenerating(false)}
                        logs={logs}
                        isCollapsed={viewMode === 'explorer'}
                        onToggleCollapse={() => setViewMode(viewMode === 'architect' ? 'explorer' : 'architect')}
                        language={language}
                        hasUncommittedChanges={lastParsedFileCount > 0}
                    />
               </div>
           </div>
        </div>
      </div>
      <div className="h-1/2 w-full">
         <SystemTerminal 
            logs={logs} 
            onOpenConfig={() => setIsConfigOpen(true)} 
         />
      </div>

      <AIConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)}
        onSave={runConnectivityTest}
        language={language}
      />
    </div>
  );
};

export default App;