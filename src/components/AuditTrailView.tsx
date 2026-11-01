import React from 'react';
import { History, Sparkles, CheckCircle2, ArrowRight, MessageSquareQuote } from 'lucide-react';
import { ProjectUpdateRecord } from '../types';

interface AuditTrailViewProps {
  updateRecords: ProjectUpdateRecord[];
  onSelectProjectName: (name: string) => void;
  onExportAuditTrail?: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  updateRecords,
  onSelectProjectName,
  onExportAuditTrail,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#0A0A0A] tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-black" />
            <span>Permanent Conversational Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-400">
            Immutable log of all natural-language updates interpreted by Luna 0.1
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExportAuditTrail && (
            <button
              onClick={onExportAuditTrail}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Export Audit Trail (.md)</span>
            </button>
          )}
          <span className="text-xs mono-num text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl font-semibold">
            {updateRecords.length} Entries Recorded
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {updateRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white border border-slate-100 hover:border-black rounded-2xl p-7 transition-colors text-xs shadow-sm"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectProjectName(record.project_name)}
                  className="font-semibold text-base text-[#0A0A0A] hover:underline transition-colors cursor-pointer tracking-tight"
                >
                  {record.project_name}
                </button>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Confidence: {Math.round(record.confidence_score * 100)}%
                </span>
              </div>
              <span className="mono-num text-slate-400 text-xs">
                {new Date(record.timestamp).toLocaleString()}
              </span>
            </div>

            {/* Original message quote */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">
                <MessageSquareQuote className="w-3.5 h-3.5 text-slate-400" />
                <span>Original Prompt from User</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-slate-800 italic leading-relaxed">
                “{record.original_message}”
              </div>
            </div>

            {/* AI Summary */}
            <div className="mb-4">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Luna AI Structured Synthesis</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">{record.ai_summary}</p>
            </div>

            {/* Field Changes */}
            {record.changes.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2.5">
                  Applied Field Delta:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {record.changes.map((c, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl flex items-center justify-between mono-num text-xs"
                    >
                      <span className="text-slate-600 font-medium">{c.label}:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">{c.old_value || 'None'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span className="text-slate-900 font-bold">{c.new_value}</span>
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
