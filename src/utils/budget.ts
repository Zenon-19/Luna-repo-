import { Project } from '../types';

export const DEFAULT_BUDGET_WARNING_THRESHOLD = 80;

export type BudgetAlertSeverity = 'normal' | 'warning' | 'critical';

export interface BudgetMonitorResult {
  costToDate: number;
  projectValue: number;
  utilizationRatio: number;
  utilizationPercentage: number;
  remainingBudget: number;
  exceedsThreshold: boolean;
  isOverBudget: boolean;
  thresholdPercentage: number;
  severity: BudgetAlertSeverity;
  label: string;
  reason?: string;
}

/**
 * Monitors a project's `cost_to_date` against its `project_value` (budget)
 * and determines whether utilization exceeds the warning threshold (default: 80%).
 */
export function monitorProjectBudget(
  project: Pick<Project, 'cost_to_date' | 'project_value' | 'name' | 'currency'>,
  thresholdPercentage: number = DEFAULT_BUDGET_WARNING_THRESHOLD
): BudgetMonitorResult {
  const costToDate = Math.max(0, Number(project.cost_to_date) || 0);
  const projectValue = Math.max(0, Number(project.project_value) || 0);

  if (projectValue <= 0) {
    const hasSpend = costToDate > 0;
    return {
      costToDate,
      projectValue,
      utilizationRatio: hasSpend ? 1 : 0,
      utilizationPercentage: hasSpend ? 100 : 0,
      remainingBudget: -costToDate,
      exceedsThreshold: hasSpend,
      isOverBudget: hasSpend,
      thresholdPercentage,
      severity: hasSpend ? 'critical' : 'normal',
      label: hasSpend ? 'Over Budget' : 'No Budget Set',
      reason: hasSpend
        ? `${project.name} has recorded spend (${costToDate.toLocaleString()}) with zero project budget`
        : undefined,
    };
  }

  const utilizationRatio = costToDate / projectValue;
  const exactPercentage = utilizationRatio * 100;
  const exceedsThreshold = exactPercentage > thresholdPercentage;
  const isOverBudget = utilizationRatio > 1;

  // Ensure values slightly over 80% (e.g. 80.3%) don't round down to 80% when warning is active
  const utilizationPercentage =
    exceedsThreshold && Math.round(exactPercentage) <= thresholdPercentage
      ? Number(exactPercentage.toFixed(1))
      : Math.round(exactPercentage);

  const remainingBudget = projectValue - costToDate;

  let severity: BudgetAlertSeverity = 'normal';
  let label = 'Within Budget';
  let reason: string | undefined;

  if (isOverBudget) {
    severity = 'critical';
    label = 'Over Budget';
    reason = `Cost to date has reached ${utilizationPercentage}% of project value (over budget by ${Math.abs(remainingBudget).toLocaleString()} ${project.currency || '₹'})`;
  } else if (exceedsThreshold) {
    severity = 'warning';
    label = `>${thresholdPercentage}% Budget`;
    reason = `Cost to date is at ${utilizationPercentage}% of project value, exceeding the ${thresholdPercentage}% budget threshold`;
  }

  return {
    costToDate,
    projectValue,
    utilizationRatio,
    utilizationPercentage,
    remainingBudget,
    exceedsThreshold,
    isOverBudget,
    thresholdPercentage,
    severity,
    label,
    reason,
  };
}

/**
 * Returns all projects whose `cost_to_date` exceeds the budget threshold (default: 80%).
 */
export function getBudgetWarningProjects(
  projects: Project[],
  thresholdPercentage: number = DEFAULT_BUDGET_WARNING_THRESHOLD
): { project: Project; budget: BudgetMonitorResult }[] {
  return projects
    .map((project) => ({
      project,
      budget: monitorProjectBudget(project, thresholdPercentage),
    }))
    .filter((item) => item.budget.exceedsThreshold)
    .sort((a, b) => b.budget.utilizationRatio - a.budget.utilizationRatio);
}

/**
 * Aggregates portfolio-wide cost-to-date versus total project value metrics.
 */
export function getPortfolioBudgetSummary(
  projects: Project[],
  thresholdPercentage: number = DEFAULT_BUDGET_WARNING_THRESHOLD
) {
  const totalCost = projects.reduce((sum, p) => sum + Math.max(0, Number(p.cost_to_date) || 0), 0);
  const totalBudgetValue = projects.reduce((sum, p) => sum + Math.max(0, Number(p.project_value) || 0), 0);
  const overallUtilizationPercentage =
    totalBudgetValue > 0 ? Math.round((totalCost / totalBudgetValue) * 100) : 0;

  const warningProjects = getBudgetWarningProjects(projects, thresholdPercentage);
  const overBudgetCount = warningProjects.filter((w) => w.budget.isOverBudget).length;

  return {
    totalCost,
    totalBudgetValue,
    overallUtilizationPercentage,
    overThresholdCount: warningProjects.length,
    overBudgetCount,
  };
}
