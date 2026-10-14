# DesignBuddy AI

Open-source AI design workspace and agent tooling. This repository contains a web application, an Electron desktop shell, API domain modules, generation utilities, retrieval components, and a preview runtime.

## Main areas

- `apps/web` — React + Vite application shell, shared API transport, and Web renderer; it is also the renderer loaded by Electron.
- `frontend/workspace` — workspace pages and components, workspace API adapters, routes, Zustand stores, project utilities, and workspace models used by the Web and desktop renderer.
- `apps/desktop` — Electron desktop entry point.
- `apps/api` — authentication, user, OAuth, and collaboration modules.
- `server/generator` — prompt analysis, project scaffolding, source validation, and preview adapters.
- `server/rag` — embeddings and vector retrieval.
- `server/preview-api`, `server/preview-engine`, `server/preview-worker` — preview-session API and runtime components.

## Current user workflows

- Homepage requests create a local project immediately and then start an AI first pass. If the API is unavailable, the local starter project remains editable and the editor reports the generation error.
- The editor can apply the full `design-systems/catalog.json` token set, export HTML/PDF/ZIP, and create a read-only share link that can be imported as a separate local copy.
- Studio sends web, slide, vector-poster, and video-storyboard briefs through the configured AI provider; generated artifacts remain editable and can be exported to HTML/PPTX/PDF/Markdown, SVG/PNG, or WebM/MP4.
- Text attachments (`txt`, `md`, `json`, `html`, `css`, `js`, `csv`, `xml`, `yaml`) are read in the browser and included in the generation prompt, with per-file size limits. Other formats are not parsed yet.
- Experts and skills selected from the workspace are carried into the next generation request. Custom experts, skills, connectors, and saved catalog assets persist in browser storage.
- The “仅本地” task policy skips hosted AI generation; the editor can still hand a prompt to a local coding-agent CLI. Browser-only review notes and share-by-copy work without a server. The local daemon adds SQLite-backed member roles, live comments/presence, and shared project sync; hosted multi-user use requires a real identity provider and shared database/broker.

## Important integration requirements

- Authentication requires a configured password-hash verifier and access-token issuer; do not use plaintext passwords.
- GitHub OAuth requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- High-quality semantic search requires a real embedding provider. The deterministic local embedding fallback is for development and lexical retrieval, not a replacement for a trained semantic model.
- Preview building and deployment require configured runtime/deployer adapters. The app must not report a deployment as ready unless a real runtime has returned a valid URL.
- The admin console and Agent Builder expose callback interfaces; connect them to authenticated backend APIs before using them in production.
- The desktop app loads a development URL only when `DESIGNBUDDY_DEV_SERVER_URL` is configured for an unpackaged build; packaged builds load the bundled web renderer.

## Project generation and cloud sync API

The editor calls same-origin `POST /api/generation` for AI-assisted HTML/CSS/JavaScript generation and `POST /api/projects` to save a project. `createProjectRepository()` selects SQLite by default (`DESIGNBUDDY_STORAGE=sqlite`, path `DESIGNBUDDY_SQLITE_PATH`) or the JSON file repository (`DESIGNBUDDY_STORAGE=file`, path `DESIGNBUDDY_PROJECT_STORE_PATH`). SQLite mode requires Node 22.5 or newer. The handler and repositories live in `server/api/http-handler.ts` and `server/api/`.

These modules are server-side building blocks, not a hosted API by themselves. The deployment must mount `createApiHandler(...)`, provide a real session authenticator, and configure durable storage. Configure `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` on the server, or choose a supported provider in the editor and enter a BYOK key. BYOK credentials stay in the current browser session and are sent only with generation requests; the server maps provider IDs to fixed OpenAI-compatible endpoints and does not save keys. `POST /api/proxy/:provider/stream` also exposes an authenticated SSE relay for those providers. Never put provider secrets in frontend/Vite build variables. The homepage model selector can override the model identifier, but the selected model must be served by the configured provider or compatible gateway. The web client defaults to same-origin `/api`; set `VITE_API_BASE_URL` at web build time to use a separately hosted backend (the client appends `/api`). For a cross-origin backend, configure exact credentialed CORS and secure session cookies. GitHub Pages serves static files only, so its preview deployment alone does not activate AI generation or cloud sync.

## MCP and collaboration endpoints

- `POST /api/mcp` implements MCP `2026-07-28` stateless discovery/tool calls plus `2025-03-26` initialize compatibility for owner-scoped project list/read/create/delete. `pnpm mcp:stdio` bridges local stdio clients; `pnpm mcp:install claude|cursor|gemini|claude-desktop|opencode|vscode` installs the bridge in supported agent configs (`--print` previews, `--uninstall` removes). Set `DESIGNBUDDY_LOCAL_TOKEN` before installing so the bridge can authenticate to the local daemon. Restart the agent after installation.
- `GET /api/projects/:id/collaboration/events` streams presence, cursor, comment, and document events over SSE; `POST /api/projects/:id/collaboration` publishes an event. `createLocalPersistence()` supplies SQLite project storage, member roles (`viewer`/`editor`), and event history. Project owners manage access with `GET/POST/DELETE /api/projects/:id/members`; add an authenticated account's user ID. Viewers can read, comment, and publish presence/cursor events; editors can also save project source. SSE clients poll the shared SQLite event table, so API processes using the same database file can share events. For multiple hosts, use a shared broker/database deployment.
- `POST /api/video/transcode` accepts WebM up to 100 MB and returns H.264 MP4 through FFmpeg. Set `FFMPEG_PATH` if the binary is not on `PATH`; isolate this endpoint in a worker/container for production workloads.

Run the local SQLite-backed daemon with `pnpm --filter designbuddy-web build` followed by `pnpm local:daemon`; it serves the built renderer and API on `127.0.0.1:8787`. Configure `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, and `FFMPEG_PATH` in the daemon environment as needed. The local agent runner supports installed Codex CLI, Claude Code, OpenCode, Gemini CLI, or Cursor Agent; it runs only after the editor's explicit “交给本机 agent 修改” action and stores a managed working copy under `data/agent-projects`. For stdio MCP clients, set `DESIGNBUDDY_LOCAL_TOKEN` to a secret you control and set `DESIGNBUDDY_MCP_TOKEN` to the same value when launching `pnpm mcp:stdio`.

The project editor also supports client-side ZIP export without a third-party ZIP dependency.

## Development

Use the package manager and scripts defined in the workspace manifests. Install with `pnpm install --frozen-lockfile`; start the web preview with `pnpm --filter designbuddy-web dev`. Configure credentials through environment variables and local environment files; never commit secrets or production tokens.

Before deployment, install dependencies, run each workspace's build and tests, configure external providers, and review authorization, persistence, and runtime isolation.
