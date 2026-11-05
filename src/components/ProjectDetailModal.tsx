import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Coins,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  History,
  MessageSquare,
  BarChart3,
  Layers,
  Flame,
  GitBranch,
  User,
  AlertTriangle
} from 'lucide-react';
import { Project, ProjectSnapshot, ProjectUpdateRecord, Milestone } from '../types';
import { formatCurrency, formatExactCurrency, getHealthBadgeColor, getStageColor, timeAgo } from '../utils/formatters';
import { checkProjectStagnation } from '../utils/alerts';

interface ProjectDetailModalProps {
  project: Project;
  snapshots: ProjectSnapshot[];
  updateRecords: ProjectUpdateRecord[];
  currency: string;
  onClose: () => void;
  onUpdateMilestone: (projectId: string, milestoneId: string, completed: boolean) => void;
  onAddMilestone: (projectId: string, title: string, targetDate: string) => void;
  onQuickUpdate: (projectName: string) => void;
  onExportAuditTrail?: (projectId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  snapshots,
  updateRecords,
  currency,
  onClose,
  onUpdateMilestone,
  onAddMilestone,
  onQuickUpdate,
  onExportAuditTrail,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'financials' | 'milestones' | 'audit'>(
    'overview'
  );
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);

  const projectSnapshots = snapshots.filter((s) => s.project_id === project.id);
  const projectAuditRecords = updateRecords.filter((r) => r.project_id === project.id);

