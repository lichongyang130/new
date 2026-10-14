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

## Homepage reference and regression checks

The homepage follows the supplied `1.png` reference (1024 × 797): a 239 px
sidebar, office mode selected by default, scene carousel, and 725 px composer.
The decorative buddy and top rewards promotion were removed on request. Task counts reflect local projects rather than the sample count
in the screenshot. Cropped decorative assets are documented in
`apps/web/src/assets/README.md`; no screenshot is used as the page background.

Run the browser regression checks after installing dependencies:

```sh
pnpm --filter designbuddy-web exec playwright install chromium
pnpm --filter designbuddy-web test:home
```

The suite starts Vite automatically and covers desktop geometry, keyboard mode
switching, scene scrolling, model selection/dismissal, text attachments, Chinese
IME handling, local-only project creation, and overflow at 320–1440 px. The host
needs Chromium system libraries and a Chinese font for visual review. In managed
environments, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can point to an existing
Chromium installation. Hosted AI generation is not exercised by these UI checks.

## Expert marketplace reference

`/experts` follows `2.png`: the WorkBuddy sidebar, compact top navigation and
search, horizontally scrollable themed collections, category and sort controls,
and a three-column expert directory. At smaller widths the directory collapses
to two or one columns without horizontal page overflow. The homepage and expert
page share `WorkBuddySidebar`; the skill and connector markets also share this
navigation, with their reference layouts described below.

- Search matches expert names, descriptions, categories and tags.
- “我的专家” shows only locally created experts, with creation, persistence and
  detail screens. Selecting an expert or team carries its role into a new task.
- The reference avatars, names and popularity values are demonstration catalog
  content, not official integrations, endorsements or live usage analytics.
  “最热” sorts those static values; “最新” sorts custom experts by creation time
  and leaves built-ins in their catalog order.
- Run `pnpm --filter designbuddy-web test:experts` for expert-page checks, or
  `pnpm --filter designbuddy-web test:ui` for the full homepage + expert + skill + connector suite.

## Skill marketplace reference

`/skills` follows the supplied `7.png` cards and adds the shared left navigation
on request. The main area has a compact navigation/search/install toolbar, three featured cards, recommendation/suite
tabs, category filters, and a three-column directory. Layout responds to the remaining content width beside the sidebar: featured
cards scroll horizontally on narrow screens and the directory becomes two or
one columns. On phones the shared navigation moves above the content.

- “换一批” cycles featured presets. Search and category filters match the local
  catalog and custom skills.
- Card “＋” buttons save skill definitions into the persisted workspace store.
  `/skills/installed` shows the real locally saved count (not the screenshot's
  sample count of 10); repeated and overlapping suite installations are
  deduplicated by ID. Skill details allow removal and task handoff.
- `/skills/create` creates custom skill definitions with a category and task
  instructions. Custom deletion requires confirmation.
- “Install” only saves local task presets: it does not download executables,
  run plugins, provision third-party APIs, or implement document conversion.
  External-service requirements are explained on each applicable detail page.
  The two zero counters reproduce reference placeholders, not live analytics.
- Run `pnpm --filter designbuddy-web test:skills` for skill layout, search,
  categories, refresh, persistence, suite deduplication, custom creation/deletion,
  task handoff, integration disclosures and responsive-layout checks.

## Connector marketplace reference

`/connectors` follows the supplied `8.png`: the shared left navigation, compact
market navigation/search/custom-connector toolbar, and three columns of 92 px
connector cards. Cards collapse to two or one columns according to the remaining
content width. The original GitHub, Notion, Figma, database and cloud entries
remain available alongside the reference catalog.

- Search filters names and descriptions; card/add controls open the matching
  configuration and integration-requirements screen. Catalog descriptions and
  branding are reference examples, not assertions of working integrations.
- GitHub and Notion retain the existing backend OAuth-start contract. Redirects
  accept only their expected HTTPS authorization endpoints. Authorization failure
  never creates a connected state; an OAuth callback triggers server verification
  rather than trusting URL query parameters.
