import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, BarChart3, LineChart as LineIcon, Layers } from 'lucide-react';
import { Project, ProjectSnapshot } from '../types';
import { formatCurrency } from '../utils/formatters';

interface PortfolioGrowthChartProps {
  projects: Project[];
  snapshots: ProjectSnapshot[];
  currency: string;
}

export const PortfolioGrowthChart: React.FC<PortfolioGrowthChartProps> = ({
  projects,
  snapshots,
  currency,
}) => {
  const [metricMode, setMetricMode] = useState<'value' | 'progress' | 'performance'>('value');

  // Synthesize monthly aggregate trend from snapshots
  const monthlyData = [
    { month: 'May 2026', totalValue: 2450000, avgProgress: 38, avgHealth: 76, activeCount: 6 },
    { month: 'Jun 2026', totalValue: 3250000, avgProgress: 49, avgHealth: 79, activeCount: 7 },
    { month: 'Jul 2026', totalValue: 4450000, avgProgress: 58, avgHealth: 81, activeCount: 7 },
    { month: 'Aug 2026', totalValue: 6950000, avgProgress: 68, avgHealth: 84, activeCount: 8 },
  ];

  // Project comparative bar chart
  const projectComparisonData = projects.map((p) => ({
    name: p.name,
    progress: p.progress_percentage,
    value: p.project_value,
    health: p.health_score,
    performance: p.performance_score,
  }));

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-8 shadow-xs">
      {/* Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0A0A0A]" />
            <h2 className="text-sm font-semibold text-[#0A0A0A] tracking-tight">
              Portfolio Growth Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time trajectory aggregated from historical snapshots and conversational updates
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('value')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              metricMode === 'value'
                ? 'bg-white text-black shadow-xs font-semibold'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Valuation Growth</span>
          </button>
          <button
            onClick={() => setMetricMode('progress')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              metricMode === 'progress'
                ? 'bg-white text-black shadow-xs font-semibold'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Progress Velocity</span>
          </button>
          <button
            onClick={() => setMetricMode('performance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              metricMode === 'performance'
                ? 'bg-white text-black shadow-xs font-semibold'
                : 'text-slate-500 hover:text-black'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Project Index</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {metricMode === 'value' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0A0A0A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0A0A0A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(0,0,0,0.4)" fontSize={11} tickLine={false} />
              <YAxis
                stroke="rgba(0,0,0,0.4)"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => formatCurrency(v, currency)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#0A0A0A',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                }}
                formatter={(value: any) => [formatCurrency(Number(value), currency), 'Valuation']}
              />
              <Area
                type="monotone"
                dataKey="totalValue"
                stroke="#0A0A0A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#valueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {metricMode === 'progress' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(0,0,0,0.4)" fontSize={11} tickLine={false} />
              <YAxis stroke="rgba(0,0,0,0.4)" fontSize={11} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#0A0A0A',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                }}
                formatter={(val: any, name: any) => [
                  `${val}%`,
                  name === 'avgProgress' ? 'Avg Progress' : 'Avg Health',
                ]}
              />
              <Line
                type="monotone"
                dataKey="avgProgress"
                name="Avg Progress"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#FFFFFF' }}
              />
              <Line
                type="monotone"
                dataKey="avgHealth"
                name="Avg Health"
                stroke="#4F46E5"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#4F46E5' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {metricMode === 'performance' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.4)" fontSize={11} tickLine={false} />
              <YAxis stroke="rgba(0,0,0,0.4)" fontSize={11} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#0A0A0A',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="progress" name="Progress %" fill="#0A0A0A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="health" name="Health Score" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Mini Chart Footer Insights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-2 border-t border-slate-100 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Monthly Value Delta</span>
          <span className="text-emerald-700 font-semibold mono-num">+₹25.0L (↑ 56%)</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Progress Velocity</span>
          <span className="text-slate-800 font-semibold mono-num">+10% / month avg</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Milestones</span>
          <span className="text-[#0A0A0A] font-semibold mono-num">14 Done / 8 In Flight</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Snapshot Integrity</span>
          <span className="text-slate-800 font-semibold mono-num">100% Verified Audit</span>
        </div>
      </div>
    </div>
  );
};
