import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Eye,
  FileText,
  Lock,
  ExternalLink,
} from 'lucide-react';
import {
  ClientSharePayload,
  MilestoneComment,
  Project,
  ProjectSnapshot,
  ProjectUpdateRecord,
} from '../types';
import {
  buildClientSharePayload,
  buildClientShareUrl,
  generateClientMarkdownSummary,
} from '../utils/clientShare';
import { fetchMilestoneComments } from '../services/api';
import { ClientProgressView } from './ClientProgressView';

interface ShareProjectModalProps {
  project: Project | null;
  snapshots: ProjectSnapshot[];
  updateRecords: ProjectUpdateRecord[];
  onClose: () => void;
  onOpenFullPreview: (payload: ClientSharePayload) => void;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  project,
  snapshots,
  updateRecords,
  onClose,
  onOpenFullPreview,
}) => {
  const [clientNote, setClientNote] = useState('');
  const [includeArchitecture, setIncludeArchitecture] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [milestoneComments, setMilestoneComments] = useState<MilestoneComment[]>([]);

  useEffect(() => {
    if (project) {
      setClientNote('');
      setIncludeArchitecture(Boolean(project.architecture || project.tech_stack?.length));
      setCopiedLink(false);
      setCopiedSummary(false);
      fetchMilestoneComments(project.id).then(setMilestoneComments);
    } else {
      setMilestoneComments([]);
    }
  }, [project?.id]);

  const payload = useMemo(() => {
    if (!project) return null;
    return buildClientSharePayload(project, snapshots, updateRecords, {
      clientNote,
      includeArchitecture,
    });
  }, [project, snapshots, updateRecords, clientNote, includeArchitecture]);

  const shareUrl = useMemo(() => {
    if (!payload) return '';
    return buildClientShareUrl(payload);
  }, [payload]);

  if (!project || !payload) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleCopySummary = async () => {
    try {
      const md = generateClientMarkdownSummary(payload, milestoneComments);
      await navigator.clipboard.writeText(md);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200/80 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-[#0A0A0A]">
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-[#0A0A0A] tracking-tight truncate">
                Share Progress with Client · {project.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Client portal showing progress, milestones, timeline, results, and milestone feedback
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share Controls + Embedded Preview */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
          {/* Link & Privacy Controls */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Shareable Client Portal Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-black"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/70">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Optional Client Greeting or Delivery Note
                </label>
                <textarea
                  rows={2}
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  placeholder="e.g. Here is this week's milestone progress and latest deliverables for review."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {(project.architecture || project.tech_stack?.length) ? (
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeArchitecture}
                        onChange={(e) => setIncludeArchitecture(e.target.checked)}
                        className="rounded border-slate-300 text-black focus:ring-black"
                      />
                      <span>Include technical stack &amp; architecture overview</span>
                    </label>
                  ) : (
                    <span className="text-xs text-slate-500">
                      Showing progress, milestones, timeline, and outcomes
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Internal costs, budgets, and risk flags are hidden.</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySummary}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-black text-xs font-semibold text-slate-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedSummary ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied Text</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Summary</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onOpenFullPreview(payload)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-black text-xs font-semibold text-slate-700 hover:text-black transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Open Full Preview</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Embedded Client Portal Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Live Client Portal Preview</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Milestone comments enabled · Costs &amp; internal metrics excluded
              </span>
            </div>

            <ClientProgressView payload={payload} embedded />
          </div>
        </div>
      </div>
    </div>
  );
};