- Connection status is verified through `GET /api/connectors`; disconnect uses
  the existing server endpoint. The response is validated and only public metadata
  is persisted, excluding arbitrary response fields such as tokens. These APIs
  still require a deployed/authenticated implementation. OAuth tests mock both
  the backend and provider; they do not establish real external authorizations.
- `/connectors/create` saves local custom MCP endpoint metadata (name, description,
  HTTPS URL and transport). It does not contact the service or install an MCP
  runtime. URLs containing credentials, query parameters or fragments are rejected;
  secrets are not collected. Saved custom configurations support confirmed deletion.
- Run `pnpm --filter designbuddy-web test:connectors` for connector-specific
  layout, search, custom-config persistence, OAuth/error/status verification and
  responsive regression checks.

## Task conversation reference

Submitting a homepage task now opens `/tasks/:id`, following `4.png`: shared left
navigation, a compact title bar, right-aligned question bubbles, WorkBuddy replies
with Markdown, a collapsible progress row, reply actions, and a fixed bottom
composer. There is no floating robot or promotional reward banner. The project
editor remains available from the title bar and generated-file cards.

- Office tasks use authenticated `POST /api/chat` and display actual SSE content
  as it arrives. Code/design tasks still use project generation and save generated
  files before offering the editor. Conversation state is stored in this browser,
  not synchronized across accounts or devices.
- The progress row shows request/response status and measured elapsed time, not
  private model reasoning. “深度思考” is reference UI wording, not a guarantee that
  the selected provider exposes or enables a special reasoning mode. Answers,
  duration and returned model metadata are not hard-coded from the screenshot.
- Stop aborts the request and retains partial content. Retry replaces the latest
  reply without duplicating its question. Refresh preserves completed replies and
  marks interrupted requests as stopped instead of silently restarting them.
  “仅本地” never sends an AI request; confirmation mode asks before each request.
- Reply controls support clipboard copying, local feedback, browser speech,
  shareable text and Markdown export. Search and task history work locally.
  Attachments support bounded text files only; microphone input is explicitly
  marked as not connected. Markdown does not execute raw HTML or load remote images.
- The chat endpoint requires the existing authenticated API deployment and an
  OpenAI-compatible streaming provider configured with `AI_API_KEY` (or
  `OPENAI_API_KEY`), optionally `AI_BASE_URL` and `AI_MODEL`. The AI settings panel
  can also supply a session-only key for a supported provider at its fixed endpoint.
  No provider key is saved in conversation storage. Static hosting / Vite alone
  cannot supply AI replies; missing configuration is shown as an error, not a
  simulated answer. Real external-provider connectivity has not been verified here.
- Run `pnpm --filter designbuddy-web test:conversation` for conversational UI
  regressions, `pnpm --filter designbuddy-web test:ui` for all reference pages, and
  `pnpm test:chat` for server validation, authentication, provider selection,
  streaming and cancellation checks. These tests mock the AI provider.

## Sidebar account popover

Clicking the shared sidebar's avatar or username opens the account popover from
`截屏2026-10-14 16.35.22.png`: masked identity, plan/credits card, promotional
entries, settings, appearance, memory, feedback, updates and sign-out. The
316 px popover is anchored above the desktop profile; it fits and scrolls within
small viewports. The profile remains accessible in compact mobile navigation.
Outside clicks, focus moving outside, Escape, arrow keys and Home/End are supported.

- The existing reference identity and “体验版” label are display placeholders,
  not authenticated account/subscription records. Credit balance is `—`, not
  the screenshot's sample balance, and purchasing is disabled.
- Unconnected account, rewards, billing, theme, memory, update and sign-out
  services show explicit explanations. They do not fabricate success, send
  billing requests, or clear local projects/conversations.
- Settings opens the existing session-only AI provider controls; feedback links
  to this repository's issues page without sending conversation data.
- Run `pnpm --filter designbuddy-web test:account` for popover layout, dismissal,
  keyboard access, settings, shared navigation and small-viewport regression tests.

## Revised primary navigation

