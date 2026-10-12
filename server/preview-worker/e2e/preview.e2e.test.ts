import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, type Browser } from "playwright";
import { createPreviewService } from "../../preview-api/create-preview-service";
import { createPreviewWorkerServer } from "../src/server";
import type { WorkerConfig } from "../src/types";

const enabled = process.env.PREVIEW_E2E === "1";

async function findAvailablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolvePromise();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
    throw new Error("Unable to allocate a local worker port.");
  }
  const port = address.port;
  await new Promise<void>((resolvePromise, reject) => {
    server.close((error) => error ? reject(error) : resolvePromise());
  });
  return port;
}

function previewProjectFiles() {
  return [
    {
      path: "package.json",
      content: JSON.stringify({
        name: "designbuddy-preview-e2e",
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
          build: "vite build",
          start: "vite preview"
        },
        devDependencies: {
          vite: "^6.0.0"
        }
      })
    },
    {
      path: "index.html",
      content: [
        "<!doctype html>",
        '<html lang="en">',
        "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>Preview E2E</title></head>",
        '<body><main id="app">Loading preview...</main><script type="module" src="/main.js"></script></body>',
        "</html>"
      ].join("")
    },
    {
      path: "main.js",
      content: 'document.querySelector("#app").textContent = "Preview Worker E2E OK";'
    }
  ];
}

test("generated project builds in Docker and executes in a real browser", {
  skip: enabled ? false : "Set PREVIEW_E2E=1 to run the Docker + Chromium end-to-end test.",
  timeout: 600000
}, async (t) => {
  const token = "designbuddy-preview-e2e-token-" + "x".repeat(32);
  const workerId = ("preview-e2e-" + process.pid + "-" + Date.now().toString(36)).slice(0, 64);
  const workspaceRoot = await mkdtemp(join(tmpdir(), "designbuddy-preview-e2e-"));
  const workerPort = await findAvailablePort();
  const origin = "http://127.0.0.1:" + workerPort;
  const config: WorkerConfig = {
    token,
    workerId,
    publicPreviewOrigin: origin,
    workspaceRoot,
    hostPortStart: 42000,
    hostPortEnd: 42049,
    previewBindHost: "127.0.0.1",
    previewUpstreamHost: "127.0.0.1",
    memoryLimit: "512m",
    cpuLimit: "1",
    pidsLimit: 128,
    maxSessions: 2,
    maxFiles: 30,
    maxTotalBytes: 2 * 1024 * 1024,
    startupTimeoutMs: 300000,
    sessionTtlMs: 600000,
    port: workerPort,
    host: "127.0.0.1"
  };

  const worker = createPreviewWorkerServer(config);
  const api = createPreviewService({
    runtimeBaseUrl: origin,
    runtimeToken: token,
    allowedPreviewOrigins: [origin],
    requestTimeoutMs: 15000,
    operationTimeoutMs: 480000
  });

  const actor = { id: "preview-e2e-user" };
  let sessionId: string | undefined;
  let browser: Browser | undefined;

  t.after(async () => {
    await browser?.close().catch(() => undefined);
    if (sessionId) {
      await api.controller.stop(actor, sessionId).catch(() => undefined);
    }
    await worker.close().catch(() => undefined);
    await worker.manager.stopAll().catch(() => undefined);
    await worker.manager.cleanupOrphans().catch(() => undefined);
    await rm(workspaceRoot, { recursive: true, force: true }).catch(() => undefined);
  });

  // Exercise both the unauthenticated API denial and the actual API controller.
  const denied = await api.controller.create(undefined, {
    projectId: "e2e-project",
    framework: "react-vite",
    files: previewProjectFiles()
  });
  assert.equal(denied.status, 401, "Preview API must reject unauthenticated creation");

  await worker.manager.cleanupOrphans();
  await worker.listen();

  const created = await api.controller.create(actor, {
    projectId: "e2e-project",
    framework: "react-vite",
    files: previewProjectFiles()
  });
  assert.equal(created.status, 201, "API should create the preview session: " + JSON.stringify(created.body));

  const body = created.body as { session?: { id?: string; status?: string; previewUrl?: string } };
  assert.equal(typeof body.session?.id, "string");
  sessionId = body.session?.id;
  assert.equal(body.session?.status, "ready");

  const previewUrl = body.session?.previewUrl;
  assert.equal(typeof previewUrl, "string");
  assert.ok(previewUrl?.startsWith(origin + "/p/"), "Preview URL should be allocated by the worker");

  // Use Chromium rather than checking only the HTTP status: the generated page
  // must load its bundled JavaScript and update the DOM without a page error.
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });
  const page = await browser.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(previewUrl!, { waitUntil: "networkidle", timeout: 45000 });
  assert.equal(response?.status(), 200, "Preview page should respond successfully");
  await page.waitForFunction(
    () => document.querySelector("#app")?.textContent === "Preview Worker E2E OK",
    undefined,
    { timeout: 15000 }
  );
  assert.deepEqual(pageErrors, [], "Generated preview should execute without uncaught browser errors");

  const health = await api.controller.health(actor, sessionId!);
  assert.equal(health.status, 200, "API health check should reach the worker");
  const healthBody = health.body as { health?: { healthy?: boolean } };
  assert.equal(healthBody.health?.healthy, true);
});
