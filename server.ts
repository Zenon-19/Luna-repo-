import express from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const COMMENTS_DATA_DIR = path.resolve(process.cwd(), '.data');
const COMMENTS_STORE_PATH = path.resolve(COMMENTS_DATA_DIR, 'milestone-comments.json');
const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,120}$/;
const ALLOWED_FEEDBACK_TYPES = new Set(['feedback', 'approved', 'question']);
const ALLOWED_AUTHOR_ROLES = new Set(['client', 'owner']);

interface StoredMilestoneComment {
  id: string;
  project_id: string;
  milestone_id: string;
  author_name: string;
  author_role: 'client' | 'owner';
  feedback_type: 'feedback' | 'approved' | 'question';
  message: string;
  created_at: string;
}

let commentsWriteQueue: Promise<void> = Promise.resolve();

async function readAllMilestoneComments(): Promise<Record<string, StoredMilestoneComment[]>> {
  try {
    const raw = await fs.promises.readFile(COMMENTS_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, StoredMilestoneComment[]>;
    }
    return {};
  } catch (err: any) {
    if (err && err.code === 'ENOENT') return {};
    console.error('Error reading milestone comments store:', err);
    return {};
  }
}

async function writeAllMilestoneComments(
  store: Record<string, StoredMilestoneComment[]>
): Promise<void> {
  await fs.promises.mkdir(COMMENTS_DATA_DIR, { recursive: true });
  await fs.promises.writeFile(COMMENTS_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Natural Language Project Update Parser
  app.post('/api/luna/parse-update', async (req, res) => {
    try {
      const { message, projects } = req.body;
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const ai = getAiClient();

      if (!ai) {
        // Fallback heuristic response if API key is not present
        const fallback = generateHeuristicUpdate(message, projects || []);
        res.json(fallback);
        return;
      }

      const projectSummaries = (projects || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        status: p.status,
        stage: p.stage,
        progress: p.progress_percentage,
        value: p.project_value,
        currency: p.currency || '₹',
        health_score: p.health_score,
      }));

      const systemPrompt = `You are Luna 0.1, an intelligent project portfolio operating system.
Your mission is to interpret natural-language updates from founders, developers, and project managers.
Analyze the user's message against the current portfolio list.

Identify:
1. Target project (match strictly or fuzzy-match to project name or alias). If creating a new project, mark is_new_project: true.
2. Confidence score (0.0 to 1.0). If confidence >= 0.75, it will auto-apply. If < 0.75, it requires confirmation.
3. Extracted field changes (progress_percentage, project_value, status, stage, health_score, etc.).
4. Completed milestones or newly declared milestones.
5. Business signals (e.g. "got 3 prospective clients", "API broke", "raised funds", "positive feedback").
6. Performance trend calculation impact ('improving', 'stable', 'declining', 'stagnant').
7. Concise executive summary in the voice of Luna 0.1 (e.g., "Updated Flownest: Progress 65% → 70%, CRM milestone marked complete, ₹50k value added.").
8. Clarification question if confidence is below 0.75.

Available project stages: 'Idea', 'Design & Spec', 'MVP', 'Development', 'Beta Testing', 'Launch', 'Scaling'
Available project statuses: 'active', 'completed', 'on_hold', 'archived'

Current portfolio context:
${JSON.stringify(projectSummaries, null, 2)}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `User message: "${message}"`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              target_project_id: {
                type: Type.STRING,
                description: 'The matching project ID from the portfolio list, or empty if unknown/new.',
              },
              target_project_name: {
                type: Type.STRING,
                description: 'The identified project name.',
              },
              confidence_score: {
                type: Type.NUMBER,
                description: 'Confidence between 0.0 and 1.0 in this match and interpretation.',
              },
              requires_confirmation: {
                type: Type.BOOLEAN,
                description: 'True if confidence is low (< 0.75) or information is ambiguous.',
              },
              clarification_question: {
                type: Type.STRING,
                description: 'Question to ask if confirmation or more info is needed.',
              },
              ai_summary: {
                type: Type.STRING,
                description: 'High-level 1-2 sentence overview of the updates identified.',
              },
              changes: {
                type: Type.ARRAY,
                description: 'List of specific field updates.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    field_name: { type: Type.STRING },
                    label: { type: Type.STRING },
                    old_value: { type: Type.STRING },
                    new_value: { type: Type.STRING },
                  },
                  required: ['field_name', 'label', 'new_value'],
                },
              },
              updated_fields: {
                type: Type.OBJECT,
                description: 'Key-value map of numerical or typed fields to update directly.',
                properties: {
                  progress_percentage: { type: Type.NUMBER },
                  project_value: { type: Type.NUMBER },
                  status: { type: Type.STRING },
                  stage: { type: Type.STRING },
                  health_score: { type: Type.NUMBER },
                },
              },
              new_milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    completed: { type: Type.BOOLEAN },
                  },
                  required: ['title', 'completed'],
                },
              },
              completed_milestone_titles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              business_signals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              performance_impact: {
                type: Type.STRING,
                description: 'improving, stable, declining, or stagnant',
              },
            },
            required: [
              'target_project_name',
              'confidence_score',
              'requires_confirmation',
              'ai_summary',
              'changes',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/luna/parse-update:', err);
      // Fallback gracefully to heuristic parser
      const fallback = generateHeuristicUpdate(req.body.message, req.body.projects || []);
      res.json(fallback);
    }
  });

  // 2. Proactive Insights Generator
  app.post('/api/luna/generate-insights', async (req, res) => {
    try {
      const { projects } = req.body;
      const ai = getAiClient();

      if (!ai) {
        res.json(generateHeuristicInsights(projects || []));
        return;
      }

      const prompt = `Analyze this portfolio of projects and generate 3 to 5 high-impact, proactive insights.
Focus on:
1. Velocity leaders & momentum spikes
2. Stagnation risks (projects with no recent updates or slowing progress)
3. Value-to-progress divergence (e.g. high value leap with low progress, or high progress with undervalued pricing)
4. Milestone bottlenecks or risk mitigation recommendations.

Current projects:
${JSON.stringify(projects, null, 2)}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are Luna 0.1 Portfolio Intelligence Engine. Generate sharp, concise executive insights with clear impact tags.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, description: 'growth | risk | milestone | discrepancy | recommendation' },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                project_id: { type: Type.STRING },
                project_name: { type: Type.STRING },
                impact: { type: Type.STRING, description: 'high | medium | info' },
                action_prompt: { type: Type.STRING, description: 'Suggested natural language action the user can send to Luna' },
              },
              required: ['id', 'type', 'title', 'description', 'impact'],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      res.json(parsed);
    } catch (err) {
      console.error('Error in /api/luna/generate-insights:', err);
      res.json(generateHeuristicInsights(req.body.projects || []));
    }
  });

  // 3. Conversational Portfolio Query Q&A
  app.post('/api/luna/ask-query', async (req, res) => {
    try {
      const { query, projects, snapshots, updates } = req.body;
      const ai = getAiClient();

      if (!ai) {
        res.json({
          answer: `Here is a summary based on your ${projects?.length || 0} projects. Active projects are progressing smoothly with an aggregate health score of ${(projects?.reduce((acc: number, p: any) => acc + (p.health_score || 0), 0) / (projects?.length || 1)).toFixed(0)}/100.`,
          referencedProjects: (projects || []).slice(0, 3).map((p: any) => p.name),
        });
        return;
      }

      const context = {
        portfolio_summary: {
          total_projects: (projects || []).length,
          active_projects: (projects || []).filter((p: any) => p.status === 'active').length,
          total_value: (projects || []).reduce((sum: number, p: any) => sum + (p.project_value || 0), 0),
        },
        projects: projects || [],
        recent_updates: (updates || []).slice(0, 10),
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `User Query: "${query}"\n\nPortfolio Context:\n${JSON.stringify(context, null, 2)}`,
        config: {
          systemInstruction: `You are Luna 0.1, the personal AI portfolio manager. Answer the user's question directly with exact figures, percentages, dates, and names from the context. Be succinct, professional, and insightful.`,
        },
      });

      res.json({
        answer: response.text,
      });
    } catch (err: any) {
      console.error('Error in /api/luna/ask-query:', err);
      res.json({
        answer: `I analyzed your portfolio: you have ${(req.body.projects || []).length} tracked projects. You can ask me specific questions or tell me what to update!`,
      });
    }
  });

  // 4. Natural Language New Project Creator
  app.post('/api/luna/create-project', async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = getAiClient();

      if (!ai) {
        res.json(generateHeuristicNewProject(prompt));
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Create a new project from this prompt: "${prompt}"`,
        config: {
          systemInstruction: 'You are Luna 0.1. Extract structured project details from user input. Default currency to ₹ if Indian context or $ otherwise.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING, description: 'SaaS | Agency / Client | AI & ML | Fintech | Mobile App | E-commerce | Infrastructure | Internal Tool' },
              status: { type: Type.STRING, description: 'active | completed | on_hold | archived' },
              stage: { type: Type.STRING, description: 'Idea | Design & Spec | MVP | Development | Beta Testing | Launch | Scaling' },
              progress_percentage: { type: Type.NUMBER },
              project_value: { type: Type.NUMBER },
              currency: { type: Type.STRING },
              health_score: { type: Type.NUMBER },
              owner: { type: Type.STRING },
              initial_milestones: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['name', 'category', 'stage', 'progress_percentage', 'project_value'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch (err) {
      console.error('Error in /api/luna/create-project:', err);
      res.json(generateHeuristicNewProject(req.body.prompt || ''));
    }
  });

  // 5. Client & Team Milestone Comments Persistence
  app.get('/api/projects/:projectId/milestone-comments', async (req, res) => {
    try {
      const { projectId } = req.params;
      if (!projectId || !SAFE_ID_REGEX.test(projectId)) {
        res.status(400).json({ error: 'Invalid project identifier' });
        return;
      }

      const store = await readAllMilestoneComments();
      const comments = Array.isArray(store[projectId]) ? store[projectId] : [];
      res.json({ comments });
    } catch (err) {
      console.error('Error loading milestone comments:', err);
      res.status(500).json({ error: 'Failed to load milestone comments' });
    }
  });

  app.post('/api/projects/:projectId/milestone-comments', async (req, res) => {
    try {
      const { projectId } = req.params;
      if (!projectId || !SAFE_ID_REGEX.test(projectId)) {
        res.status(400).json({ error: 'Invalid project identifier' });
        return;
      }

      const { milestone_id, author_name, message, feedback_type, author_role } = req.body || {};

      if (typeof milestone_id !== 'string' || !SAFE_ID_REGEX.test(milestone_id)) {
        res.status(400).json({ error: 'Valid milestone_id is required' });
        return;
      }

      const cleanAuthor = typeof author_name === 'string' ? author_name.trim().slice(0, 80) : '';
      if (!cleanAuthor) {
        res.status(400).json({ error: 'Author name is required' });
        return;
      }

      const cleanMessage = typeof message === 'string' ? message.trim().slice(0, 1500) : '';
      if (!cleanMessage) {
        res.status(400).json({ error: 'Comment message is required' });
        return;
      }

      const safeFeedbackType: 'feedback' | 'approved' | 'question' =
        typeof feedback_type === 'string' && ALLOWED_FEEDBACK_TYPES.has(feedback_type)
          ? (feedback_type as 'feedback' | 'approved' | 'question')
          : 'feedback';

      const safeAuthorRole: 'client' | 'owner' =
        typeof author_role === 'string' && ALLOWED_AUTHOR_ROLES.has(author_role)
          ? (author_role as 'client' | 'owner')
          : 'client';

      const newComment: StoredMilestoneComment = {
        id: `mc-${randomUUID()}`,
        project_id: projectId,
        milestone_id,
        author_name: cleanAuthor,
        author_role: safeAuthorRole,
        feedback_type: safeFeedbackType,
        message: cleanMessage,
        created_at: new Date().toISOString(),
      };

      const writeOp = commentsWriteQueue.then(async () => {
        const store = await readAllMilestoneComments();
        const existing = Array.isArray(store[projectId]) ? store[projectId] : [];
        const updated = [...existing, newComment].slice(-500);
        store[projectId] = updated;
        await writeAllMilestoneComments(store);
      });
      commentsWriteQueue = writeOp.catch(() => {});
      await writeOp;

      res.status(201).json({ comment: newComment });
    } catch (err) {
      console.error('Error saving milestone comment:', err);
      res.status(500).json({ error: 'Failed to save milestone comment' });
    }
  });

  app.delete('/api/projects/:projectId/milestone-comments/:commentId', async (req, res) => {
    try {
      const { projectId, commentId } = req.params;
      if (
        !projectId ||
        !SAFE_ID_REGEX.test(projectId) ||
        !commentId ||
        !SAFE_ID_REGEX.test(commentId)
      ) {
        res.status(400).json({ error: 'Invalid identifier' });
        return;
      }

      const writeOp = commentsWriteQueue.then(async () => {
        const store = await readAllMilestoneComments();
        const existing = Array.isArray(store[projectId]) ? store[projectId] : [];
        store[projectId] = existing.filter((c) => c.id !== commentId);
        await writeAllMilestoneComments(store);
      });
      commentsWriteQueue = writeOp.catch(() => {});
      await writeOp;

      res.json({ deleted: true });
    } catch (err) {
      console.error('Error deleting milestone comment:', err);
      res.status(500).json({ error: 'Failed to delete milestone comment' });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Luna 0.1 Portfolio Intelligence server running on port ${PORT}`);
  });
}

