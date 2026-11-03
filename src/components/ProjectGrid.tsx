import React from 'react';
import { LayoutGrid, ListFilter, Calendar, Plus, Sparkles, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Project, ProjectSnapshot } from '../types';
import { ProjectCard } from './ProjectCard';
import { formatCurrency, getHealthBadgeColor, getStageColor } from '../utils/formatters';
import { checkProjectStagnation } from '../utils/alerts';

interface ProjectGridProps {
  projects: Project[];
  snapshots?: ProjectSnapshot[];
  currency: string;
  viewMode: 'grid' | 'table' | 'timeline' | 'audit';
  onSelectProject: (project: Project) => void;
  onQuickUpdate: (projectName: string) => void;
  onOpenNewProject: () => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  snapshots = [],
  currency,
  viewMode,
  onSelectProject,
  onQuickUpdate,
  onOpenNewProject,
}) => {
  if (projects.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center my-6 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#0A0A0A] mb-1">No matching projects found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
          Try clearing your search query, or tell Luna to create a new project with natural language.
        </p>
        <button
          onClick={onOpenNewProject}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project</span>
        </button>
      </div>
    );
  }

  // 1. Grid Mode
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            snapshots={snapshots}
            currency={currency}
            onClick={() => onSelectProject(project)}
            onQuickUpdate={onQuickUpdate}
          />
        ))}
      </div>
    );
  }

  // 2. Table / Ledger Mode
  if (viewMode === 'table') {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden mb-10 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-100">
              <tr>
                <th className="py-4 px-6">Project Name</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Stage</th>
                <th className="py-4 px-6">Progress</th>
                <th className="py-4 px-6">Project Value</th>
                <th className="py-4 px-6">Performance</th>
                <th className="py-4 px-6">Health</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => {
                const health = getHealthBadgeColor(p.health_score);
                const stagnation = checkProjectStagnation(p, snapshots);
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProject(p)}
                    className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-[#0A0A0A]">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color || '#000000' }}
                        />
                        <span className="text-sm font-semibold tracking-tight">{p.name}</span>
                        {stagnation.isStagnant && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-semibold"
                            title={stagnation.reason}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Stagnant ({stagnation.stagnantDays}d)</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{p.category}</td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-slate-700 font-medium">
                        {p.stage}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              stagnation.isStagnant ? 'bg-amber-600' : 'bg-black'
                            }`}
                            style={{ width: `${p.progress_percentage}%` }}
                          />
                        </div>
                        <span className="mono-num text-slate-900 text-xs font-semibold">
                          {p.progress_percentage}%
                        </span>
                        {stagnation.isStagnant && (
                          <span
                            className="text-[10px] text-amber-700 font-bold"
                            title={stagnation.reason}
                          >
                            · {stagnation.stagnantDays}d frozen
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 mono-num font-semibold text-sm text-[#0A0A0A]">
                      {formatCurrency(p.project_value, currency)}
                    </td>
                    <td className="py-4 px-6">
                      {stagnation.isStagnant ? (
                        <span className="text-amber-700 font-bold mono-num text-xs">
                          → {p.performance_score}/100
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold mono-num text-xs">
                          ↑ {p.performance_score}/100
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-[#0A0A0A] mono-num">
                        {p.health_score} <span className="text-slate-400 font-normal">({health.label})</span>
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickUpdate(p.name);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-black hover:text-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 3. Milestone Roadmap View
  return (
    <div className="space-y-5 mb-10">
      {projects.map((project) => {
        const stagnation = checkProjectStagnation(project, snapshots);
        return (
          <div
            key={project.id}
            className={`bg-white border rounded-2xl p-6 transition-colors shadow-sm ${
              stagnation.isStagnant ? 'border-amber-200/90' : 'border-slate-100 hover:border-black'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color || '#000000' }}
                />
                <h4 className="font-semibold text-base text-[#0A0A0A] tracking-tight">{project.name}</h4>
                <span className="text-xs text-slate-400">({project.category})</span>
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold mono-num">
                  {project.progress_percentage}%
                </span>
                {stagnation.isStagnant && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-semibold"
                    title={stagnation.reason}
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Stagnant &gt; 14d ({stagnation.stagnantDays}d)</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => onSelectProject(project)}
                className="text-xs text-black hover:underline font-semibold self-start sm:self-auto cursor-pointer"
              >
                Open Project Intelligence →
              </button>
            </div>

          {/* Milestones list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {project.milestones.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                  m.completed
                    ? 'bg-emerald-50/50 border-emerald-100 text-slate-800'
                    : 'bg-slate-50/70 border-slate-100 text-slate-600'
                }`}
              >
                <div className="flex items-start gap-2.5 mb-2.5">
                  <CheckCircle2
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      m.completed ? 'text-emerald-600' : 'text-slate-300'
                    }`}
                  />
                  <span className={m.completed ? 'line-through text-slate-400' : 'font-medium text-[#0A0A0A]'}>
                    {m.title}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between mt-auto">
                  <span>Target: {m.target_date}</span>
                  {m.completed && <span className="text-emerald-700 font-bold">Done</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);
};
