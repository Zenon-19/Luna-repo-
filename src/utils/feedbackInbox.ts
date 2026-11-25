import { MilestoneComment, Project } from '../types';
import { fetchMilestoneComments, mergeMilestoneComments } from '../services/api';

export interface FeedbackInboxItem {
  id: string;
  project_id: string;
  project_name: string;
  milestone_id: string;
  milestone_title: string;
  comment: MilestoneComment;
  isUnread: boolean;
}

export interface PortfolioFeedbackSummary {
  items: FeedbackInboxItem[];
  unreadCount: number;
  unreadByProject: Record<string, number>;
  totalByProject: Record<string, number>;
}

const READ_IDS_STORAGE_KEY = 'luna_read_client_comment_ids_v1';

export function getReadCommentIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_IDS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((id) => typeof id === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadCommentIds(ids: Set<string>): void {
  try {
    // Keep bounded to the most recent 1000 IDs
    const arr = Array.from(ids).slice(-1000);
    localStorage.setItem(READ_IDS_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // Ignore storage quota errors
  }
}

export function markCommentIdsAsRead(commentIds: string[]): Set<string> {
  const next = getReadCommentIds();
  commentIds.forEach((id) => {
    if (id) next.add(id);
  });
  saveReadCommentIds(next);
  return next;
}

export function clearReadCommentIds(): void {
  try {
    localStorage.removeItem(READ_IDS_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export async function loadPortfolioFeedbackSummary(
  projects: Project[],
  readIdsOverride?: Set<string>
): Promise<PortfolioFeedbackSummary> {
  const readIds = readIdsOverride || getReadCommentIds();
  const unreadByProject: Record<string, number> = {};
  const totalByProject: Record<string, number> = {};
  const items: FeedbackInboxItem[] = [];

  if (projects.length === 0) {
    return { items, unreadCount: 0, unreadByProject, totalByProject };
  }

  const fetchedPerProject = await Promise.all(
    projects.map(async (project) => {
      const remote = await fetchMilestoneComments(project.id);
      const embedded = project.milestones.flatMap((m) => m.comments || []);
      const merged = mergeMilestoneComments(embedded, remote);
      return { project, comments: merged };
    })
  );

  fetchedPerProject.forEach(({ project, comments }) => {
    totalByProject[project.id] = comments.length;
    const milestoneMap = new Map(project.milestones.map((m) => [m.id, m.title]));
    let projectUnread = 0;

    comments.forEach((comment) => {
      if (comment.author_role !== 'client') return;
      const isUnread = !readIds.has(comment.id);
      if (isUnread) projectUnread += 1;

      items.push({
        id: comment.id,
        project_id: project.id,
        project_name: project.name,
        milestone_id: comment.milestone_id,
        milestone_title: milestoneMap.get(comment.milestone_id) || 'Project Milestone',
        comment,
        isUnread,
      });
    });

    if (projectUnread > 0) {
      unreadByProject[project.id] = projectUnread;
    }
  });

  items.sort(
    (a, b) =>
      new Date(b.comment.created_at).getTime() - new Date(a.comment.created_at).getTime()
  );

  const unreadCount = items.reduce((sum, item) => sum + (item.isUnread ? 1 : 0), 0);

  return {
    items,
    unreadCount,
    unreadByProject,
    totalByProject,
  };
}
