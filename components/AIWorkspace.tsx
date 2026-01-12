import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, ChevronDown, ChevronUp, Download, Code, Loader2, XCircle, ArrowRight, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface AIWorkspaceProps {
  isGenerating: boolean;
  generatedContent: string;
  onGenerate: (prompt: string) => void;
  onCancel: () => void;
  logs: any[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  language: Language;
  hasUncommittedChanges: boolean;
}

const AIWorkspace: React.FC<AIWorkspaceProps> = ({
  isGenerating,
  generatedContent,
  onGenerate,
  onCancel,
  logs,
  isCollapsed,
  onToggleCollapse,
  language,
  hasUncommittedChanges
}) => {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[language];

  // Logic to determine if "Continue" should be shown.
  // Requirement: "If AI has output, but no modified files... button text becomes Continue and change color"
  // If `generatedContent` is present AND `!hasUncommittedChanges` (meaning parsed files count was 0 for last turn)
  // Note: hasUncommittedChanges is calculated in App based on parsing. 
  // However, `hasUncommittedChanges` means "Found files". 
  // So if `generatedContent` is not empty AND `!hasUncommittedChanges`, it implies a conversation turn or partial generation.
  // But strictly, if the user just asked "Hello", AI replied "Hi", hasUncommittedChanges is false.
  // The requirement says "Wait for user confirmation... usually shouldn't happen".
  // Simplified logic: If we have generated content, and we are not generating, show "Continue".
  const showContinue = generatedContent.length > 0 && !isGenerating && !hasUncommittedChanges;

  useEffect(() => {
    // Auto scroll to bottom of generation
    if (contentRef.current && isGenerating) {
        contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [generatedContent, isGenerating]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    if (isCollapsed) onToggleCollapse(); // Auto expand
    onGenerate(prompt);
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'langchain_plan.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isCollapsed) {
      return (
          <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={onToggleCollapse}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg shadow-indigo-900/50 flex items-center justify-center transition-all hover:scale-110"
                title={t.aiArchitect}
              >
                  <Sparkles className="w-6 h-6" />
              </button>
          </div>
      );
  }

  return (
    <div className={`flex flex-col h-full bg-slate-900 border-l border-slate-700 transition-all duration-300`}>
      
      {/* Header / Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${isGenerating ? 'text-amber-400 animate-pulse' : 'text-indigo-400'}`} />
            <h2 className="text-sm font-semibold text-slate-100">{t.aiArchitect}</h2>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onToggleCollapse}
                className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 transition-colors"
                title={t.collapse}
            >
                <ChevronDown className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-4 border-b border-slate-700 shrink-0 h-32`}>
         <div className="relative h-full flex flex-col">
            <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.describeReq}
                className="w-full h-full bg-slate-800 text-slate-200 p-3 rounded-lg border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none text-sm placeholder-slate-500"
                disabled={isGenerating}
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
                {isGenerating ? (
                    <button 
                        onClick={onCancel}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-200 text-xs font-medium rounded-md border border-red-700 transition-colors"
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        {t.stop}
                    </button>
                ) : (
                    <button 
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            showContinue
                             ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/50'
                             : prompt.trim() 
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50' 
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        {showContinue ? (
                             <>
                                <ArrowRight className="w-3.5 h-3.5" />
                                {t.continue}
                             </>
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                {t.execute}
                            </>
                        )}
                    </button>
                )}
            </div>
         </div>
      </div>

      {/* Output / Preview Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
        {/* Output Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('preview')}
                    className={`text-xs px-2 py-1 rounded ${activeTab === 'preview' ? 'bg-slate-800 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {t.planPreview}
                </button>
                <button 
                    onClick={() => setActiveTab('code')}
                    className={`text-xs px-2 py-1 rounded ${activeTab === 'code' ? 'bg-slate-800 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {t.rawOutput}
                </button>
            </div>
            <button 
                onClick={handleDownload}
                disabled={!generatedContent}
                className="text-slate-500 hover:text-indigo-400 disabled:opacity-30"
                title={t.downloadPlan}
            >
                <Download className="w-4 h-4" />
            </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {!generatedContent && isGenerating && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-xs animate-pulse">{t.initializing}</span>
                </div>
            )}
            
            {!generatedContent && !isGenerating && (
                 <div className="flex flex-col items-center justify-center h-full text-slate-600">
                    <Code className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">{t.readyToGen}</p>
                </div>
            )}

            {generatedContent && (
                <div className="prose prose-invert prose-sm max-w-none">
                     {activeTab === 'preview' ? (
                         <ReactMarkdown 
                            components={{
                                code({node, inline, className, children, ...props}: any) {
                                    return !inline ? (
                                        <div className="bg-slate-900 rounded p-3 my-2 border border-slate-800 overflow-x-auto">
                                            <code className="font-mono text-xs text-emerald-300" {...props}>
                                                {children}
                                            </code>
                                        </div>
                                    ) : (
                                        <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-200 text-xs font-mono" {...props}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                         >
                             {generatedContent}
                         </ReactMarkdown>
                     ) : (
                         <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
                             {generatedContent}
                         </pre>
                     )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AIWorkspace;