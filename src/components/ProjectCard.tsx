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
  GitBranch
} from 'lucide-react';
import { Project } from '../types';
import { formatCurrency, getHealthBadgeColor, getStageColor, timeAgo } from '../utils/formatters';

interface ProjectCardProps {
  project: Project;
  currency: string;
  onClick: () => void;
  onQuickUpdate: (projectName: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currency,
  onClick,
  onQuickUpdate,
}) => {
  const healthBadge = getHealthBadgeColor(project.health_score);
  const stageBadge = getStageColor(project.stage);
  const isStagnant = project.days_since_update > 10 && project.status === 'active';

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white border rounded-2xl p-6 hover:border-black hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs ${
        isStagnant ? 'border-amber-300' : 'border-slate-100'
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-[#0A0A0A] group-hover:text-black transition-colors tracking-tight">
                  {project.name}
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
              </div>
              <span className="text-xs text-slate-400 font-normal">
                {project.stage} Stage · {project.category}
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
        <p className="text-xs text-slate-500 line-clamp-2 mb-5 leading-relaxed">
          {project.description}
        </p>

        {/* Progression Section */}
        <div className="mb-5 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Progress
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-[#0A0A0A] mono-num">
                {project.progress_percentage}%
              </span>
              {project.progress_delta_month > 0 && (
                <span className="text-[11px] text-emerald-600 font-bold">
                  ↑ {project.progress_delta_month}%
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-black h-1.5 rounded-full transition-all duration-500"
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
      </div>

      {/* Footer: Milestones, Commits, Quick Update */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
            {project.milestones.filter((m) => m.completed).length}/{project.milestones.length}
          </span>

          {project.github_commits_count && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <GitBranch className="w-3 h-3" />
              {project.github_commits_count}
            </span>
          )}

          {isStagnant && (
            <span className="flex items-center gap-1 text-[10px] text-amber-700 font-medium">
              <AlertTriangle className="w-2.5 h-2.5" />
              {project.days_since_update}d inactive
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
