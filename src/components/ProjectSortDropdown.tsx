import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowUpDown, 
  ChevronDown, 
  Check, 
  Activity, 
  Coins, 
  Calendar, 
  RotateCcw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ProjectSortOption } from '../types';

interface SortItem {
  id: ProjectSortOption;
  label: string;
  shortLabel: string;
  category: 'Health' | 'Value' | 'Completion Date' | 'Default';
  icon: React.ComponentType<{ className?: string }>;
  direction: 'asc' | 'desc' | 'default';
}

const SORT_OPTIONS: SortItem[] = [
  {
    id: 'health_desc',
    label: 'Health Score (High → Low)',
    shortLabel: 'Health (High → Low)',
    category: 'Health',
    icon: Activity,
    direction: 'desc',
  },
  {
    id: 'health_asc',
    label: 'Health Score (Low → High)',
    shortLabel: 'Health (Low → High)',
    category: 'Health',
    icon: Activity,
    direction: 'asc',
  },
  {
    id: 'value_desc',
    label: 'Project Value (High → Low)',
    shortLabel: 'Value (High → Low)',
    category: 'Value',
    icon: Coins,
    direction: 'desc',
  },
  {
    id: 'value_asc',
    label: 'Project Value (Low → High)',
    shortLabel: 'Value (Low → High)',
    category: 'Value',
    icon: Coins,
    direction: 'asc',
  },
  {
    id: 'date_asc',
    label: 'Completion Date (Earliest First)',
    shortLabel: 'Completion (Earliest)',
    category: 'Completion Date',
    icon: Calendar,
    direction: 'asc',
  },
  {
    id: 'date_desc',
    label: 'Completion Date (Latest First)',
    shortLabel: 'Completion (Latest)',
    category: 'Completion Date',
    icon: Calendar,
    direction: 'desc',
  },
  {
    id: 'default',
    label: 'Default (Portfolio Order)',
    shortLabel: 'Default Order',
    category: 'Default',
    icon: RotateCcw,
    direction: 'default',
  },
];

interface ProjectSortDropdownProps {
  sortBy: ProjectSortOption;
  onSortChange: (sort: ProjectSortOption) => void;
  className?: string;
}

export const ProjectSortDropdown: React.FC<ProjectSortDropdownProps> = ({
  sortBy,
  onSortChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = SORT_OPTIONS.find((opt) => opt.id === sortBy) || SORT_OPTIONS[0];

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:border-black text-xs font-medium text-[#0A0A0A] shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-black"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Sort projects by health score, value, or completion date"
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-slate-400 font-normal">Sort:</span>
        <span className="font-semibold text-[#0A0A0A] truncate max-w-[150px]">
          {activeOption.shortLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-black' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-40 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Sort Projects By
            </span>
            <span className="text-xs text-slate-500">
              Health, valuation, or completion target
            </span>
          </div>

          <div className="space-y-0.5 max-h-[340px] overflow-y-auto">
            {SORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = option.id === sortBy;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSortChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-black font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{option.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {option.direction === 'desc' && (
                      <ArrowDown className={`w-3 h-3 ${isSelected ? 'text-white/80' : 'text-slate-400'}`} />
                    )}
                    {option.direction === 'asc' && (
                      <ArrowUp className={`w-3 h-3 ${isSelected ? 'text-white/80' : 'text-slate-400'}`} />
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
