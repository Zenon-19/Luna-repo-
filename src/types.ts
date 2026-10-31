export type ProjectCategory =
  | 'SaaS'
  | 'Agency / Client'
  | 'AI & ML'
  | 'Fintech'
  | 'Mobile App'
  | 'Developer Tools'
  | 'E-commerce'
  | 'Infrastructure'
  | 'Internal Tool';

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived';

export type ProjectStage =
  | 'Idea'
  | 'Design & Spec'
  | 'MVP'
  | 'Development'
  | 'Beta Testing'
  | 'Launch'
  | 'Scaling';

export type HealthStatus = 'Excellent' | 'Healthy' | 'Attention Required' | 'At Risk' | 'Critical';

export type PerformanceTrend = 'improving' | 'stable' | 'declining' | 'stagnant';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  target_date: string;
  completed: boolean;
  completed_at?: string;
}

export interface ProjectSnapshot {
  id: string;
  project_id: string;
  snapshot_date: string;
  progress_percentage: number;
  project_value: number;
  health_score: number;
  performance_score: number;
  note?: string;
}

export interface FieldChange {
  field_name: string;
  label: string;
  old_value: string | number;
  new_value: string | number;
}

export interface ProjectUpdateRecord {
  id: string;
  project_id: string;
  project_name: string;
  original_message: string;
  ai_summary: string;
  confidence_score: number;
  timestamp: string;
  changes: FieldChange[];
  business_signals: string[];
  user_confirmed?: boolean;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  stage: ProjectStage;
  progress_percentage: number;
  project_value: number;
  currency: string;
  realized_value: number;
  potential_value: number;
  cost_to_date: number;
  health_score: number;
  health_status: HealthStatus;
  performance_score: number;
  performance_trend: PerformanceTrend;
  performance_delta_month: number;
  performance_delta_year: number;
  progress_delta_month: number;
  progress_delta_year: number;
  value_delta_month: number;
  value_delta_year: number;
  target_completion_date: string;
  start_date: string;
  owner: string;
  icon: string;
  color: string;
  tags: string[];
  milestones: Milestone[];
  business_signals: string[];
  last_updated: string;
  days_since_update: number;
  repo_name?: string;
  github_commits_count?: number;
}

export interface LunaInsight {
  id: string;
  type: 'growth' | 'risk' | 'milestone' | 'discrepancy' | 'recommendation';
  title: string;
  description: string;
  project_id?: string;
  project_name?: string;
  impact: 'high' | 'medium' | 'info';
  timestamp: string;
  action_prompt?: string;
}

export interface AIParseResult {
  target_project_id?: string;
  target_project_name: string;
  confidence_score: number;
  requires_confirmation: boolean;
  clarification_question?: string;
  ai_summary: string;
  changes: FieldChange[];
  updated_fields?: {
    progress_percentage?: number;
    project_value?: number;
    status?: ProjectStatus;
    stage?: ProjectStage;
    health_score?: number;
  };
  new_milestones?: { title: string; completed: boolean }[];
  completed_milestone_titles?: string[];
  business_signals?: string[];
  performance_impact?: PerformanceTrend;
}

export interface MCPStatus {
  name: string;
  type: 'database' | 'filesystem' | 'git' | 'cloud';
  status: 'connected' | 'syncing' | 'idle' | 'error';
  latency: string;
  details: string;
}
