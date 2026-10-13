# DesignBuddy AI

Open-source AI design workspace and agent tooling. This repository contains a web application, an Electron desktop shell, API domain modules, generation utilities, retrieval components, and a preview runtime.

## Main areas

- `apps/web` — React-based web workspace and UI components.
- `apps/desktop` — Electron desktop entry point.
- `apps/api` — authentication, user, OAuth, and collaboration modules.
- `server/generator` — prompt analysis, project scaffolding, source validation, and preview adapters.
- `server/rag` — embeddings and vector retrieval.
- `server/preview-api`, `server/preview-engine`, `server/preview-worker` — preview-session API and runtime components.

## Current user workflows

- Homepage requests create a local project immediately and then start an AI first pass. If the API is unavailable, the local starter project remains editable and the editor reports the generation error.
- The editor can apply the full `design-systems/catalog.json` token set, export HTML/PDF/ZIP, and create a read-only share link that can be imported as a separate local copy.
- Text attachments (`txt`, `md`, `json`, `html`, `css`, `js`, `csv`, `xml`, `yaml`) are read in the browser and included in the generation prompt, with per-file size limits. Other formats are not parsed yet.
- Experts and skills selected from the workspace are carried into the next generation request. Custom experts, skills, connectors, and saved catalog assets persist in browser storage.
- The “仅本地” task policy skips AI network generation. Review notes and shared project copies remain browser/local workflows; real multi-user presence and shared comment threads require a deployed collaboration backend.

## Important integration requirements

- Authentication requires a configured password-hash verifier and access-token issuer; do not use plaintext passwords.
- GitHub OAuth requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- High-quality semantic search requires a real embedding provider. The deterministic local embedding fallback is for development and lexical retrieval, not a replacement for a trained semantic model.
- Preview building and deployment require configured runtime/deployer adapters. The app must not report a deployment as ready unless a real runtime has returned a valid URL.
- The admin console and Agent Builder expose callback interfaces; connect them to authenticated backend APIs before using them in production.
- The desktop app loads a development URL only when `DESIGNBUDDY_DEV_SERVER_URL` is configured for an unpackaged build; packaged builds load the bundled web renderer.

## Project generation and cloud sync API

The editor calls same-origin `POST /api/generation` for AI-assisted HTML/CSS/JavaScript generation and `POST /api/projects` to save a project. The request handler and file-backed repository live in `server/api/http-handler.ts` and `server/api/file-project-repository.ts`.

These modules are server-side building blocks, not a hosted API by themselves. The deployment must mount `createApiHandler(...)` at `/api`, provide a real session authenticator, and configure a persistent writable volume for `DESIGNBUDDY_PROJECT_STORE_PATH`. Configure `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` on the server; never put provider secrets in frontend/Vite variables. The homepage model selector can override the model identifier, but the selected model must be served by the configured provider or compatible gateway. The web client defaults to same-origin `/api`; set `VITE_API_BASE_URL` at web build time to use a separately hosted backend (the client appends `/api`). For a cross-origin backend, configure exact credentialed CORS and secure session cookies. GitHub Pages serves static files only, so its preview deployment alone does not activate AI generation or cloud sync.

The project editor also supports client-side ZIP export without a third-party ZIP dependency.

## Development

Use the package manager and scripts defined in the workspace manifests. Install with `pnpm install --frozen-lockfile`; start the web preview with `pnpm --filter designbuddy-web dev`. Configure credentials through environment variables and local environment files; never commit secrets or production tokens.

Before deployment, install dependencies, run each workspace's build and tests, configure external providers, and review authorization, persistence, and runtime isolation.
