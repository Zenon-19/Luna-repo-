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
  User
} from 'lucide-react';
import { Project, ProjectSnapshot, ProjectUpdateRecord, Milestone } from '../types';
import { formatCurrency, formatExactCurrency, getHealthBadgeColor, getStageColor, timeAgo } from '../utils/formatters';

interface ProjectDetailModalProps {
  project: Project;
  snapshots: ProjectSnapshot[];
  updateRecords: ProjectUpdateRecord[];
  currency: string;
  onClose: () => void;
  onUpdateMilestone: (projectId: string, milestoneId: string, completed: boolean) => void;
  onAddMilestone: (projectId: string, title: string, targetDate: string) => void;
  onQuickUpdate: (projectName: string) => void;
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
      <div className="relative w-full max-w-4xl bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto text-slate-900">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-xs"
              style={{
                backgroundColor: project.color || '#000000',
              }}
            >
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-[#0A0A0A] tracking-tight">{project.name}</h2>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-lg border ${stageBadge}`}>
                  {project.stage}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${healthBadge.bg} ${healthBadge.text} ${healthBadge.border}`}
                >
                  {project.health_score}/100 • {healthBadge.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {project.category} • Owned by {project.owner} • Started {project.start_date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                onClose();
                onQuickUpdate(project.name);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
        <div className="flex items-center gap-1 px-6 pt-2 bg-slate-50/40 border-b border-slate-100 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-black text-black font-semibold'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Overview & Context
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-3.5 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'progress'
                ? 'border-black text-black font-semibold'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Progress & Velocity ({project.progress_percentage}%)
          </button>
          <button
            onClick={() => setActiveTab('financials')}
            className={`px-3.5 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'financials'
                ? 'border-black text-black font-semibold'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Financials & ROI ({formatCurrency(project.project_value, currency)})
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3.5 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'milestones'
                ? 'border-black text-black font-semibold'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Milestones ({project.milestones.filter((m) => m.completed).length}/{project.milestones.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'border-black text-black font-semibold'
                : 'border-transparent text-slate-400 hover:text-black'
            }`}
          >
            Audit Trail ({projectAuditRecords.length} Messages)
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description Card */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-5 shadow-xs">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Project Mission & Overview
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 mono-num"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* High Level 3-Metric Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4.5 shadow-xs">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Current Progress
                  </span>
                  <div className="text-2xl font-bold text-[#0A0A0A] mono-num mt-1">
                    {project.progress_percentage}%
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                    +{project.progress_delta_month}% from last month
                  </span>
                </div>
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4.5 shadow-xs">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Estimated Valuation
                  </span>
                  <div className="text-2xl font-bold text-[#0A0A0A] mono-num mt-1">
                    {formatCurrency(project.project_value, currency)}
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                    +{formatCurrency(project.value_delta_month, currency)} MoM
                  </span>
                </div>
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4.5 shadow-xs">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
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
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Progress Progression Curve
                  </span>
                  <span className="text-lg font-bold text-[#0A0A0A] mono-num">
                    {project.progress_percentage}% Completed
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full bg-black"
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>

                {/* Snapshots Table */}
                <h5 className="text-xs font-semibold text-slate-700 mb-2 mt-4">
                  Historical Progression Snapshots
                </h5>
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
                      {projectSnapshots.map((snap) => (
                        <tr key={snap.id} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 mono-num text-slate-500">{snap.snapshot_date}</td>
                          <td className="py-2 px-3 font-semibold text-black mono-num">
                            {snap.progress_percentage}%
                          </td>
                          <td className="py-2 px-3 mono-num">
                            {formatCurrency(snap.project_value, currency)}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 mono-num text-[11px] font-semibold">
                              {snap.health_score}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">{snap.note || 'Regular snapshot'}</td>
                        </tr>
                      ))}
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

          {/* TAB 4: MILESTONES */}
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Milestone Deliverables
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Natural-Language Audit Trail
                </span>
                <span className="text-[11px] text-slate-400 mono-num font-medium">
                  {projectAuditRecords.length} Saved Records
                </span>
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
