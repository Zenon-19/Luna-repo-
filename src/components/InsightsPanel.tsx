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
    <div className="bg-white border border-slate-100 rounded-2xl p-7 sm:p-8 mb-10 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Luna AI Insights
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous pattern detection across velocity, stagnation risks & valuation anomalies
          </p>
        </div>

        <button
          onClick={onRefreshInsights}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-black hover:text-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          title="Re-run AI Portfolio Analysis"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Re-analyze</span>
        </button>
      </div>

      {insights.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#0A0A0A]">
              Ready to analyze your live portfolio
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Click Re-analyze to evaluate milestone velocity, budget utilization, and delivery risks across your projects.
            </p>
          </div>
          <button
            onClick={onRefreshInsights}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isRefreshing ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((ins, idx) => {
            const isFeaturedDark = idx === 0;

            if (isFeaturedDark) {
              return (
                <div
                  key={ins.id}
                  className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Top Velocity
                      </span>
                      {ins.project_name && (
                        <span className="text-[11px] text-slate-300 font-medium">
                          {ins.project_name}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2 leading-snug">
                      {ins.title}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {ins.description}
                    </p>
                  </div>

                  {ins.action_prompt && (
                    <button
                      onClick={() => onApplyPrompt(ins.action_prompt!)}
                      className="flex items-center justify-between w-full text-xs text-slate-300 hover:text-white font-semibold pt-3 border-t border-slate-800 transition-colors text-left cursor-pointer"
                    >
                      <span className="line-clamp-1">{ins.action_prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div
                key={ins.id}
                className="bg-white border border-slate-100 hover:border-black rounded-2xl p-5 flex flex-col justify-between transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      ins.type === 'risk' ? 'text-rose-600' : 'text-slate-400'
                    }`}>
                      {ins.type === 'risk' ? 'Alert' : 'Notice'}
                    </span>
                    {ins.project_name && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {ins.project_name}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-semibold text-[#0A0A0A] mb-2 leading-snug">
                    {ins.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {ins.description}
                  </p>
                </div>

                {ins.action_prompt && (
                  <button
                    onClick={() => onApplyPrompt(ins.action_prompt!)}
                    className="flex items-center justify-between w-full text-xs text-slate-700 hover:text-black font-semibold pt-3 border-t border-slate-100 transition-colors text-left cursor-pointer"
                  >
                    <span className="line-clamp-1">{ins.action_prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
