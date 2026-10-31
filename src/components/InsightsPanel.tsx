import React from 'react';
import { Sparkles, AlertTriangle, TrendingUp, Info, ArrowRight, RefreshCw } from 'lucide-react';
import { LunaInsight } from '../types';

interface InsightsPanelProps {
  insights: LunaInsight[];
  onApplyPrompt: (prompt: string) => void;
  onRefreshInsights: () => void;
  isRefreshing?: boolean;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  onApplyPrompt,
  onRefreshInsights,
  isRefreshing,
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-8 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-black">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0A0A0A] tracking-tight">
              Luna AI Proactive Intelligence
            </h3>
            <p className="text-[11px] text-slate-400">
              Autonomous pattern detection across velocity, stagnation risks & valuation anomalies
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshInsights}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          title="Re-run AI Portfolio Analysis"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-[11px]">Re-analyze</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((ins) => {
          let badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
          let icon = <TrendingUp className="w-3.5 h-3.5" />;

          if (ins.type === 'risk') {
            badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
            icon = <AlertTriangle className="w-3.5 h-3.5" />;
          } else if (ins.type === 'discrepancy') {
            badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
            icon = <Info className="w-3.5 h-3.5" />;
          }

          return (
            <div
              key={ins.id}
              className="bg-slate-50/70 border border-slate-100 hover:border-slate-300 rounded-xl p-4 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border ${badgeColor}`}
                  >
                    {icon}
                    <span>{ins.type}</span>
                  </span>
                  {ins.project_name && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {ins.project_name}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-semibold text-[#0A0A0A] mb-1.5 leading-snug">
                  {ins.title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  {ins.description}
                </p>
              </div>

              {ins.action_prompt && (
                <button
                  onClick={() => onApplyPrompt(ins.action_prompt!)}
                  className="flex items-center justify-between w-full text-[11px] text-slate-700 hover:text-black font-semibold pt-2 border-t border-slate-200/60 transition-colors text-left"
                >
                  <span className="line-clamp-1">{ins.action_prompt}</span>
                  <ArrowRight className="w-3 h-3 shrink-0 ml-1" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
