import { Project, ProjectSnapshot, ProjectUpdateRecord, LunaInsight, MCPStatus } from '../types';

/**
 * Clean-slate initial workspace state for new users.
 * Projects, snapshots, audit logs, and insights start empty so every user begins with their own real portfolio.
 */
export const initialProjects: Project[] = [];

export const initialSnapshots: ProjectSnapshot[] = [];

export const initialUpdateRecords: ProjectUpdateRecord[] = [];

export const initialInsights: LunaInsight[] = [];

export const initialMCPStatus: MCPStatus[] = [
  {
    name: 'PostgreSQL MCP Server',
    type: 'database',
    status: 'connected',
    latency: '18ms',
    details: 'Workspace state snapshot synchronization ready',
  },
  {
    name: 'Filesystem MCP Server',
    type: 'filesystem',
    status: 'connected',
    latency: '3ms',
    details: 'Local project workspace and audit log sync',
  },
  {
    name: 'GitHub MCP Server',
    type: 'git',
    status: 'connected',
    latency: '82ms',
    details: 'Repository commit & branch tracking ready',
  },
  {
    name: 'Cloud Intelligence Agent',
    type: 'cloud',
    status: 'connected',
    latency: '142ms',
    details: 'Natural-language project parsing online',
  },
];
