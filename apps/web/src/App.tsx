import { useEffect, useMemo, useRef, useState } from "react";
import WorkspaceHub from "./pages/WorkspaceHub";
import DesignLibrary from "./pages/DesignLibrary";
import StudioPage from "./pages/StudioPage";
import ShareProjectPage from "./pages/ShareProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import type { DesignProject } from "./models/project";
import { createProject, listProjects, updateProject } from "./store/projectStore";
import { useWorkspaceStore } from "./store/workspaceStore";
import { navigateTo, normalizeAppPath } from "./router/workspaceRoutes";
import "./styles.css";
import "./home-workspace.css";

type WorkMode = "office" | "code" | "design";
type TaskAttachment = { name: string; text?: string };
const textAttachmentExtensions = /\.(txt|md|markdown|json|html|htm|css|js|csv|xml|yaml|yml)$/i;

const quickActions = [
  { title: "文档处理", icon: "▤", mode: "office" as WorkMode, prompt: "帮我整理和处理这份文档，提炼关键信息并输出清晰的结果。" },
  { title: "金融服务", icon: "▣", mode: "office" as WorkMode, prompt: "帮我整理金融服务需求并生成一份结构清晰的分析方案。" },
  { title: "数据分析及可视化", icon: "◷", mode: "code" as WorkMode, prompt: "分析这些数据，并设计清晰易读的数据可视化看板。" },
  { title: "个人工作台", icon: "▦", mode: "office" as WorkMode, prompt: "为我规划一个高效、清晰的个人工作台。" },
  { title: "幻灯片", icon: "▧", mode: "office" as WorkMode, prompt: "根据我的主题制作一份结构清晰、视觉精美的演示文稿。" },
  { title: "网页设计", icon: "◇", mode: "design" as WorkMode, prompt: "帮我设计一个现代、简洁、具有高品质视觉风格的网站首页。" },
];

const modes: { id: WorkMode; label: string; icon: string }[] = [
  { id: "office", label: "日常办公", icon: "♧" },
  { id: "code", label: "代码开发", icon: "‹›" },
  { id: "design", label: "设计创意", icon: "◈" },
];

const expertCatalog = [
  { id: "dev", name: "高级开发工程师", description: "全栈开发、系统架构与工程效率", terms: ["开发", "代码", "编程", "前端", "后端", "react", "网页", "网站", "调试", "bug", "架构", "接口", "程序"] },
  { id: "product", name: "产品策略顾问", description: "产品规划、用户研究与需求梳理", terms: ["产品", "需求", "prd", "用户", "调研", "规划", "路线图", "功能", "原型", "体验"] },
  { id: "designer", name: "UI 设计专家", description: "界面设计、交互流程与视觉规范", terms: ["设计", "ui", "界面", "视觉", "交互", "页面", "配色", "组件", "设计系统", "原型", "品牌"] },
  { id: "content", name: "内容增长专家", description: "内容策划、社交媒体运营与增长", terms: ["内容", "小红书", "公众号", "短视频", "文案", "营销", "运营", "增长", "社媒", "标题"] },
  { id: "finance", name: "金融研究分析师", description: "行业研究、财务信息整理与投资分析框架", terms: ["金融", "投资", "股票", "财务", "行业", "市场分析", "基金", "商业分析", "竞品"] },
  { id: "career", name: "求职与职业导师", description: "简历优化、面试准备与职业规划", terms: ["简历", "求职", "面试", "职业", "工作", "招聘", "校招", "转行", "自我介绍"] },
  { id: "writing", name: "写作与研究助理", description: "资料归纳、论文结构与专业写作", terms: ["论文", "写作", "报告", "总结", "资料", "研究", "整理", "纪要", "翻译"] },
];

