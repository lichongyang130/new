import type { DesignProject, ProjectFile } from "../models/project";
import { PROJECT_STORAGE_KEY } from "../models/project";

const starterFiles: ProjectFile[] = [
  {
    path: "index.html",
    language: "html",
    content: `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DesignBuddy Starter</title>
  <link rel="stylesheet" href="./src/styles.css">
</head>
<body>
  <main class="page-shell">
    <nav class="top-nav"><span class="brand">STUDIO<span> / DESIGNBUDDY</span></span><a href="#contact">联系我们</a></nav>
    <section class="hero">
      <p class="eyebrow">YOUR NEXT IDEA STARTS HERE</p>
      <h1>把一个想法，<br><span>变成真正的作品。</span></h1>
      <p class="intro">这是你的项目起点。编辑源码、调整样式，并在右侧实时预览每次变化。</p>
      <a class="primary-link" href="#features">探索设计 <span>↗</span></a>
    </section>
    <section class="feature-grid" id="features">
      <article><span class="number">01</span><h2>清晰的结构</h2><p>用简单、易读的页面结构组织内容。</p></article>
      <article><span class="number">02</span><h2>灵活的样式</h2><p>调整颜色、留白与排版，打造自己的视觉语言。</p></article>
      <article><span class="number">03</span><h2>实时反馈</h2><p>保存源码后即可在预览面板检查效果。</p></article>
    </section>
    <footer id="contact">MADE WITH DESIGNBUDDY <span>从草稿开始，不断打磨。</span></footer>
  </main>
  <script src="./src/main.js"></script>
</body>
</html>`
  },
  {
    path: "src/styles.css",
    language: "css",
    content: `:root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; color: #1c2434; background: #f6f5f1; font-synthesis: none; text-rendering: optimizeLegibility; }
* { box-sizing: border-box; }
body { margin: 0; }
a { color: inherit; text-decoration: none; }
.page-shell { width: min(1120px, calc(100% - 48px)); margin: auto; }
.top-nav { height: 82px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dcdedb; font-size: 13px; }
.brand { font-weight: 800; letter-spacing: .12em; } .brand span { color: #81877f; font-weight: 500; font-size: 10px; }
.top-nav a { padding: 10px 14px; border: 1px solid #d5d8d2; border-radius: 999px; }
.hero { padding: clamp(72px, 12vw, 140px) 0 90px; max-width: 790px; }
.eyebrow, .number { font-size: 11px; color: #60795f; letter-spacing: .16em; font-weight: 700; }
h1 { font-size: clamp(42px, 7vw, 78px); line-height: 1.08; letter-spacing: -.065em; margin: 20px 0 25px; }
h1 span { color: #758b6f; }
.intro { font-size: 16px; line-height: 1.9; color: #697269; max-width: 520px; }
.primary-link { display: inline-flex; gap: 22px; align-items: center; margin-top: 22px; padding: 14px 20px; color: white; background: #26372e; border-radius: 999px; font-size: 13px; }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid #dcdedb; border-bottom: 1px solid #dcdedb; }
.feature-grid article { padding: 28px 24px 34px 0; } .feature-grid article + article { padding-left: 24px; border-left: 1px solid #dcdedb; }
.feature-grid h2 { font-size: 18px; margin: 28px 0 10px; } .feature-grid p { color: #697269; font-size: 13px; line-height: 1.8; }
footer { display: flex; justify-content: space-between; gap: 16px; padding: 26px 0 36px; font-size: 10px; color: #788077; letter-spacing: .1em; }
@media (max-width: 640px) { .page-shell { width: calc(100% - 32px); } .feature-grid { grid-template-columns: 1fr; } .feature-grid article, .feature-grid article + article { padding: 20px 0; border-left: 0; } .hero { padding: 70px 0 60px; } footer { flex-direction: column; } }`
  },
  {
    path: "src/main.js",
    language: "javascript",
    content: `document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});`
  }
];

function readProjects(): DesignProject[] {
  try {
    const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is DesignProject =>
      Boolean(item && typeof item.id === "string" && typeof item.name === "string" && Array.isArray(item.files))
    );
  } catch {
    return [];
  }
}

function writeProjects(projects: DesignProject[]): void {
  try {
    window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
  } catch {
    throw new Error("无法保存项目到本机存储。请检查浏览器存储空间或隐私设置。");
  }
}

export function listProjects(): DesignProject[] {
  return readProjects().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProject(id: string): DesignProject | undefined {
  return readProjects().find((project) => project.id === id);
}

export function createProject(prompt: string, name?: string): DesignProject {
  const trimmed = prompt.trim();
  const projectName = (name?.trim() || trimmed.slice(0, 36) || "未命名设计项目").replace(/[\r\n\t]+/g, " ");
  const now = new Date().toISOString();
  const project: DesignProject = {
    id: crypto.randomUUID(),
    name: projectName.length > 48 ? projectName.slice(0, 48) + "…" : projectName,
    prompt: trimmed,
    files: starterFiles.map((file) => ({ ...file })),
    createdAt: now,
    updatedAt: now,
    status: "draft",
  };
  writeProjects([project, ...readProjects()]);
  return project;
}

export function updateProject(project: DesignProject): DesignProject {
  const updated = { ...project, updatedAt: new Date().toISOString() };
  const projects = readProjects();
  const index = projects.findIndex((item) => item.id === project.id);
  if (index < 0) projects.unshift(updated);
  else projects[index] = updated;
  writeProjects(projects);
  return updated;
}

export function removeProject(id: string): void {
  writeProjects(readProjects().filter((project) => project.id !== id));
}
