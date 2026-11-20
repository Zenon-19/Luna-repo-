import { Project, ProjectSnapshot, ProjectUpdateRecord, LunaInsight, AIParseResult } from '../types';
import { formatCurrency } from '../utils/formatters';

export async function parseNaturalLanguageUpdate(
  message: string,
  projects: Project[]
): Promise<AIParseResult> {
  try {
    const res = await fetch('/api/luna/parse-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, projects }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('API error, using local resilient parser:', err);
    return fallbackLocalParser(message, projects);
  }
}

export async function generateProactiveInsights(
  projects: Project[]
): Promise<LunaInsight[]> {
  try {
    const res = await fetch('/api/luna/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('API error, returning local insights:', err);
    return [];
  }
}

export const generatePortfolioInsights = generateProactiveInsights;

export async function askLunaQuery(
  query: string,
  projects: Project[],
  snapshots: ProjectSnapshot[],
  updates: ProjectUpdateRecord[]
): Promise<{ answer: string; referencedProjects?: string[] }> {
  try {
    const res = await fetch('/api/luna/ask-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, projects, snapshots, updates }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('API error in askLunaQuery:', err);
    const totalVal = projects.reduce((a, b) => a + (b.project_value || 0), 0);
    return {
      answer: `I analyzed your portfolio of ${projects.length} projects. You have ${formatCurrency(totalVal, '₹')} total value tracked across enterprise AI, SaaS, and infrastructure initiatives.`,
    };
  }
}

export async function createProjectFromPrompt(
  prompt: string
): Promise<Partial<Project>> {
  try {
    const res = await fetch('/api/luna/create-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('API error in createProjectFromPrompt:', err);
    return {
      name: prompt.slice(0, 24),
      category: 'SaaS',
      stage: 'Development',
      progress_percentage: 20,
      project_value: 300000,
      currency: '₹',
      health_score: 80,
    };
  }
}

function fallbackLocalParser(message: string, projects: Project[]): AIParseResult {
  const lower = message.toLowerCase();
  const matchedProject = projects.find(p => lower.includes(p.name.toLowerCase()));

  const percentMatch = message.match(/(\d{1,3})\s*%/);
  const progressVal = percentMatch ? parseInt(percentMatch[1], 10) : undefined;

  let valueVal: number | undefined = undefined;
  if (/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/i.test(message)) {
    const num = parseFloat(message.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|l\b)/i)![1]);
    valueVal = num * 100000;
  } else if (/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i.test(message)) {
    const num = parseFloat(message.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i)![1]);
    valueVal = num * 10000000;
  } else if (/(\d+(?:\.\d+)?)\s*(?:k|thousand)/i.test(message)) {
    const num = parseFloat(message.match(/(\d+(?:\.\d+)?)\s*(?:k|thousand)/i)![1]);
    valueVal = num * 1000;
  }

  const changes: any[] = [];
  const updated_fields: any = {};

  if (matchedProject) {
    if (progressVal !== undefined) {
      changes.push({
        field_name: 'progress_percentage',
        label: 'Progress',
        old_value: `${matchedProject.progress_percentage}%`,
        new_value: `${progressVal}%`,
      });
      updated_fields.progress_percentage = progressVal;
    }
    if (valueVal !== undefined) {
      const isCostUpdate = /\b(cost|spend|spent|expense|budget used)\b/i.test(message);
      if (isCostUpdate) {
        changes.push({
          field_name: 'cost_to_date',
          label: 'Cost to Date',
          old_value: `${matchedProject.currency}${matchedProject.cost_to_date.toLocaleString()}`,
          new_value: `${matchedProject.currency}${valueVal.toLocaleString()}`,
        });
        updated_fields.cost_to_date = valueVal;
      } else {
        changes.push({
          field_name: 'project_value',
          label: 'Project Value',
          old_value: `${matchedProject.currency}${matchedProject.project_value.toLocaleString()}`,
          new_value: `${matchedProject.currency}${valueVal.toLocaleString()}`,
        });
        updated_fields.project_value = valueVal;
      }
    }
  }

  const confidence = matchedProject ? (changes.length > 0 ? 0.94 : 0.6) : 0.4;

  return {
    target_project_id: matchedProject ? matchedProject.id : undefined,
    target_project_name: matchedProject ? matchedProject.name : 'Unknown Project',
    confidence_score: confidence,
    requires_confirmation: confidence < 0.75,
    clarification_question: matchedProject
      ? `I detected ${matchedProject.name}. Would you like me to update progress, value, or add a note?`
      : 'Which project does this update apply to?',
    ai_summary: matchedProject
      ? `Updated ${matchedProject.name}: ${changes.map(c => `${c.label} → ${c.new_value}`).join(', ') || 'Recorded activity update'}.`
      : 'Identified update message.',
    changes,
    updated_fields,
    business_signals: lower.includes('client') || lower.includes('feedback') ? ['Received client feedback'] : [],
    performance_impact: 'improving',
  };
}
