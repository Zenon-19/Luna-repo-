import React from 'react';
import { AlertCircle, Check, X, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { AIParseResult, Project } from '../types';

interface LunaConfirmationCardProps {
  parseResult: AIParseResult;
  projects: Project[];
  onConfirm: (result: AIParseResult) => void;
  onCancel: () => void;
  onSelectAlternativeProject: (projectId: string) => void;
}

export const LunaConfirmationCard: React.FC<LunaConfirmationCardProps> = ({
  parseResult,
  projects,
  onConfirm,
  onCancel,
  onSelectAlternativeProject,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 text-slate-900">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Luna Needs Confirmation
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold mono-num">
              Confidence: {Math.round(parseResult.confidence_score * 100)}%
            </span>
          </div>
          <p className="text-sm text-[#0A0A0A] font-medium mt-1">
            {parseResult.clarification_question ||
              `I matched this to "${parseResult.target_project_name}". Would you like me to apply these updates?`}
          </p>
        </div>
      </div>

      {/* Target Project Selection if needed */}
      <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <label className="text-[11px] text-slate-500 block mb-1.5 font-medium">Selected Target Project:</label>
        <select
          value={parseResult.target_project_id || ''}
          onChange={(e) => onSelectAlternativeProject(e.target.value)}
          className="w-full bg-white border border-slate-200 text-xs text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
        >
          <option value="" disabled>
            Select a project...
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.category} — {p.progress_percentage}%)
            </option>
          ))}
        </select>
      </div>

      {/* Proposed Changes Preview */}
      {parseResult.changes.length > 0 && (
        <div className="mb-4">
          <span className="text-[11px] text-slate-500 block mb-2 font-medium">
            Extracted Field Changes:
          </span>
          <div className="space-y-1.5">
            {parseResult.changes.map((change, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100"
              >
                <span className="text-slate-700 font-medium">{change.label}</span>
                <div className="flex items-center gap-2 mono-num">
                  <span className="text-slate-400">{change.old_value || 'None'}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span className="text-emerald-700 font-semibold">{change.new_value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(parseResult)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Confirm & Update Dashboard</span>
        </button>
      </div>
    </div>
  );
};
