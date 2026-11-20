import React from 'react';
import { Plus, Sparkles, ArrowRight } from 'lucide-react';

interface OnboardingEmptyStateProps {
  onCreateProject: () => void;
  onStartWithPrompt: (prompt: string) => void;
}

export const OnboardingEmptyState: React.FC<OnboardingEmptyStateProps> = ({
  onCreateProject,
  onStartWithPrompt,
}) => {
  return (
    <section className="max-w-4xl mx-auto py-8 sm:py-12">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-xs">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-slate-500 mb-3">
            Clean Workspace · Ready for your first project
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0A0A0A] leading-tight text-balance mb-4">
            Track real project delivery and share progress with clients in one place.
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            Your portfolio starts empty so you can add only your active work. Monitor milestones, timelines, and internal budgets privately, then generate clean read-only progress links for clients whenever you ship.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onCreateProject}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>

            <button
              onClick={() =>
                onStartWithPrompt(
                  'Create a new project called Client Portal Redesign in SaaS category at 25% progress with value ₹5 lakh.'
                )
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-black text-slate-800 hover:text-black text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>Describe a Project</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 3-Step Workflow Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 mt-10 border-t border-slate-100">
          <div>
            <div className="text-xs font-semibold text-[#0A0A0A] mb-1.5">
              01. Set Up Your Project
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add your project scope, target completion date, budget, and initial milestones in under a minute.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#0A0A0A] mb-1.5">
              02. Log Updates &amp; Results
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Check off completed deliverables, track cost versus budget warnings, and record key outcomes as you go.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#0A0A0A] mb-1.5">
              03. Share With Clients
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a read-only client portal link showcasing progress, milestones, and results while keeping internal costs private.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
