export function formatCurrency(value: number, currency: string = '₹'): string {
  if (value === undefined || value === null || isNaN(value)) return `${currency}0`;

  if (currency === '₹' || currency === 'Rs' || currency === 'INR') {
    if (value >= 10000000) {
      const cr = value / 10000000;
      return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      const l = value / 100000;
      return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)}L`;
    }
    if (value >= 1000) {
      const k = value / 1000;
      return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}k`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  }

  // Western formatting ($, €, £)
  if (value >= 1000000) {
    const m = value / 1000000;
    return `${currency}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const k = value / 1000;
    return `${currency}${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `${currency}${value.toLocaleString('en-US')}`;
}

export function formatExactCurrency(value: number, currency: string = '₹'): string {
  if (currency === '₹') {
    return `₹${value.toLocaleString('en-IN')}`;
  }
  return `${currency}${value.toLocaleString('en-US')}`;
}

export function getHealthBadgeColor(score: number): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  if (score >= 85) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200/60',
      label: 'Excellent',
    };
  }
  if (score >= 75) {
    return {
      bg: 'bg-zinc-100',
      text: 'text-zinc-800',
      border: 'border-zinc-200/60',
      label: 'Healthy',
    };
  }
  if (score >= 60) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200/60',
      label: 'Attention',
    };
  }
  if (score >= 40) {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200/60',
      label: 'At Risk',
    };
  }
  return {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200/60',
    label: 'Critical',
  };
}

export function getStageColor(stage: string): string {
  // Clean monochromatic stage styling
  switch (stage) {
    case 'Launch':
      return 'bg-zinc-900 text-white border-zinc-900';
    case 'Scaling':
      return 'bg-zinc-100 text-zinc-900 border-zinc-200/60 font-semibold';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200/60';
  }
}

export function calculatePortfolioMetrics(projects: any[]) {
  const total = projects.length;
  const active = projects.filter(p => p.status === 'active').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const onHold = projects.filter(p => p.status === 'on_hold').length;
  const archived = projects.filter(p => p.status === 'archived').length;

  const activeProjects = projects.filter(p => p.status === 'active');
  const avgProgress = activeProjects.length
    ? Math.round(activeProjects.reduce((acc, p) => acc + (p.progress_percentage || 0), 0) / activeProjects.length)
    : 0;

  const totalValue = projects.reduce((acc, p) => acc + (p.project_value || 0), 0);
  const realizedValue = projects.reduce((acc, p) => acc + (p.realized_value || 0), 0);
  const potentialValue = projects.reduce((acc, p) => acc + (p.potential_value || 0), 0);

  const avgHealth = projects.length
    ? Math.round(projects.reduce((acc, p) => acc + (p.health_score || 0), 0) / projects.length)
    : 80;

  return {
    total,
    active,
    completed,
    onHold,
    archived,
    avgProgress,
    totalValue,
    realizedValue,
    potentialValue,
    avgHealth,
  };
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
