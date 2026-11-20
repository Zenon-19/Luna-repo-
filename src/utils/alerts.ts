import { Project, ProjectSnapshot } from '../types';

export interface StagnationAlert {
  isStagnant: boolean;
  stagnantDays: number;
  lastProgressChangeDate?: string;
  sinceSnapshotDate?: string;
  reason?: string;
  severity: 'normal' | 'warning' | 'critical';
  currentProgress: number;
}

/**
 * Proactive Alert evaluator:
 * Evaluates whether project progress has been stagnant for > 14 days based on snapshots data.
 */
export function checkProjectStagnation(
  project: Project,
  snapshots: ProjectSnapshot[],
  referenceDateStr?: string
): StagnationAlert {
  // If project is completed or archived, stagnation alert does not apply
  if (project.status === 'completed' || project.status === 'archived') {
    return {
      isStagnant: false,
      stagnantDays: 0,
      severity: 'normal',
      currentProgress: project.progress_percentage,
    };
  }

  // Find all snapshots for this project
  const projectSnapshots = snapshots
    .filter((s) => s.project_id === project.id)
    .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime());

  // Determine current reference date
  // Uses provided date or project's latest timestamp or snapshot date or August 22, 2026 / current date
  const now = referenceDateStr
    ? new Date(referenceDateStr)
    : new Date('2026-08-22T12:00:00Z');

  // Case 1: No snapshots exist for this project yet
  if (projectSnapshots.length === 0) {
    const fallbackDays = project.days_since_update || 0;
    const isStagnant = fallbackDays > 14 && project.progress_delta_month <= 0;
    return {
      isStagnant,
      stagnantDays: fallbackDays,
      severity: fallbackDays > 30 ? 'critical' : fallbackDays > 14 ? 'warning' : 'normal',
      reason: isStagnant ? `No progress updates for ${fallbackDays} days` : undefined,
      currentProgress: project.progress_percentage,
    };
  }

  // Case 2: We have snapshots
  const currentProgress = project.progress_percentage;

  // Let's trace backwards from the latest snapshot to find when current progress began
  // Walk backwards through snapshots
  let earliestMatchingSnapshotIndex = projectSnapshots.length - 1;
  const latestSnapshot = projectSnapshots[projectSnapshots.length - 1];

  // If latest snapshot's progress is equal to currentProgress
  if (latestSnapshot.progress_percentage === currentProgress) {
    for (let i = projectSnapshots.length - 1; i >= 0; i--) {
      if (projectSnapshots[i].progress_percentage === currentProgress) {
        earliestMatchingSnapshotIndex = i;
      } else {
        // Progress changed here
        break;
      }
    }
  } else {
    // If the project had an update after the latest snapshot with different progress,
    // check how recent that was
    if (project.days_since_update <= 14) {
      return {
        isStagnant: false,
        stagnantDays: project.days_since_update,
        severity: 'normal',
        currentProgress,
      };
    }
  }

  const earliestMatchingSnapshot = projectSnapshots[earliestMatchingSnapshotIndex];
  const earliestDate = new Date(earliestMatchingSnapshot.snapshot_date);

  // Calculate days between earliest matching snapshot and now/reference
  const diffMs = Math.max(0, now.getTime() - earliestDate.getTime());
  const daysSinceEarliestSameSnapshot = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Also check consecutive snapshot span (time difference between earliest matching snapshot and latest snapshot)
  const latestSnapshotDate = new Date(latestSnapshot.snapshot_date);
  const snapshotSpanMs = Math.max(0, latestSnapshotDate.getTime() - earliestDate.getTime());
  const snapshotSpanDays = Math.floor(snapshotSpanMs / (1000 * 60 * 60 * 24));

  // If progress has been unchanged across snapshots for > 14 days,
  // OR the time since that progress was recorded to today is > 14 days and progress has not moved
  const stagnantDays = Math.max(daysSinceEarliestSameSnapshot, snapshotSpanDays);
  const isStagnant = stagnantDays > 14 && project.progress_delta_month <= 0;

  const severity = stagnantDays > 30 ? 'critical' : stagnantDays > 14 ? 'warning' : 'normal';

  let reason = '';
  if (isStagnant) {
    reason = `Progress stagnant at ${currentProgress}% for ${stagnantDays} days (since ${earliestMatchingSnapshot.snapshot_date})`;
  }

  return {
    isStagnant,
    stagnantDays,
    lastProgressChangeDate: earliestMatchingSnapshot.snapshot_date,
    sinceSnapshotDate: earliestMatchingSnapshot.snapshot_date,
    severity,
    reason,
    currentProgress,
  };
}

/**
 * Filter projects that have active stagnation alerts
 */
export function getStagnantProjects(
  projects: Project[],
  snapshots: ProjectSnapshot[]
): { project: Project; alert: StagnationAlert }[] {
  return projects
    .map((project) => ({
      project,
      alert: checkProjectStagnation(project, snapshots),
    }))
    .filter((item) => item.alert.isStagnant);
}

export {
  monitorProjectBudget,
  getBudgetWarningProjects,
  getPortfolioBudgetSummary,
  DEFAULT_BUDGET_WARNING_THRESHOLD,
} from './budget';
export type { BudgetMonitorResult, BudgetAlertSeverity } from './budget';

