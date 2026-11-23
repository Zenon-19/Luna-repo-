import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Layers,
  Clock,
  MessageSquare,
  Send,
  ThumbsUp,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ClientSharePayload,
  MilestoneComment,
  MilestoneFeedbackType,
} from '../types';
import {
  generateClientMarkdownSummary,
  getClientShareProjectKey,
} from '../utils/clientShare';
import {
  fetchMilestoneComments,
  createMilestoneComment,
  mergeMilestoneComments,
} from '../services/api';

interface ClientProgressViewProps {
  payload: ClientSharePayload;
  embedded?: boolean;
  isPreviewMode?: boolean;
  onExitPreview?: () => void;
}

const CLIENT_AUTHOR_STORAGE_KEY = 'luna_client_author_name_v1';

export const ClientProgressView: React.FC<ClientProgressViewProps> = ({
  payload,
  embedded = false,
  isPreviewMode = false,
  onExitPreview,
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [remoteComments, setRemoteComments] = useState<MilestoneComment[]>([]);
  const [activeComposerMilestoneId, setActiveComposerMilestoneId] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState<string>(() => {
    try {
      return localStorage.getItem(CLIENT_AUTHOR_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [feedbackType, setFeedbackType] = useState<MilestoneFeedbackType>('feedback');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [justPostedMilestoneId, setJustPostedMilestoneId] = useState<string | null>(null);

  const { project, progress_history, recent_updates, client_note, shared_at } = payload;
  const projectKey = useMemo(() => getClientShareProjectKey(payload), [payload]);

  useEffect(() => {
    let active = true;
    fetchMilestoneComments(projectKey).then((loaded) => {
      if (active) {
        setRemoteComments(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, [projectKey]);

  const embeddedPayloadComments = useMemo(
    () => project.milestones.flatMap((m) => m.comments || []),
    [project.milestones]
  );

  const allComments = useMemo(
    () => mergeMilestoneComments(embeddedPayloadComments, remoteComments),
    [embeddedPayloadComments, remoteComments]
  );

  const commentsByMilestone = useMemo(() => {
    const grouped: Record<string, MilestoneComment[]> = {};
    allComments.forEach((c) => {
      if (!grouped[c.milestone_id]) grouped[c.milestone_id] = [];
      grouped[c.milestone_id].push(c);
    });
    return grouped;
  }, [allComments]);

  const completedMilestones = project.milestones.filter((m) => m.completed).length;
  const totalMilestones = project.milestones.length;

  const statusLabel =
    project.status === 'completed'
      ? 'Delivered'
      : project.status === 'on_hold'
      ? 'Paused'
      : project.status === 'archived'
      ? 'Archived'
      : 'In Progress';

  const handleCopySummary = async () => {
    try {
      const md = generateClientMarkdownSummary(payload, allComments);
      await navigator.clipboard.writeText(md);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  const handleOpenComposer = (milestoneId: string) => {
    if (activeComposerMilestoneId === milestoneId) {
      setActiveComposerMilestoneId(null);
      setCommentError(null);
      return;
    }
    setActiveComposerMilestoneId(milestoneId);
    setCommentText('');
    setFeedbackType('feedback');
    setCommentError(null);
  };

  const handleSubmitComment = async (e: React.FormEvent, milestoneId: string) => {
    e.preventDefault();
    const trimmedAuthor = authorName.trim();
    const trimmedMessage = commentText.trim();

    if (!trimmedAuthor) {
      setCommentError('Please enter your name so the team knows who left this note.');
      return;
    }
    if (!trimmedMessage) {
      setCommentError('Please write a comment or feedback note before posting.');
      return;
    }

    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      try {
        localStorage.setItem(CLIENT_AUTHOR_STORAGE_KEY, trimmedAuthor);
      } catch {
        // Ignore storage errors
      }

      const saved = await createMilestoneComment({
        projectId: projectKey,
        milestoneId,
        authorName: trimmedAuthor,
        authorRole: 'client',
        feedbackType,
        message: trimmedMessage,
      });

      setRemoteComments((prev) => mergeMilestoneComments(prev, [saved]));
      setCommentText('');
      setActiveComposerMilestoneId(null);
      setJustPostedMilestoneId(milestoneId);
      setTimeout(() => {
        setJustPostedMilestoneId((curr) => (curr === milestoneId ? null : curr));
      }, 2500);
    } catch {
      setCommentError('Unable to save comment right now. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatCommentDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.split('T')[0] || '';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getFeedbackLabel = (type: MilestoneFeedbackType) => {
    if (type === 'approved') {
      return { text: 'Approved', className: 'text-emerald-700' };
    }
    if (type === 'question') {
      return { text: 'Question', className: 'text-amber-700' };
    }
    return { text: 'Feedback', className: 'text-slate-500' };
  };

  const chartData =
    progress_history.length > 0
      ? progress_history.map((snap) => ({
          date: snap.date,
          progress: snap.progress_percentage,
          note: snap.note,
        }))
      : [
          { date: project.start_date, progress: 0, note: 'Project initiated' },
          {
            date: project.last_updated.split('T')[0],
            progress: project.progress_percentage,
            note: 'Current status',
          },
        ];

  return (
    <div
      className={
        embedded
          ? 'bg-[#FAFAFA] text-[#0A0A0A] p-6 sm:p-8 rounded-2xl border border-slate-200/80'
          : 'min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col'
      }
    >
      {/* Preview Mode Banner (only shown when owner previews full-screen) */}
      {!embedded && isPreviewMode && onExitPreview && (
        <div className="bg-slate-900 text-white px-6 py-2.5 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold whitespace-nowrap">Client Portal Preview</span>
            <span className="text-slate-400 truncate hidden sm:inline">
              This is the exact client view with milestone feedback enabled (internal costs and budgets are hidden).
            </span>
          </div>
          <button
            onClick={onExitPreview}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-black font-semibold hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </button>
        </div>
      )}

      {/* Standalone Client Top Bar */}
      {!embedded && (
        <header className="sticky top-0 z-20 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-slate-200/70 px-6 lg:px-10 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-8">
            <span className="text-base font-semibold tracking-tight text-[#0A0A0A] whitespace-nowrap shrink-0">
              {project.name}
            </span>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
              <a
                href="#progress"
                className="hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0"
              >
                Progress
              </a>
              <a
                href="#results"
                className="hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0"
              >
                Results
              </a>
              <a
                href="#milestones"
                className="hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0"
              >
                Milestones
              </a>
              <a
                href="#updates"
                className="hover:text-[#0A0A0A] transition-colors whitespace-nowrap shrink-0"
              >
                Updates
              </a>
            </nav>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Summary Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main Client Content Container */}
      <main className={embedded ? 'space-y-6' : 'flex-1 max-w-5xl w-full mx-auto px-6 sm:px-10 py-10 space-y-8'}>
        {/* Hero Project Header */}
        <section id="progress" className="bg-white border border-slate-200/80 rounded-2xl p-7 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                <span>Client Progress Report</span>
                <span aria-hidden="true">·</span>
                <span>{project.category}</span>
                <span aria-hidden="true">·</span>
                <span>{project.stage} Stage</span>
                <span aria-hidden="true">·</span>
                <span>Led by {project.owner}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0A0A0A] text-balance">
                {project.name}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                {project.description}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-xs text-slate-400 font-medium mb-0.5">Updated</div>
              <div className="text-xs font-medium text-slate-700 mono-num">
                {project.last_updated.split('T')[0]}
              </div>
            </div>
          </div>

          {/* Optional Owner Note for Client */}
          {client_note && (
            <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
              <span className="font-semibold text-[#0A0A0A] block mb-1">Note from {project.owner}</span>
              <p>{client_note}</p>
            </div>
          )}

          {/* 4-Column Client KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Overall Progress</div>
              <div className="text-2xl font-semibold text-[#0A0A0A] mono-num">
                {project.progress_percentage}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="bg-black h-full rounded-full transition-all duration-500"
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Milestones Completed</div>
              <div className="text-2xl font-semibold text-[#0A0A0A] mono-num">
                {completedMilestones} / {totalMilestones}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {totalMilestones > 0
                  ? `${Math.round((completedMilestones / totalMilestones) * 100)}% deliverables signed off`
                  : 'Deliverables pending setup'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Delivery Window</div>
              <div className="text-sm font-semibold text-[#0A0A0A] mono-num mt-1">
                {project.start_date} → {project.target_completion_date}
              </div>
              <div className="text-xs text-slate-500 mt-2">Target completion timeline</div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Current Status</div>
              <div className="text-2xl font-semibold text-[#0A0A0A]">{statusLabel}</div>
              <div className="text-xs text-emerald-700 font-medium mt-1.5">
                {project.stage} phase
              </div>
            </div>
          </div>
        </section>

        {/* Progress Trajectory Chart */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-7 sm:p-8">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-[#0A0A0A]">Completion Trajectory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Recorded milestone and delivery progression over time
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mono-num">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.progress_percentage}% Complete</span>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="clientProgressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A0A0A" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#0A0A0A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(0,0,0,0.4)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="rgba(0,0,0,0.4)"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0A0A0A',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Completion']}
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="#0A0A0A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#clientProgressGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Two-column: Key Results & Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Delivered Results & Outcomes */}
          <section id="results" className="bg-white border border-slate-200/80 rounded-2xl p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#0A0A0A]">Key Results & Outcomes</h2>
              <span className="text-xs text-slate-400 mono-num">
                {project.results.length} {project.results.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            {project.results.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed py-4">
                Key delivery outcomes and verified client results will appear here as milestones are completed.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {project.results.map((res, idx) => (
                  <li key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-700 leading-relaxed">{res}</span>
                  </li>
                ))}
              </ul>
            )}

            {(project.architecture || (project.tech_stack && project.tech_stack.length > 0)) && (
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A]">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Technical Architecture</span>
                </div>
                {project.architecture && (
                  <p className="text-xs font-mono text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    {project.architecture}
                  </p>
                )}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div className="text-xs text-slate-500">
                    Stack: {project.tech_stack.join(' · ')}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Milestones Roadmap + Client Comments */}
          <section id="milestones" className="bg-white border border-slate-200/80 rounded-2xl p-7">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#0A0A0A]">Milestone Deliverables</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Review deliverables and leave feedback on specific milestones
                </p>
              </div>
              <div className="text-xs text-slate-400 mono-num whitespace-nowrap shrink-0">
                <span>
                  {completedMilestones}/{totalMilestones} Complete
                </span>
                {allComments.length > 0 && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span className="text-slate-600 font-medium">
                      {allComments.length} {allComments.length === 1 ? 'note' : 'notes'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {totalMilestones === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed py-4">
                No milestone items have been added to this project timeline yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {project.milestones.map((m) => {
                  const mComments = commentsByMilestone[m.id] || [];
                  const isComposerOpen = activeComposerMilestoneId === m.id;
                  const showJustPosted = justPostedMilestoneId === m.id;

                  return (
                    <div key={m.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div
                              className={`text-xs font-medium ${
                                m.completed ? 'text-slate-900' : 'text-slate-700'
                              }`}
                            >
                              {m.title}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 mono-num flex items-center flex-wrap gap-1.5">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>
                                {m.completed && m.completed_at
                                  ? `Delivered ${m.completed_at}`
                                  : `Target ${m.target_date}`}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className={m.completed ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                                {m.completed ? 'Completed' : 'Scheduled'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenComposer(m.id)}
                          aria-expanded={isComposerOpen}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isComposerOpen
                              ? 'bg-black text-white border-black'
                              : 'bg-white border-slate-200/90 text-slate-600 hover:text-[#0A0A0A] hover:border-slate-300'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span className="mono-num">
                            {mComments.length > 0 ? mComments.length : 'Feedback'}
                          </span>
                        </button>
                      </div>

                      {showJustPosted && (
                        <div className="mt-2.5 ml-6 text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>Feedback added to this milestone</span>
                        </div>
                      )}

                      {/* Existing Comments Thread for this Milestone */}
                      {mComments.length > 0 && (
                        <div className="mt-3 ml-6 space-y-2 border-l-2 border-slate-100 pl-3.5">
                          {mComments.map((c) => {
                            const labelMeta = getFeedbackLabel(c.feedback_type);
                            return (
                              <div
                                key={c.id}
                                className="bg-slate-50/80 border border-slate-200/70 rounded-xl px-3.5 py-2.5"
                              >
                                <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    <span className="font-semibold text-[#0A0A0A] truncate">
                                      {c.author_name}
                                    </span>
                                    {c.author_role === 'owner' && (
                                      <>
                                        <span className="text-slate-300" aria-hidden="true">·</span>
                                        <span className="text-slate-500 font-medium">Team</span>
                                      </>
                                    )}
                                    <span className="text-slate-300" aria-hidden="true">·</span>
                                    <span className={`font-medium ${labelMeta.className}`}>
                                      {labelMeta.text}
                                    </span>
                                  </div>
                                  <span className="text-slate-400 mono-num shrink-0">
                                    {formatCommentDate(c.created_at)}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {c.message}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Inline Feedback / Comment Composer */}
                      {isComposerOpen && (
                        <form
                          onSubmit={(e) => handleSubmitComment(e, m.id)}
                          className="mt-3 ml-6 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <input
                              type="text"
                              value={authorName}
                              onChange={(e) => {
                                setAuthorName(e.target.value);
                                if (commentError) setCommentError(null);
                              }}
                              placeholder="Your name"
                              maxLength={80}
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-[#0A0A0A] placeholder:text-slate-400 focus:outline-none focus:border-black"
                            />

                            <div
                              role="group"
                              aria-label="Feedback category"
                              className="inline-flex items-center bg-slate-200/70 p-0.5 rounded-lg self-start sm:self-auto"
                            >
                              <button
                                type="button"
                                onClick={() => setFeedbackType('feedback')}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                  feedbackType === 'feedback'
                                    ? 'bg-white text-[#0A0A0A] shadow-2xs'
                                    : 'text-slate-600 hover:text-[#0A0A0A]'
                                }`}
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Feedback</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setFeedbackType('approved')}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                  feedbackType === 'approved'
                                    ? 'bg-white text-emerald-700 shadow-2xs'
                                    : 'text-slate-600 hover:text-[#0A0A0A]'
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setFeedbackType('question')}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                  feedbackType === 'question'
                                    ? 'bg-white text-amber-700 shadow-2xs'
                                    : 'text-slate-600 hover:text-[#0A0A0A]'
                                }`}
                              >
                                <HelpCircle className="w-3 h-3" />
                                <span>Question</span>
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            value={commentText}
                            onChange={(e) => {
                              setCommentText(e.target.value);
                              if (commentError) setCommentError(null);
                            }}
                            maxLength={1500}
                            placeholder={`Share feedback, sign-off notes, or questions on "${m.title}"...`}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-[#0A0A0A] placeholder:text-slate-400 focus:outline-none focus:border-black resize-y"
                          />

                          {commentError && (
                            <p className="text-[11px] text-rose-600 font-medium">{commentError}</p>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">
                              Saved directly to milestone feedback
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveComposerMilestoneId(null);
                                  setCommentError(null);
                                }}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-600 hover:text-[#0A0A0A] cursor-pointer whitespace-nowrap shrink-0"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isSubmittingComment}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black hover:bg-slate-800 disabled:opacity-50 text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <Send className="w-3 h-3" />
                                <span>{isSubmittingComment ? 'Posting...' : 'Post Feedback'}</span>
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Recent Progress Updates */}
        <section id="updates" className="bg-white border border-slate-200/80 rounded-2xl p-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0A0A0A]">Recent Progress Updates</h2>
            <span className="text-xs text-slate-400 mono-num">
              {recent_updates.length} {recent_updates.length === 1 ? 'update' : 'updates'}
            </span>
          </div>

          {recent_updates.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Progress updates posted by the delivery team will appear here.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent_updates.map((upd, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-slate-700 leading-relaxed">{upd.summary}</p>
                  <span className="text-[11px] text-slate-400 mono-num shrink-0">
                    {upd.date.split('T')[0]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quiet Client Portal Footer */}
        {!embedded && (
          <footer className="pt-2 pb-6 text-center text-xs text-slate-400">
            <span>Shared project progress portal</span>
            <span aria-hidden="true"> · </span>
            <span className="mono-num">Generated {shared_at.split('T')[0]}</span>
          </footer>
        )}
      </main>
    </div>
  );
};
