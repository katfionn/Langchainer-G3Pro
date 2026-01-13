
import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Server, Globe, Cpu, Plus, Trash2, Settings, Star, AlertCircle, Zap } from 'lucide-react';
import { AIConfig, AIChannel, ModelInstance } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  language: Language;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose, onSave, language }) => {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('ai_planner_configs_v5');
      const INTERNAL_ID = 'google-internal';
      
      let baseConfigs: AIConfig[] = [];
      if (saved) {
        try {
          baseConfigs = JSON.parse(saved);
        } catch (e) {
          baseConfigs = [];
        }
      }
      
      if (!baseConfigs.some(c => c.id === INTERNAL_ID)) {
        baseConfigs.unshift({
          id: INTERNAL_ID,
          channel: 'google',
          apiKey: '', 
          isInternal: true,
          models: [{ id: 'm-internal', name: 'Studio Native (Gemini 3 Pro)', modelId: 'gemini-3-pro-preview', isPrimary: true, isSecondary: false }]
        });
      }

      setConfigs(baseConfigs);
      setActiveTab(activeTab || baseConfigs[0]?.id || INTERNAL_ID);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('ai_planner_configs_v5', JSON.stringify(configs));
    onSave();
    onClose();
  };

  const addChannel = () => {
    const newId = `c-${Date.now()}`;
    const newChannel: AIConfig = {
      id: newId,
      channel: 'compatible',
      apiKey: '',
      baseUrl: '',
      models: [{ id: `m-${Date.now()}`, name: 'New Model', modelId: '', isPrimary: false, isSecondary: false }]
    };
    setConfigs([...configs, newChannel]);
    setActiveTab(newId);
  };

  const removeChannel = (id: string) => {
    const config = configs.find(c => c.id === id);
    if (config?.isInternal) return; 
    const newConfigs = configs.filter(c => c.id !== id);
    setConfigs(newConfigs);
    if (activeTab === id) setActiveTab(newConfigs[0]?.id || '');
  };

  const updateConfig = (id: string, field: keyof AIConfig, value: any) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addModel = (configId: string) => {
    setConfigs(prev => prev.map(c => {
      if (c.id === configId) {
        return {
          ...c,
          models: [...c.models, { id: `m-${Date.now()}`, name: 'New Model', modelId: '', isPrimary: false, isSecondary: false }]
        };
      }
      return c;
    }));
  };

  const updateModel = (configId: string, modelId: string, field: keyof ModelInstance, value: any) => {
    setConfigs(prev => prev.map(c => {
      if (c.id === configId) {
        const updatedModels = c.models.map(m => {
          if (m.id === modelId) return { ...m, [field]: value };
          return m;
        });

        if (field === 'isPrimary' && value === true) {
          return {
            ...c,
            models: updatedModels.map(m => m.id === modelId ? { ...m, isPrimary: true } : { ...m, isPrimary: false })
          };
        }
        return { ...c, models: updatedModels };
      } 
      
      if (field === 'isPrimary' && value === true) {
        return { ...c, models: c.models.map(m => ({ ...m, isPrimary: false })) };
      }
      return c;
    }));
  };

  const removeModel = (configId: string, modelId: string) => {
    setConfigs(prev => prev.map(c => {
      if (c.id === configId) {
        if (c.isInternal && c.models.length <= 1) return c;
        return { ...c, models: c.models.filter(m => m.id !== modelId) };
      }
      return c;
    }));
  };

  if (!isOpen) return null;

  const currentConfig = configs.find(c => c.id === activeTab);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                <Settings className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{t.aiOrchestrator}</h2>
                <p className="text-xs text-slate-500 font-medium">{t.configModels}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-slate-800 bg-slate-950/50 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.channels}</span>
                <button onClick={addChannel} className="p-1 hover:bg-indigo-500/20 text-indigo-400 rounded transition-all">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            {configs.map(c => (
              <div 
                key={c.id} 
                onClick={() => setActiveTab(c.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeTab === c.id ? 'bg-indigo-600/10 border-indigo-500/50 text-white' : 'border-transparent text-slate-400 hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center gap-3">
                    {c.isInternal ? <Zap className="w-4 h-4 text-amber-400" /> : <div className={`w-2 h-2 rounded-full ${c.apiKey ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
                    <span className="text-sm font-semibold capitalize">{c.channel === 'google' ? 'Google' : c.channel} {c.isInternal && '(Studio)'}</span>
                </div>
                {!c.isInternal && (
                    <button onClick={(e) => { e.stopPropagation(); removeChannel(c.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/30">
            {currentConfig ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">{t.providerType}</label>
                            <select 
                                disabled={currentConfig.isInternal}
                                value={currentConfig.channel}
                                onChange={(e) => updateConfig(currentConfig.id, 'channel', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:border-indigo-500 outline-none disabled:opacity-50"
                            >
                                <option value="google">Google Official</option>
                                <option value="openai">OpenAI Official</option>
                                <option value="compatible">OpenAI Compatible</option>
                                <option value="openrouter">OpenRouter AI</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">
                                {currentConfig.isInternal ? t.managedKey : t.apiKey}
                            </label>
                            <div className="relative">
                                <Shield className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                                <input 
                                    disabled={currentConfig.isInternal}
                                    type="password"
                                    value={currentConfig.isInternal ? '••••••••••••••••' : currentConfig.apiKey}
                                    onChange={(e) => updateConfig(currentConfig.id, 'apiKey', e.target.value)}
                                    placeholder="Enter API Key"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-slate-100 focus:border-indigo-500 outline-none disabled:bg-slate-900/50"
                                />
                            </div>
                        </div>
                        {(!currentConfig.isInternal && (currentConfig.channel === 'compatible' || currentConfig.channel === 'openai')) && (
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">{t.baseUrl}</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
                                    <input 
                                        type="text"
                                        value={currentConfig.baseUrl || ''}
                                        onChange={(e) => updateConfig(currentConfig.id, 'baseUrl', e.target.value)}
                                        placeholder="https://api.openai.com/v1"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-slate-100 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t.modelInventory}</h3>
                            {!currentConfig.isInternal && (
                                <button onClick={() => addModel(currentConfig.id)} className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300">
                                    <Plus className="w-4 h-4" /> {t.addModel}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {currentConfig.models.map(model => (
                                <div key={model.id} className={`group relative p-6 rounded-2xl border bg-slate-950/50 transition-all ${model.isPrimary ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-slate-800'}`}>
                                    {/* Trash button in Top-Right */}
                                    {!currentConfig.isInternal && (
                                        <button 
                                            onClick={() => removeModel(currentConfig.id, model.id)} 
                                            className="absolute top-4 right-4 p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Label Name</label>
                                                <input 
                                                    disabled={currentConfig.isInternal}
                                                    type="text" 
                                                    value={model.name}
                                                    placeholder="e.g. GPT-4 Mini"
                                                    onChange={(e) => updateModel(currentConfig.id, model.id, 'name', e.target.value)}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Deployment ID / Model ID</label>
                                                <input 
                                                    disabled={currentConfig.isInternal}
                                                    type="text" 
                                                    value={model.modelId}
                                                    placeholder="e.g. gpt-4o-mini"
                                                    onChange={(e) => updateModel(currentConfig.id, model.id, 'modelId', e.target.value)}
                                                    className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-sm text-white font-mono disabled:opacity-50 ${!model.modelId && !currentConfig.isInternal ? 'border-red-500/50 bg-red-500/5' : 'border-slate-700'}`}
                                                />
                                            </div>
                                            {(currentConfig.channel === 'compatible' || currentConfig.channel === 'openrouter') && (
                                                <div className="md:col-span-2 space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t.extraPayload}</label>
                                                    <textarea 
                                                        value={model.customParams || ''}
                                                        onChange={(e) => updateModel(currentConfig.id, model.id, 'customParams', e.target.value)}
                                                        placeholder='{"temperature": 0.5}'
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-400 outline-none h-20"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Primary Toggle Button - Vertically Centered */}
                                        <div className="flex shrink-0">
                                            <button 
                                                onClick={() => updateModel(currentConfig.id, model.id, 'isPrimary', true)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all ${model.isPrimary ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                                            >
                                                <Star className={`w-3.5 h-3.5 ${model.isPrimary ? 'fill-current' : ''}`} />
                                                {t.primary}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            ) : null}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-800 bg-slate-950/80 flex justify-between items-center">
            <div className="text-slate-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{t.internalWarning}</span>
            </div>
            <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800">Cancel</button>
                <button 
                    onClick={handleSave} 
                    disabled={!currentConfig?.isInternal && currentConfig?.models.every(m => !m.modelId)}
                    className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-xl shadow-indigo-900/40"
                >
                    <Save className="w-4 h-4" /> {t.saveConfig}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigModal;
