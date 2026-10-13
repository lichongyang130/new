import { useEffect, useRef, useState } from "react";
import WorkspaceHub from "./pages/WorkspaceHub";
import DesignLibrary from "./pages/DesignLibrary";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import type { DesignProject } from "./models/project";
import { createProject, listProjects } from "./store/projectStore";
import { navigateTo, normalizeAppPath } from "./router/workspaceRoutes";
import "./styles.css";

type WorkMode = "office" | "code" | "design";

const quickActions = [
  { title: "网页设计", icon: "▤", mode: "design" as WorkMode, prompt: "帮我设计一个现代、简洁、具有高品质视觉风格的网站首页。" },
  { title: "交互原型", icon: "▣", mode: "design" as WorkMode, prompt: "帮我制作一个可点击、流程清晰的产品交互原型。" },
  { title: "视觉设计", icon: "◉", mode: "design" as WorkMode, prompt: "为我的产品设计统一的视觉风格、配色、字体和组件规范。" },
  { title: "数据看板", icon: "◷", mode: "code" as WorkMode, prompt: "设计一个信息层级清楚、易于阅读的数据可视化看板。" },
  { title: "产品需求", icon: "▦", mode: "office" as WorkMode, prompt: "帮我把一个产品想法梳理成清晰的功能需求和页面结构。" },
  { title: "设计系统", icon: "◇", mode: "design" as WorkMode, prompt: "为一个 SaaS 产品建立可复用的设计系统和 UI 组件规范。" },
];

const modes: { id: WorkMode; label: string; icon: string }[] = [
  { id: "office", label: "日常办公", icon: "♧" },
  { id: "code", label: "代码开发", icon: "‹›" },
  { id: "design", label: "设计创意", icon: "◈" },
];

function RobotMascot() {
  return (
    <div className="buddy-mascot" aria-hidden="true">
      <span className="mascot-status">✦</span>
      <span className="mascot-antenna" />
      <span className="mascot-head">
        <i className="mascot-ear mascot-ear--left" />
        <i className="mascot-ear mascot-ear--right" />
        <span className="mascot-face"><i /><i /><b /></span>
      </span>
      <span className="mascot-body" />
    </div>
  );
}

