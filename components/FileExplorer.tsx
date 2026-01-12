import React, { useState } from 'react';
import { FileText, Download, GitCommit, GitBranch, RotateCcw, X, FileCode, Trash2 } from 'lucide-react';
import { Project, ProjectFile, Version, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { downloadFile, downloadProjectZip } from '../utils/fileHelpers';
import ReactMarkdown from 'react-markdown';

interface FileExplorerProps {
  project: Project;
  language: Language;
  onCommit: (projectId: string, message: string) => void;
  onRevert: (projectId: string, versionId: string) => void;
  onDeleteVersion: (projectId: string, versionId: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  project,
  language,
  onCommit,
  onRevert,
  onDeleteVersion
}) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const t = TRANSLATIONS[language];

  // Helper to format path display
  const getDisplayName = (path: string) => {
     return path.replace(/^\.\//, '');
  };

  // Filter out hidden files (start with .)
  const visibleFiles = project.files.filter(f => !f.name.startsWith('.'));

  const handleCommit = () => {
    if (commitMessage.trim()) {
      onCommit(project.id, commitMessage);
      setCommitMessage('');
      setShowVersions(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-slate-100">{t.files}</h2>
          <span className="text-xs text-slate-500">
             ({project.name})
          </span>
        </div>
        <div className="flex items-center gap-2">
           <button
             onClick={() => setShowVersions(!showVersions)}
             className={`p-1.5 rounded-md transition-colors ${showVersions ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
             title="Version Control"
           >
             <GitBranch className="w-4 h-4" />
           </button>
           {/* Fix No.1: Download current project state */}
           <button
             onClick={() => downloadProjectZip(project.name, project.files)}
             className="p-1.5 hover:bg-slate-700 rounded-md transition-colors text-slate-400 hover:text-white"
             title={t.downloadAll}
           >
             <Download className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Version Sidebar (Conditional) */}
        {showVersions && (
          <div className="w-64 border-r border-slate-700 bg-slate-800/50 flex flex-col">
             <div className="p-3 border-b border-slate-700">
                <h3 className="text-xs font-semibold text-slate-300 mb-2">{t.commit}</h3>
                <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder={t.versionMsg}
                      className="w-full bg-slate-900 text-slate-200 text-xs p-2 rounded border border-slate-600 focus:border-indigo-500 outline-none"
                    />
                    <button
                      onClick={handleCommit}
                      disabled={!commitMessage.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs py-1.5 rounded flex items-center justify-center gap-1"
                    >
                       <GitCommit className="w-3 h-3" />
                       {t.saveVersion}
                    </button>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-2">
                <h3 className="text-xs font-semibold text-slate-400 mb-2 px-1">History</h3>
                {project.versions.slice().reverse().map(v => (
                    <div key={v.id} className="p-2 mb-2 rounded bg-slate-900 border border-slate-700 hover:border-slate-500 group/item relative">
                        <div className="flex justify-between items-start mb-1 pr-6">
                            <span className="text-xs text-indigo-300 font-medium truncate w-full" title={v.message}>
                                {v.message}
                                {project.activeVersionId === v.id && (
                                    <span className="ml-2 text-emerald-500 font-bold">*</span>
                                )}
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-600">
                            {new Date(v.timestamp).toLocaleString()}
                        </div>
                        
                        <div className="flex absolute top-2 right-2 gap-1">
                             <button
                                onClick={() => {
                                    if(confirm('Revert to this version? Current changes will be lost.')) {
                                        onRevert(project.id, v.id);
                                        setShowVersions(false);
                                    }
                                }}
                                className="text-slate-500 hover:text-emerald-400 p-0.5"
                                title={t.restore}
                            >
                                <RotateCcw className="w-3 h-3" />
                            </button>
                            {/* Addition No.3: Delete Version */}
                            <button
                                onClick={() => {
                                    if(confirm('Delete this version record?')) {
                                        onDeleteVersion(project.id, v.id);
                                    }
                                }}
                                className="text-slate-500 hover:text-red-400 p-0.5"
                                title="Delete Version"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleFiles.map((file, idx) => (
                  <div 
                    key={idx}
                    className="group relative bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-indigo-500 transition-all cursor-pointer"
                    onClick={() => setSelectedFile(file)}
                  >
                     <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-slate-900 text-indigo-400">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-200 truncate" title={file.name}>
                                {getDisplayName(file.name)}
                            </h4>
                            <span className="text-xs text-slate-500 uppercase">{file.language}</span>
                        </div>
                     </div>
                     <button
                        onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(file);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900 text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                        title={t.download}
                     >
                        <Download className="w-3.5 h-3.5" />
                     </button>
                  </div>
              ))}
              {visibleFiles.length === 0 && (
                  <div className="col-span-full text-center py-10 text-slate-500 text-sm">
                      {t.emptyFiles}
                  </div>
              )}
           </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 w-full max-w-4xl h-[80vh] rounded-lg border border-slate-700 flex flex-col shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/50">
                      <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <span className="font-mono text-sm text-slate-200">{selectedFile.name}</span>
                      </div>
                      <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-white">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-auto p-0 custom-scrollbar bg-[#0d1117]">
                      <ReactMarkdown
                        components={{
                            code({node, inline, className, children, ...props}: any) {
                                return (
                                    <code className={`block p-4 font-mono text-sm ${className || ''}`} {...props} style={{ whiteSpace: 'pre' }}>
                                        {children}
                                    </code>
                                )
                            }
                        }}
                      >
                          {`\`\`\`${selectedFile.language}\n${selectedFile.content}\n\`\`\``}
                      </ReactMarkdown>
                  </div>
                  <div className="px-4 py-2 border-t border-slate-800 bg-slate-800/50 flex justify-end">
                       <button
                         onClick={() => downloadFile(selectedFile)}
                         className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs"
                       >
                           <Download className="w-3.5 h-3.5" />
                           {t.download}
                       </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FileExplorer;