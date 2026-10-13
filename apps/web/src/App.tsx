import { useEffect, useState } from "react";
import WorkspaceHub from "./pages/WorkspaceHub";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import type { DesignProject } from "./models/project";
import { createProject, listProjects } from "./store/projectStore";
import { navigateTo, normalizeAppPath } from "./router/workspaceRoutes";
import "./styles.css";

const templates = [
  { id: "saas", title: "SaaS 产品首页", description: "产品介绍、功能特性、价格方案", prompt: "设计一个现代简约的 SaaS 产品首页，包含导航、主视觉、功能特性和价格方案。" },
  { id: "dashboard", title: "数据管理后台", description: "指标卡片、数据表格、筛选工具", prompt: "设计一个清晰专业的数据管理后台，包含侧边栏、统计卡片、筛选区和数据表格。" },
  { id: "store", title: "电商产品页面", description: "产品展示、详情信息、购买入口", prompt: "设计一个简洁精致的电商产品展示页，包含产品介绍、视觉图片区域、功能卖点和购买入口。" },
  { id: "portfolio", title: "个人作品集", description: "个人介绍、作品展示、联系信息", prompt: "设计一个有编辑感的个人作品集网站，包含个人介绍、项目精选和联系信息。" },
];

function BrandMark() {
  return <span className="db-brand-mark" aria-hidden="true">D</span>;
}

