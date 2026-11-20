import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Clock, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  MessageSquarePlus,
  Flame,
  AlertTriangle,
  GitBranch,
  Calendar
} from 'lucide-react';
import { Project, ProjectSnapshot } from '../types';
import { formatCurrency, getHealthBadgeColor, getStageColor, timeAgo } from '../utils/formatters';
import { checkProjectStagnation } from '../utils/alerts';
import { monitorProjectBudget } from '../utils/budget';
import { HighlightedText } from './HighlightedText';

interface ProjectCardProps {
  project: Project;
  snapshots?: ProjectSnapshot[];
  currency: string;
  searchQuery?: string;
  onClick: () => void;
  onQuickUpdate: (projectName: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  snapshots = [],
  currency,
  searchQuery = '',
  onClick,
  onQuickUpdate,
}) => {
  const healthBadge = getHealthBadgeColor(project.health_score);
  const stageBadge = getStageColor(project.stage);
  const stagnation = checkProjectStagnation(project, snapshots);
  const isStagnant = stagnation.isStagnant;
  const budget = monitorProjectBudget(project);
  const isBudgetWarning = budget.exceedsThreshold;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white border rounded-2xl p-6 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs ${
        budget.isOverBudget
          ? 'border-rose-200/90 hover:border-rose-400 bg-rose-50/15'
          : isBudgetWarning || isStagnant
          ? 'border-amber-200/90 hover:border-amber-400 bg-amber-50/15'
          : 'border-slate-100 hover:border-black'
      }`}
    >
      {/* Top Bar: Identity & Health */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            {/* Minimalist Monogram Avatar */}
            <div
              className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center font-bold text-sm text-[#0A0A0A] group-hover:bg-black group-hover:text-white transition-all shadow-xs"
            >
              {project.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base text-[#0A0A0A] group-hover:text-black transition-colors tracking-tight">
                  <HighlightedText text={project.name} highlight={searchQuery} />
                </h3>
                {project.status === 'completed' && (
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    · Done
                  </span>
                )}
                {project.status === 'on_hold' && (
                  <span className="text-[10px] uppercase font-bold text-amber-600">
                    · On Hold
                  </span>
                )}
                {isStagnant && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-semibold tracking-tight"
                    title={stagnation.reason}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Stagnant ({stagnation.stagnantDays}d)</span>
                  </span>
                )}
                {isBudgetWarning && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold tracking-tight ${
                      budget.isOverBudget
                        ? 'bg-rose-50 border-rose-200/90 text-rose-800'
                        : 'bg-amber-50 border-amber-200/80 text-amber-800'
                    }`}
                    title={budget.reason}
                  >
                    <AlertTriangle
                      className={`w-2.5 h-2.5 ${
                        budget.isOverBudget ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                    <span>
                      {budget.isOverBudget
                        ? `Over Budget (${budget.utilizationPercentage}%)`
                        : `Budget ${budget.utilizationPercentage}%`}
                    </span>
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-normal">
                <HighlightedText text={project.stage} highlight={searchQuery} /> Stage · <HighlightedText text={project.category} highlight={searchQuery} />
              </span>
            </div>
          </div>

          {/* Minimalist Health Tag */}
          <div className="text-right">
            <span className="text-xs font-semibold text-[#0A0A0A] mono-num block">
              {project.health_score}/100
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {healthBadge.label}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
          <HighlightedText text={project.description} highlight={searchQuery} />
        </p>

        {/* Tags with query highlighting */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-slate-100/80 text-[10px] font-medium text-slate-600 border border-slate-200/60"
              >
                <HighlightedText text={tag} highlight={searchQuery} />
              </span>
            ))}
            {project.tags.length > 4 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{project.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Progression Section */}
        <div className={`mb-5 p-4 rounded-xl border ${
          isStagnant ? 'bg-amber-50/30 border-amber-200/60' : 'bg-slate-50/70 border-slate-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Progress
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[#0A0A0A] mono-num">
                {project.progress_percentage}%
              </span>
              {isStagnant ? (
                <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Stagnant ({stagnation.stagnantDays}d)
                </span>
              ) : project.progress_delta_month > 0 ? (
                <span className="text-[11px] text-emerald-600 font-bold">
                  ↑ {project.progress_delta_month}%
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">
                  → 0%
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                isStagnant ? 'bg-amber-600' : 'bg-black'
              }`}
              style={{
                width: `${project.progress_percentage}%`,
              }}
            />
          </div>
        </div>

        {/* Value & Performance Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Value block */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold mb-0.5">
              Value
            </span>
            <div className="text-sm font-semibold text-[#0A0A0A] mono-num">
              {formatCurrency(project.project_value, currency)}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
              <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
              +{formatCurrency(project.value_delta_month, currency)}
            </span>
          </div>

          {/* Performance block */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold mb-0.5">
              Trajectory
            </span>
            <div className="text-sm font-semibold text-[#0A0A0A] mono-num flex items-center gap-1">
              {project.performance_score}/100
              {project.performance_delta_month > 0 ? (
                <span className="text-[11px] text-emerald-600 font-bold">
                  ↑ {project.performance_delta_month}%
                </span>
              ) : project.performance_delta_month < 0 ? (
                <span className="text-[11px] text-rose-600 font-bold">
                  ↓ {Math.abs(project.performance_delta_month)}%
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-bold">
                  → 0%
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 capitalize">
              {project.performance_trend}
            </span>
          </div>
        </div>

        {/* Cost vs Budget Monitor */}
        <div
          className={`mb-5 px-4 py-3 rounded-xl border ${
            budget.isOverBudget
              ? 'bg-rose-50/40 border-rose-200/80'
              : isBudgetWarning
              ? 'bg-amber-50/40 border-amber-200/80'
              : 'bg-slate-50/70 border-slate-100'
          }`}
          title={budget.reason}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
              {isBudgetWarning && (
                <AlertTriangle
                  className={`w-3 h-3 ${
                    budget.isOverBudget ? 'text-rose-600' : 'text-amber-600'
                  }`}
                />
              )}
              <span
                className={
                  budget.isOverBudget
                    ? 'text-rose-700'
                    : isBudgetWarning
                    ? 'text-amber-800'
                    : 'text-slate-400'
                }
              >
                Cost vs Budget
              </span>
            </span>
            <div className="flex items-center gap-1.5 text-[11px] mono-num">
              <span className="text-slate-600 font-medium">
                {formatCurrency(project.cost_to_date, currency)} / {formatCurrency(project.project_value, currency)}
              </span>
              <span
                className={`font-bold ${
                  budget.isOverBudget
                    ? 'text-rose-700'
                    : isBudgetWarning
                    ? 'text-amber-700'
                    : 'text-slate-700'
                }`}
              >
                ({budget.utilizationPercentage}%)
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden relative">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${
                budget.isOverBudget
                  ? 'bg-rose-600'
                  : isBudgetWarning
                  ? 'bg-amber-500'
                  : 'bg-slate-700'
              }`}
              style={{ width: `${Math.min(100, budget.utilizationPercentage)}%` }}
            />
            <div
              className="absolute top-0 bottom-0 w-px bg-slate-400/70"
              style={{ left: '80%' }}
              title="80% budget threshold"
            />
          </div>
          {isBudgetWarning && (
            <div
              className={`mt-1.5 text-[10px] font-semibold flex items-center justify-between ${
                budget.isOverBudget ? 'text-rose-700' : 'text-amber-800'
              }`}
            >
              <span>
                {budget.isOverBudget
                  ? `Over budget by ${formatCurrency(Math.abs(budget.remainingBudget), currency)}`
                  : 'Exceeds 80% budget threshold'}
              </span>
              <span className="mono-num">
                {budget.remainingBudget >= 0
                  ? `${formatCurrency(budget.remainingBudget, currency)} left`
                  : `-${formatCurrency(Math.abs(budget.remainingBudget), currency)}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Milestones, Commits, Quick Update */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
            {project.milestones.filter((m) => m.completed).length}/{project.milestones.length}
          </span>

          {project.target_completion_date && (
            <span
              className="flex items-center gap-1 text-[11px] text-slate-500 font-medium"
              title={`Target Completion: ${project.target_completion_date}`}
            >
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>
                {new Date(project.target_completion_date + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </span>
          )}

          {project.github_commits_count && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
              <GitBranch className="w-3 h-3" />
              {project.github_commits_count}
            </span>
          )}

          {isStagnant && (
            <span
              className="flex items-center gap-1 text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80"
              title={stagnation.reason}
            >
              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
              <span>Stagnant &gt; 14d</span>
            </span>
          )}
        </div>

        {/* Quick Update Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickUpdate(project.name);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-black hover:text-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
        >
          <MessageSquarePlus className="w-3 h-3" />
          <span>Update</span>
        </button>
      </div>
    </div>
  );
};
