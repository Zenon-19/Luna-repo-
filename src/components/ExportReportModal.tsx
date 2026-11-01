import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  Code2,
  History,
  Filter,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Share2
} from 'lucide-react';
import { Project, ProjectSnapshot, ProjectUpdateRecord } from '../types';
import { formatCurrency } from '../utils/formatters';

export type ReportType = 'portfolio' | 'audit_trail';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  snapshots: ProjectSnapshot[];
  updateRecords: ProjectUpdateRecord[];
  currency: string;
  initialReportType?: ReportType;
  initialProjectId?: string;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  projects,
  snapshots,
  updateRecords,
  currency,
  initialReportType = 'portfolio',
  initialProjectId = 'all',
}) => {
  const [reportType, setReportType] = useState<ReportType>(initialReportType);
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Audit trail customization toggles
  const [includePrompts, setIncludePrompts] = useState(true);
  const [includeChanges, setIncludeChanges] = useState(true);
  const [includeSignals, setIncludeSignals] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialReportType) setReportType(initialReportType);
      if (initialProjectId) setSelectedProjectId(initialProjectId);
      setCopied(false);
    }
  }, [isOpen, initialReportType, initialProjectId]);

  if (!isOpen) return null;

  // Portfolio calculations
  const totalValuation = projects.reduce((sum, p) => sum + p.project_value, 0);
  const activeProjects = projects.filter((p) => p.status === 'active');
  const avgProgress = activeProjects.length
    ? Math.round(
        activeProjects.reduce((sum, p) => sum + p.progress_percentage, 0) / activeProjects.length
      )
    : 0;

  // Filtered update records for audit trail
  const filteredRecords = updateRecords.filter((r) => {
    const matchesProject = selectedProjectId === 'all' || r.project_id === selectedProjectId;
    if (!matchesProject) return false;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchProj = r.project_name.toLowerCase().includes(q);
      const matchMsg = r.original_message.toLowerCase().includes(q);
      const matchSummary = r.ai_summary.toLowerCase().includes(q);
      const matchSignals = r.business_signals.some((s) => s.toLowerCase().includes(q));
      return matchProj || matchMsg || matchSummary || matchSignals;
    }
    return true;
  });

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId);
  const scopeLabel = selectedProjectId === 'all' ? 'All Portfolio Projects' : selectedProjectObj?.name || 'Selected Project';

  // 1. Generate Executive Portfolio Markdown
  const generatePortfolioMarkdown = () => {
    return `# Luna 0.1 — Portfolio Intelligence Executive Report
*Generated on: ${new Date().toLocaleDateString('en-US', {
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

## 3. Conversational Audit Snapshot (Latest Updates)
${updateRecords
  .slice(0, 5)
  .map(
    (r) => `* **${r.project_name}** (${new Date(r.timestamp).toLocaleDateString()}):
  * Original User Prompt: "${r.original_message}"
  * Luna Interpretation: ${r.ai_summary}
`
  )
  .join('\n')}
`;
  };

  // 2. Generate Dedicated Audit Trail Markdown Summary
  const generateAuditTrailMarkdown = () => {
    if (filteredRecords.length === 0) {
      return `# Luna 0.1 — Project Audit Trail Summary
*Generated on: ${new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}*
*Target Scope: ${scopeLabel}*

> **Notice**: No audit entries match the current filter criteria ("${searchFilter || selectedProjectId}").
> Natural-language updates processed via the Luna Command Dock will be recorded here permanently.
`;
    }

    const totalCount = filteredRecords.length;
    const avgConfidence = Math.round(
      (filteredRecords.reduce((sum, r) => sum + (r.confidence_score || 0.95), 0) / totalCount) * 100
    );

    const dates = filteredRecords.map((r) => new Date(r.timestamp).getTime());
    const earliestDate = new Date(Math.min(...dates)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const latestDate = new Date(Math.max(...dates)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const uniqueSignals = Array.from(
      new Set(filteredRecords.flatMap((r) => r.business_signals || []))
    );

    let md = `# Luna 0.1 — Project Audit Trail & Conversational Decision Log
*Generated on: ${new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}*
*Scope: ${scopeLabel}*

---

## 📊 Audit Trail Overview
- **Total Audit Log Entries**: ${totalCount}
- **Active Filter Scope**: ${scopeLabel}
- **Audit Period**: ${earliestDate} — ${latestDate}
- **Average Luna AI Confidence**: ${avgConfidence}%
- **Key Business Signals Tracked**: ${
      uniqueSignals.length > 0 ? uniqueSignals.slice(0, 6).join(' • ') : 'Standard system audit'
    }

---

## 📜 Chronological Audit Trail & State Transitions
`;

    // Sort newest first
    const sorted = [...filteredRecords].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    sorted.forEach((record, idx) => {
      const formattedTimestamp = new Date(record.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      md += `\n### ${idx + 1}. ${record.project_name} — ${formattedTimestamp}\n`;

      if (includeMetadata) {
        md += `- **Audit Record ID**: \`${record.id}\`\n`;
        md += `- **Luna Confidence**: ${Math.round(record.confidence_score * 100)}%\n`;
        md += `- **Verification Status**: ${
          record.user_confirmed !== false ? 'Verified & Committed' : 'Auto-recorded'
        }\n`;
      }

      if (includePrompts) {
        md += `\n#### 💬 Original User Prompt\n> "${record.original_message}"\n`;
      }

      md += `\n#### 🧠 Luna AI Structured Synthesis\n${record.ai_summary}\n`;

      if (includeChanges && record.changes && record.changes.length > 0) {
        md += `\n#### ⚡ Applied Field Changes\n`;
        md += `| Field | Previous Value | New Value | Net Delta |\n`;
        md += `| :--- | :--- | :--- | :--- |\n`;
        record.changes.forEach((c) => {
          let deltaStr = 'Updated';
          if (typeof c.new_value === 'number' && typeof c.old_value === 'number') {
            const diff = c.new_value - c.old_value;
            deltaStr = diff >= 0 ? `+${diff}` : `${diff}`;
          }
          md += `| **${c.label || c.field_name}** | \`${c.old_value ?? 'None'}\` | \`${c.new_value}\` | ${deltaStr} |\n`;
        });
      }

      if (includeSignals && record.business_signals && record.business_signals.length > 0) {
        md += `\n#### 📡 Detected Business Signals\n`;
        record.business_signals.forEach((sig) => {
          md += `- ${sig}\n`;
        });
      }

      md += `\n---\n`;
    });

    md += `\n*End of Luna 0.1 Audit Trail. Generated via Model Context Protocol (MCP) data pipeline.*\n`;

    return md;
  };

  // Determine active content
  let activeContent = '';
  if (reportType === 'portfolio') {
    if (format === 'markdown') {
      activeContent = generatePortfolioMarkdown();
    } else {
      activeContent = JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          report_type: 'executive_portfolio_report',
          summary: {
            total_projects: projects.length,
            total_value: totalValuation,
            average_progress: avgProgress,
          },
          projects,
          snapshots,
          recent_audit_records: updateRecords.slice(0, 10),
        },
        null,
        2
      );
    }
  } else {
    // Audit Trail
    if (format === 'markdown') {
      activeContent = generateAuditTrailMarkdown();
    } else {
      activeContent = JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          report_type: 'project_audit_trail_summary',
          scope: selectedProjectId,
          project_name: scopeLabel,
          record_count: filteredRecords.length,
          filters: {
            search_query: searchFilter || null,
            include_prompts: includePrompts,
            include_changes: includeChanges,
            include_signals: includeSignals,
            include_metadata: includeMetadata,
          },
          records: filteredRecords,
        },
        null,
        2
      );
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const isMd = format === 'markdown';
    const blob = new Blob([activeContent], {
      type: isMd ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const dateStr = new Date().toISOString().split('T')[0];
    const slug =
      reportType === 'portfolio'
        ? 'luna-portfolio-report'
        : `luna-audit-trail-${selectedProjectId === 'all' ? 'all-projects' : selectedProjectId}`;

    a.download = `${slug}-${dateStr}.${isMd ? 'md' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900">
        {/* Top Header */}
        <div className="p-7 sm:p-8 border-b border-slate-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-xs">
              {reportType === 'audit_trail' ? (
                <History className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0A0A0A] tracking-tight">
                  {reportType === 'audit_trail'
                    ? 'Export Project Audit Trail Summary'
                    : 'Export Portfolio Intelligence Report'}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  · Markdown & Raw Data
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate formatted reports and audit logs ready to copy to clipboard for Notion, GitHub, or investor updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-black transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Report Type Switcher */}
        <div className="px-7 sm:px-8 py-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-xl">
            <button
              onClick={() => setReportType('portfolio')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                reportType === 'portfolio'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-black'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Executive Report</span>
            </button>
            <button
              onClick={() => setReportType('audit_trail')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                reportType === 'audit_trail'
                  ? 'bg-black text-white font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-black'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Project Audit Trail</span>
              <span className="ml-1 px-1.5 py-0.2 bg-slate-200/80 text-black rounded-full text-[10px] font-semibold mono-num">
                {updateRecords.length}
              </span>
            </button>
          </div>

          {/* Quick Copy & Download Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-black hover:bg-slate-800 border-black text-white shadow-xs'
              }`}
              title="Copy formatted markdown to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Formatted Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium border border-slate-200 transition-all cursor-pointer"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Audit Trail Specific Filtering & Options Bar */}
        {reportType === 'audit_trail' && (
          <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Project Filter & Search */}
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-xs">
                <Filter className="w-3 h-3 text-slate-400" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="text-xs bg-transparent text-[#0A0A0A] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Projects ({updateRecords.length} records)</option>
                  {projects.map((p) => {
                    const count = updateRecords.filter((r) => r.project_id === p.id).length;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter audit prompts or signals..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Customization checkboxes */}
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <label className="flex items-center gap-1 cursor-pointer hover:text-black">
                <input
                  type="checkbox"
                  checked={includePrompts}
                  onChange={(e) => setIncludePrompts(e.target.checked)}
                  className="rounded text-black focus:ring-black cursor-pointer"
                />
                <span>Prompts</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer hover:text-black">
                <input
                  type="checkbox"
                  checked={includeChanges}
                  onChange={(e) => setIncludeChanges(e.target.checked)}
                  className="rounded text-black focus:ring-black cursor-pointer"
                />
                <span>Deltas</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer hover:text-black">
                <input
                  type="checkbox"
                  checked={includeSignals}
                  onChange={(e) => setIncludeSignals(e.target.checked)}
                  className="rounded text-black focus:ring-black cursor-pointer"
                />
                <span>Signals</span>
              </label>

              <label className="flex items-center gap-1 cursor-pointer hover:text-black">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="rounded text-black focus:ring-black cursor-pointer"
                />
                <span>Metadata</span>
              </label>
            </div>
          </div>
        )}

        {/* Format Selector Bar */}
        <div className="px-5 py-2 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Output Format:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setFormat('markdown')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  format === 'markdown'
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-black'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>Markdown (.md)</span>
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  format === 'json'
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-black'
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>JSON Raw</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] mono-num text-slate-400">
            {reportType === 'audit_trail'
              ? `${filteredRecords.length} of ${updateRecords.length} audit records selected`
              : `${projects.length} portfolio projects included`}
          </div>
        </div>

        {/* Preview Code Viewport */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-50/70 flex-1 whitespace-pre-wrap select-all leading-relaxed">
          {activeContent}
        </div>

        {/* Bottom Status & Help Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>
              {reportType === 'audit_trail'
                ? 'Markdown is formatted for Notion tables, GitHub Issues, Jira, or email updates'
                : 'Executive summary calculates live valuation, MoM trajectory, and active milestones'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-xs transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