function isWorkspaceHubPath(path: string) {
  return path.startsWith("/experts") || path.startsWith("/skills") || path.startsWith("/connectors");
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(normalizeAppPath(window.location.pathname));
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"website" | "dashboard" | "prototype">("website");
  const [notice, setNotice] = useState("");
  const [projects, setProjects] = useState<DesignProject[]>(() => listProjects());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const syncPath = () => {
      setCurrentPath(window.location.pathname);
      setProjects(listProjects());
    };
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  function startProject(initialPrompt = prompt.trim(), projectName?: string) {
    if (!initialPrompt.trim() && !projectName) {
      setNotice("先描述你想创建的网页或选择一个模板。");
      return;
    }
    try {
      setBusy(true);
      const request = mode === "dashboard"
        ? `数据后台设计需求：${initialPrompt}`
        : mode === "prototype"
          ? `可交互原型设计需求：${initialPrompt}`
          : initialPrompt;
      const project = createProject(request, projectName);
      setProjects(listProjects());
      setNotice("");
      setPrompt("");
      navigateTo(`/editor/${encodeURIComponent(project.id)}`);
      setCurrentPath(window.location.pathname);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "项目创建失败，请检查浏览器存储设置。");
    } finally {
      setBusy(false);
    }
  }

  if (isWorkspaceHubPath(currentPath)) return <WorkspaceHub />;
  const editorMatch = currentPath.match(/^\/editor\/([^/]+)$/);
  if (editorMatch) {
    let projectId = editorMatch[1];
    try { projectId = decodeURIComponent(projectId); } catch { /* Keep the raw id for the not-found screen. */ }
    return <ProjectEditorPage projectId={projectId} />;
  }
  if (currentPath === "/projects") return <ProjectsPage />;

  return (
    <div className="db-app-shell">
      <aside className="db-app-sidebar">
        <button className="db-brand-lockup" onClick={() => navigateTo("/")} aria-label="返回 DesignBuddy 首页">
          <BrandMark />
          <span><strong>DesignBuddy</strong><small>AI DESIGN WORKSPACE</small></span>
        </button>
        <button className="db-new-project-button" onClick={() => { setPrompt(""); navigateTo("/"); setCurrentPath("/"); }}>
          <span>＋</span> 新建项目
        </button>
        <nav className="db-primary-nav" aria-label="主导航">
          <button className={currentPath === "/" ? "is-active" : ""} onClick={() => { navigateTo("/"); setCurrentPath("/"); }}>
            <span className="db-nav-icon">⌂</span> 创建设计
          </button>
          <button className={currentPath === "/projects" ? "is-active" : ""} onClick={() => { navigateTo("/projects"); setCurrentPath("/projects"); }}>
            <span className="db-nav-icon">▦</span> 我的项目 <span className="db-nav-count">{projects.length}</span>
          </button>
          <button onClick={() => { navigateTo("/experts"); setCurrentPath("/experts"); }}>
            <span className="db-nav-icon">✳</span> Agent 与技能
          </button>
        </nav>
        <div className="db-sidebar-section-label">最近项目</div>
        <div className="db-sidebar-recent">
          {projects.slice(0, 5).map((project) => (
            <button key={project.id} title={project.name} onClick={() => navigateTo(`/editor/${encodeURIComponent(project.id)}`)}>
              <span className="db-mini-project-icon">◇</span><span>{project.name}</span>
            </button>
          ))}
          {projects.length === 0 && <p>你的项目会显示在这里。</p>}
        </div>
        <div className="db-sidebar-footer">
          <div className="db-avatar">D</div>
          <div><strong>本机工作区</strong><span>项目草稿保存在此浏览器</span></div>
        </div>
      </aside>

      <main className="db-home-main">
        <header className="db-home-topbar">
          <span className="db-breadcrumb">工作台 <span>/</span> 创建设计</span>
          <button className="db-topbar-link" onClick={() => navigateTo("/projects")}>查看所有项目 <span>→</span></button>
        </header>
        <div className="db-home-content">
          <section className="db-home-hero">
            <div className="db-hero-orb" aria-hidden="true"><span>✳</span></div>
            <p className="db-eyebrow">IDEAS INTO INTERFACES</p>
            <h1>把你的想法，<br /><span>变成真正的作品。</span></h1>
            <p className="db-home-subtitle">描述你想要的网站或产品界面，建立项目草稿，接着编辑代码并实时预览。</p>
          </section>

          <section className="db-prompt-panel" aria-label="创建项目">
            <div className="db-prompt-label"><span className="db-prompt-dot" />描述你的设计需求</div>
            <textarea
              value={prompt}
              onChange={(event) => { setPrompt(event.target.value); setNotice(""); }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  startProject();
                }
              }}
              placeholder="例如：设计一个精致的 SaaS 产品首页，使用浅色背景、醒目的主标题、功能介绍和价格卡片……"
              rows={4}
              aria-label="设计需求描述"
            />
            <div className="db-prompt-bottom">
              <div className="db-mode-tabs" aria-label="项目类型">
                <button className={mode === "website" ? "is-active" : ""} onClick={() => setMode("website")}>◇ 网页设计</button>
                <button className={mode === "dashboard" ? "is-active" : ""} onClick={() => setMode("dashboard")}>▦ 数据后台</button>
                <button className={mode === "prototype" ? "is-active" : ""} onClick={() => setMode("prototype")}>⌘ 交互原型</button>
              </div>
              <button className="db-button db-button-primary" disabled={busy} onClick={() => startProject()}>
                {busy ? "正在创建…" : "创建项目"} <span>↗</span>
              </button>
            </div>
          </section>
          {notice && <p className="db-alert" role="alert">{notice}</p>}
          <p className="db-local-disclaimer">当前版本会创建可编辑的项目起始模板；AI 自动生成服务尚未接通，不会把模板冒充成 AI 生成结果。</p>

          <section className="db-template-section">
            <div className="db-section-heading">
              <div><p className="db-eyebrow">START WITH A TEMPLATE</p><h2>从一个起点开始</h2></div>
              <button onClick={() => navigateTo("/projects")}>管理项目 <span>→</span></button>
            </div>
            <div className="db-template-grid">
              {templates.map((template, index) => (
                <button className="db-template-card" key={template.id} onClick={() => startProject(template.prompt, template.title)}>
                  <span className={`db-template-art db-template-art-${index + 1}`}>
                    <i className="db-art-nav" /><i className="db-art-heading" /><i className="db-art-heading-short" />
                    <i className="db-art-visual" /><i className="db-art-card-one" /><i className="db-art-card-two" />
                  </span>
                  <span className="db-template-card-title">{template.title}<span>↗</span></span>
                  <span className="db-template-description">{template.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="db-recent-section">
            <div className="db-section-heading">
              <div><p className="db-eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2>最近项目</h2></div>
              <button onClick={() => navigateTo("/projects")}>全部项目 <span>→</span></button>
            </div>
            {projects.length > 0 ? (
              <div className="db-recent-list">
                {projects.slice(0, 3).map((project) => (
                  <button key={project.id} className="db-recent-project" onClick={() => navigateTo(`/editor/${encodeURIComponent(project.id)}`)}>
                    <span className="db-recent-icon">◇</span>
                    <span className="db-recent-project-name">{project.name}<small>{project.prompt || "空白设计项目"}</small></span>
                    <span className="db-recent-status">草稿</span><span className="db-recent-arrow">→</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="db-recent-empty"><span>◈</span><p>还没有项目。描述一个想法，或选择上面的模板开始。</p></div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