function isWorkspaceHubPath(path: string) {
  return path.startsWith("/experts") || path.startsWith("/skills") || path.startsWith("/connectors");
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(normalizeAppPath(window.location.pathname));
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<WorkMode>("design");
  const [notice, setNotice] = useState("");
  const [projects, setProjects] = useState<DesignProject[]>(() => listProjects());
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState("DesignBuddy Auto");
  const [workspace, setWorkspace] = useState("默认工作空间");
  const [permission, setPermission] = useState("默认权限");
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncPath = () => {
      setCurrentPath(normalizeAppPath(window.location.pathname));
      setProjects(listProjects());
    };
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  function go(path: string) {
    navigateTo(path);
    setCurrentPath(normalizeAppPath(window.location.pathname));
    setProjects(listProjects());
    setNotice("");
  }

  function startProject(initialPrompt = prompt.trim(), projectName?: string) {
    if (!initialPrompt.trim() && !projectName) {
      setNotice("先描述你的想法，或点击上方的快捷场景开始。");
      return;
    }
    try {
      setBusy(true);
      const prefix = mode === "office" ? "日常办公需求：" : mode === "code" ? "代码开发需求：" : "设计创意需求：";
      const request = initialPrompt.startsWith("日常办公需求：") || initialPrompt.startsWith("代码开发需求：") || initialPrompt.startsWith("设计创意需求：")
        ? initialPrompt
        : `${prefix}${initialPrompt}`;
      const project = createProject(request, projectName);
      setProjects(listProjects());
      setNotice("");
      setPrompt("");
      setAttachments([]);
      go(`/editor/${encodeURIComponent(project.id)}`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "项目创建失败，请检查浏览器存储设置。");
    } finally {
      setBusy(false);
    }
  }

  if (currentPath.startsWith("/library")) return <DesignLibrary />;
  if (isWorkspaceHubPath(currentPath)) return <WorkspaceHub />;
  const editorMatch = currentPath.match(/^\/editor\/([^/]+)$/);
  if (editorMatch) {
    let projectId = editorMatch[1];
    try { projectId = decodeURIComponent(projectId); } catch { /* Keep the raw id for the not-found screen. */ }
    return <ProjectEditorPage projectId={projectId} />;
  }
  if (currentPath === "/projects") return <ProjectsPage />;

  return (
    <div className="workbuddy-app">
      <aside className="app-sidebar">
        <div className="sidebar-windowbar">
          <div className="window-dots" aria-label="窗口控制">
            <span className="window-dot window-dot--red" />
            <span className="window-dot window-dot--yellow" />
            <span className="window-dot window-dot--green" />
          </div>
          <div className="sidebar-utilities">
            <button title="打开任务列表" aria-label="打开任务列表" onClick={() => go("/projects")}>▱</button>
            <button title="搜索项目" aria-label="搜索项目" onClick={() => go("/projects")}>⌕</button>
            <button title="筛选项目" aria-label="筛选项目" onClick={() => go("/projects")}>▽</button>
          </div>
        </div>

        <div className="brand-row">
          <button className="brand-lockup" onClick={() => go("/")} aria-label="返回 DesignBuddy 首页">
            <strong>DesignBuddy</strong>
            <span>AI 设计工作台</span>
          </button>
          <button className="discover-button" onClick={() => { setNotice("从快捷场景选择网页、原型或设计系统任务，快速开始。"); }}>
            ◉ 探索灵感 <span>⌄</span>
          </button>
        </div>

        <button className="sidebar-nav-item is-prominent" onClick={() => { setPrompt(""); go("/"); }}>
          <span>⊕</span><span className="sidebar-nav-label">新建任务</span>
        </button>

        <nav className="sidebar-navigation" aria-label="主导航">
          <button className="sidebar-nav-item" onClick={() => go("/experts")}>
            <span>♙</span><span className="sidebar-nav-label">助理</span><span className="beta-label">BETA</span>
            <span className="nav-trailing-actions"><span title="工作空间">▱</span><span title="设置">⚙</span></span>
          </button>
          <button className="sidebar-nav-item" onClick={() => go("/experts")}>
            <span>♧</span><span className="sidebar-nav-label">专家 · 技能 · 连接器</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => go("/library")}>
            <span>◈</span><span className="sidebar-nav-label">设计资产中心</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => setNotice("定时任务入口正在规划中；当前可直接在输入框创建设计任务。")}>
            <span>◴</span><span className="sidebar-nav-label">定时任务</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => go("/projects")}>
            <span>▤</span><span className="sidebar-nav-label">资料库</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => setNotice("更多工作区工具将逐步开放。")}>
            <span>⊞</span><span className="sidebar-nav-label">更多</span><span className="nav-hint">工具</span>
          </button>
        </nav>

        <div className="sidebar-lists">
          <button onClick={() => go("/projects")}>任务（{projects.length}）</button>
          <button onClick={() => setNotice("当前工作空间：默认工作空间。可在输入框下方切换工作空间。")}>空间（2）</button>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar" aria-hidden="true">D</div>
          <strong title="DesignBuddy Workspace">DesignBuddy Workspace</strong>
          <button title="通知" aria-label="通知" onClick={() => setNotice("目前没有新通知。")}>♧</button>
          <button title="工作区状态" aria-label="工作区状态" onClick={() => setNotice("当前为本地工作区，项目草稿保存在此浏览器。")}>▣</button>
        </div>
      </aside>

      <main className="main-workspace">
        <button className="top-promo" onClick={() => { setMode("design"); setPrompt("帮我梳理一个产品创意，并设计对应的网页首页与交互原型。"); }}>
          <span className="promo-mark">✦</span> 发现更多设计灵感 <span>›</span>
        </button>

        <div className="home-content">
          <header className="welcome-header">
            <h1>DesignBuddy，我帮你</h1>
            <div className="mode-switch" role="tablist" aria-label="任务模式">
              {modes.map((item) => (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={mode === item.id}
                  className={`mode-tab ${mode === item.id ? "is-selected" : ""}`}
                  onClick={() => setMode(item.id)}
                >
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          </header>

          <section className="quick-actions-row" aria-label="快捷任务场景">
            <div className="quick-actions-list">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  className="quick-action-chip"
                  onClick={() => { setMode(action.mode); setPrompt(action.prompt); setNotice(""); }}
                >
                  <span>{action.icon}</span>{action.title}
                </button>
              ))}
            </div>
            <button className="quick-scroll-button" title="查看全部快捷场景" aria-label="查看全部快捷场景" onClick={() => setNotice("已展示常用设计场景：网页、原型、视觉、数据看板、产品需求与设计系统。")}>›</button>
            <RobotMascot />
          </section>

          <section className="composer-shell" aria-label="创建任务">
            <div className="composer-main">
              {attachments.length > 0 && (
                <div className="attachment-list">
                  {attachments.map((file, index) => (
                    <span className="attachment-chip" key={`${file}-${index}`}>
                      ▧ {file}
                      <button aria-label={`移除附件 ${file}`} onClick={() => setAttachments((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(event) => { setPrompt(event.target.value); setNotice(""); }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    startProject();
                  }
                }}
                placeholder="今天要帮你做些什么？描述需求，或点击上方场景快速开始……"
                rows={3}
                aria-label="任务描述"
              />
              <div className="composer-controls">
                <button className="attach-button" title="添加附件" aria-label="添加附件" onClick={() => fileInputRef.current?.click()}>＋</button>
                <input
                  ref={fileInputRef}
                  className="visually-hidden-input"
                  type="file"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files ?? []).map((file) => file.name);
                    if (files.length) {
                      setAttachments((current) => [...current, ...files].slice(-4));
                      setNotice("已选择附件名称。当前版本尚未接通文件解析，请在任务描述中补充附件内容。");
                    }
                    event.currentTarget.value = "";
                  }}
                />
                <div className="composer-actions-right">
                  <label className="model-picker">
                    <span className="model-spark">◈</span>
                    <select value={model} aria-label="模型选择" onChange={(event) => setModel(event.target.value)}>
                      <option>DesignBuddy Auto</option>
                      <option>GPT 系列</option>
                      <option>Claude 系列</option>
                      <option>本地模型</option>
                    </select>
                    <span>⌄</span>
                  </label>
                  <button className="microphone-button" title="语音输入" aria-label="语音输入" onClick={() => setNotice("语音输入暂未接入，请直接在输入框中描述任务。")}>♩</button>
                  <button className="send-button" disabled={busy || !prompt.trim()} title="开始任务" aria-label="开始任务" onClick={() => startProject()}>
                    {busy ? "…" : "➤"}
                  </button>
                </div>
              </div>
            </div>
            <div className="composer-footer">
              <label className="footer-select">
                ▱
                <select value={workspace} onChange={(event) => setWorkspace(event.target.value)} aria-label="工作空间">
                  <option>默认工作空间</option>
                  <option>个人空间</option>
                  <option>产品设计空间</option>
                </select>
                <span>⌄</span>
              </label>
              <label className="footer-select">
                ◉
                <select value={permission} onChange={(event) => setPermission(event.target.value)} aria-label="任务权限">
                  <option>默认权限</option>
                  <option>仅本地</option>
                  <option>需要确认后执行</option>
                </select>
                <span>⌄</span>
              </label>
            </div>
          </section>

          {notice && (
            <div className="home-notice" role="status">
              <span aria-hidden="true">ⓘ</span>
              <span>{notice}</span>
              <button aria-label="关闭提示" onClick={() => setNotice("")}>×</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
