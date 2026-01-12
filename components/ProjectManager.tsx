import React, { useState } from 'react';
import { Folder, Plus, FileCode, Trash2, Box, Edit2, Check, X } from 'lucide-react';
import { Project, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ProjectManagerProps {
  projects: Project[];
  activeProjectId: string | null;
  currentLanguage: Language;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onLanguageChange: (lang: Language) => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  activeProjectId,
  currentLanguage,
  onSelectProject,
  onNewProject,
  onDeleteProject,
  onRenameProject,
  onLanguageChange
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const t = TRANSLATIONS[currentLanguage];

  const startEditing = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditName(project.name);
  };

  const saveEdit = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editingId && editName.trim()) {
      onRenameProject(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      {/* Header */}
      <div className="flex flex-col bg-slate-800 border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">{t.projects}</h2>
            </div>
            <button
            onClick={onNewProject}
            className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
            title={t.newProject}
            >
            <Plus className="w-4 h-4" />
            </button>
        </div>
        
        {/* Language Selector */}
        <div className="px-4 pb-2">
            <select 
                value={currentLanguage} 
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="w-full bg-slate-900 text-slate-400 text-xs border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
            >
                <option value="en">English</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="es">Español (Spanish)</option>
                <option value="pt">Português (Portuguese)</option>
            </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
              activeProjectId === project.id
                ? 'bg-indigo-900/30 border-indigo-500/50'
                : 'bg-transparent border-transparent hover:bg-slate-800'
            }`}
          >
            <div className={`mt-1 p-1.5 rounded-md ${
                activeProjectId === project.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'
            }`}>
              <Folder className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              {editingId === project.id ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-950 text-slate-200 text-xs px-1 py-0.5 rounded border border-indigo-500 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button onClick={saveEdit} className="text-emerald-400 hover:text-emerald-300"><Check className="w-3 h-3" /></button>
                      <button onClick={cancelEdit} className="text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
                  </div>
              ) : (
                <div className="flex items-center justify-between group/title">
                    <h3 className={`text-sm font-medium truncate ${
                        activeProjectId === project.id ? 'text-indigo-200' : 'text-slate-300'
                    }`}>
                    {project.name}
                    </h3>
                    <button 
                        onClick={(e) => startEditing(project, e)}
                        className="opacity-0 group-hover/title:opacity-100 text-slate-500 hover:text-indigo-400 transition-opacity"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                </div>
              )}
              
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {project.description || 'No description'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                   project.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' :
                   project.status === 'active' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                   'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {project.status}
                </span>
                <span className="text-[10px] text-slate-600">
                    {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/30 hover:text-red-400 text-slate-600 rounded transition-all"
                title={t.delete}
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {projects.length === 0 && (
            <div className="text-center py-10 px-4">
                <FileCode className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">{t.noProjects}</p>
                <button 
                    onClick={onNewProject}
                    className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                    {t.createFirst}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManager;