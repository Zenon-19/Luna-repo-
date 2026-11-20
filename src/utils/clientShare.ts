import {
  ClientSharePayload,
  Project,
  ProjectSnapshot,
  ProjectUpdateRecord,
} from '../types';

export interface ClientShareOptions {
  clientNote?: string;
  includeArchitecture?: boolean;
}

/**
 * Strictly constructs a sanitized, client-safe progress payload.
 * Excludes all internal financial data (cost_to_date, project_value, realized_value,
 * potential_value, ROI, budget thresholds) and internal risk/stagnation flags.
 */
export function buildClientSharePayload(
  project: Project,
  snapshots: ProjectSnapshot[],
  updateRecords: ProjectUpdateRecord[],
  options: ClientShareOptions = {}
): ClientSharePayload {
  const { clientNote, includeArchitecture = true } = options;

  const progressHistory = snapshots
    .filter((s) => s.project_id === project.id)
    .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime())
    .slice(-12)
    .map((s) => ({
      date: s.snapshot_date,
      progress_percentage: s.progress_percentage,
      note: s.note,
    }));

  const recentUpdates = updateRecords
    .filter((r) => r.project_id === project.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)
    .map((r) => ({
      date: r.timestamp,
      summary: r.ai_summary,
    }));

  return {
    v: 1,
    shared_at: new Date().toISOString(),
    ...(clientNote?.trim() ? { client_note: clientNote.trim() } : {}),
    project: {
      name: project.name,
      description: project.description,
      category: project.category,
      status: project.status,
      stage: project.stage,
      progress_percentage: project.progress_percentage,
      start_date: project.start_date,
      target_completion_date: project.target_completion_date,
      last_updated: project.last_updated,
      owner: project.owner,
      ...(includeArchitecture && project.architecture ? { architecture: project.architecture } : {}),
      ...(includeArchitecture && project.tech_stack && project.tech_stack.length > 0
        ? { tech_stack: project.tech_stack }
        : {}),
      milestones: project.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        target_date: m.target_date,
        completed: m.completed,
        ...(m.completed_at ? { completed_at: m.completed_at } : {}),
      })),
      results: [...(project.business_signals || [])],
    },
    progress_history: progressHistory,
    recent_updates: recentUpdates,
  };
}

/**
 * Encodes a ClientSharePayload into a UTF-8 safe Base64URL string.
 */
export function encodeClientSharePayload(payload: ClientSharePayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes and validates a Base64URL string back into a ClientSharePayload.
 * Returns null if the token is invalid or malformed.
 */
export function decodeClientSharePayload(token: string): ClientSharePayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);

    if (
      !parsed ||
      parsed.v !== 1 ||
      !parsed.project ||
      typeof parsed.project.name !== 'string' ||
      !Array.isArray(parsed.project.milestones)
    ) {
      return null;
    }

    return parsed as ClientSharePayload;
  } catch {
    return null;
  }
}

/**
 * Builds the full shareable URL for a client progress payload.
 */
export function buildClientShareUrl(payload: ClientSharePayload): string {
  const token = encodeClientSharePayload(payload);
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('share', token);
  return url.toString();
}

/**
 * Generates a client-safe Markdown progress report (strictly excluding costs/budgets).
 */
export function generateClientMarkdownSummary(payload: ClientSharePayload): string {
  const { project, client_note, recent_updates } = payload;
  const completedCount = project.milestones.filter((m) => m.completed).length;

  let md = `# ${project.name} — Client Progress Report\n\n`;
  md += `**Status:** ${project.stage} (${project.progress_percentage}% Complete)\n`;
  md += `**Timeline:** ${project.start_date} → ${project.target_completion_date}\n`;
  md += `**Lead:** ${project.owner}\n\n`;

  if (client_note) {
    md += `> ${client_note}\n\n`;
  }

  md += `## Overview\n${project.description}\n\n`;

  if (project.results.length > 0) {
    md += `## Key Results & Outcomes\n`;
    project.results.forEach((res) => {
      md += `- ${res}\n`;
    });
    md += `\n`;
  }

  md += `## Milestones (${completedCount}/${project.milestones.length} Completed)\n`;
  if (project.milestones.length === 0) {
    md += `- No milestones logged yet.\n`;
  } else {
    project.milestones.forEach((m) => {
      const statusMark = m.completed ? '[x]' : '[ ]';
      const dateMeta = m.completed && m.completed_at
        ? `Completed ${m.completed_at}`
        : `Target ${m.target_date}`;
      md += `- ${statusMark} **${m.title}** (${dateMeta})\n`;
    });
  }

  if (recent_updates.length > 0) {
    md += `\n## Recent Progress Updates\n`;
    recent_updates.forEach((u) => {
      const dateLabel = u.date.split('T')[0];
      md += `- **${dateLabel}:** ${u.summary}\n`;
    });
  }

  return md;
}
