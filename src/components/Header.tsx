import React from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  FileText, 
  Database, 
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  Calendar,
  History,
  TrendingUp,
  Cpu,
  Trash2
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currency: string;
  onCurrencyChange: (c: string) => void;
  viewMode: 'grid' | 'table' | 'timeline' | 'audit';
  onViewModeChange: (m: 'grid' | 'table' | 'timeline' | 'audit') => void;
  onOpenNewProject: () => void;
  onOpenExportModal: () => void;
  onOpenMCPModal: () => void;
  onOpenAskLuna: () => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categories: string[];
  projectCount?: number;
  onClearWorkspace?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  currency,
  onCurrencyChange,
  viewMode,
  onViewModeChange,
  onOpenNewProject,
  onOpenExportModal,
  onOpenMCPModal,
  onOpenAskLuna,
  selectedCategory,
  onSelectCategory,
  categories,
  projectCount = 0,
  onClearWorkspace,
}) => {
  const [confirmClear, setConfirmClear] = React.useState(false);
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-slate-100 px-6 lg:px-10 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs">
              L
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg tracking-tight text-[#0A0A0A]">
                  Luna 0.1
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                  Intelligence
                </span>
              </div>
            </div>
          </div>

          {/* MCP Status Chip (Small screens) */}
          <button
            onClick={onOpenMCPModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 shadow-xs md:hidden cursor-pointer"
            title="View Model Context Protocol (MCP) Server Status"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-mono text-[10px]">MCP Online</span>
          </button>
        </div>

        {/* Center: Live Search & Category Filter */}
        <div className="flex items-center gap-2.5 w-full md:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects, milestones, notes (Press '/' to focus)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-black cursor-pointer shadow-xs font-medium"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Right: View Toggles & Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* MCP Server Button */}
          <button
            onClick={onOpenMCPModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-black transition-colors shadow-xs cursor-pointer"
            title="View MCP server integrations (PostgreSQL, Filesystem, GitHub)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] font-medium">MCP Online</span>
          </button>

          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 text-xs font-mono">
            {['₹', '$', '€'].map((curr) => (
              <button
                key={curr}
                onClick={() => onCurrencyChange(curr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currency === curr
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-black'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="hidden lg:flex items-center bg-slate-100 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-black'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-black'
              }`}
              title="Ledger / Table View"
            >
              <ListFilter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('timeline')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-black'
              }`}
              title="Milestone Roadmap"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('audit')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'audit'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-black'
              }`}
              title="Historical Audit Trail"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clear Workspace (two-step confirmation) */}
          {projectCount > 0 && onClearWorkspace && (
            confirmClear ? (
              <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-xl px-2 py-1 text-xs">
                <button
                  onClick={() => {
                    onClearWorkspace();
                    setConfirmClear(false);
                  }}
                  className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer whitespace-nowrap"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 rounded-lg text-slate-600 hover:text-black font-medium cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs text-slate-600 hover:text-rose-700 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                title="Remove all projects and reset workspace"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline font-semibold">Clear All</span>
              </button>
            )
          )}

          {/* Export Report */}
          {projectCount > 0 && (
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-black transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
              title="Export Portfolio Report (Markdown / JSON)"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline font-semibold">Export</span>
            </button>
          )}

          {/* Add Project */}
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>
    </header>
  );
};
