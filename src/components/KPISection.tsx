import React from 'react';
import { 
  FolderKanban, 
  TrendingUp, 
  Coins, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  CheckCircle2,
  PauseCircle,
  Sparkles
} from 'lucide-react';
import { Project } from '../types';
import { formatCurrency, getHealthBadgeColor } from '../utils/formatters';

interface KPISectionProps {
  projects: Project[];
  currency: string;
  onFilterStatus: (status: string) => void;
  selectedStatus: string;
}

export const KPISection: React.FC<KPISectionProps> = ({
  projects,
  currency,
  onFilterStatus,
  selectedStatus,
}) => {
  const total = projects.length;
  const active = projects.filter((p) => p.status === 'active').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  const onHold = projects.filter((p) => p.status === 'on_hold').length;

  const activeProjects = projects.filter((p) => p.status === 'active');
  const avgProgress = activeProjects.length
    ? Math.round(
        activeProjects.reduce((acc, p) => acc + (p.progress_percentage || 0), 0) /
          activeProjects.length
      )
    : 0;

  const totalValue = projects.reduce((acc, p) => acc + (p.project_value || 0), 0);
  const realizedValue = projects.reduce((acc, p) => acc + (p.realized_value || 0), 0);
  const potentialValue = projects.reduce((acc, p) => acc + (p.potential_value || 0), 0);

  const avgHealth = projects.length
    ? Math.round(
        projects.reduce((acc, p) => acc + (p.health_score || 0), 0) / projects.length
      )
    : 80;

  const healthBadge = getHealthBadgeColor(avgHealth);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* 1. Total Projects Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Total Projects
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-semibold text-[#0A0A0A] mono-num">{total}</span>
            <span className="text-sm text-slate-500 font-medium">{active} Active</span>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
          <button
            onClick={() => onFilterStatus('active')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
              selectedStatus === 'active'
                ? 'bg-black text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1" />
            {active} Active
          </button>
          <button
            onClick={() => onFilterStatus('completed')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
              selectedStatus === 'completed'
                ? 'bg-black text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-2.5 h-2.5 inline mr-1 text-emerald-600" />
            {completed} Done
          </button>
          <button
            onClick={() => onFilterStatus('on_hold')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
              selectedStatus === 'on_hold'
                ? 'bg-black text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PauseCircle className="w-2.5 h-2.5 inline mr-1 text-amber-600" />
            {onHold} Hold
          </button>
        </div>
      </div>

      {/* 2. Portfolio Value Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Portfolio Value
          </div>
          <div className="flex flex-col">
            <div className="text-3xl font-semibold text-[#0A0A0A] mono-num">
              {formatCurrency(totalValue, currency)}
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ↑ 12.4% vs last month
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
          <div>
            <span className="text-slate-400">Realized: </span>
            <span className="text-slate-800 font-semibold mono-num">
              {formatCurrency(realizedValue, currency)}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Pipeline: </span>
            <span className="text-emerald-700 font-semibold mono-num">
              {formatCurrency(potentialValue, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Overall Progress Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Overall Progress
          </div>
          <div className="flex flex-col">
            <div className="text-3xl font-semibold text-[#0A0A0A] mono-num">{avgProgress}%</div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-black h-full transition-all duration-500"
                style={{ width: `${avgProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100">
          <span>+8% MoM velocity</span>
          <span className="text-slate-700 font-medium">{active} active streams</span>
        </div>
      </div>

      {/* 4. Health Score Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Health Score
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-semibold text-[#0A0A0A] mono-num">{avgHealth}</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${healthBadge.bg} ${healthBadge.text} ${healthBadge.border}`}
            >
              {healthBadge.label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-600" />
            <span>Velocity: High</span>
          </div>
          <span className="text-slate-500 font-medium">0 Critical risks</span>
        </div>
      </div>
    </div>
  );
};