  const healthBadge = getHealthBadgeColor(project.health_score);
  const stageBadge = getStageColor(project.stage);
  const stagnation = checkProjectStagnation(project, snapshots);

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    onAddMilestone(
      project.id,
      newMilestoneTitle.trim(),
      newMilestoneDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    );
    setNewMilestoneTitle('');
    setNewMilestoneDate('');
    setIsAddingMilestone(false);
  };

  const roi =
    project.cost_to_date > 0
      ? Math.round(((project.realized_value - project.cost_to_date) / project.cost_to_date) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] my-auto text-slate-900">
        {/* Top Header */}
        <div className="p-7 sm:p-8 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center font-bold text-base text-black shadow-xs"
            >
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-[#0A0A0A] tracking-tight">{project.name}</h2>
                <span className="text-xs text-slate-400 font-medium">
                  · {project.stage} Stage
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                  {project.health_score}/100 {healthBadge.label}
                </span>
                {stagnation.isStagnant && (
                  <span
                    className="text-xs bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5"
                    title={stagnation.reason}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Stagnant &gt; 14d ({stagnation.stagnantDays}d)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {project.category} · Owned by {project.owner} · Started {project.start_date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={() => {
                onClose();
                onQuickUpdate(project.name);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Update with Luna</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-7 sm:px-8 bg-white border-b border-slate-100 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer mr-3 ${
              activeTab === 'overview'
                ? 'border-black text-black'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Overview & Context
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer mr-3 ${
              activeTab === 'progress'
                ? 'border-black text-black'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Progress & Velocity ({project.progress_percentage}%)
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer mr-3 ${
              activeTab === 'financials'
                ? 'border-black text-black'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Financials & ROI ({formatCurrency(project.project_value, currency)})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer mr-3 ${
              activeTab === 'milestones'
                ? 'border-black text-black'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Milestones ({project.milestones.filter((m) => m.completed).length}/{project.milestones.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'border-black text-black'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Audit Trail ({projectAuditRecords.length} Messages)
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-7 sm:p-8 overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Proactive Stagnation Alert Banner */}
              {stagnation.isStagnant && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 shadow-xs flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <span>Proactive Alert · Progress Stagnant for {stagnation.stagnantDays} Days</span>
                      </h4>
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60">
                        Threshold Exceeded (&gt; 14d)
                      </span>
                    </div>
                    <p className="text-xs text-amber-950/90 leading-relaxed mb-3">
                      Historical snapshot analysis reveals progress has remained unchanged at <strong className="font-semibold text-black">{project.progress_percentage}%</strong> since {stagnation.sinceSnapshotDate}. Zero progress advancement has been recorded across snapshots for {stagnation.stagnantDays} days.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onQuickUpdate(project.name);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Post Progress Update with Luna</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Description Card */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-6 shadow-xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Project Mission & Overview
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Architecture & "How It's Made" Section */}
              {(project.how_made || project.architecture || project.tech_stack) && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-black" />
                      <span>Architecture & How It&apos;s Made</span>
                    </h4>
                    {project.repo_name && (
                      <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                        <GitBranch className="w-3 h-3 text-slate-600" />
                        <span>{project.repo_name}</span>
                        {project.github_commits_count && (
                          <span className="text-slate-400">· {project.github_commits_count} commits</span>
                        )}
                      </span>
                    )}
                  </div>

                  {project.how_made && (
                    <p className="text-xs text-slate-700 leading-relaxed mb-4">
                      {project.how_made}
                    </p>
                  )}

                  {project.architecture && (
                    <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3.5 mb-4 text-xs font-mono text-slate-800 leading-relaxed overflow-x-auto">
                      <span className="text-[10px] text-slate-400 uppercase font-bold font-sans block mb-1">
                        Architecture Flow
                      </span>
                      {project.architecture}
                    </div>
                  )}

                  {project.tech_stack && project.tech_stack.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">
                        Core Tech Stack & Protocols
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200/70"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* High Level 3-Metric Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Current Progress
                  </span>
                  <div className="text-2xl font-bold text-[#0A0A0A] mono-num mt-1">
                    {project.progress_percentage}%
                  </div>
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">
                    +{project.progress_delta_month}% vs last month
                  </span>
                </div>
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Estimated Valuation
                  </span>
                  <div className="text-2xl font-bold text-[#0A0A0A] mono-num mt-1">
                    {formatCurrency(project.project_value, currency)}
                  </div>
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">
                    +{formatCurrency(project.value_delta_month, currency)} MoM
                  </span>
                </div>
                <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Target Completion
                  </span>
                  <div className="text-lg font-bold text-[#0A0A0A] mono-num mt-1">
                    {project.target_completion_date}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Target velocity on schedule
                  </span>
                </div>
              </div>

              {/* Business Signals & Intelligence Highlights */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5 shadow-xs">
                <h4 className="text-xs font-semibold text-[#0A0A0A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>Luna Business Signals & Market Notes</span>
                </h4>
                <div className="space-y-2">
                  {project.business_signals.map((sig, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 bg-white border border-slate-200/80 p-3 rounded-xl shadow-xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROGRESS & VELOCITY */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              {/* Progress Breakdown */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Progress Progression Curve
                  </span>
                  <div className="flex items-center gap-2">
                    {stagnation.isStagnant && (
                      <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-0.5 rounded-lg font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Stagnant for {stagnation.stagnantDays} days</span>
                      </span>
                    )}
                    <span className="text-lg font-bold text-[#0A0A0A] mono-num">
                      {project.progress_percentage}% Completed
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full ${stagnation.isStagnant ? 'bg-amber-600' : 'bg-black'}`}
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>

                {/* Snapshots Table */}
                <div className="flex items-center justify-between mt-5 mb-2">
                  <h5 className="text-xs font-semibold text-slate-700">
                    Historical Progression Snapshots
                  </h5>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {projectSnapshots.length} snapshot records
                  </span>
                </div>
                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Progress</th>
                        <th className="py-2.5 px-3">Valuation</th>
                        <th className="py-2.5 px-3">Health</th>
                        <th className="py-2.5 px-3">Snapshot Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {projectSnapshots.map((snap) => {
                        const isStagnantSnapshot =
                          stagnation.isStagnant &&
                          snap.progress_percentage === project.progress_percentage &&
                          new Date(snap.snapshot_date).getTime() >=
                            new Date(stagnation.sinceSnapshotDate || '').getTime();

                        return (
                          <tr
                            key={snap.id}
                            className={`hover:bg-slate-50/60 ${
                              isStagnantSnapshot ? 'bg-amber-50/20' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 mono-num text-slate-600">
                              {snap.snapshot_date}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-black mono-num">
                              <span className="inline-flex items-center gap-1.5">
                                <span>{snap.progress_percentage}%</span>
                                {isStagnantSnapshot && (
                                  <span className="text-[9px] uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-bold">
                                    Frozen
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 mono-num">
                              {formatCurrency(snap.project_value, currency)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 mono-num text-[11px] font-semibold">
                                {snap.health_score}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {snap.note || 'Regular snapshot'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIALS */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 shadow-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    Current Valuation
                  </span>
                  <div className="text-xl font-bold text-[#0A0A0A] mono-num mt-1">
                    {formatExactCurrency(project.project_value, currency)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 shadow-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    Realized Revenue
                  </span>
                  <div className="text-xl font-bold text-emerald-700 mono-num mt-1">
                    {formatExactCurrency(project.realized_value, currency)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 shadow-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    Potential Pipeline
                  </span>
                  <div className="text-xl font-bold text-indigo-700 mono-num mt-1">
                    {formatExactCurrency(project.potential_value, currency)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 shadow-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                    Calculated ROI
                  </span>
                  <div className="text-xl font-bold text-black mono-num mt-1">
                    +{roi}%
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 shadow-xs">
                <h5 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                  Cost to Date vs Return
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Direct operational and development expenditure to date is{' '}
                  <span className="mono-num text-black font-semibold">
                    {formatExactCurrency(project.cost_to_date, currency)}
                  </span>
                  , delivering a net realization multiple of{' '}
                  <span className="mono-num text-emerald-700 font-semibold">
                    {(project.realized_value / (project.cost_to_date || 1)).toFixed(1)}x
                  </span>
                  .
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: MILESTONES & TIMELINE */}
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              {/* Timeline Horizon Banner */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-black" />
                    <span>Project Timeline & Delivery Horizon</span>
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {project.progress_percentage}% Delivered (Ending 2026)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Project Initiation</span>
                    <span className="font-semibold text-slate-800">{project.start_date}</span>
                  </div>
                  <div className="bg-white border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Target Completion</span>
                    <span className="font-semibold text-slate-800">{project.target_completion_date} (This Year)</span>
                  </div>
                  <div className="bg-white border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Milestone Velocity</span>
                    <span className="font-semibold text-emerald-700">
                      {project.milestones.filter((m) => m.completed).length} of {project.milestones.length} Completed (100%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Milestone Deliverables & Timeline
                </span>
                <button
                  onClick={() => setIsAddingMilestone(!isAddingMilestone)}
                  className="flex items-center gap-1 text-xs text-black hover:text-slate-700 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Milestone</span>
                </button>
              </div>

              {isAddingMilestone && (
                <form
                  onSubmit={handleCreateMilestone}
                  className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="text"
                    placeholder="Milestone title (e.g. Stripe checkout live)..."
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 text-xs text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-black"
                  />
                  <input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    className="bg-white border border-slate-200 text-xs text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-black"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {project.milestones.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      m.completed
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                        : 'bg-white border-slate-100 text-[#0A0A0A] shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onUpdateMilestone(project.id, m.id, !m.completed)}
                        className="text-slate-400 hover:text-black transition-colors cursor-pointer"
                      >
                        {m.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div>
                        <span className={`text-xs ${m.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                          {m.title}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Target: {m.target_date} {m.completed_at && `• Completed on ${m.completed_at}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Natural-Language Audit Trail
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {projectAuditRecords.length} recorded events for {project.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onExportAuditTrail && (
                    <button
                      onClick={() => onExportAuditTrail(project.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Export & Copy Audit (.md)</span>
                    </button>
                  )}
                  <span className="text-[11px] text-slate-500 mono-num font-semibold bg-slate-100 px-2.5 py-1 rounded-lg">
                    {projectAuditRecords.length} Records
                  </span>
                </div>
              </div>

              {projectAuditRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                  No conversational updates recorded yet. Send a message to Luna at the bottom to create your first permanent record!
                </div>
              ) : (
                <div className="space-y-3">
                  {projectAuditRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 text-xs space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 text-[11px] text-slate-400">
                        <span className="mono-num">{new Date(record.timestamp).toLocaleString()}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold mono-num">
                          Confidence: {Math.round(record.confidence_score * 100)}%
                        </span>
                      </div>

                      {/* Original User Message */}
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold mb-1">
                          Original User Message:
                        </span>
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-800 italic">
                          “{record.original_message}”
                        </div>
                      </div>

                      {/* AI Summary */}
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#0A0A0A] block font-semibold mb-1">
                          Luna Interpretation:
                        </span>
                        <p className="text-slate-700">{record.ai_summary}</p>
                      </div>

                      {/* Field Changes Table */}
                      {record.changes.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold mb-1.5">
                            Recorded Changes:
                          </span>
                          <div className="space-y-1">
                            {record.changes.map((c, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg mono-num text-[11px] border border-slate-100"
                              >
                                <span className="text-slate-700 font-medium">{c.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400">{c.old_value}</span>
                                  <span className="text-slate-300">→</span>
                                  <span className="text-emerald-700 font-semibold">{c.new_value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
