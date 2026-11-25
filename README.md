# Luna 0.1 — Portfolio Intelligence & Client Progress Workspace

Luna 0.1 is a clean-slate project portfolio intelligence and client delivery workspace built for founders, product leads, and agencies. It combines local-first portfolio tracking, proactive budget and stagnation alerts, natural-language progress logging, full project lifecycle editing, and privacy-safe shareable client progress portals with interactive milestone feedback.

---

## Application Purpose & Core Capabilities

Luna 0.1 replaces scattered spreadsheets and status docs with a single operational workspace that balances internal portfolio visibility for owners with clean, financial-free progress reporting for clients.

### 1. Clean-Slate Portfolio Workspace
- **Empty-by-Default Onboarding**: New workspaces start empty (`initialProjects = []`) with guided quickstart templates and manual project creation (`NewProjectModal` & `OnboardingEmptyState`).
- **Multi-View Exploration**: Switch between **Grid**, **Ledger / Table**, **Milestone Roadmap**, and **Audit Trail** views.
- **Search Highlighting & Sorting**: Live search (`/` shortcut) highlights matching characters across names, descriptions, categories, tags, and milestones (`HighlightedText`), paired with sorting by health score, project value, or target completion date (`ProjectSortDropdown`).

### 2. Full Project Editing & Lifecycle Management
- **Project Detail Modal**: Inspect projects across five dedicated tabs — **Overview & Context**, **Progress & Velocity**, **Financials & ROI**, **Milestones**, and **Audit Trail**.
- **Direct Edit Mode**: Modify project name, description, category, owner, status (`active`, `completed`, `on_hold`, `archived`), stage, progress percentage, health score, start/target dates, project value, realized value, cost to date, tags, tech stack, architecture notes, and key outcomes directly in the modal.
- **Safe Lifecycle Controls**: Archive/restore projects or remove them cleanly via two-step **Delete Project** confirmation. Manual edits automatically append structured `FieldChange` records to the audit trail and update progress snapshots.

### 3. Proactive Budget & Stagnation Monitoring
- **Budget Threshold Warnings (`>80%`)**: Compares `cost_to_date` against `project_value`, surfacing amber alerts above 80% utilization and crimson alerts when over 100% (`monitorProjectBudget`).
- **Stagnation Detection (`>14 days`)**: Analyzes snapshot history and update recency to flag projects whose progress has remained flat for more than 14 days (`checkProjectStagnation`).

### 4. Client Progress Sharing & Milestone Feedback Loop
- **Privacy-Safe Share Links (`?share=<token>`)**: Generates a URL-encoded `ClientSharePayload` containing delivery progress, completion chart history, milestones, timeline, optional architecture/tech stack, and verified outcomes.
- **Strict Financial Isolation**: Internal financials (`cost_to_date`, `project_value`, `realized_value`, `potential_value`, ROI, budget warnings) and internal risk/stagnation flags are never included in share tokens or rendered inside `ClientProgressView`.
- **In-App Preview & Markdown Export**: Preview the client portal embedded inside `ShareProjectModal` or full-screen before sharing, and copy Markdown progress reports (including milestone comments).
- **Milestone Comments & Client Approvals**: Clients viewing a shared link can post **Feedback**, **Approve**, or **Question** notes on specific milestones.
- **Client Feedback Inbox & Alerts**: Unread client milestone notes appear in the header **Feedback** inbox popover and as quiet note counters on project cards, deep-linking directly to the target project's **Milestones** tab for team replies.

### 5. Conversational Luna Dock (AI + Heuristic Fallback)
- Log natural-language updates (e.g., progress percentages, cost/value changes, new milestones, or client signals) through the bottom **Luna Dock**.
- Uses server-side `@google/genai` when `GEMINI_API_KEY` is configured and gracefully falls back to deterministic local parsing heuristics when running without an API key.

---

## Local Storage & Data Persistence

Luna 0.1 is designed as a **local-first workspace** that stores portfolio records directly in browser `localStorage` with no database setup or user login required.

### Browser `localStorage` Keys

