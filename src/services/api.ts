import {
  Project,
  ProjectSnapshot,
  ProjectUpdateRecord,
  LunaInsight,
  AIParseResult,
  MilestoneComment,
  MilestoneFeedbackType,
} from '../types';
import { formatCurrency } from '../utils/formatters';

export async function parseNaturalLanguageUpdate(
  message: string,
  projects: Project[]
): Promise<AIParseResult> {
  try {
    const res = await fetch('/api/luna/parse-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, projects }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('API error, using local resilient parser:', err);
    return fallbackLocalParser(message, projects);
  }
}

export async function generateProactiveInsights(
  projects: Project[]
): Promise<LunaInsight[]> {
  try {
    const res = await fetch('/api/luna/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('API error, returning local insights:', err);
    return [];
  }
}

export const generatePortfolioInsights = generateProactiveInsights;

export async function askLunaQuery(
  query: string,
  projects: Project[],
  snapshots: ProjectSnapshot[],
  updates: ProjectUpdateRecord[]
): Promise<{ answer: string; referencedProjects?: string[] }> {
  try {
    const res = await fetch('/api/luna/ask-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, projects, snapshots, updates }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('API error in askLunaQuery:', err);
    const totalVal = projects.reduce((a, b) => a + (b.project_value || 0), 0);
    return {
      answer: `I analyzed your portfolio of ${projects.length} projects. You have ${formatCurrency(totalVal, '₹')} total value tracked across enterprise AI, SaaS, and infrastructure initiatives.`,
    };
  }
}

export async function createProjectFromPrompt(
  prompt: string
): Promise<Partial<Project>> {
  try {
    const res = await fetch('/api/luna/create-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('API error in createProjectFromPrompt:', err);
    const nameMatch = prompt.match(/(?:called|named)\s+([A-Za-z0-9\s\-&]+?)(?:\s+in\s+|\s+at\s+|\s+with\s+|\.|,|$)/i);
    const percentMatch = prompt.match(/(\d{1,3})\s*%/);
    let valueVal = 500000;
    if (/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/i.test(prompt)) {
      valueVal = parseFloat(prompt.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/i)![1]) * 100000;
    } else if (/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i.test(prompt)) {
      valueVal = parseFloat(prompt.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i)![1]) * 10000000;
    } else if (/(\d+(?:\.\d+)?)\s*(?:k|thousand)/i.test(prompt)) {
      valueVal = parseFloat(prompt.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)/i)![1]) * 1000;
    }
    return {
      name: (nameMatch ? nameMatch[1].trim() : prompt.slice(0, 32).trim()) || 'New Project',
      description: prompt,
      category: 'SaaS',
      stage: 'Development',
      progress_percentage: percentMatch ? Math.min(100, parseInt(percentMatch[1], 10)) : 20,
      project_value: valueVal,
      currency: '₹',
      health_score: 85,
    };
  }
}

function fallbackLocalParser(message: string, projects: Project[]): AIParseResult {
  const lower = message.toLowerCase();
  const matchedProject = projects.find(p => lower.includes(p.name.toLowerCase()));

  const percentMatch = message.match(/(\d{1,3})\s*%/);
  const progressVal = percentMatch ? parseInt(percentMatch[1], 10) : undefined;

  let valueVal: number | undefined = undefined;
  if (/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/i.test(message)) {
    const num = parseFloat(message.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/i)![1]);
    valueVal = num * 100000;
  } else if (/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i.test(message)) {
    const num = parseFloat(message.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i)![1]);
    valueVal = num * 10000000;
  } else if (/(\d+(?:\.\d+)?)\s*(?:k|thousand)/i.test(message)) {
    const num = parseFloat(message.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)/i)![1]);
    valueVal = num * 1000;
  }

  const changes: any[] = [];
  const updated_fields: any = {};

  if (matchedProject) {
    if (progressVal !== undefined) {
      changes.push({
        field_name: 'progress_percentage',
        label: 'Progress',
        old_value: `${matchedProject.progress_percentage}%`,
        new_value: `${progressVal}%`,
      });
      updated_fields.progress_percentage = progressVal;
    }
    if (valueVal !== undefined) {
      const isCostUpdate = /\b(cost|spend|spent|expense|budget used)\b/i.test(message);
      if (isCostUpdate) {
        changes.push({
          field_name: 'cost_to_date',
          label: 'Cost to Date',
          old_value: `${matchedProject.currency}${matchedProject.cost_to_date.toLocaleString()}`,
          new_value: `${matchedProject.currency}${valueVal.toLocaleString()}`,
        });
        updated_fields.cost_to_date = valueVal;
      } else {
        changes.push({
          field_name: 'project_value',
          label: 'Project Value',
          old_value: `${matchedProject.currency}${matchedProject.project_value.toLocaleString()}`,
          new_value: `${matchedProject.currency}${valueVal.toLocaleString()}`,
        });
        updated_fields.project_value = valueVal;
      }
    }
  }

  const confidence = matchedProject ? (changes.length > 0 ? 0.94 : 0.6) : 0.4;

  return {
    target_project_id: matchedProject ? matchedProject.id : undefined,
    target_project_name: matchedProject ? matchedProject.name : 'Unknown Project',
    confidence_score: confidence,
    requires_confirmation: confidence < 0.75,
    clarification_question: matchedProject
      ? `I detected ${matchedProject.name}. Would you like me to update progress, value, or add a note?`
      : 'Which project does this update apply to?',
    ai_summary: matchedProject
      ? `Updated ${matchedProject.name}: ${changes.map(c => `${c.label} → ${c.new_value}`).join(', ') || 'Recorded activity update'}.`
      : 'Identified update message.',
    changes,
    updated_fields,
    business_signals: lower.includes('client') || lower.includes('feedback') ? ['Received client feedback'] : [],
    performance_impact: 'improving',
  };
}