// Fallback Heuristics when Gemini API key is absent or network fails
function generateHeuristicUpdate(message: string, projects: any[]) {
  const lower = message.toLowerCase();
  let matchedProject = projects.find(p => lower.includes(p.name.toLowerCase()));

  // Extract percentage
  const percentMatch = message.match(/(\d{1,3})\s*%/);
  const progressVal = percentMatch ? parseInt(percentMatch[1], 10) : undefined;

  // Extract currency value (e.g. ₹3 lakh, ₹8,00,000, 3L, $50k)
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
  } else {
    const rawValMatch = message.match(/(?:₹|\$|rs\.?)\s*([\d,]+)/i);
    if (rawValMatch) {
      valueVal = parseInt(rawValMatch[1].replace(/,/g, ''), 10);
    }
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
      changes.push({
        field_name: 'project_value',
        label: 'Project Value',
        old_value: `${matchedProject.currency || '₹'}${matchedProject.project_value?.toLocaleString() || '0'}`,
        new_value: `${matchedProject.currency || '₹'}${valueVal.toLocaleString()}`,
      });
      updated_fields.project_value = valueVal;
    }
  }

  // Check confidence
  const confidence = matchedProject ? (changes.length > 0 ? 0.92 : 0.6) : 0.45;

  return {
    target_project_id: matchedProject ? matchedProject.id : '',
    target_project_name: matchedProject ? matchedProject.name : 'Unknown Project',
    confidence_score: confidence,
    requires_confirmation: confidence < 0.75,
    clarification_question: matchedProject
      ? `I identified ${matchedProject.name}, but I need more details. Would you like me to update progress, value, health, or add a note?`
      : 'Which project does this update belong to?',
    ai_summary: matchedProject
      ? `Identified update for ${matchedProject.name}${changes.length > 0 ? ': ' + changes.map(c => `${c.label} → ${c.new_value}`).join(', ') : ' (recorded as activity note)'}.`
      : 'Please specify the project name.',
    changes,
    updated_fields,
    new_milestones: lower.includes('finished') || lower.includes('completed')
      ? [{ title: 'Module update completed', completed: true }]
      : [],
    completed_milestone_titles: [],
    business_signals: lower.includes('client') || lower.includes('feedback')
      ? ['Client feedback received']
      : [],
    performance_impact: 'improving',
  };
}

