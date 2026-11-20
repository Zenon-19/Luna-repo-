import React from 'react';
import { 
  LayoutGrid, 
  ListFilter, 
  Calendar, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Share2
} from 'lucide-react';
import { Project, ProjectSnapshot, ProjectSortOption } from '../types';
import { ProjectCard } from './ProjectCard';
import { formatCurrency, getHealthBadgeColor, getStageColor } from '../utils/formatters';
import { checkProjectStagnation } from '../utils/alerts';
import { monitorProjectBudget } from '../utils/budget';
import { HighlightedText } from './HighlightedText';

interface ProjectGridProps {
  projects: Project[];
  snapshots?: ProjectSnapshot[];
  currency: string;
  viewMode: 'grid' | 'table' | 'timeline' | 'audit';
  sortBy?: ProjectSortOption;
  onSortChange?: (sort: ProjectSortOption) => void;
  searchQuery?: string;
  onSelectProject: (project: Project) => void;
  onQuickUpdate: (projectName: string) => void;
  onShareProject?: (project: Project) => void;
  onOpenNewProject: () => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({
  projects,
  snapshots = [],
  currency,
  viewMode,
  sortBy,
  onSortChange,
  searchQuery = '',
  onSelectProject,
  onQuickUpdate,
  onShareProject,
  onOpenNewProject,
}) => {
  if (projects.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center my-6 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#0A0A0A] mb-1">
          {searchQuery.trim()
            ? `No projects matching "${searchQuery}"`
            : 'No matching projects found'}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
          {searchQuery.trim()
            ? 'Check your search query spelling or try filtering by another category.'
            : 'Try clearing your search query, or tell Luna to create a new project with natural language.'}
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
            searchQuery={searchQuery}
            onClick={() => onSelectProject(project)}
            onQuickUpdate={onQuickUpdate}
            onShare={onShareProject}
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
                <th 
                  className={`py-4 px-6 ${onSortChange ? 'cursor-pointer hover:text-black transition-colors select-none' : ''}`}
                  onClick={() => {
                    if (onSortChange) {
                      onSortChange(sortBy === 'value_desc' ? 'value_asc' : 'value_desc');
                    }
                  }}
                  title="Click to sort by Project Value"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Project Value</span>
                    {sortBy === 'value_desc' && <ArrowDown className="w-3 h-3 text-black" />}
                    {sortBy === 'value_asc' && <ArrowUp className="w-3 h-3 text-black" />}
                  </div>
                </th>
                <th className="py-4 px-6">Cost / Budget</th>
                <th className="py-4 px-6">Performance</th>
                <th 
                  className={`py-4 px-6 ${onSortChange ? 'cursor-pointer hover:text-black transition-colors select-none' : ''}`}
                  onClick={() => {
                    if (onSortChange) {
                      onSortChange(sortBy === 'health_desc' ? 'health_asc' : 'health_desc');
                    }
                  }}
                  title="Click to sort by Health Score"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Health</span>
                    {sortBy === 'health_desc' && <ArrowDown className="w-3 h-3 text-black" />}
                    {sortBy === 'health_asc' && <ArrowUp className="w-3 h-3 text-black" />}
                  </div>
                </th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => {
                const health = getHealthBadgeColor(p.health_score);
                const stagnation = checkProjectStagnation(p, snapshots);
                const budget = monitorProjectBudget(p);
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProject(p)}
                    className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${
                      budget.isOverBudget
                        ? 'bg-rose-50/20'
                        : budget.exceedsThreshold
                        ? 'bg-amber-50/15'
                        : ''
                    }`}
                  >
                    <td className="py-4 px-6 font-semibold text-[#0A0A0A]">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color || '#000000' }}
                        />
                        <span className="text-sm font-semibold tracking-tight">
                          <HighlightedText text={p.name} highlight={searchQuery} />
                        </span>
                        {stagnation.isStagnant && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[10px] font-semibold"
                            title={stagnation.reason}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Stagnant ({stagnation.stagnantDays}d)</span>
                          </span>
                        )}
                        {budget.exceedsThreshold && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
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
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <HighlightedText text={p.category} highlight={searchQuery} />
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-slate-700 font-medium">
                        <HighlightedText text={p.stage} highlight={searchQuery} />
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
                      <div className="flex flex-col gap-1 min-w-[110px]" title={budget.reason}>
                        <div className="flex items-center justify-between gap-2 text-xs mono-num">
                          <span className="text-slate-700 font-medium">
                            {formatCurrency(p.cost_to_date, currency)}
                          </span>
                          <span
                            className={`font-bold ${
                              budget.isOverBudget
                                ? 'text-rose-700'
                                : budget.exceedsThreshold
                                ? 'text-amber-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {budget.utilizationPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
                          <div
                            className={`h-1.5 rounded-full ${
                              budget.isOverBudget
                                ? 'bg-rose-600'
                                : budget.exceedsThreshold
                                ? 'bg-amber-500'
                                : 'bg-slate-600'
                            }`}
                            style={{ width: `${Math.min(100, budget.utilizationPercentage)}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-px bg-slate-400/70"
                            style={{ left: '80%' }}
                          />
                        </div>
                      </div>
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
                      <div className="inline-flex items-center gap-1.5">
                        {onShareProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareProject(p);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-black text-slate-600 hover:text-black text-xs font-semibold transition-all cursor-pointer"
                            title="Share client progress link"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Share</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickUpdate(p.name);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-black hover:text-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Update
                        </button>
                      </div>
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
        const budget = monitorProjectBudget(project);
        return (
          <div
            key={project.id}
            className={`bg-white border rounded-2xl p-6 transition-colors shadow-sm ${
              budget.isOverBudget
                ? 'border-rose-200/90 hover:border-rose-400'
                : budget.exceedsThreshold || stagnation.isStagnant
                ? 'border-amber-200/90 hover:border-amber-400'
                : 'border-slate-100 hover:border-black'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color || '#000000' }}
                />
                <h4 className="font-semibold text-base text-[#0A0A0A] tracking-tight">
                  <HighlightedText text={project.name} highlight={searchQuery} />
                </h4>
                <span className="text-xs text-slate-400">
                  (<HighlightedText text={project.category} highlight={searchQuery} />)
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold mono-num">
                  {project.progress_percentage}%
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-600 font-medium mono-num">
                  Cost: {formatCurrency(project.cost_to_date, currency)} / {formatCurrency(project.project_value, currency)}
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
                {budget.exceedsThreshold && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[10px] font-semibold ${
                      budget.isOverBudget
                        ? 'bg-rose-50 border-rose-200/90 text-rose-800'
                        : 'bg-amber-50 border-amber-200/80 text-amber-800'
                    }`}
                    title={budget.reason}
                  >
                    <AlertTriangle
                      className={`w-3 h-3 ${
                        budget.isOverBudget ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    />
                    <span>
                      {budget.isOverBudget
                        ? `Over Budget (${budget.utilizationPercentage}%)`
                        : `Budget ${budget.utilizationPercentage}% (>80%)`}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                {onShareProject && (
                  <button
                    onClick={() => onShareProject(project)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-black text-xs font-semibold text-slate-700 hover:text-black transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Share Client View</span>
                  </button>
                )}
                <button
                  onClick={() => onSelectProject(project)}
                  className="text-xs text-black hover:underline font-semibold cursor-pointer"
                >
                  Open Project Intelligence →
                </button>
              </div>
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
                    <HighlightedText text={m.title} highlight={searchQuery} />
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
