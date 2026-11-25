import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertTriangle,
  Share2,
  Send,
  Edit3,
  Trash2,
  Archive,
  Save
} from 'lucide-react';
import {
  Project,
  ProjectCategory,
  ProjectStage,
  ProjectStatus,
  ProjectSnapshot,
  ProjectUpdateRecord,
  Milestone,
  MilestoneComment,
} from '../types';
import { formatCurrency, formatExactCurrency, getHealthBadgeColor, getStageColor, timeAgo } from '../utils/formatters';
import { checkProjectStagnation } from '../utils/alerts';
import { monitorProjectBudget } from '../utils/budget';
import {
  fetchMilestoneComments,
  createMilestoneComment,
  mergeMilestoneComments,
} from '../services/api';

type ModalTab = 'overview' | 'progress' | 'financials' | 'milestones' | 'audit';

const PROJECT_CATEGORIES: ProjectCategory[] = [
  'SaaS',
  'Agency / Client',
  'AI & ML',
  'Fintech',
  'Mobile App',
  'Developer Tools',
  'E-commerce',
  'Infrastructure',
  'Internal Tool',
];

const PROJECT_STAGES: ProjectStage[] = [
  'Idea',
  'Design & Spec',
  'MVP',
  'Development',
  'Beta Testing',
  'Launch',
  'Scaling',
  'Delivered',
  'Production',
  'Completed',
];

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'archived', label: 'Archived' },
];

