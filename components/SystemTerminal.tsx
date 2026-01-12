import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Cpu, Activity, ShieldCheck, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { LogEntry } from '../types';
import { checkConnectivity } from '../services/geminiService';

interface SystemTerminalProps {
  logs: LogEntry[];
  onOpenConfig: () => void;
}

const SystemTerminal: React.FC<SystemTerminalProps> = ({ logs, onOpenConfig }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING'>('CHECKING');

  const runCheck = async (force: boolean = false) => {
    setStatus('CHECKING');
    const report = await checkConnectivity(force);
    setStatus(report.success ? 'ONLINE' : 'OFFLINE');
  };

  useEffect(() => {
    // 首次挂载运行正常检查
    runCheck(false);
    // 延长自动轮询间隔到 120s (2分钟)，降低 API 压力
    const interval = setInterval(() => runCheck(false), 120000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'success': return 'text-emerald-400 font-bold';
      case 'system': return 'text-indigo-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-black border-t border-slate-800 font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium uppercase tracking-tight">Terminal System Engine</span>
        </div>
        <div className="flex gap-4 items-center">
            <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
                <Cpu className="w-3 h-3" />
                <span>MEM: 128MB</span>
            </div>
            
            <div 
                onClick={() => {
                    // 点击状态灯强制刷新一次并打开配置
                    runCheck(true);
                    onOpenConfig();
                }}
                className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded transition-all hover:bg-slate-800 ${
                    status === 'ONLINE' ? 'text-emerald-500' : 
                    status === 'OFFLINE' ? 'text-red-500' : 'text-slate-500'
                }`}
            >
                {status === 'CHECKING' ? <RefreshCw className="w-3 h-3 animate-spin" /> : 
                 status === 'ONLINE' ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
                <span className="font-bold tracking-widest uppercase">{status}</span>
            </div>
        </div>
      </div>

      {/* Logs Area */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-black/90"
      >
        {logs.map((log) => (
            <div key={log.id} className="flex gap-2 hover:bg-slate-900/50 rounded px-1 transition-colors group">
                <span className="text-slate-600 shrink-0 select-none">
                    [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' })}]
                </span>
                {log.phase && (
                    <span className="text-indigo-600 font-bold shrink-0 select-none">
                        {log.phase} &gt;
                    </span>
                )}
                <span className={`${getLogColor(log.level)} break-all`}>
                    {log.message}
                </span>
            </div>
        ))}
        {status === 'CHECKING' && (
            <div className="text-slate-700 animate-pulse italic">
                &gt; Establishing secure handshake...
            </div>
        )}
      </div>
    </div>
  );
};

export default SystemTerminal;