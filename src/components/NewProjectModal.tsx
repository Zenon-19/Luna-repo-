import React, { useState } from 'react';
import { X, Sparkles, Plus, Layers, Coins, Calendar, Tag } from 'lucide-react';
import { Project, ProjectCategory, ProjectStage } from '../types';
import { createProjectFromPrompt } from '../services/api';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Partial<Project>) => void;
  currency: string;
  defaultMode?: 'ai' | 'manual';
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  currency,
  defaultMode = 'manual',
}) => {
  const [activeMode, setActiveMode] = useState<'ai' | 'manual'>(defaultMode);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('SaaS');
  const [stage, setStage] = useState<ProjectStage>('Development');
  const [progress, setProgress] = useState(20);
  const [projectValue, setProjectValue] = useState(500000);
  const [costToDate, setCostToDate] = useState(75000);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  );
  const [owner, setOwner] = useState('');
  const [tags, setTags] = useState('');

  if (!isOpen) return null;

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const generated = await createProjectFromPrompt(aiPrompt.trim());
      onCreateProject({
        ...generated,
        currency,
      });
      onClose();
    } catch (err) {
      console.error('Failed to create project via AI prompt:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const val = Number(projectValue) || 0;
    const cost = Math.max(0, Number(costToDate) || 0);
    const prog = Math.min(100, Math.max(0, Number(progress) || 0));

    onCreateProject({
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: description.trim() || 'Active project tracked in workspace.',
      category,
      status: prog === 100 ? 'completed' : 'active',
      stage: prog === 100 ? 'Completed' : stage,
      progress_percentage: prog,
      project_value: val,
      currency,
      realized_value: Math.round(val * (prog / 100)),
      potential_value: Math.round(val * 1.5),
      cost_to_date: cost,
      health_score: 88,
      health_status: 'Healthy',
      performance_score: 85,
      performance_trend: 'improving',
      performance_delta_month: 10,
      performance_delta_year: 25,
      progress_delta_month: prog,
      progress_delta_year: prog,
      value_delta_month: Math.round(val * 0.1),
      value_delta_year: val,
      target_completion_date:
        targetDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      owner: owner.trim() || 'Project Lead',
      icon: 'Layers',
      color: '#0A0A0A',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      milestones: [
        {
          id: `m-${Date.now()}-1`,
          title: 'Project Kickoff & Scope Sign-off',
          target_date: new Date().toISOString().split('T')[0],
          completed: true,
          completed_at: new Date().toISOString().split('T')[0],
        },
        {
          id: `m-${Date.now()}-2`,
          title: 'Primary Deliverable',
          target_date:
            targetDate || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
          completed: prog === 100,
        },
      ],
      business_signals: ['Project initialized and ready for milestone tracking'],
      last_updated: new Date().toISOString(),
      days_since_update: 0,
    });
    setName('');
    setDescription('');
    setTags('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-7 sm:p-8 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                Add New Project to Portfolio
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Track valuation, milestones, progress & conversational audit trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode switcher */}
        <div className="px-7 sm:px-8 py-3 bg-white flex items-center gap-2 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveMode('ai')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'ai'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Natural Language</span>
          </button>
          <button
            onClick={() => setActiveMode('manual')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'manual'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Manual Form</span>
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-6">
          {activeMode === 'ai' ? (
            <form onSubmit={handleAiSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">
                  Describe the project to Luna:
                </label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. “Add a new project called SwiftFlow in Fintech category. It is an automated cross-border payroll tool currently in Development stage at 25% progress, estimated valuation ₹7.5 lakh.”"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Luna Synthesizing...' : 'Generate & Add Project'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. ApexCRM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black"
                  >
                    <option value="SaaS">SaaS</option>
                    <option value="Agency / Client">Agency / Client</option>
                    <option value="AI & ML">AI & ML</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Internal Tool">Internal Tool</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 block mb-1 font-medium">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="One sentence description of the project goal..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as ProjectStage)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black"
                  >
                    <option value="Idea">Idea</option>
                    <option value="Design & Spec">Design & Spec</option>
                    <option value="MVP">MVP</option>
                    <option value="Development">Development</option>
                    <option value="Beta Testing">Beta Testing</option>
                    <option value="Launch">Launch</option>
                    <option value="Scaling">Scaling</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Progress %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Budget / Value ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={projectValue}
                    onChange={(e) => setProjectValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black mono-num"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Cost to Date ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={costToDate}
                    onChange={(e) => setCostToDate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Target Completion</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black mono-num"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Owner / Lead</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g. Web, Client"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
