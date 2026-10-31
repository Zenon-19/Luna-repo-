import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Code2 } from 'lucide-react';
import { Project, ProjectSnapshot, ProjectUpdateRecord } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  snapshots: ProjectSnapshot[];
  updateRecords: ProjectUpdateRecord[];
  currency: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  projects,
  snapshots,
  updateRecords,
  currency,
}) => {
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalValuation = projects.reduce((sum, p) => sum + p.project_value, 0);
  const activeProjects = projects.filter((p) => p.status === 'active');
  const avgProgress = activeProjects.length
    ? Math.round(
        activeProjects.reduce((sum, p) => sum + p.progress_percentage, 0) / activeProjects.length
      )
    : 0;

  // Generate Markdown report
  const markdownContent = `# Luna 0.1 — Portfolio Intelligence Executive Report
*Generated on ${new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}*

## 1. Executive Summary
- **Total Tracked Projects**: ${projects.length} (${activeProjects.length} Active, ${
    projects.filter((p) => p.status === 'completed').length
  } Completed, ${projects.filter((p) => p.status === 'on_hold').length} On Hold)
- **Total Portfolio Valuation**: ${formatCurrency(totalValuation, currency)}
- **Average Active Progression**: ${avgProgress}%
- **Portfolio Health Score**: ${Math.round(
    projects.reduce((sum, p) => sum + p.health_score, 0) / (projects.length || 1)
  )}/100

---

## 2. Project Portfolio Ledger
${projects
  .map(
    (p) => `### ${p.name} (${p.category})
- **Stage**: ${p.stage} | **Status**: ${p.status}
- **Progress**: ${p.progress_percentage}% (+${p.progress_delta_month}% MoM)
- **Valuation**: ${formatCurrency(p.project_value, currency)}
- **Health**: ${p.health_score}/100 (${p.health_status})
- **Milestones**: ${p.milestones.filter((m) => m.completed).length}/${p.milestones.length} Completed
- **Business Signals**: ${p.business_signals.join('; ') || 'None'}
`
  )
  .join('\n')}

---

## 3. Recent Conversational Audit Log
${updateRecords
  .slice(0, 5)
  .map(
    (r) => `* **${r.project_name}** (${new Date(r.timestamp).toLocaleDateString()}):
  * Original text: "${r.original_message}"
  * Luna summary: ${r.ai_summary}
`
  )
  .join('\n')}
`;

  const jsonContent = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      summary: {
        total_projects: projects.length,
        total_value: totalValuation,
        average_progress: avgProgress,
      },
      projects,
      snapshots,
      update_records: updateRecords,
    },
    null,
    2
  );

  const activeContent = format === 'markdown' ? markdownContent : jsonContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeContent], {
      type: format === 'markdown' ? 'text/markdown' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna-portfolio-report-${new Date().toISOString().split('T')[0]}.${
      format === 'markdown' ? 'md' : 'json'
    }`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-900">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0A0A0A] tracking-tight">
                Export Portfolio Intelligence Report
              </h3>
              <p className="text-xs text-slate-400">
                Share with founders, investors, stakeholders or save to Notion / GitHub
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

        {/* Format selector */}
        <div className="px-5 pt-3 pb-2 bg-slate-50/40 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setFormat('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                format === 'markdown'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-black'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown (.md)</span>
            </button>
            <button
              onClick={() => setFormat('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                format === 'json'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-black'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JSON Raw (.json)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-800 transition-all cursor-pointer font-medium"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-50/70 flex-1 whitespace-pre-wrap select-all border-b border-slate-100">
          {activeContent}
        </div>
      </div>
    </div>
  );
};
