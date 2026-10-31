import React from 'react';
import { X, Database, FileCode, GitBranch, Cloud, CheckCircle2, RefreshCw, Cpu } from 'lucide-react';
import { MCPStatus } from '../types';

interface MCPStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  mcps: MCPStatus[];
}

export const MCPStatusModal: React.FC<MCPStatusModalProps> = ({ isOpen, onClose, mcps }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0A0A0A] tracking-tight">
                Model Context Protocol (MCP) Architecture
              </h3>
              <p className="text-xs text-slate-400">
                Luna 0.1 multi-server tool orchestration protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed shadow-xs">
            <span className="font-semibold text-[#0A0A0A] block mb-1">
              Active Tool Orchestration Pipeline:
            </span>
            Luna uses MCP tools to read/write persistent snapshots to PostgreSQL/Supabase, inspect repository commits via GitHub MCP, and save immutable local audit records via Filesystem MCP.
          </div>

          <div className="space-y-3">
            {mcps.map((mcp, idx) => {
              let icon = <Database className="w-4 h-4 text-black" />;
              if (mcp.type === 'filesystem') icon = <FileCode className="w-4 h-4 text-slate-700" />;
              if (mcp.type === 'git') icon = <GitBranch className="w-4 h-4 text-slate-700" />;
              if (mcp.type === 'cloud') icon = <Cloud className="w-4 h-4 text-slate-700" />;

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs text-[#0A0A0A]">{mcp.name}</h4>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mono-num bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {mcp.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{mcp.details}</p>
                    </div>
                  </div>

                  <span className="text-[11px] mono-num text-slate-400 font-medium">{mcp.latency}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>All 4 MCP server agents communicating seamlessly</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
