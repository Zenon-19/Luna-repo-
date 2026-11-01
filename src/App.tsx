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
} from './types';
import { generatePortfolioInsights } from './services/api';

const DATA_VERSION = 'v2_167cr_ai_enterprise';

export default function App() {
  // Local state with localStorage hydration & automatic migration to 1.67 Cr portfolio
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
    const saved = localStorage.getItem('luna_snapshots');
    return saved ? JSON.parse(saved) : initialSnapshots;
  });

  const [updateRecords, setUpdateRecords] = useState<ProjectUpdateRecord[]>(() => {
    const saved = localStorage.getItem('luna_update_records');
    return saved ? JSON.parse(saved) : initialUpdateRecords;
  });

  const [insights, setInsights] = useState<LunaInsight[]>(() => {
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

  // Modals & Active selections
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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

  // Filtered categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => set.add(p.category));
    return Array.from(set);
  }, [projects]);

  // Filter projects by search, category, status
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && p.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchCategory = p.category.toLowerCase().includes(q);
        const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
        const matchMilestones = p.milestones.some((m) => m.title.toLowerCase().includes(q));
        return matchName || matchDesc || matchCategory || matchTags || matchMilestones;
      }
      return true;
    });
  }, [projects, selectedCategory, selectedStatus, searchQuery]);

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
      progress_percentage: newProj.progress_percentage || 15,
      project_value: newProj.project_value || 500000,
      currency: currency,
      realized_value: newProj.realized_value || 100000,
      potential_value: newProj.potential_value || 1000000,
      cost_to_date: newProj.cost_to_date || 50000,
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
        return {
          ...prev,
          milestones: newMilestones,
          progress_percentage: Math.round((completedCount / (newMilestones.length || 1)) * 100),
        };
      });
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
      />

      {/* Main App Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-10 py-8 sm:py-10">
        {/* KPI Cards Section */}
        <KPISection
          projects={projects}
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
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                {selectedCategory === 'All' ? 'Active Projects' : `${selectedCategory} Projects`}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} tracked in real-time
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedStatus((prev) => (prev === 'archived' ? 'all' : 'archived'))}
                className="text-xs font-semibold text-black hover:underline cursor-pointer"
              >
                {selectedStatus === 'archived' ? 'View Active Projects' : 'View Archive'}
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
              if (found) setSelectedProject(found);
            }}
            onExportAuditTrail={() =>
              handleOpenExportModal({ initialReportType: 'audit_trail', initialProjectId: 'all' })
            }
          />
        ) : (
          <ProjectGrid
            projects={filteredProjects}
            currency={currency}
            viewMode={viewMode}
            onSelectProject={(p) => setSelectedProject(p)}
            onQuickUpdate={handleQuickUpdate}
            onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          />
        )}
      </main>

      {/* Conversational Luna 0.1 Command Dock */}
      <LunaDock
        projects={projects}
        onApplyUpdate={handleApplyUpdate}
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
          onClose={() => setSelectedProject(null)}
          onUpdateMilestone={handleUpdateMilestone}
          onAddMilestone={handleAddMilestone}
          onQuickUpdate={handleQuickUpdate}
          onExportAuditTrail={(projectId) =>
            handleOpenExportModal({ initialReportType: 'audit_trail', initialProjectId: projectId })
          }
        />
      )}

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