function generateHeuristicInsights(projects: any[]) {
  const insights: any[] = [];
  if (projects.length === 0) return insights;

  // 100% portfolio completion check
  if (projects.length > 0 && projects.every((p: any) => p.status === 'completed' || p.progress_percentage === 100)) {
    insights.push({
      id: 'ins-all-completed-2026',
      type: 'milestone',
      title: '100% Portfolio Completed in 2026',
      description: `All ${projects.length} projects have reached 100% progress and final delivery ending this year.`,
      project_id: projects[0]?.id || '',
      project_name: 'Portfolio Milestone',
      impact: 'high',
      action_prompt: 'Export Annual 2026 Portfolio Completion Audit Report',
    });
  }

  // Fastest growing
  const sorted = [...projects].sort((a, b) => (b.progress_percentage || 0) - (a.progress_percentage || 0));
  if (sorted[0]) {
    insights.push({
      id: 'ins-1',
      type: 'growth',
      title: `${sorted[0].name} leads portfolio velocity`,
      description: `${sorted[0].name} has reached ${sorted[0].progress_percentage}% progression and is on track for target delivery.`,
      project_id: sorted[0].id,
      project_name: sorted[0].name,
      impact: 'high',
      action_prompt: `Review milestone roadmap for ${sorted[0].name}`,
    });
  }

  // Stagnation
  const stagnant = projects.find(p => p.status === 'on_hold' || (p.health_score && p.health_score < 75));
  if (stagnant) {
    insights.push({
      id: 'ins-2',
      type: 'risk',
      title: `Attention recommended on ${stagnant.name}`,
      description: `${stagnant.name} health score is ${stagnant.health_score}/100 with delayed milestone velocity.`,
      project_id: stagnant.id,
      project_name: stagnant.name,
      impact: 'medium',
      action_prompt: `Update status or assign blockers on ${stagnant.name}`,
    });
  }

  // Value insight
  const highestValue = [...projects].sort((a, b) => (b.project_value || 0) - (a.project_value || 0))[0];
  if (highestValue) {
    insights.push({
      id: 'ins-3',
      type: 'recommendation',
      title: `High asset valuation in ${highestValue.name}`,
      description: `${highestValue.name} represents the largest valuation in your portfolio at ₹${(highestValue.project_value / 100000).toFixed(1)}L.`,
      project_id: highestValue.id,
      project_name: highestValue.name,
      impact: 'info',
      action_prompt: `Check ROI and realized revenue for ${highestValue.name}`,
    });
  }

  return insights;
}

function generateHeuristicNewProject(prompt: string) {
  const nameMatch = prompt.match(/(?:named|called|project)\s+([A-Za-z0-9_\- ]+?)(?:,|\.|\s+in|\s+for|\s+with|$)/i);
  const name = nameMatch ? nameMatch[1].trim() : 'New Project';

  return {
    name,
    description: `Created via Luna 0.1 natural language prompt: "${prompt}"`,
    category: 'SaaS',
    status: 'active',
    stage: 'Development',
    progress_percentage: 15,
    project_value: 300000,
    currency: '₹',
    health_score: 85,
    owner: 'Founder',
    initial_milestones: ['Architecture Spec', 'Core MVP Prototype', 'User Testing'],
  };
}

startServer();
