import React, { useState } from 'react';
import { X, Sparkles, Plus, Layers, Coins, Calendar, Tag } from 'lucide-react';
import { Project, ProjectCategory, ProjectStage } from '../types';
import { createProjectFromPrompt } from '../services/api';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Partial<Project>) => void;
  currency: string;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  currency,
}) => {
  const [activeMode, setActiveMode] = useState<'ai' | 'manual'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('SaaS');
  const [stage, setStage] = useState<ProjectStage>('Development');
  const [progress, setProgress] = useState(20);
  const [projectValue, setProjectValue] = useState(500000);
  const [owner, setOwner] = useState('Lakshya Lohani');
  const [tags, setTags] = useState('React, B2B');

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

    onCreateProject({
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: description.trim() || 'New portfolio project tracked by Luna 0.1.',
      category,
      status: 'active',
      stage,
      progress_percentage: Number(progress),
      project_value: Number(projectValue),
      currency,
      realized_value: Math.round(Number(projectValue) * 0.25),
      potential_value: Math.round(Number(projectValue) * 1.8),
      cost_to_date: Math.round(Number(projectValue) * 0.15),
      health_score: 85,
      health_status: 'Healthy',
      performance_score: 80,
      performance_trend: 'improving',
      performance_delta_month: 10,
      performance_delta_year: 25,
      progress_delta_month: 10,
      progress_delta_year: 20,
      value_delta_month: Math.round(Number(projectValue) * 0.1),
      value_delta_year: Number(projectValue),
      target_completion_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      start_date: new Date().toISOString().split('T')[0],
      owner: owner.trim() || 'Founder',
      icon: 'Layers',
      color: '#6366F1',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Core Architecture Spec', target_date: '2026-09-30', completed: true },
        { id: `m-${Date.now()}-2`, title: 'MVP Deliverable', target_date: '2026-11-15', completed: false },
      ],
      business_signals: ['Project initialized in portfolio'],
      last_updated: new Date().toISOString(),
      days_since_update: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0A0A0A] tracking-tight">
                Add New Project to Portfolio
              </h3>
              <p className="text-xs text-slate-400">
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
        <div className="px-5 pt-3 pb-2 bg-slate-50/40 flex items-center gap-2 border-b border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveMode('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'ai'
                ? 'bg-black text-white font-semibold shadow-xs'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Natural Language</span>
          </button>
          <button
            onClick={() => setActiveMode('manual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeMode === 'manual'
                ? 'bg-black text-white font-semibold shadow-xs'
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Valuation ({currency})</label>
                  <input
                    type="number"
                    value={projectValue}
                    onChange={(e) => setProjectValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Owner</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1 font-medium">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
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