const COMMENTS_STORAGE_PREFIX = 'luna_milestone_comments_v1_';

function readLocalComments(projectId: string): MilestoneComment[] {
  try {
    const raw = localStorage.getItem(`${COMMENTS_STORAGE_PREFIX}${projectId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalComments(projectId: string, comments: MilestoneComment[]): void {
  try {
    localStorage.setItem(`${COMMENTS_STORAGE_PREFIX}${projectId}`, JSON.stringify(comments));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function mergeMilestoneComments(
  ...lists: (MilestoneComment[] | undefined)[]
): MilestoneComment[] {
  const map = new Map<string, MilestoneComment>();
  lists.forEach((list) => {
    if (!list) return;
    list.forEach((c) => {
      if (c && c.id) map.set(c.id, c);
    });
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export async function fetchMilestoneComments(projectId: string): Promise<MilestoneComment[]> {
  const local = readLocalComments(projectId);
  try {
    const res = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/milestone-comments`
    );
    if (!res.ok) return local;
    const data = await res.json();
    const serverComments: MilestoneComment[] = Array.isArray(data?.comments)
      ? data.comments
      : [];
    const merged = mergeMilestoneComments(local, serverComments);
    writeLocalComments(projectId, merged);
    return merged;
  } catch {
    return local;
  }
}

export async function createMilestoneComment(input: {
  projectId: string;
  milestoneId: string;
  authorName: string;
  authorRole?: 'client' | 'owner';
  feedbackType?: MilestoneFeedbackType;
  message: string;
}): Promise<MilestoneComment> {
  const authorName = input.authorName.trim().slice(0, 80);
  const message = input.message.trim().slice(0, 1500);
  const feedbackType: MilestoneFeedbackType = input.feedbackType || 'feedback';
  const authorRole = input.authorRole || 'client';

  const fallbackComment: MilestoneComment = {
    id: `mc-local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    project_id: input.projectId,
    milestone_id: input.milestoneId,
    author_name: authorName,
    author_role: authorRole,
    feedback_type: feedbackType,
    message,
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(
      `/api/projects/${encodeURIComponent(input.projectId)}/milestone-comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_id: input.milestoneId,
          author_name: authorName,
          author_role: authorRole,
          feedback_type: feedbackType,
          message,
        }),
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to save comment (${res.status})`);
    }

    const data = await res.json();
    const saved: MilestoneComment = data?.comment || fallbackComment;
    const merged = mergeMilestoneComments(readLocalComments(input.projectId), [saved]);
    writeLocalComments(input.projectId, merged);
    return saved;
  } catch (err) {
    console.warn('Persisting milestone comment locally (server unavailable):', err);
    const merged = mergeMilestoneComments(readLocalComments(input.projectId), [fallbackComment]);
    writeLocalComments(input.projectId, merged);
    return fallbackComment;
  }
}

export async function deleteMilestoneComment(
  projectId: string,
  commentId: string
): Promise<void> {
  const nextLocal = readLocalComments(projectId).filter((c) => c.id !== commentId);
  writeLocalComments(projectId, nextLocal);
  try {
    await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/milestone-comments/${encodeURIComponent(commentId)}`,
      { method: 'DELETE' }
    );
  } catch {
    // Ignore offline errors; already removed from local cache
  }
}
