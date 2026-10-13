# DesignBuddy AI

Open-source AI design workspace and agent tooling. This repository contains a web application, an Electron desktop shell, API domain modules, generation utilities, retrieval components, and a preview runtime.

## Main areas

- `apps/web` — React-based web workspace and UI components.
- `apps/desktop` — Electron desktop entry point.
- `apps/api` — authentication, user, OAuth, and collaboration modules.
- `server/generator` — prompt analysis, project scaffolding, source validation, and preview adapters.
- `server/rag` — embeddings and vector retrieval.
- `server/preview-api`, `server/preview-engine`, `server/preview-worker` — preview-session API and runtime components.

## Important integration requirements

- Authentication requires a configured password-hash verifier and access-token issuer; do not use plaintext passwords.
- GitHub OAuth requires `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- High-quality semantic search requires a real embedding provider. The deterministic local embedding fallback is for development and lexical retrieval, not a replacement for a trained semantic model.
- Preview building and deployment require configured runtime/deployer adapters. The app must not report a deployment as ready unless a real runtime has returned a valid URL.
- The admin console and Agent Builder expose callback interfaces; connect them to authenticated backend APIs before using them in production.
- The desktop app loads a development URL only when `DESIGNBUDDY_DEV_SERVER_URL` is configured for an unpackaged build; packaged builds load the bundled web renderer.

## Development

Use the package manager and scripts defined in the workspace manifests. Configure credentials through environment variables and local environment files; never commit secrets or production tokens.

Before deployment, install dependencies, run each workspace's build and tests, configure external providers, and review authorization, persistence, and runtime isolation.
