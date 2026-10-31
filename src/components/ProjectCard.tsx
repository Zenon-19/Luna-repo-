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
      className={`group relative bg-white border rounded-2xl p-5 hover:border-black hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs ${
        isStagnant ? 'border-amber-300' : 'border-slate-100'
      }`}
    >
      {/* Top Bar: Identity, Category, Health Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Color Accent Avatar */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs"
              style={{
                backgroundColor: `${project.color}15`,
                border: `1px solid ${project.color}35`,
                color: project.color || '#000000',
              }}
            >
              {project.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-[#0A0A0A] group-hover:text-black transition-colors tracking-tight">
                  {project.name}
                </h3>
                {project.status === 'completed' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                    Done
                  </span>
                )}
                {project.status === 'on_hold' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                    On Hold
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">{project.category}</span>
            </div>
          </div>

          {/* Health Badge */}
          <div className="flex flex-col items-end">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${healthBadge.bg} ${healthBadge.text} ${healthBadge.border}`}
            >
              {project.health_score}/100 • {healthBadge.label}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Progression Section */}
        <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${stageBadge}`}>
                {project.stage}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-[#0A0A0A] mono-num">
                {project.progress_percentage}%
              </span>
              {project.progress_delta_month > 0 && (
                <span className="text-[11px] text-emerald-600 font-semibold">
                  (+{project.progress_delta_month}%)
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden relative">
            <div
              className="h-1.5 rounded-full transition-all duration-500 relative"
              style={{
                width: `${project.progress_percentage}%`,
                backgroundColor: project.color || '#0A0A0A',
              }}
            />
          </div>
        </div>

        {/* Value & Performance Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Value block */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
              Project Value
            </span>
            <div className="text-sm font-semibold text-[#0A0A0A] mono-num mt-0.5">
              {formatCurrency(project.project_value, currency)}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center mt-0.5">
              <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
              +{formatCurrency(project.value_delta_month, currency)} MoM
            </span>
          </div>

          {/* Performance block */}
          <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
              Performance
            </span>
            <div className="text-sm font-semibold text-[#0A0A0A] mono-num mt-0.5 flex items-center gap-1">
              {project.performance_score}/100
              {project.performance_delta_month >= 0 ? (
                <span className="text-[11px] text-emerald-600 font-semibold">
                  ↑ {project.performance_delta_month}%
                </span>
              ) : (
                <span className="text-[11px] text-rose-600 font-semibold">
                  ↓ {Math.abs(project.performance_delta_month)}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 capitalize">
              {project.performance_trend} trend
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Milestones count, Last Updated, Quick Update button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <CheckCircle2 className="w-3 h-3 text-slate-700" />
            {project.milestones.filter((m) => m.completed).length}/{project.milestones.length}
          </span>

          {project.github_commits_count && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <GitBranch className="w-3 h-3" />
              {project.github_commits_count}
            </span>
          )}

          {isStagnant && (
            <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
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
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-black hover:text-white text-slate-700 text-[11px] font-medium transition-all"
        >
          <MessageSquarePlus className="w-3 h-3" />
          <span>Update</span>
        </button>
      </div>
    </div>
  );
};
