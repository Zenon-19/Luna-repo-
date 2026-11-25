import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { KPISection } from './components/KPISection';
import { PortfolioGrowthChart } from './components/PortfolioGrowthChart';
import { InsightsPanel } from './components/InsightsPanel';
import { ProjectGrid } from './components/ProjectGrid';
import { AuditTrailView } from './components/AuditTrailView';
import { LunaDock } from './components/LunaDock';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { NewProjectModal } from './components/NewProjectModal';
import { ExportReportModal } from './components/ExportReportModal';
import { MCPStatusModal } from './components/MCPStatusModal';
import { ProjectSortDropdown } from './components/ProjectSortDropdown';
import { OnboardingEmptyState } from './components/OnboardingEmptyState';
import { ShareProjectModal } from './components/ShareProjectModal';
import { ClientProgressView } from './components/ClientProgressView';

import {
  initialProjects,
  initialSnapshots,
  initialUpdateRecords,
  initialInsights,
  initialMCPStatus,
} from './data/initialData';
import {
  Project,
  ProjectSnapshot,
  ProjectUpdateRecord,
  LunaInsight,
  AIParseResult,
  MCPStatus,
  ProjectSortOption,
  ClientSharePayload,
  FieldChange,
} from './types';
import { generatePortfolioInsights } from './services/api';
import { checkProjectStagnation } from './utils/alerts';
import { monitorProjectBudget } from './utils/budget';
import { decodeClientSharePayload } from './utils/clientShare';
import {
  PortfolioFeedbackSummary,
  FeedbackInboxItem,
  loadPortfolioFeedbackSummary,
  markCommentIdsAsRead,
  clearReadCommentIds,
  getReadCommentIds,
} from './utils/feedbackInbox';

const DATA_VERSION = 'v7_clean_slate_client_share';