The shared sidebar is branded **DesignBuddy**. Its primary entries are now
首页 → 插件 → 模版 → 定时任务 → 更多. Home returns to `/` without clearing an
unsent prompt. Plugins opens `/plugins` using the existing official plugin
catalog; 模版 opens `/inspiration`, the template-based 灵感 page with search and
preview details. Both destinations retain the shared sidebar. `/library` keeps
its original multi-tab asset workbench.

Hovering 更多 opens a right-side flyout with 专家, 技能 and 连接器 on separate
rows. A short hover grace period lets the pointer cross into the flyout. Click/
touch, keyboard navigation, Escape and outside dismissal also work; small-screen
menus stay inside the viewport. Projects remain reachable through the task list
and the top sidebar utilities. Scheduled execution is still not connected and
its entry explains that limitation rather than creating a fake scheduled job.
Run `pnpm --filter designbuddy-web test:sidebar` for these navigation regressions.

## Redesigned plugin marketplace

`/plugins` now uses its own `PluginsPage.tsx` / `plugins.css` rather than the
asset library's generic color-strip cards. The DesignBuddy sidebar is retained.
The light editorial layout includes a green design-tools feature, a personal
toolbox feature, category-colored icons and a responsive three/two-column grid.

- **精选发现** curates 12 existing capabilities; **全部插件** retains all 480
  catalog definitions with Chinese category filters, case-insensitive search,
  name sorting and 24-item pagination. **我的清单** filters saved plugins from
  the existing `designbuddy.workspace.v1` store, so previous saves are retained.
- Search supports Cmd/Ctrl K, clearing and helpful empty states. Feature links
  open the relevant category or saved list instead of being decorative buttons.
- The native detail dialog displays the real catalog version, permission codes,
  risk label and adapter requirement. Escape/backdrop dismissal, focus trapping,
  focus restoration and small-screen scrolling are supported.
- Saving/removing a definition never installs software, grants permissions or
  executes a plugin. There are no fabricated popularity/download counts. The
  adapter requirement is explicitly disclosed. Storage errors roll back the
  in-memory save and show a failure message; these are local browser bookmarks,
  not account-synchronized installations.
- `/library` remains the separate multi-asset catalog. The detail dialog can
  navigate to the existing connector page without implying an account is linked.
- Run `pnpm --filter designbuddy-web test:plugins` for layout, filtering,
  pagination, persistence, permission disclosure, modal keyboard behavior,
  storage failure and 320–1440 px regressions.

## Community: four native work formats

`/inspiration` retains the supplied community reference's category pills,
three-column previews and DesignBuddy sidebar. The previous 21-case / 24-screen
universal workbench has been removed: changing a category must change the actual
work format, not just the website's colors and labels. The collection now contains
**eight complete samples (two per format, 160 pages/artboards)**; video, audio and 3D are not advertised until real outputs
exist. The separate 130-item asset specification catalog remains at `/library`.

