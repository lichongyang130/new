import { createServer } from "node:http";
import { Readable } from "node:stream";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { createApiHandler } from "./api/http-handler";
import { createLocalPersistence } from "./api/project-repository";

const host = process.env.DESIGNBUDDY_HOST || "127.0.0.1";
if (!new Set(["127.0.0.1", "::1", "localhost"]).has(host)) throw new Error("The local daemon only binds to loopback. Put it behind an authenticated reverse proxy for remote access.");
const port = Number(process.env.DESIGNBUDDY_PORT || 8787);
const rendererRoot = resolve(process.env.DESIGNBUDDY_RENDERER_DIR || "./apps/web/dist");
const localToken = process.env.DESIGNBUDDY_LOCAL_TOKEN || randomBytes(32).toString("base64url");
const { projects, collaborationStore, memberships } = createLocalPersistence();
const mime = new Map([[".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".css", "text/css; charset=utf-8"], [".svg", "image/svg+xml"], [".png", "image/png"], [".ico", "image/x-icon"], [".woff2", "font/woff2"]]);

function cookie(request: Request, name: string): string | undefined {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

const api = createApiHandler({
  projects,
  collaborationStore,
  memberships,
  localAgentWorkspaceRoot: process.env.DESIGNBUDDY_AGENT_WORKSPACE_DIR || "./data/agent-projects",
  authenticate: async (request) => {
    const authorization = request.headers.get("authorization") || "";
    const candidate = cookie(request, "designbuddy_local_session") || (/^Bearer\s+/i.test(authorization) ? authorization.replace(/^Bearer\s+/i, "") : undefined);
    if (!candidate) return null;
    const expected = Buffer.from(localToken);
    const actual = Buffer.from(decodeURIComponent(candidate));
    return expected.length === actual.length && timingSafeEqual(expected, actual) ? { id: "local-user" } : null;
  },
});

createServer(async (incoming, outgoing) => {
  try {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of incoming) {
      const buffer = Buffer.from(chunk);
      bytes += buffer.length;
      if (bytes > 105 * 1024 * 1024) { outgoing.writeHead(413).end("Request too large"); return; }
      chunks.push(buffer);
    }
    const url = new URL(incoming.url || "/", `http://${incoming.headers.host || `${host}:${port}`}`);
    const method = incoming.method || "GET";
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) if (value && !Array.isArray(value)) headers.set(key, value);

    if (url.pathname === "/api/local/session" && method === "POST") {
      const origin = incoming.headers.origin;
      const expectedOrigin = `http://${incoming.headers.host}`;
      if (!origin || origin !== expectedOrigin || incoming.headers["content-type"] !== "application/json") { outgoing.writeHead(403).end("Same-origin JSON request required"); return; }
      outgoing.writeHead(204, { "Set-Cookie": `designbuddy_local_session=${encodeURIComponent(localToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400` }).end();
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      const controller = new AbortController();
      outgoing.once("close", () => controller.abort());
      const request = new Request(url, { method, headers, signal: controller.signal, ...(method === "GET" || method === "HEAD" ? {} : { body: Buffer.concat(chunks), duplex: "half" } as RequestInit) });
      const response = await api(request);
      const responseHeaders = Object.fromEntries(response.headers.entries());
      outgoing.writeHead(response.status, responseHeaders);
      if (response.body) Readable.fromWeb(response.body as import("node:stream/web").ReadableStream).pipe(outgoing);
      else outgoing.end();
      return;
    }

    if (method !== "GET" && method !== "HEAD") { outgoing.writeHead(405).end("Method not allowed"); return; }
    const requested = resolve(rendererRoot, `.${decodeURIComponent(url.pathname)}`);
    const safePath = requested === rendererRoot || requested.startsWith(rendererRoot + sep);
    let file = safePath ? requested : resolve(rendererRoot, "index.html");
    try { if (!(await stat(file)).isFile()) file = resolve(rendererRoot, "index.html"); }
    catch { file = resolve(rendererRoot, "index.html"); }
    const data = await readFile(file);
    outgoing.writeHead(200, { "Content-Type": mime.get(extname(file)) || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    outgoing.end(method === "HEAD" ? undefined : data);
  } catch (error) {
    if (!outgoing.headersSent) outgoing.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    outgoing.end(error instanceof Error ? error.message : "Internal server error");
  }
}).listen(port, host, () => {
  console.log(`DesignBuddy local daemon listening at http://${host}:${port}`);
  console.log(`SQLite project store: ${process.env.DESIGNBUDDY_SQLITE_PATH || "./data/designbuddy.sqlite"}`);
  if (process.env.DESIGNBUDDY_LOCAL_TOKEN) console.log("Local session token is configured through DESIGNBUDDY_LOCAL_TOKEN.");
});
