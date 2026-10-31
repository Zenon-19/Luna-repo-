import React from 'react';
import { History, Sparkles, CheckCircle2, ArrowRight, MessageSquareQuote } from 'lucide-react';
import { ProjectUpdateRecord } from '../types';

interface AuditTrailViewProps {
  updateRecords: ProjectUpdateRecord[];
  onSelectProjectName: (name: string) => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  updateRecords,
  onSelectProjectName,
}) => {
  if (updateRecords.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center my-6 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mx-auto mb-4">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#0A0A0A] mb-1">No Audit Records Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Send a natural-language update via Luna at the bottom of the screen. Every update permanently records the original user text and extracted metrics in this audit log.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#0A0A0A] tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-black" />
            <span>Permanent Conversational Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-400">
            Immutable log of all natural-language updates interpreted by Luna 0.1
          </p>
        </div>
        <span className="text-xs mono-num text-slate-700 bg-slate-100 px-3 py-1 rounded-full font-semibold">
          {updateRecords.length} Entries Recorded
        </span>
      </div>

      <div className="space-y-3">
        {updateRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white border border-slate-100 hover:border-slate-300 rounded-2xl p-6 transition-all text-xs shadow-xs"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onSelectProjectName(record.project_name)}
                  className="font-semibold text-sm text-[#0A0A0A] hover:underline transition-colors cursor-pointer"
                >
                  {record.project_name}
                </button>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mono-num font-semibold">
                  Confidence: {Math.round(record.confidence_score * 100)}%
                </span>
              </div>
              <span className="mono-num text-slate-400 text-[11px]">
                {new Date(record.timestamp).toLocaleString()}
              </span>
            </div>

            {/* Original message quote */}
            <div className="mb-3">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-semibold mb-1">
                <MessageSquareQuote className="w-3 h-3 text-slate-400" />
                <span>Original Prompt from User</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 italic">
                “{record.original_message}”
              </div>
            </div>

            {/* AI Summary */}
            <div className="mb-3">
              <div className="text-[10px] text-[#0A0A0A] uppercase font-semibold mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-black" />
                <span>Luna AI Structured Synthesis</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{record.ai_summary}</p>
            </div>

            {/* Field Changes */}
            {record.changes.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                  Applied Field Delta:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {record.changes.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between mono-num text-[11px]"
                    >
                      <span className="text-slate-600">{c.label}:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">{c.old_value || 'None'}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className="text-emerald-700 font-semibold">{c.new_value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