| Route | Actual format | Scope and operations |
| --- | --- | --- |
| `/inspiration/travel` | Travel booking website prototype | 20 linked business pages: search, destinations, attractions, stays, rooms, dates, itinerary, travelers, confirmation, simulated payment, orders, favorites, guide and consultation. No real reservations, payments or messages. |
| `/inspiration/luma` | 16:9 presentation | 20 SVG slides from a shared scene description, thumbnail and keyboard navigation, viewport presentation mode (Escape exits), title/body editing, per-slide notes. PPTX export preserves editable text/shapes and embedded JPEG pictures with source credits in notes—not flattened slide screenshots. |
| `/inspiration/research` | Paginated A4 methods report | 20 substantive sections/pages, directory navigation/search, paginated or continuous display, zoom, title/paragraph editing and local comments. Download structured JSON or use browser Print / Save as PDF. The print button detects overflowing edited pages and asks for shorter text rather than silently truncating them. No DOCX export is claimed. |
| `/inspiration/chishan` | Brand artwork collection | 20 separately composed SVG artboards: posters, menu, logo, packaging label, invitation, story, collage, sleeve, event, tasting card, palette, signage, thanks card, postcard and more. Native-size view, fit, pan/zoom, captions, accent color and favorites. Download embedded-image editable SVG, native-pixel PNG, or a ZIP of all 20 SVGs and photo credits. |
| `/inspiration/museum` | City museum booking prototype | 20 business pages with exhibition search/filtering, linked collection notes, curatorial stories, program calendar, ticket types, dates/time slots, visitor form, explicit simulation confirmation, immutable latest-reservation snapshot, demo pass, rescheduling/cancellation, favorites and local consultation. Reference photography is not presented as the actual venue; no real admission credentials, payment or activity registration. |
| `/inspiration/city` | WALK city-walking proposal | 20 new editorial slide compositions: brief, route diagram, time-allocation chart, accessibility matrix, recording cards, contingency plan and run-of-show. Independent blue/coral visual language, content and photography; reuses only the presentation player and editable-PPTX exporter. |
| `/inspiration/handbook` | Before You Go travel handbook | 20 practical A4 chapters with planning tables, checklists, writing spaces and source notes. Independent warm editorial page renderer; reuses document navigation, editing, annotations, overflow detection and printing. Advice is general; prices, policies and schedules must be checked against official sources. |
| `/inspiration/nature` | Field Letters nature photography posters | 20 new SVG compositions: photo posters, observation cards, book cover, banner, postcard, bookmark, seasonal foldout, palette, invitation and blank calendar. Independent images/compositions; reuses canvas controls and SVG/PNG/ZIP export. |

- Community thumbnails render the actual first website section, slide, document
  page or artboard, rather than unrelated marketing covers.
- The samples use **44 distinct real photographs**: nine for travel and five per
  other sample, with **no cross-sample reuse**. Images are distributed according
  to the work's content, not padded onto every page. Files, sources, credits and
  per-photo license evidence are in `apps/web/src/assets/inspiration/` and
  `apps/web/src/assets/samples/` and `apps/web/src/assets/expansion/`. Credits are visible inside every sample and
  retained in relevant exports. No remote placeholder-image service is used.
- All brands, reservations, prices, events and product claims are demonstrations.
  The report explains observation methods using open images, not new experiments,
  clinical findings or medical advice. Its chart values are explicitly illustrative.
- **做同款** creates an independent same-format local copy at
  `/inspiration/:sample/draft/:uuid`, accessible from 我的副本. It does not turn a
  presentation or artwork into an HTML website. State is validated on load;
  malformed storage is discarded field-by-field. Copies and edits remain local
  to this browser, not synchronized to an account or collaborative backend.
  Storage failures show an export recommendation. Keep exports as backups.
- Fixed-layout artwork/PPT text may shrink to fit. SVG/PPTX text remains editable
  and uses installed fonts (Office may substitute fonts); PNG is a raster image.
  Presentation mode fills the app viewport, not the browser's Fullscreen API.
  Browser printing supports the report's fixed A4 pagination; unusually long
  edited sections should be shortened before sharing.
- `pnpm --filter designbuddy-web test:inspiration` checks the four distinct
  media formats and all 160 pages/artboards, both complete booking flows, notes/edits,
  actual PPTX/SVG/PNG/ZIP contents, two 20-page PDFs, copy isolation, photo-set
  separation, corrupted storage, retired routes and 320–1440 px layouts.

The existing project editor's **交互模式** remains available for HTML projects.
The default element-selection mode is preserved; interaction mode removes the
selection click interceptor without changing sandbox permissions. The eight
samples have their own type-specific editors and do not use that HTML sandbox.

For meaningful Chinese visual/overflow tests on a minimal Linux runner, install a CJK font (for example Noto Sans SC) before launching Chromium. Fonts in SVG/PPTX remain text, not outlined glyphs.

## Homepage design concepts

Static homepage explorations are archived in [docs/design/homepage](docs/design/homepage/README.md): five initial directions and fifteen minimalist conversation-home concepts, with original PNGs and numbered PDF collections. These are design references only; they have not replaced the implemented homepage.