function scoreExpert(text: string, terms: string[]) {
  const normalized = text.toLocaleLowerCase();
  return terms.reduce((score, term) => normalized.includes(term.toLocaleLowerCase()) ? score + (term.length > 2 ? 2 : 1) : score, 0);
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
  const [model, setModel] = useState("");
  const [workspace, setWorkspace] = useState("默认工作空间");
  const [permission, setPermission] = useState("默认权限");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [selectedExpert, setSelectedExpert] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const customExperts = useWorkspaceStore((state) => state.experts);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recommendedExperts = useMemo(() => {
    const request = prompt.trim();
    if (request.length < 2) return [];
    const builtIn = expertCatalog.map((expert) => ({
      id: expert.id,
      name: expert.name,
      description: expert.description,
      score: scoreExpert(request, [...expert.terms, expert.name]),
      custom: false,
    }));
    const personal = customExperts.map((expert) => ({
      id: expert.id,
      name: expert.name,
      description: expert.description || [...expert.skills, ...expert.capabilities].join("、") || "你的自定义专家",
      score: scoreExpert(request, [expert.name, expert.description, ...expert.skills, ...expert.capabilities].filter(Boolean)),
      custom: true,
    }));
    return [...personal, ...builtIn].filter((expert) => expert.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  }, [prompt, customExperts]);

  useEffect(() => {
    const syncPath = () => {
      setCurrentPath(normalizeAppPath(window.location.pathname));
      setProjects(listProjects());
    };
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  useEffect(() => {
    if (currentPath !== "/") return;
    const key = "designbuddy.launch-context.v1";
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return;
    window.sessionStorage.removeItem(key);
    try {
      const context = JSON.parse(raw) as { expert?: unknown; skill?: unknown };
      if (typeof context.expert === "string") setSelectedExpert(context.expert);
      if (typeof context.skill === "string") setSelectedSkill(context.skill);
      setNotice("已载入所选专家/技能，请描述任务后开始。");
    } catch { setNotice("无法读取所选专家或技能，请重新选择。"); }
  }, [currentPath]);

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
      const expertPrefix = selectedExpert ? `推荐专家：${selectedExpert}。` : "";
      const skillPrefix = selectedSkill ? `使用技能：${selectedSkill}。` : "";
      const hasModePrefix = initialPrompt.startsWith("日常办公需求：") || initialPrompt.startsWith("代码开发需求：") || initialPrompt.startsWith("设计创意需求：");
      const task = hasModePrefix ? `${expertPrefix}${skillPrefix}${initialPrompt}` : `${prefix}${expertPrefix}${skillPrefix}${initialPrompt}`;
      const request = `工作空间：${workspace}；执行策略：${permission}。\n${task}`;
      const attachmentContext = attachments.filter((item) => item.text).map((item) => `\n\n--- 附件：${item.name} ---\n${item.text}`).join("");
      const fullRequest = request + attachmentContext;
      const draft = createProject(fullRequest, projectName || initialPrompt.trim().slice(0, 36));
      const project = updateProject({ ...draft, workspaceName: workspace, executionPolicy: permission });
      try {
        window.sessionStorage.setItem(`designbuddy.generate-on-open.${project.id}`, JSON.stringify({ prompt: fullRequest, model, localOnly: permission === "仅本地" }));
      } catch {
        setNotice("本机草稿已创建，但浏览器不允许自动启动 AI 生成。可在项目编辑器右侧手动提交需求。");
      }
      setProjects(listProjects());
      setNotice("");
      setPrompt("");
      setSelectedExpert("");
      setSelectedSkill("");
      setAttachments([]);
      go(`/editor/${encodeURIComponent(project.id)}`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "项目创建失败，请检查浏览器存储设置。");
    } finally {
      setBusy(false);
    }
  }

  if (currentPath.startsWith("/library")) return <DesignLibrary />;
  if (currentPath === "/studio" || currentPath.startsWith("/studio/")) return <StudioPage />;
  if (currentPath === "/share") return <ShareProjectPage />;
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
          <button className="brand-lockup" onClick={() => go("/")} aria-label="返回 WorkBuddy 首页">
            <strong>WorkBuddy</strong>
            <span>5.7.7</span>
          </button>
          <button className="discover-button" onClick={() => { setNotice("从快捷场景选择文档、金融、数据或个人工作台任务，快速开始。"); }}>
            ◉ 发现应用 <span>⌄</span>
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
            <span>♧</span><span className="sidebar-nav-label">专家·技能·连接器</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => setNotice("定时任务入口正在规划中；当前可直接在输入框创建设计任务。")}>
            <span>◴</span><span className="sidebar-nav-label">定时任务</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => go("/projects")}>
            <span>▤</span><span className="sidebar-nav-label">资料库</span>
          </button>
          <button className="sidebar-nav-item" onClick={() => setNotice("更多工作区工具将逐步开放。")}>
            <span>⊞</span><span className="sidebar-nav-label">更多</span><span className="nav-hint">灵感</span>
          </button>
        </nav>

        <div className="sidebar-lists">
          <button onClick={() => go("/projects")}>任务（{projects.length || 3}）</button>
          <button onClick={() => setNotice("当前工作空间：默认工作空间。可在输入框下方切换工作空间。")}>空间（2）</button>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar" aria-hidden="true">D</div>
          <strong title="19932101651">19932101651</strong>
          <button title="通知" aria-label="通知" onClick={() => setNotice("目前没有新通知。")}>♧</button>
          <button title="工作区状态" aria-label="工作区状态" onClick={() => setNotice("当前为本地工作区，项目草稿保存在此浏览器。")}>▣</button>
        </div>
      </aside>

      <main className="main-workspace home-workspace-v2">
        <button className="top-promo" onClick={() => { setMode("design"); setPrompt("帮我梳理一个产品创意，并设计对应的网页首页与交互原型。"); }}><span className="promo-mark">♧</span> 做任务赢积分好礼 <span>›</span></button>
        <div className="home-content home-content-v2">
          <header className="welcome-header">
            <h1>WorkBuddy，我帮你</h1>
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
            <div className="quick-actions-list">{quickActions.map((action) => <button key={action.title} className="quick-action-chip" onClick={() => { setMode(action.mode); setPrompt(action.prompt); setSelectedExpert(""); setSelectedSkill(""); setNotice(""); }}><span>{action.icon}</span>{action.title}</button>)}</div>
            <button className="quick-scroll-button" title="查看任务场景" aria-label="查看任务场景" onClick={() => setNotice("已展示常用任务场景。")}>›</button>
          </section>

          <section className="composer-shell" aria-label="创建任务">
            <div className="composer-main">
              {attachments.length > 0 && (
                <div className="attachment-list">
                  {attachments.map((file, index) => (
                    <span className="attachment-chip" key={`${file.name}-${index}`} title={file.text ? "文本内容已读取" : "暂不支持读取此文件类型"}>
                      ▧ {file.name}{file.text ? " ✓" : ""}
                      <button aria-label={`移除附件 ${file.name}`} onClick={() => setAttachments((items) => items.filter((_, itemIndex) => itemIndex !== index))}>×</button>
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
                placeholder="今天要帮你做些什么？ @ 添加上下文，/ 调用技能与指令"
                rows={3}
                aria-label="任务描述"
              />
              {(selectedExpert || selectedSkill) && <div className="home-selected-capabilities"><span>本次任务将使用：{[selectedExpert, selectedSkill].filter(Boolean).join(" · ")}</span><button type="button" onClick={() => { setSelectedExpert(""); setSelectedSkill(""); }}>清除</button></div>}
              {recommendedExperts.length > 0 && <div className="home-expert-recommendations" aria-live="polite">
                <div className="home-expert-recommendations-heading"><span>✦ 根据你的需求推荐专家</span><small>匹配领域与专家能力</small></div>
                <div className="home-expert-recommendations-list">{recommendedExperts.map((expert) => <article className={selectedExpert === expert.name ? "is-selected" : ""} key={expert.id}>
                  <span className="home-expert-recommendation-avatar">{expert.name.slice(0, 1)}</span>
                  <span className="home-expert-recommendation-copy"><b>{expert.name}{expert.custom && <i>我的专家</i>}</b><small>{expert.description}</small></span>
                  <button type="button" aria-pressed={selectedExpert === expert.name} onClick={() => setSelectedExpert((current) => current === expert.name ? "" : expert.name)}>{selectedExpert === expert.name ? "已选择 ✓" : "选择专家"}</button>
                </article>)}</div>
              </div>}
              <div className="composer-controls">
                <button className="attach-button" title="添加附件" aria-label="添加附件" onClick={() => fileInputRef.current?.click()}>＋</button>
                <input
                  ref={fileInputRef}
                  className="visually-hidden-input"
                  type="file"
                  multiple
                  onChange={(event) => {
                    const selected = Array.from(event.currentTarget.files ?? []);
                    event.currentTarget.value = "";
                    if (!selected.length) return;
                    void Promise.all(selected.map(async (file): Promise<TaskAttachment> => {
                      if (!textAttachmentExtensions.test(file.name) && !file.type.startsWith("text/")) return { name: file.name };
                      if (file.size > 160_000) return { name: file.name };
                      try { return { name: file.name, text: (await file.text()).slice(0, 80_000) }; }
                      catch { return { name: file.name }; }
                    })).then((parsed) => {
                      setAttachments((current) => [...current, ...parsed].slice(-4));
                      const readable = parsed.filter((file) => file.text).length;
                      setNotice(readable ? `已读取 ${readable} 个文本附件；每个文件最多提取 80 KB 文本。PDF 和图片仅附上文件名。` : "已添加附件。当前只会解析文本文件，PDF 与图片内容暂未提取。");
                    });
                  }}
                />
                <div className="composer-actions-right">
                  <label className="model-picker">
                    <span className="model-spark">♫</span>
                    <select value={model} aria-label="模型选择" onChange={(event) => setModel(event.target.value)}>
                      <option value="">Step-5-Preview</option>
                      <option value="gpt-4o-mini">GPT · gpt-4o-mini</option>
                      <option value="claude-3-5-sonnet-latest">Claude · Sonnet</option>
                      <option value="llama3.1">兼容网关 · llama3.1</option>
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