interface ProjectDetailModalProps {
  project: Project;
  snapshots: ProjectSnapshot[];
  updateRecords: ProjectUpdateRecord[];
  currency: string;
  initialTab?: ModalTab;
  focusedMilestoneId?: string | null;
  onClose: () => void;
  onUpdateMilestone: (projectId: string, milestoneId: string, completed: boolean) => void;
  onAddMilestone: (projectId: string, title: string, targetDate: string) => void;
  onUpdateProject?: (projectId: string, updatedFields: Partial<Project>) => void;
  onDeleteProject?: (projectId: string) => void;
  onFeedbackRead?: (commentIds: string[]) => void;
  onQuickUpdate: (projectName: string) => void;
  onExportAuditTrail?: (projectId: string) => void;
  onShareProject?: (project: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  snapshots,
  updateRecords,
  currency,
  initialTab = 'overview',
  focusedMilestoneId = null,
  onClose,
  onUpdateMilestone,
  onAddMilestone,
  onUpdateProject,
  onDeleteProject,
  onFeedbackRead,
  onQuickUpdate,
  onExportAuditTrail,
  onShareProject,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit form controlled state
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description);
  const [editCategory, setEditCategory] = useState<ProjectCategory>(project.category);
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status);
  const [editStage, setEditStage] = useState<ProjectStage>(project.stage);
  const [editOwner, setEditOwner] = useState(project.owner);
  const [editProgress, setEditProgress] = useState(String(project.progress_percentage));
  const [editHealthScore, setEditHealthScore] = useState(String(project.health_score));
  const [editProjectValue, setEditProjectValue] = useState(String(project.project_value));
  const [editRealizedValue, setEditRealizedValue] = useState(String(project.realized_value));
  const [editCostToDate, setEditCostToDate] = useState(String(project.cost_to_date));
  const [editStartDate, setEditStartDate] = useState(project.start_date);
  const [editTargetDate, setEditTargetDate] = useState(project.target_completion_date);
  const [editTags, setEditTags] = useState(project.tags.join(', '));
  const [editTechStack, setEditTechStack] = useState((project.tech_stack || []).join(', '));
  const [editArchitecture, setEditArchitecture] = useState(project.architecture || '');
  const [editResults, setEditResults] = useState((project.business_signals || []).join('\n'));

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [remoteComments, setRemoteComments] = useState<MilestoneComment[]>([]);
  const [replyingMilestoneId, setReplyingMilestoneId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const milestoneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, project.id]);

  useEffect(() => {
    setEditName(project.name);
    setEditDescription(project.description);
    setEditCategory(project.category);
    setEditStatus(project.status);
    setEditStage(project.stage);
    setEditOwner(project.owner);
    setEditProgress(String(project.progress_percentage));
    setEditHealthScore(String(project.health_score));
    setEditProjectValue(String(project.project_value));
    setEditRealizedValue(String(project.realized_value));
    setEditCostToDate(String(project.cost_to_date));
    setEditStartDate(project.start_date);
    setEditTargetDate(project.target_completion_date);
    setEditTags(project.tags.join(', '));
    setEditTechStack((project.tech_stack || []).join(', '));
    setEditArchitecture(project.architecture || '');
    setEditResults((project.business_signals || []).join('\n'));
    setConfirmDelete(false);
    setEditError(null);
  }, [project]);

  useEffect(() => {
    let active = true;
    fetchMilestoneComments(project.id).then((loaded) => {
      if (active) setRemoteComments(loaded);
    });
    return () => {
      active = false;
    };
  }, [project.id]);

  const allMilestoneComments = useMemo(
    () =>
      mergeMilestoneComments(
        project.milestones.flatMap((m) => m.comments || []),
        remoteComments
      ),
    [project.milestones, remoteComments]
  );

  const commentsByMilestone = useMemo(() => {
    const grouped: Record<string, MilestoneComment[]> = {};
    allMilestoneComments.forEach((c) => {
      if (!grouped[c.milestone_id]) grouped[c.milestone_id] = [];
      grouped[c.milestone_id].push(c);
    });
    return grouped;
  }, [allMilestoneComments]);

  // Mark client comments read when viewing the Milestones tab
  useEffect(() => {
    if (activeTab === 'milestones' && !isEditing && onFeedbackRead) {
      const clientCommentIds = allMilestoneComments
        .filter((c) => c.author_role === 'client')
        .map((c) => c.id);
      if (clientCommentIds.length > 0) {
        onFeedbackRead(clientCommentIds);
      }
    }
  }, [activeTab, isEditing, allMilestoneComments, onFeedbackRead]);

  // Scroll focused milestone into view when deep-linked from Feedback Inbox
  useEffect(() => {
    if (activeTab === 'milestones' && !isEditing && focusedMilestoneId) {
      const el = milestoneRefs.current[focusedMilestoneId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeTab, isEditing, focusedMilestoneId]);

  const handleSaveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProject) return;

    const cleanName = editName.trim();
    if (!cleanName) {
      setEditError('Project name is required.');
      return;
    }

    const parsedProgress = Number(editProgress);
    const parsedHealth = Number(editHealthScore);
    const parsedValue = Number(editProjectValue);
    const parsedRealized = Number(editRealizedValue);
    const parsedCost = Number(editCostToDate);

    if (
      Number.isNaN(parsedProgress) ||
      Number.isNaN(parsedHealth) ||
      Number.isNaN(parsedValue) ||
      Number.isNaN(parsedRealized) ||
      Number.isNaN(parsedCost)
    ) {
      setEditError('Numeric fields must contain valid numbers.');
      return;
    }

    if (parsedValue < 0 || parsedRealized < 0 || parsedCost < 0) {
      setEditError('Project value, realized value, and cost to date cannot be negative.');
      return;
    }

    const clampedProgress = Math.min(100, Math.max(0, Math.round(parsedProgress)));
    const clampedHealth = Math.min(100, Math.max(0, Math.round(parsedHealth)));
    const parsedTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const parsedTech = editTechStack
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const parsedResults = editResults
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const derivedHealthStatus =
      clampedHealth >= 90
        ? 'Excellent'
        : clampedHealth >= 75
        ? 'Healthy'
        : clampedHealth >= 60
        ? 'Attention Required'
        : clampedHealth >= 40
        ? 'At Risk'
        : 'Critical';

    onUpdateProject(project.id, {
      name: cleanName,
      slug: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || project.slug,
      description: editDescription.trim() || project.description,
      category: editCategory,
      status: editStatus,
      stage: editStage,
      owner: editOwner.trim() || 'Project Lead',
      progress_percentage: clampedProgress,
      health_score: clampedHealth,
      health_status: derivedHealthStatus,
      project_value: parsedValue,
      realized_value: parsedRealized,
      cost_to_date: parsedCost,
      start_date: editStartDate || project.start_date,
      target_completion_date: editTargetDate || project.target_completion_date,
      tags: parsedTags,
      tech_stack: parsedTech,
      architecture: editArchitecture.trim() || undefined,
      business_signals: parsedResults,
    });

    setEditError(null);
    setIsEditing(false);
    setActiveTab('overview');
  };

  const handleOwnerReply = async (e: React.FormEvent, milestoneId: string) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setIsSendingReply(true);
    try {
      const saved = await createMilestoneComment({
        projectId: project.id,
        milestoneId,
        authorName: project.owner || 'Owner',
        authorRole: 'owner',
        feedbackType: 'feedback',
        message: trimmed,
      });
      setRemoteComments((prev) => mergeMilestoneComments(prev, [saved]));
      setReplyText('');
      setReplyingMilestoneId(null);
    } finally {
      setIsSendingReply(false);
    }
  };

  const projectSnapshots = snapshots.filter((s) => s.project_id === project.id);
  const projectAuditRecords = updateRecords.filter((r) => r.project_id === project.id);

  const healthBadge = getHealthBadgeColor(project.health_score);
  const stageBadge = getStageColor(project.stage);
  const stagnation = checkProjectStagnation(project, snapshots);
  const budget = monitorProjectBudget(project);

  const liveEditCost = Math.max(0, Number(editCostToDate) || 0);
  const liveEditValue = Math.max(0, Number(editProjectValue) || 0);
  const liveEditBudgetPct = liveEditValue > 0 ? Math.round((liveEditCost / liveEditValue) * 100) : 0;

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
                {budget.exceedsThreshold && (
                  <span
                    className={`text-xs border px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
                      budget.isOverBudget
                        ? 'bg-rose-50 text-rose-800 border-rose-200/90'
                        : 'bg-amber-50 text-amber-800 border-amber-200/80'
                    }`}
                    title={budget.reason}
                  >
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${
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
              <p className="text-xs text-slate-400 mt-1">
                {project.category} · Owned by {project.owner} · Started {project.start_date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            {onUpdateProject && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing((prev) => !prev);
                  setConfirmDelete(false);
                  setEditError(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isEditing
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 hover:border-black text-slate-800 hover:text-black'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Back to Details' : 'Edit'}</span>
              </button>
            )}
            {onShareProject && (
              <button
                onClick={() => {
                  onClose();
                  onShareProject(project);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-black text-slate-800 hover:text-black text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Client View</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onQuickUpdate(project.name);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Update with Luna</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close project details"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (hidden while editing) */}
        {!isEditing && (
          <div className="flex items-center gap-2 px-7 sm:px-8 bg-white border-b border-slate-100 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3.5 border-b-2 transition-all cursor-pointer mr-3 whitespace-nowrap shrink-0 ${
                activeTab === 'overview'
                  ? 'border-black text-black'
                  : 'border-transparent text-slate-400 hover:text-black'
              }`}
            >
              Overview & Context
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-3.5 border-b-2 transition-all cursor-pointer mr-3 whitespace-nowrap shrink-0 ${
                activeTab === 'progress'
                  ? 'border-black text-black'
                  : 'border-transparent text-slate-400 hover:text-black'
              }`}
            >
              Progress & Velocity ({project.progress_percentage}%)
            </button>
            <button
              onClick={() => setActiveTab('financials')}
              className={`py-3.5 border-b-2 transition-all cursor-pointer mr-3 whitespace-nowrap shrink-0 ${
                activeTab === 'financials'
                  ? 'border-black text-black'
                  : 'border-transparent text-slate-400 hover:text-black'
              }`}
            >
              Financials & ROI ({formatCurrency(project.project_value, currency)})
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`py-3.5 border-b-2 transition-all cursor-pointer mr-3 whitespace-nowrap shrink-0 ${
                activeTab === 'milestones'
                  ? 'border-black text-black'
                  : 'border-transparent text-slate-400 hover:text-black'
              }`}
            >
              Milestones ({project.milestones.filter((m) => m.completed).length}/{project.milestones.length})
              {allMilestoneComments.length > 0 ? ` · ${allMilestoneComments.length} Notes` : ''}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'audit'
                  ? 'border-black text-black'
                  : 'border-transparent text-slate-400 hover:text-black'
              }`}
            >
              Audit Trail ({projectAuditRecords.length} Messages)
            </button>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-7 sm:p-8 overflow-y-auto space-y-6">
          {/* FULL EDIT & LIFECYCLE MODE */}
          {isEditing && (
            <form onSubmit={handleSaveEdits} className="space-y-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#0A0A0A]">Edit Project Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update identity, delivery schedule, budget metrics, and client outcomes directly.
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 mono-num">Saved locally</span>
              </div>

              {editError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {editError}
                </div>
              )}

              {/* Identity & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      if (editError) setEditError(null);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ProjectCategory)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-black cursor-pointer"
                  >
                    {PROJECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Project Lead / Owner
                  </label>
                  <input
                    type="text"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    placeholder="Project Lead"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-black"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] leading-relaxed focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Status, Stage & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-black cursor-pointer"
                  >
                    {PROJECT_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Stage
                  </label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value as ProjectStage)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-black cursor-pointer"
                  >
                    {PROJECT_STAGES.map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Progress (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editProgress}
                    onChange={(e) => setEditProgress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Health Score (0–100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editHealthScore}
                    onChange={(e) => setEditHealthScore(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Target Completion
                  </label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Financials & Budget */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0A0A0A]">
                    Financials & Budget ({currency})
                  </span>
                  <span
                    className={`text-[11px] font-medium mono-num ${
                      liveEditBudgetPct > 100
                        ? 'text-rose-700'
                        : liveEditBudgetPct > 80
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    Budget Utilization: {liveEditBudgetPct}%
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Project Value / Budget
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editProjectValue}
                      onChange={(e) => setEditProjectValue(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Realized Value
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editRealizedValue}
                      onChange={(e) => setEditRealizedValue(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1.5">
                      Cost to Date
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editCostToDate}
                      onChange={(e) => setEditCostToDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              {/* Tags, Architecture & Client Outcomes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g. CRM, Enterprise, Q4"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Tech Stack (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editTechStack}
                    onChange={(e) => setEditTechStack(e.target.value)}
                    placeholder="e.g. React, TypeScript, Postgres"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-black"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Architecture Notes (optional, shared if enabled)
                  </label>
                  <textarea
                    rows={2}
                    value={editArchitecture}
                    onChange={(e) => setEditArchitecture(e.target.value)}
                    placeholder="Brief system architecture overview..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#0A0A0A] focus:outline-none focus:border-black"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Key Results & Outcomes (one per line, shown in Client Portal)
                  </label>
                  <textarea
                    rows={3}
                    value={editResults}
                    onChange={(e) => setEditResults(e.target.value)}
                    placeholder="Reduced onboarding time by 35%&#10;Launched client reporting portal"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-[#0A0A0A] leading-relaxed focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Save / Cancel & Lifecycle Controls */}
              <div className="pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (!onUpdateProject) return;
                      const nextStatus: ProjectStatus =
                        project.status === 'archived' ? 'active' : 'archived';
                      onUpdateProject(project.id, { status: nextStatus });
                      setIsEditing(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-black text-xs font-semibold text-slate-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{project.status === 'archived' ? 'Restore Active' : 'Archive Project'}</span>
                  </button>

                  {onDeleteProject && (
                    confirmDelete ? (
                      <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteProject(project.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-black cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-xs font-semibold text-rose-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Project</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditError(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-600 hover:text-black cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 1: OVERVIEW */}
          {!isEditing && activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Proactive Budget Threshold Warning Banner */}
              {budget.exceedsThreshold && (
                <div
                  className={`border rounded-2xl p-5 shadow-xs flex items-start gap-4 ${
                    budget.isOverBudget
                      ? 'bg-rose-50/70 border-rose-200/90'
                      : 'bg-amber-50/70 border-amber-200/80'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                      budget.isOverBudget
                        ? 'bg-rose-100 border-rose-200 text-rose-800'
                        : 'bg-amber-100 border-amber-200 text-amber-800'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        budget.isOverBudget ? 'text-rose-700' : 'text-amber-700'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h4
                        className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          budget.isOverBudget ? 'text-rose-900' : 'text-amber-900'
                        }`}
                      >
                        <span>
                          Budget Alert · {budget.utilizationPercentage}% of Project Budget Consumed
                        </span>
                      </h4>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          budget.isOverBudget
                            ? 'bg-rose-100 text-rose-800 border-rose-200/60'
                            : 'bg-amber-100 text-amber-800 border-amber-200/60'
                        }`}
                      >
                        {budget.isOverBudget ? 'Over Budget (> 100%)' : 'Threshold Exceeded (> 80%)'}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        budget.isOverBudget ? 'text-rose-950/90' : 'text-amber-950/90'
                      }`}
                    >
                      Expenditure to date (
                      <strong className="font-semibold text-black mono-num">
                        {formatExactCurrency(project.cost_to_date, currency)}
                      </strong>
                      ) has reached{' '}
                      <strong className="font-semibold text-black mono-num">
                        {budget.utilizationPercentage}%
                      </strong>{' '}
                      of total project value (
                      <strong className="font-semibold text-black mono-num">
                        {formatExactCurrency(project.project_value, currency)}
                      </strong>
                      ).{' '}
                      {budget.isOverBudget
                        ? `Current spend exceeds project budget by ${formatExactCurrency(Math.abs(budget.remainingBudget), currency)}.`
                        : `Only ${formatExactCurrency(budget.remainingBudget, currency)} remains in the allocated budget.`}
                    </p>
                  </div>
                </div>
              )}

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
                  <div
                    className={`text-xl font-bold mono-num mt-1 ${
                      roi < 0 ? 'text-rose-700' : 'text-black'
                    }`}
                  >
                    {roi >= 0 ? `+${roi}%` : `${roi}%`}
                  </div>
                </div>
              </div>

              {/* Budget Monitor Card */}
              <div
                className={`p-5 rounded-2xl border shadow-xs ${
                  budget.isOverBudget
                    ? 'bg-rose-50/40 border-rose-200/90'
                    : budget.exceedsThreshold
                    ? 'bg-amber-50/40 border-amber-200/80'
                    : 'bg-slate-50/60 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    {budget.exceedsThreshold && (
                      <AlertTriangle
                        className={`w-3.5 h-3.5 ${
                          budget.isOverBudget ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      />
                    )}
                    <span>Budget Utilization (Cost to Date vs Project Value)</span>
                  </h5>
                  <span
                    className={`text-xs font-bold mono-num px-2.5 py-0.5 rounded-full border ${
                      budget.isOverBudget
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : budget.exceedsThreshold
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {budget.utilizationPercentage}% Utilized · {budget.label}
                  </span>
                </div>

                <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden relative mb-3">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      budget.isOverBudget
                        ? 'bg-rose-600'
                        : budget.exceedsThreshold
                        ? 'bg-amber-500'
                        : 'bg-black'
                    }`}
                    style={{ width: `${Math.min(100, budget.utilizationPercentage)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-500/70"
                    style={{ left: '80%' }}
                    title="80% Alert Threshold"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/80 border border-slate-200/60 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                      Cost to Date
                    </span>
                    <span className="font-semibold text-[#0A0A0A] mono-num">
                      {formatExactCurrency(project.cost_to_date, currency)}
                    </span>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                      Budget (Project Value)
                    </span>
                    <span className="font-semibold text-[#0A0A0A] mono-num">
                      {formatExactCurrency(project.project_value, currency)}
                    </span>
                  </div>
                  <div className="bg-white/80 border border-slate-200/60 rounded-xl p-3">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">
                      {budget.remainingBudget >= 0 ? 'Remaining Budget' : 'Budget Overrun'}
                    </span>
                    <span
                      className={`font-semibold mono-num ${
                        budget.isOverBudget
                          ? 'text-rose-700'
                          : budget.exceedsThreshold
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {budget.remainingBudget >= 0
                        ? formatExactCurrency(budget.remainingBudget, currency)
                        : `-${formatExactCurrency(Math.abs(budget.remainingBudget), currency)}`}
                    </span>
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

              <div className="space-y-2.5">
                {project.milestones.map((m) => {
                  const mComments = commentsByMilestone[m.id] || [];
                  const isReplying = replyingMilestoneId === m.id;
                  const isFocused = focusedMilestoneId === m.id;
                  return (
                    <div
                      key={m.id}
                      ref={(el) => {
                        milestoneRefs.current[m.id] = el;
                      }}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isFocused
                          ? 'bg-slate-50 border-black ring-1 ring-black/15'
                          : m.completed
                          ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                          : 'bg-white border-slate-100 text-[#0A0A0A] shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => onUpdateMilestone(project.id, m.id, !m.completed)}
                            className="text-slate-400 hover:text-black transition-colors cursor-pointer shrink-0"
                          >
                            {m.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <span className={`text-xs ${m.completed ? 'line-through text-slate-400' : 'font-medium'}`}>
                              {m.title}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Target: {m.target_date} {m.completed_at && `• Completed on ${m.completed_at}`}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setReplyingMilestoneId(isReplying ? null : m.id);
                            setReplyText('');
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-black text-[11px] font-medium text-slate-600 hover:text-black transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{mComments.length > 0 ? `${mComments.length} · Reply` : 'Add Note'}</span>
                        </button>
                      </div>

                      {mComments.length > 0 && (
                        <div className="mt-3 ml-8 space-y-2 border-l-2 border-slate-200/70 pl-3">
                          {mComments.map((c) => (
                            <div
                              key={c.id}
                              className="bg-white border border-slate-200/70 rounded-xl px-3 py-2 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-[#0A0A0A]">{c.author_name}</span>
                                  <span className="text-slate-300" aria-hidden="true">·</span>
                                  <span className="text-slate-500">
                                    {c.author_role === 'client' ? 'Client' : 'Team'}
                                  </span>
                                  <span className="text-slate-300" aria-hidden="true">·</span>
                                  <span
                                    className={`font-medium ${
                                      c.feedback_type === 'approved'
                                        ? 'text-emerald-700'
                                        : c.feedback_type === 'question'
                                        ? 'text-amber-700'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {c.feedback_type === 'approved'
                                      ? 'Approved'
                                      : c.feedback_type === 'question'
                                      ? 'Question'
                                      : 'Feedback'}
                                  </span>
                                </div>
                                <span className="text-slate-400 mono-num">
                                  {c.created_at.split('T')[0]}
                                </span>
                              </div>
                              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{c.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {isReplying && (
                        <form
                          onSubmit={(e) => handleOwnerReply(e, m.id)}
                          className="mt-3 ml-8 flex flex-col sm:flex-row gap-2"
                        >
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            maxLength={1500}
                            placeholder={`Reply as ${project.owner || 'Owner'} on "${m.title}"...`}
                            className="flex-1 bg-white border border-slate-200 text-xs text-slate-900 px-3 py-2 rounded-xl focus:outline-none focus:border-black"
                          />
                          <button
                            type="submit"
                            disabled={isSendingReply || !replyText.trim()}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Send className="w-3 h-3" />
                            <span>{isSendingReply ? 'Sending...' : 'Reply'}</span>
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
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