| Key | Purpose | Lifecycle / Notes |
| --- | --- | --- |
| `luna_data_version` | Schema/seed version marker (`v7_clean_slate_client_share`) | Triggers clean initialization on first load or version migration. |
| `luna_projects` | Serialized array of `Project` objects (metadata, financials, milestones, outcomes) | Synced automatically whenever projects are created, edited, or deleted. |
| `luna_snapshots` | Historical `ProjectSnapshot` entries used for growth charts and 14-day stagnation detection | Appended on project creation, milestone toggles, Luna updates, and manual edits; pruned on delete. |
| `luna_update_records` | Conversational and manual edit `ProjectUpdateRecord` audit trail entries | Persisted across sessions; pruned on project delete or **Clear All**. |
| `luna_insights` | Generated `LunaInsight` portfolio recommendations | Updated on manual insight refresh; cleared on **Clear All**. |
| `luna_read_client_comment_ids_v1` | Array of client `MilestoneComment` IDs marked as read by the owner (bounded to latest 1,000 IDs) | Drives the header **Feedback** inbox unread counter and card unread indicators. |
| `luna_milestone_comments_v1_<projectId>` | Per-project cache and offline fallback for milestone comments | Synchronizes with server comments when online and persists comments locally if offline; removed when deleting a project. |
| `luna_client_author_name_v1` | Remembers the client reviewer's display name across milestones in `ClientProgressView` | Client-side convenience preference only. |

### Clearing & Cross-Browser Sharing Notes
- **Workspace Reset**: Clicking **Clear All** in the header (with two-step confirmation) clears all projects, snapshots, audit records, insights, and unread feedback tracking.
- **Shared Link Snapshot Behavior**: Because portfolio projects live in your browser's `localStorage`, `?share=...` URLs carry a self-contained sanitized snapshot so clients on other browsers/devices can view progress immediately. Milestone comments posted through the portal are persisted to `.data/milestone-comments.json` via the Express API (and cached in `localStorage`) so comments sync between client links and the owner workspace.

---

## Technical Stack

### Frontend
- **React 19** (`react`, `react-dom`) with **TypeScript (~5.8)**
- **Vite 6** (`vite`, `@vitejs/plugin-react`) for development bundling and production builds
- **Tailwind CSS v4** (`tailwindcss`, `@tailwindcss/vite`)
- **Recharts** (`recharts`) for portfolio trajectory and client completion area charts
- **Lucide React** (`lucide-react`), **Motion** (`motion`), and **Canvas Confetti** (`canvas-confetti`)

### Backend & Tooling
- **Express 4** (`express`) + **tsx** (`tsx`) serving both `/api/*` endpoints and Vite middleware on port `3000`
- **Google GenAI SDK** (`@google/genai`) for optional server-side natural-language parsing, insights, and portfolio Q&A
- **esbuild** (`esbuild`) for bundling `server.ts` into `dist/server.cjs` for production deployment
- **dotenv** (`dotenv`) for loading `.env` runtime configuration

### Server API Endpoints (`server.ts`)
- `GET /api/health` — Server readiness check and Gemini key availability flag
- `POST /api/luna/parse-update` — Natural-language project update parser (Gemini + heuristic fallback)
- `POST /api/luna/generate-insights` — Proactive portfolio insights generator
- `POST /api/luna/ask-query` — Portfolio Q&A over projects, snapshots, and audit records
- `POST /api/luna/create-project` — Structured project creation from a natural-language prompt
- `GET /api/projects/:projectId/milestone-comments` — Fetch persisted milestone comments for a project
- `POST /api/projects/:projectId/milestone-comments` — Validate and persist client/owner milestone comments
- `DELETE /api/projects/:projectId/milestone-comments/:commentId` — Remove a milestone comment

---

## Running the Project

### Prerequisites
- **Node.js 18+** (or **Bun**)
- **npm** (or `bun`)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Available environment variables:
- `GEMINI_API_KEY` *(optional)* — Enables Gemini-powered natural-language parsing and portfolio Q&A in `/api/luna/*`. Without it, built-in heuristic fallbacks handle updates and insights automatically.
- `APP_URL` *(optional)* — Public base URL where the app is hosted.
- `DISABLE_HMR` *(optional)* — Set to `"true"` to disable Vite HMR and file watching when running in managed preview environments.

### 3. Start the Development Server
Starts the Express server with Vite middleware on **http://localhost:3000**:
```bash
npm run dev
```

### 4. Type-Check, Build & Run in Production
```bash
# Run TypeScript type checks
npm run lint

# Build client bundle (dist/) and server bundle (dist/server.cjs)
npm run build

# Start production server on port 3000
npm start
```

### 5. Clean Build Artifacts
```bash
npm run clean
```
