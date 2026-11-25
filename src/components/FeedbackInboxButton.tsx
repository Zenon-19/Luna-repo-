import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, MessageSquare, ThumbsUp, HelpCircle, ArrowRight } from 'lucide-react';
import { FeedbackInboxItem } from '../utils/feedbackInbox';
import { MilestoneFeedbackType } from '../types';

interface FeedbackInboxButtonProps {
  items: FeedbackInboxItem[];
  unreadCount: number;
  onSelectFeedback: (item: FeedbackInboxItem) => void;
  onMarkAllRead: () => void;
}

export const FeedbackInboxButton: React.FC<FeedbackInboxButtonProps> = ({
  items,
  unreadCount,
  onSelectFeedback,
  onMarkAllRead,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.split('T')[0] || '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const renderFeedbackTypeMeta = (type: MilestoneFeedbackType) => {
    if (type === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
          <ThumbsUp className="w-3 h-3" />
          <span>Approved</span>
        </span>
      );
    }
    if (type === 'question') {
      return (
        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
          <HelpCircle className="w-3 h-3" />
          <span>Question</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
        <MessageSquare className="w-3 h-3" />
        <span>Feedback</span>
      </span>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`Client feedback inbox (${unreadCount} unread)`}
        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0 ${
          isOpen
            ? 'bg-black text-white border-black'
            : unreadCount > 0
            ? 'bg-white border-slate-300 hover:border-black text-[#0A0A0A]'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-black'
        }`}
        title="View client milestone feedback & alerts"
      >
        <Bell className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Feedback</span>
        {unreadCount > 0 && (
          <span
            className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold mono-num ${
              isOpen ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden text-[#0A0A0A]">
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-[#0A0A0A]">Client Feedback Inbox</h3>
              <p className="text-[11px] text-slate-400 mono-num mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} unread ${unreadCount === 1 ? 'note' : 'notes'}`
                  : `${items.length} total ${items.length === 1 ? 'note' : 'notes'}`}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-black transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <MessageSquare className="w-5 h-5 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700">No client feedback yet</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Share a project progress link to invite milestone reviews, approvals, and questions.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onSelectFeedback(item);
                  }}
                  className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer block ${
                    item.isUnread ? 'bg-slate-50/75' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {item.isUnread && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-black shrink-0">
                          New ·
                        </span>
                      )}
                      <span className="font-semibold text-[#0A0A0A] truncate">
                        {item.project_name}
                      </span>
                    </div>
                    <span className="text-slate-400 mono-num shrink-0">
                      {formatTimestamp(item.comment.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1.5 flex-wrap">
                    <span className="font-medium text-slate-700">{item.comment.author_name}</span>
                    <span aria-hidden="true">·</span>
                    {renderFeedbackTypeMeta(item.comment.feedback_type)}
                    <span aria-hidden="true">·</span>
                    <span className="truncate max-w-[160px]">{item.milestone_title}</span>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.comment.message}
                    </p>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