export default function App() {
  // Local state with localStorage hydration & automatic migration to all completed projects (2026)
  const [projects, setProjects] = useState<Project[]>(() => {
    const version = localStorage.getItem('luna_data_version');
    if (version !== DATA_VERSION) {
      localStorage.setItem('luna_data_version', DATA_VERSION);
      localStorage.setItem('luna_projects', JSON.stringify(initialProjects));
      localStorage.setItem('luna_snapshots', JSON.stringify(initialSnapshots));
      localStorage.setItem('luna_update_records', JSON.stringify(initialUpdateRecords));
      localStorage.setItem('luna_insights', JSON.stringify(initialInsights));
      return initialProjects;
    }
    const saved = localStorage.getItem('luna_projects');
    return saved ? JSON.parse(saved) : initialProjects;
  });

  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>(() => {
    const version = localStorage.getItem('luna_data_version');
    if (version !== DATA_VERSION) {
      return initialSnapshots;
    }
    const saved = localStorage.getItem('luna_snapshots');
    return saved ? JSON.parse(saved) : initialSnapshots;
  });

  const [updateRecords, setUpdateRecords] = useState<ProjectUpdateRecord[]>(() => {
    const version = localStorage.getItem('luna_data_version');
    if (version !== DATA_VERSION) {
      return initialUpdateRecords;
    }
    const saved = localStorage.getItem('luna_update_records');
    return saved ? JSON.parse(saved) : initialUpdateRecords;
  });

  const [insights, setInsights] = useState<LunaInsight[]>(() => {
    const version = localStorage.getItem('luna_data_version');
    if (version !== DATA_VERSION) {
      return initialInsights;
    }
    const saved = localStorage.getItem('luna_insights');
    return saved ? JSON.parse(saved) : initialInsights;
  });

  const [mcps] = useState<MCPStatus[]>(initialMCPStatus);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currency, setCurrency] = useState('₹');
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'timeline' | 'audit'>('grid');
  const [sortBy, setSortBy] = useState<ProjectSortOption>('default');

  // Client Share Link detection (?share=...)
  const [shareTokenState, setShareTokenState] = useState<{
    payload: ClientSharePayload | null;
    invalid: boolean;
  }>(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    if (!token) return { payload: null, invalid: false };
    const decoded = decodeClientSharePayload(token);
    return decoded ? { payload: decoded, invalid: false } : { payload: null, invalid: true };
  });
  const [previewClientPayload, setPreviewClientPayload] = useState<ClientSharePayload | null>(null);

  // Modals & Active selections
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'overview' | 'progress' | 'financials' | 'milestones' | 'audit'>('overview');
  const [focusedMilestoneId, setFocusedMilestoneId] = useState<string | null>(null);
  const [shareModalProject, setShareModalProject] = useState<Project | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalConfig, setExportModalConfig] = useState<{
    initialReportType?: 'portfolio' | 'audit_trail';
    initialProjectId?: string;
  }>({ initialReportType: 'portfolio', initialProjectId: 'all' });
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [recentRecord, setRecentRecord] = useState<ProjectUpdateRecord | null>(null);
  const [prefillMessage, setPrefillMessage] = useState<string | undefined>(undefined);
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false);
  const [feedbackSummary, setFeedbackSummary] = useState<PortfolioFeedbackSummary>({
    items: [],
    unreadCount: 0,
    unreadByProject: {},
    totalByProject: {},
  });

  const handleOpenExportModal = (config?: {
    initialReportType?: 'portfolio' | 'audit_trail';
    initialProjectId?: string;
  }) => {
    setExportModalConfig({
      initialReportType: config?.initialReportType || 'portfolio',
      initialProjectId: config?.initialProjectId || 'all',
    });
    setIsExportModalOpen(true);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('luna_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('luna_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  useEffect(() => {
    localStorage.setItem('luna_update_records', JSON.stringify(updateRecords));
  }, [updateRecords]);

  useEffect(() => {
    localStorage.setItem('luna_insights', JSON.stringify(insights));
  }, [insights]);

  // Keyboard shortcut '/' to search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Refresh client feedback inbox summary
  const refreshFeedbackSummary = React.useCallback(
    async (readOverride?: Set<string>) => {
      const summary = await loadPortfolioFeedbackSummary(projects, readOverride);
      setFeedbackSummary(summary);
    },
    [projects]
  );

  useEffect(() => {
    if (shareTokenState.payload || shareTokenState.invalid) return;
    refreshFeedbackSummary();
  }, [refreshFeedbackSummary, shareTokenState.payload, shareTokenState.invalid, selectedProject, shareModalProject, previewClientPayload]);

  useEffect(() => {
    if (shareTokenState.payload || shareTokenState.invalid) return;
    const onFocusOrStorage = () => {
      refreshFeedbackSummary();
    };
    window.addEventListener('focus', onFocusOrStorage);
    window.addEventListener('storage', onFocusOrStorage);
    return () => {
      window.removeEventListener('focus', onFocusOrStorage);
      window.removeEventListener('storage', onFocusOrStorage);
    };
  }, [refreshFeedbackSummary, shareTokenState.payload, shareTokenState.invalid]);

  // Filtered categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [projects]);

  // Filter and sort projects by search, category, status, and sortBy option
  const filteredProjects = useMemo(() => {
    const list = projects.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'stagnant') {
          if (!checkProjectStagnation(p, snapshots).isStagnant) {
            return false;
          }
        } else if (selectedStatus === 'budget_warning') {
          if (!monitorProjectBudget(p).exceedsThreshold) {
            return false;
          }
        } else if (p.status !== selectedStatus) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
        const matchMilestones = p.milestones.some((m) => m.title.toLowerCase().includes(q));
        const matchTech = p.tech_stack?.some((t) => t.toLowerCase().includes(q));
        const matchArch = p.architecture?.toLowerCase().includes(q);
        const matchHowMade = p.how_made?.toLowerCase().includes(q);
        return matchName || matchDesc || matchCategory || matchTags || matchMilestones || !!matchTech || !!matchArch || !!matchHowMade;
      }
      return true;
    });

    if (sortBy === 'health_desc') {
      return [...list].sort((a, b) => (b.health_score || 0) - (a.health_score || 0));
    }
    if (sortBy === 'health_asc') {
      return [...list].sort((a, b) => (a.health_score || 0) - (b.health_score || 0));
    }
    if (sortBy === 'value_desc') {
      return [...list].sort((a, b) => (b.project_value || 0) - (a.project_value || 0));
    }
    if (sortBy === 'value_asc') {
      return [...list].sort((a, b) => (a.project_value || 0) - (b.project_value || 0));
    }
    if (sortBy === 'date_asc') {
      return [...list].sort(
        (a, b) =>
          new Date(a.target_completion_date || '9999-12-31').getTime() -
          new Date(b.target_completion_date || '9999-12-31').getTime()
      );
    }
    if (sortBy === 'date_desc') {
      return [...list].sort(
        (a, b) =>
          new Date(b.target_completion_date || '1970-01-01').getTime() -
          new Date(a.target_completion_date || '1970-01-01').getTime()
      );
    }

    return list;
  }, [projects, snapshots, selectedCategory, selectedStatus, searchQuery, sortBy]);

  // Handle Natural Language Update applied by Luna
  const handleApplyUpdate = (parseResult: AIParseResult, originalMessage: string) => {
    const targetId = parseResult.target_project_id;
    const targetName = parseResult.target_project_name;

    // Find target project
    const projectIndex = projects.findIndex(
      (p) =>
        (targetId && p.id === targetId) ||
        (targetName && p.name.toLowerCase() === targetName.toLowerCase())
    );

    if (projectIndex === -1) {
      console.warn('Could not find project to update for:', parseResult);
      return;
    }

    const currentProject = projects[projectIndex];
    const updatedFields = parseResult.updated_fields || {};

    // Calculate deltas
    const oldProgress = currentProject.progress_percentage;
    const newProgress =
      typeof updatedFields.progress_percentage === 'number'
        ? updatedFields.progress_percentage
        : oldProgress;
    const progressDelta = newProgress - oldProgress;

    const oldValue = currentProject.project_value;
    const newValue =
      typeof updatedFields.project_value === 'number'
        ? updatedFields.project_value
        : oldValue;
    const valueDelta = newValue - oldValue;

    // New Milestones
    let updatedMilestones = [...currentProject.milestones];
    if (parseResult.new_milestones && parseResult.new_milestones.length > 0) {
      parseResult.new_milestones.forEach((mTitle) => {
        updatedMilestones.push({
          id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: mTitle,
          target_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          completed: false,
        });
      });
    }

    // Business Signals
    let updatedSignals = [...currentProject.business_signals];
    if (parseResult.business_signals && parseResult.business_signals.length > 0) {
      parseResult.business_signals.forEach((sig) => {
        if (!updatedSignals.includes(sig)) {
          updatedSignals.unshift(sig);
        }
      });
    }

    // Updated Project Object
    const updatedProject: Project = {
      ...currentProject,
      ...updatedFields,
      progress_percentage: newProgress,
      project_value: newValue,
      progress_delta_month: progressDelta !== 0 ? progressDelta : currentProject.progress_delta_month,
      value_delta_month: valueDelta !== 0 ? valueDelta : currentProject.value_delta_month,
      milestones: updatedMilestones,
      business_signals: updatedSignals,
      last_updated: new Date().toISOString(),
      days_since_update: 0,
    };

    // Update Projects Array
    const newProjects = [...projects];
    newProjects[projectIndex] = updatedProject;
    setProjects(newProjects);

    // If modal is open for this project, update selectedProject
    if (selectedProject && selectedProject.id === currentProject.id) {
      setSelectedProject(updatedProject);
    }

    // Create Snapshot
    const newSnapshot: ProjectSnapshot = {
      id: `snap-${Date.now()}`,
      project_id: currentProject.id,
      snapshot_date: new Date().toISOString().split('T')[0],
      progress_percentage: newProgress,
      project_value: newValue,
      health_score: updatedProject.health_score,
      performance_score: updatedProject.performance_score,
      note: parseResult.ai_summary,
    };
    setSnapshots((prev) => [newSnapshot, ...prev]);

    // Create Audit Record
    const newRecord: ProjectUpdateRecord = {
      id: `rec-${Date.now()}`,
      project_id: currentProject.id,
      project_name: currentProject.name,
      timestamp: new Date().toISOString(),
      original_message: originalMessage,
      ai_summary: parseResult.ai_summary,
      confidence_score: parseResult.confidence_score,
      changes: parseResult.changes,
      business_signals: parseResult.business_signals || [],
      user_confirmed: !parseResult.requires_confirmation,
    };
    setUpdateRecords((prev) => [newRecord, ...prev]);
    setRecentRecord(newRecord);
  };

  // Create new project
  const handleCreateProject = (newProj: Partial<Project>) => {
    const fullProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProj.name || 'New Project',
      slug: (newProj.name || 'new-project').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: newProj.description || 'Project managed by Luna 0.1.',
      category: newProj.category || 'SaaS',
      status: newProj.status || 'active',
      stage: newProj.stage || 'Development',
      progress_percentage: typeof newProj.progress_percentage === 'number' ? newProj.progress_percentage : 15,
      project_value: typeof newProj.project_value === 'number' ? newProj.project_value : 500000,
      currency: currency,
      realized_value: typeof newProj.realized_value === 'number' ? newProj.realized_value : 100000,
      potential_value: typeof newProj.potential_value === 'number' ? newProj.potential_value : 1000000,
      cost_to_date: typeof newProj.cost_to_date === 'number' ? newProj.cost_to_date : 50000,
      health_score: newProj.health_score || 85,
      health_status: newProj.health_status || 'Healthy',
      performance_score: newProj.performance_score || 80,
      performance_trend: newProj.performance_trend || 'improving',
      performance_delta_month: 10,
      performance_delta_year: 25,
      progress_delta_month: 10,
      progress_delta_year: 20,
      value_delta_month: Math.round((newProj.project_value || 500000) * 0.1),
      value_delta_year: newProj.project_value || 500000,
      target_completion_date:
        newProj.target_completion_date ||
        new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      owner: newProj.owner || 'Lakshya Lohani',
      icon: newProj.icon || 'Layers',
      color: newProj.color || '#6366F1',
      tags: newProj.tags || ['New'],
      milestones: newProj.milestones || [
        { id: `m-${Date.now()}-1`, title: 'Core Architecture', target_date: '2026-09-30', completed: true },
        { id: `m-${Date.now()}-2`, title: 'MVP Deliverable', target_date: '2026-11-15', completed: false },
      ],
      business_signals: newProj.business_signals || ['Initialized in portfolio'],
      last_updated: new Date().toISOString(),
      days_since_update: 0,
    };

    setProjects((prev) => [fullProject, ...prev]);

    // Add initial snapshot
    setSnapshots((prev) => [
      {
        id: `snap-${Date.now()}`,
        project_id: fullProject.id,
        snapshot_date: fullProject.start_date,
        progress_percentage: fullProject.progress_percentage,
        project_value: fullProject.project_value,
        health_score: fullProject.health_score,
        performance_score: fullProject.performance_score,
        note: 'Project initialized',
      },
      ...prev,
    ]);
  };

  // Milestone toggling
  const handleUpdateMilestone = (projectId: string, milestoneId: string, completed: boolean) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newMilestones = p.milestones.map((m) =>
          m.id === milestoneId
            ? { ...m, completed, completed_at: completed ? new Date().toISOString().split('T')[0] : undefined }
            : m
        );
        const completedCount = newMilestones.filter((m) => m.completed).length;
        const autoProgress = Math.round((completedCount / (newMilestones.length || 1)) * 100);
        return {
          ...p,
          milestones: newMilestones,
          progress_percentage: autoProgress,
          last_updated: new Date().toISOString(),
        };
      })
    );

    // Also update selectedProject if currently viewing modal
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject((prev) => {
        if (!prev) return null;
        const newMilestones = prev.milestones.map((m) =>
          m.id === milestoneId
            ? { ...m, completed, completed_at: completed ? new Date().toISOString().split('T')[0] : undefined }
            : m
        );
        const completedCount = newMilestones.filter((m) => m.completed).length;
        const newProgress = Math.round((completedCount / (newMilestones.length || 1)) * 100);
        return {
          ...prev,
          milestones: newMilestones,
          progress_percentage: newProgress,
        };
      });
    }

    // Append a new snapshot reflecting milestone progression
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      const newMilestones = project.milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, completed, completed_at: completed ? new Date().toISOString().split('T')[0] : undefined }
          : m
      );
      const completedCount = newMilestones.filter((m) => m.completed).length;
      const autoProgress = Math.round((completedCount / (newMilestones.length || 1)) * 100);
      const newSnap: ProjectSnapshot = {
        id: `snap-${Date.now()}`,
        project_id: projectId,
        snapshot_date: new Date().toISOString().split('T')[0],
        progress_percentage: autoProgress,
        project_value: project.project_value,
        health_score: project.health_score,
        performance_score: project.performance_score,
        note: `Milestone ${completed ? 'completed' : 'reopened'}`,
      };
      setSnapshots((prev) => [newSnap, ...prev]);
    }
  };

  // Milestone addition
  const handleAddMilestone = (projectId: string, title: string, targetDate: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: [
            ...p.milestones,
            {
              id: `m-${Date.now()}`,
              title,
              target_date: targetDate,
              completed: false,
            },
          ],
        };
      })
    );
  };

  // Refresh AI Insights
  const handleRefreshInsights = async () => {
    setIsRefreshingInsights(true);
    try {
      const newInsights = await generatePortfolioInsights(projects);
      setInsights(newInsights);
    } catch (e) {
      console.error('Error refreshing insights:', e);
    } finally {
      setIsRefreshingInsights(false);
    }
  };

  const handleQuickUpdate = (projectName: string) => {
    setPrefillMessage(`${projectName} update: `);
  };

  // Manual project editing inside ProjectDetailModal
  const handleUpdateProject = (projectId: string, updatedFields: Partial<Project>) => {
    const existing = projects.find((p) => p.id === projectId);
    if (!existing) return;

    const updatedProject: Project = {
      ...existing,
      ...updatedFields,
      last_updated: new Date().toISOString(),
      days_since_update: 0,
    };

    const changes: FieldChange[] = [];
    if (updatedFields.name && updatedFields.name !== existing.name) {
      changes.push({ field_name: 'name', label: 'Project Name', old_value: existing.name, new_value: updatedFields.name });
    }
    if (updatedFields.status && updatedFields.status !== existing.status) {
      changes.push({ field_name: 'status', label: 'Status', old_value: existing.status, new_value: updatedFields.status });
    }
    if (updatedFields.stage && updatedFields.stage !== existing.stage) {
      changes.push({ field_name: 'stage', label: 'Stage', old_value: existing.stage, new_value: updatedFields.stage });
    }
    if (typeof updatedFields.progress_percentage === 'number' && updatedFields.progress_percentage !== existing.progress_percentage) {
      changes.push({ field_name: 'progress_percentage', label: 'Progress', old_value: `${existing.progress_percentage}%`, new_value: `${updatedFields.progress_percentage}%` });
    }
    if (typeof updatedFields.project_value === 'number' && updatedFields.project_value !== existing.project_value) {
      changes.push({ field_name: 'project_value', label: 'Project Value', old_value: `${existing.currency}${existing.project_value.toLocaleString()}`, new_value: `${existing.currency}${updatedFields.project_value.toLocaleString()}` });
    }
    if (typeof updatedFields.cost_to_date === 'number' && updatedFields.cost_to_date !== existing.cost_to_date) {
      changes.push({ field_name: 'cost_to_date', label: 'Cost to Date', old_value: `${existing.currency}${existing.cost_to_date.toLocaleString()}`, new_value: `${existing.currency}${updatedFields.cost_to_date.toLocaleString()}` });
    }
    if (typeof updatedFields.health_score === 'number' && updatedFields.health_score !== existing.health_score) {
      changes.push({ field_name: 'health_score', label: 'Health Score', old_value: existing.health_score, new_value: updatedFields.health_score });
    }
    if (updatedFields.target_completion_date && updatedFields.target_completion_date !== existing.target_completion_date) {
      changes.push({ field_name: 'target_completion_date', label: 'Target Completion', old_value: existing.target_completion_date, new_value: updatedFields.target_completion_date });
    }

    setProjects((prev) => prev.map((p) => (p.id === projectId ? updatedProject : p)));
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject(updatedProject);
    }

    if (
      updatedProject.progress_percentage !== existing.progress_percentage ||
      updatedProject.project_value !== existing.project_value ||
      updatedProject.health_score !== existing.health_score
    ) {
      const snap: ProjectSnapshot = {
        id: `snap-${Date.now()}`,
        project_id: projectId,
        snapshot_date: new Date().toISOString().split('T')[0],
        progress_percentage: updatedProject.progress_percentage,
        project_value: updatedProject.project_value,
        health_score: updatedProject.health_score,
        performance_score: updatedProject.performance_score,
        note: 'Manual project details update',
      };
      setSnapshots((prev) => [snap, ...prev]);
    }

    const editRecord: ProjectUpdateRecord = {
      id: `rec-${Date.now()}`,
      project_id: projectId,
      project_name: updatedProject.name,
      timestamp: new Date().toISOString(),
      original_message: 'Manual workspace edit',
      ai_summary:
        changes.length > 0
          ? `Updated ${updatedProject.name}: ${changes.map((c) => `${c.label} → ${c.new_value}`).join(', ')}.`
          : `Updated project details for ${updatedProject.name}.`,
      confidence_score: 1,
      changes,
      business_signals: [],
      user_confirmed: true,
    };
    setUpdateRecords((prev) => [editRecord, ...prev]);
  };

  // Delete project cleanly from localStorage state
  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setSnapshots((prev) => prev.filter((s) => s.project_id !== projectId));
    setUpdateRecords((prev) => prev.filter((r) => r.project_id !== projectId));
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject(null);
    }
    if (shareModalProject && shareModalProject.id === projectId) {
      setShareModalProject(null);
    }
    try {
      localStorage.removeItem(`luna_milestone_comments_v1_${projectId}`);
    } catch {
      // Ignore
    }
  };

  const handleMarkFeedbackIdsRead = React.useCallback(
    (commentIds: string[]) => {
      if (commentIds.length === 0) return;
      const currentRead = getReadCommentIds();
      const hasNewRead = commentIds.some((id) => !currentRead.has(id));
      if (!hasNewRead) return;
      const nextRead = markCommentIdsAsRead(commentIds);
      refreshFeedbackSummary(nextRead);
    },
    [refreshFeedbackSummary]
  );

  const handleMarkAllFeedbackRead = () => {
    const allIds = feedbackSummary.items.map((item) => item.id);
    if (allIds.length === 0) return;
    const nextRead = markCommentIdsAsRead(allIds);
    refreshFeedbackSummary(nextRead);
  };

  const handleSelectFeedbackItem = (item: FeedbackInboxItem) => {
    const nextRead = markCommentIdsAsRead([item.id]);
    refreshFeedbackSummary(nextRead);
    const target = projects.find((p) => p.id === item.project_id);
    if (target) {
      setModalInitialTab('milestones');
      setFocusedMilestoneId(item.milestone_id);
      setSelectedProject(target);
    }
  };

  const handleClearWorkspace = () => {
    setProjects([]);
    setSnapshots([]);
    setUpdateRecords([]);
    setInsights([]);
    setRecentRecord(null);
    setSelectedProject(null);
    setShareModalProject(null);
    setSelectedCategory('All');
    setSelectedStatus('all');
    setSearchQuery('');
    clearReadCommentIds();
  };

  // 1. Standalone Shared Client Portal View (?share=...)
  if (shareTokenState.payload) {
    return <ClientProgressView payload={shareTokenState.payload} />;
  }

  // 2. Invalid/Malformed Share Token fallback
  if (shareTokenState.invalid) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-xs">
          <h1 className="text-lg font-semibold text-[#0A0A0A] mb-2">
            Share Link Unavailable
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            This client progress link appears incomplete or invalid. Request a fresh link from the project owner, or open your own workspace.
          </p>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('share');
              window.history.replaceState({}, '', url.toString());
              setShareTokenState({ payload: null, invalid: false });
            }}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Open Portfolio Workspace
          </button>
        </div>
      </div>
    );
  }

  // 3. In-app Full Client Portal Preview Mode
  if (previewClientPayload) {
    return (
      <ClientProgressView
        payload={previewClientPayload}
        isPreviewMode
        onExitPreview={() => setPreviewClientPayload(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0A0A0A] flex flex-col font-sans selection:bg-slate-200 selection:text-black pb-32">
      {/* Header with Search, Filter & Currency Controls */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currency={currency}
        onCurrencyChange={setCurrency}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        onOpenExportModal={() => handleOpenExportModal({ initialReportType: 'portfolio' })}
        onOpenMCPModal={() => setIsMCPModalOpen(true)}
        onOpenAskLuna={() => {}}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categories}
        projectCount={projects.length}
        onClearWorkspace={handleClearWorkspace}
        feedbackItems={feedbackSummary.items}
        unreadFeedbackCount={feedbackSummary.unreadCount}
        onSelectFeedback={handleSelectFeedbackItem}
        onMarkAllFeedbackRead={handleMarkAllFeedbackRead}
      />

      {/* Main App Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-8 sm:py-10">
        {projects.length === 0 ? (
          <OnboardingEmptyState
            onCreateProject={() => setIsNewProjectModalOpen(true)}
            onStartWithPrompt={(prompt) => setPrefillMessage(prompt)}
          />
        ) : (
          <>
            {/* KPI Cards Section */}
            <KPISection
              projects={projects}
              snapshots={snapshots}
              currency={currency}
              onFilterStatus={(st) => setSelectedStatus((prev) => (prev === st ? 'all' : st))}
              selectedStatus={selectedStatus}
            />

            {/* Growth Analytics Canvas (Shown on Grid & Table & Timeline views) */}
            {viewMode !== 'audit' && (
              <PortfolioGrowthChart projects={projects} snapshots={snapshots} currency={currency} />
            )}

            {/* AI Proactive Intelligence Panel */}
            {viewMode !== 'audit' && (
              <InsightsPanel
                insights={insights}
                onApplyPrompt={(prompt) => setPrefillMessage(prompt)}
                onRefreshInsights={handleRefreshInsights}
                isRefreshing={isRefreshingInsights}
              />
            )}

            {/* Section Heading for Projects in Clean Minimalism */}
            {viewMode !== 'audit' && (
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    {selectedStatus === 'completed' || (projects.length > 0 && projects.every((p) => p.status === 'completed'))
                      ? 'Completed Projects'
                      : selectedCategory === 'All'
                      ? 'Active Projects'
                      : `${selectedCategory} Projects`}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} tracked in real-time
                    {searchQuery.trim() ? (
                      <>
                        {' · '}Matching &ldquo;
                        <span className="text-black font-semibold bg-amber-100 text-amber-950 px-1 py-0.2 rounded-xs">
                          {searchQuery}
                        </span>
                        &rdquo;
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Sorting Dropdown Component */}
                  <ProjectSortDropdown sortBy={sortBy} onSortChange={setSortBy} />

                  <button
                    onClick={() => setSelectedStatus((prev) => (prev === 'archived' ? 'all' : 'archived'))}
                    className="text-xs font-semibold text-black hover:underline cursor-pointer"
                  >
                    {selectedStatus === 'archived' ? 'View All Projects' : 'View Archive'}
                  </button>
                </div>
              </div>
            )}

            {/* Active View Mode Content */}
            {viewMode === 'audit' ? (
              <AuditTrailView
                updateRecords={updateRecords}
                onSelectProjectName={(name) => {
                  const found = projects.find((p) => p.name.toLowerCase() === name.toLowerCase());
                  if (found) {
                    setModalInitialTab('overview');
                    setFocusedMilestoneId(null);
                    setSelectedProject(found);
                  }
                }}
                onExportAuditTrail={() =>
                  handleOpenExportModal({ initialReportType: 'audit_trail', initialProjectId: 'all' })
                }
              />
            ) : (
              <ProjectGrid
                projects={filteredProjects}
                snapshots={snapshots}
                currency={currency}
                viewMode={viewMode}
                sortBy={sortBy}
                onSortChange={setSortBy}
                searchQuery={searchQuery}
                unreadCommentsByProject={feedbackSummary.unreadByProject}
                totalCommentsByProject={feedbackSummary.totalByProject}
                onSelectProject={(p) => {
                  setModalInitialTab('overview');
                  setFocusedMilestoneId(null);
                  setSelectedProject(p);
                }}
                onQuickUpdate={handleQuickUpdate}
                onShareProject={(p) => setShareModalProject(p)}
                onOpenNewProject={() => setIsNewProjectModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Conversational Luna 0.1 Command Dock */}
      <LunaDock
        projects={projects}
        onApplyUpdate={handleApplyUpdate}
        onCreateProject={handleCreateProject}
        recentRecord={recentRecord}
        currency={currency}
        prefillMessage={prefillMessage}
        onClearPrefill={() => setPrefillMessage(undefined)}
      />

      {/* Deep-dive Project Intelligence Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          snapshots={snapshots}
          updateRecords={updateRecords}
          currency={currency}
          initialTab={modalInitialTab}
          focusedMilestoneId={focusedMilestoneId}
          onClose={() => {
            setSelectedProject(null);
            setFocusedMilestoneId(null);
          }}
          onUpdateMilestone={handleUpdateMilestone}
          onAddMilestone={handleAddMilestone}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onFeedbackRead={handleMarkFeedbackIdsRead}
          onQuickUpdate={handleQuickUpdate}
          onExportAuditTrail={(projectId) =>
            handleOpenExportModal({ initialReportType: 'audit_trail', initialProjectId: projectId })
          }
          onShareProject={(p) => setShareModalProject(p)}
        />
      )}

      {/* Share Progress with Client Modal */}
      <ShareProjectModal
        project={shareModalProject}
        snapshots={snapshots}
        updateRecords={updateRecords}
        onClose={() => setShareModalProject(null)}
        onOpenFullPreview={(payload) => {
          setShareModalProject(null);
          setPreviewClientPayload(payload);
        }}
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
        currency={currency}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        projects={projects}
        snapshots={snapshots}
        updateRecords={updateRecords}
        currency={currency}
        initialReportType={exportModalConfig.initialReportType}
        initialProjectId={exportModalConfig.initialProjectId}
      />

      {/* MCP Status Modal */}
      <MCPStatusModal
        isOpen={isMCPModalOpen}
        onClose={() => setIsMCPModalOpen(false)}
        mcps={mcps}
      />
    </div>
  );
}
