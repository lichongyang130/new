import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DesignLibrary, ProjectEditorPage, ProjectsPage, ShareProjectPage, StudioPage, WorkspaceHub } from "../../../frontend/workspace";
import type { DesignProject } from "../../../frontend/workspace/models/project";
import { createProject, listProjects, updateProject } from "../../../frontend/workspace/projectStore";
import { useWorkspaceStore } from "../../../frontend/workspace/store";
import { PromptInput } from "../../../frontend/workspace";
import { navigateTo, normalizeAppPath } from "../../../frontend/workspace/workspaceRoutes";
import { HomeIcon, type HomeIconName } from "./components/HomeIcon";
import { HomeModeIcon } from "./components/HomeModeIcon";
import { HomeAttachMenu } from "./components/HomeAttachMenu";
import { HomeModelMenu, ModelGlyph } from "./components/HomeModelMenu";
import { WorkBuddySidebar } from "./components/WorkBuddySidebar";
import PluginsPage from "../../../frontend/workspace/pages/PluginsPage";
import InspirationPage from "./inspiration/InspirationPage";
import TaskConversationPage from "../../../frontend/workspace/pages/TaskConversationPage";
import { saveTaskConversation, pendingTaskKey, type TaskConversation } from "../../../frontend/workspace/taskConversation";
import { openSettings, useModelOptions } from "../../../frontend/workspace/settingsStore";
import "./styles.css";
import "./home-workspace.css";
import "./home-reference.css";
import { HomeDiscovery, type HomeScene } from "./components/HomeDiscovery";


type WorkMode = "office" | "code" | "design";
type TaskAttachment = { name: string; text?: string };
const textAttachmentExtensions = /\.(txt|md|markdown|json|html|htm|css|js|csv|xml|yaml|yml)$/i;

const quickActions: { title: string; icon: HomeIconName; mode: WorkMode; prompt: string }[] = [
  { title: "文档处理", icon: "document", mode: "office", prompt: "帮我整理和处理这份文档，提炼关键信息并输出清晰的结果。" },
  { title: "金融服务", icon: "wallet", mode: "office", prompt: "帮我整理金融服务需求并生成一份结构清晰的分析方案。" },
  { title: "数据分析及可视化", icon: "chart", mode: "code", prompt: "分析这些数据，并设计清晰易读的数据可视化看板。" },
  { title: "个人工作台", icon: "grid", mode: "office", prompt: "为我规划一个高效、清晰的个人工作台。" },
  { title: "幻灯片", icon: "slides", mode: "office", prompt: "根据我的主题制作一份结构清晰、视觉精美的演示文稿。" },
  { title: "网页设计", icon: "palette", mode: "design", prompt: "帮我设计一个现代、简洁、具有高品质视觉风格的网站首页。" },
];

const modes: { id: WorkMode; label: string; icon: HomeIconName }[] = [
  { id: "office", label: "日常办公", icon: "coffee" },
  { id: "code", label: "代码开发", icon: "code" },
  { id: "design", label: "设计创意", icon: "palette" },
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
  const modelOptions = useModelOptions();
  const [currentPath, setCurrentPath] = useState(normalizeAppPath(window.location.pathname));
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<WorkMode>("office");
  const [notice, setNotice] = useState("");
  const [projects, setProjects] = useState<DesignProject[]>(() => listProjects());
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState("");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [maxMode, setMaxMode] = useState(false);
  const [thinkingMode, setThinkingMode] = useState<"balanced" | "extreme">("balanced");
  const [workspace, setWorkspace] = useState("默认工作空间");
  const [permission, setPermission] = useState("默认权限");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [selectedExpert, setSelectedExpert] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const customExperts = useWorkspaceStore((state) => state.experts);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    if (!modelMenuOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !modelMenuRef.current?.contains(event.target)) setModelMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModelMenuOpen(false);
        modelMenuRef.current?.querySelector<HTMLButtonElement>(".model-picker")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [modelMenuOpen]);

  useLayoutEffect(() => {
    if (!modelMenuOpen) return;
    const host = modelMenuRef.current;
    const panel = host?.querySelector<HTMLElement>(".model-menu-popover");
    const trigger = host?.querySelector<HTMLElement>(".model-picker");
    if (!panel || !trigger) return;
    const place = () => {
      const anchor = trigger.getBoundingClientRect();
      const bounds = panel.getBoundingClientRect();
      const above = anchor.top - bounds.height - 10;
      panel.style.left = `${Math.max(12, Math.min(anchor.right - bounds.width, window.innerWidth - bounds.width - 12))}px`;
      panel.style.top = `${Math.max(12, Math.min(above >= 12 ? above : anchor.bottom + 10, window.innerHeight - bounds.height - 12))}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(panel);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { observer.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [modelMenuOpen]);

  useEffect(() => {
    if (!modelOptions.some(option => option.id === model)) setModel("");
  }, [modelOptions, model]);

  function go(path: string) {
    navigateTo(path);
    setCurrentPath(normalizeAppPath(window.location.pathname));
    setProjects(listProjects());
    setNotice("");
  }

  function selectHomeScene(scene: Pick<HomeScene, "mode" | "prompt">) {
    if (prompt.trim() && prompt !== scene.prompt && !window.confirm("输入框已有内容，是否替换为此场景的任务提示？附件、模型、工作空间和权限将保留。")) return false;
    setMode(scene.mode);
    setPrompt(scene.prompt);
    setSelectedExpert("");
    setSelectedSkill("");
    setNotice("");
    requestAnimationFrame(() => {
      const input = composerRef.current?.querySelector("textarea");
      input?.focus({ preventScroll: true });
      input?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
    return true;
  }

  function startProject(initialPrompt = prompt.trim(), projectName?: string) {
    if (!initialPrompt.trim() && !projectName) {
      setNotice("先描述你的想法，或选择一个快捷场景开始。");
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
      const conversation: TaskConversation = {
        projectId: project.id, mode, model, permission,
        messages: [{ id: crypto.randomUUID(), role: "user", content: initialPrompt.trim(), requestContent: fullRequest, createdAt: new Date().toISOString(), status: "complete" }],
      };
      saveTaskConversation(conversation);
      try { sessionStorage.setItem(pendingTaskKey(project.id), "1"); }
      catch {
        conversation.messages.push({ id: crypto.randomUUID(), role: "assistant", content: "", createdAt: new Date().toISOString(), status: "error", error: "浏览器不允许自动提交，请点击重新生成。" });
        saveTaskConversation(conversation);
      }
      setProjects(listProjects());
      setNotice("");
      setPrompt("");
      setSelectedExpert("");
      setSelectedSkill("");
      setAttachments([]);
      go(`/tasks/${encodeURIComponent(project.id)}`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "项目创建失败，请检查浏览器存储设置。");
    } finally {
      setBusy(false);
    }
  }

  if (currentPath === "/plugins") return <PluginsPage />;
  if (currentPath === "/inspiration" || currentPath.startsWith("/inspiration/")) return <InspirationPage pathname={currentPath} />;
  if (currentPath.startsWith("/library")) return <DesignLibrary />;
  if (currentPath === "/studio" || currentPath.startsWith("/studio/")) return <StudioPage />;
  if (currentPath === "/share") return <ShareProjectPage />;
  if (isWorkspaceHubPath(currentPath)) return <WorkspaceHub />;
  const taskMatch = currentPath.match(/^\/tasks\/([^/]+)$/);
  if (taskMatch) {
    let id = taskMatch[1];
    try { id = decodeURIComponent(id); } catch { /* Show the not-found view. */ }
    return <TaskConversationPage key={id} projectId={id} />;
  }
  const editorMatch = currentPath.match(/^\/editor\/([^/]+)$/);
  if (editorMatch) {
    let projectId = editorMatch[1];
    try { projectId = decodeURIComponent(projectId); } catch { /* Keep the raw id for the not-found screen. */ }
    return <ProjectEditorPage projectId={projectId} />;
  }
  if (currentPath === "/projects") return <ProjectsPage />;

  return (
    <div className="workbuddy-app">
      <WorkBuddySidebar active="home" projectCount={projects.length} go={go} setNotice={setNotice} />

      <main className="main-workspace home-workspace-v2 home27">
        <div className="home27-topbar">
          <button className="home27-top-icon" aria-label="查看最近项目" onClick={() => go("/projects")}><HomeIcon name="search" size={19} /></button>
          <button className="home27-workspace-button" onClick={() => { const select = composerRef.current?.querySelector<HTMLSelectElement>('select[aria-label="工作空间"]'); select?.focus(); select?.scrollIntoView({ block: "center", behavior: "smooth" }); }}><HomeIcon name="folder" />{workspace}<HomeIcon name="chevron" size={12} /></button>
          <button className="home27-top-icon" aria-label="查看首页通知" onClick={() => setNotice("目前没有新通知。项目与对话保存在此浏览器中。 ")}><HomeIcon name="bell" size={19} /></button>
        </div>
        <div className="home-content home-content-v2 home27-content">
          <header className="welcome-header home27-hero">
            <div className="home27-hero-copy">
              <div className="home27-eyebrow"><b>AI</b><span>×</span>创意<span>×</span>效率</div>
              <h1>想做什么，<span>说出来就好。</span></h1>
              <p>DesignBuddy 让创意更简单，让工作更高效。</p>
            </div>
          </header>
          <div className="home27-mode-row">
            <div className="mode-switch" role="tablist" aria-label="任务模式">
              {modes.map((item) => (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={mode === item.id}
                  tabIndex={mode === item.id ? 0 : -1}
                  onKeyDown={(event) => {
                    const index = modes.findIndex((entry) => entry.id === item.id);
                    const next = event.key === "ArrowRight" ? (index + 1) % modes.length
                      : event.key === "ArrowLeft" ? (index + modes.length - 1) % modes.length
                      : event.key === "Home" ? 0 : event.key === "End" ? modes.length - 1 : -1;
                    if (next < 0) return;
                    event.preventDefault();
                    setMode(modes[next].id);
                    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
                  }}
                  className={`mode-tab ${mode === item.id ? "is-selected" : ""}`}
                  onClick={() => setMode(item.id)}
                >
                  <HomeModeIcon mode={item.id} />{item.label}
                </button>
              ))}
            </div>
          </div>

          <section ref={composerRef} className="composer-shell" aria-label="创建任务">
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
              <PromptInput
                value={prompt}
                onChange={(value) => { setPrompt(value); setNotice(""); }}
                onSubmit={startProject}
                placeholder="描述你的想法，例如：制作一个产品介绍PPT…"
                rows={3}
                ariaLabel="任务描述"
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
                <HomeAttachMenu
                  mode={mode}
                  selectedExpert={selectedExpert}
                  selectedSkill={selectedSkill}
                  onOpen={() => setModelMenuOpen(false)}
                  onUpload={() => fileInputRef.current?.click()}
                  onModeChange={setMode}
                  onExpertSelect={name => {
                    setSelectedExpert(name);
                    setNotice("已选择专家，请描述任务后发送。");
                    requestAnimationFrame(() => composerRef.current?.querySelector("textarea")?.focus({ preventScroll: true }));
                  }}
                  onSkillSelect={(name, requirement) => {
                    setSelectedSkill(name);
                    setNotice(requirement || "已选择技能任务说明，请描述需求后发送。此操作不会安装或执行外部程序。");
                    requestAnimationFrame(() => composerRef.current?.querySelector("textarea")?.focus({ preventScroll: true }));
                  }}
                  onNavigate={go}
                />
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
                  <button className="home27-context-button" aria-label="添加文本上下文" title="添加文本上下文" onClick={() => fileInputRef.current?.click()}>@</button>
                  <div className="model-picker-host" ref={modelMenuRef}>
                    <button className="model-picker" type="button" aria-label="选择大模型" aria-haspopup="dialog" aria-expanded={modelMenuOpen} onClick={() => setModelMenuOpen((open) => !open)}>
                      <span className="model-spark"><ModelGlyph id={model} /></span><span>{modelOptions.find((option) => option.id === model)?.name ?? model}</span><span className={modelMenuOpen ? "model-chevron is-open" : "model-chevron"}><HomeIcon name="chevron" size={10} /></span>
                    </button>
                    {modelMenuOpen && <HomeModelMenu
                      model={model}
                      maxMode={maxMode}
                      thinkingMode={thinkingMode}
                      onMaxChange={() => setMaxMode(enabled => !enabled)}
                      onThinkingChange={setThinkingMode}
                      onSelect={id => {
                        setModel(id);
                        setModelMenuOpen(false);
                        requestAnimationFrame(() => modelMenuRef.current?.querySelector<HTMLButtonElement>(".model-picker")?.focus());
                      }}
                      onConfigure={() => {
                        setModelMenuOpen(false);
                        openSettings("models", modelMenuRef.current?.querySelector<HTMLButtonElement>(".model-picker"));
                      }}
                    />}
                  </div>
                  <button className="microphone-button" title="语音输入" aria-label="语音输入" onClick={() => setNotice("语音输入暂未接入，请直接在输入框中描述任务。")}><HomeIcon name="microphone" size={15} /></button>
                  <button className="send-button" disabled={busy || !prompt.trim()} title="开始任务" aria-label="开始任务" onClick={() => startProject()}>
                    {busy ? "…" : <HomeIcon name="send" size={19} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="composer-footer">
              <label className="footer-select">
                <HomeIcon name="folder" />
                <select value={workspace} onChange={(event) => setWorkspace(event.target.value)} aria-label="工作空间">
                  <option value="默认工作空间">选择工作空间</option>
                  <option>个人空间</option>
                  <option>产品设计空间</option>
                </select>
                <HomeIcon name="chevron" size={10} />
              </label>
              <label className="footer-select">
                <HomeIcon name="shield" />
                <select style={{ width: `calc(${permission.length}em + 4px)` }} value={permission} onChange={(event) => setPermission(event.target.value)} aria-label="任务权限">
                  <option>默认权限</option>
                  <option>仅本地</option>
                  <option>需要确认后执行</option>
                </select>
                <HomeIcon name="chevron" size={10} />
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
          <HomeDiscovery mode={mode} onSelect={selectHomeScene} onExplore={() => go("/inspiration")} />
          <details className="home27-more-scenes">
            <summary>更多快捷场景 <span aria-hidden="true">＋</span></summary>
            <div>{quickActions.filter(action => action.mode === mode).map(action => <button key={action.title} onClick={() => selectHomeScene(action)}><HomeIcon name={action.icon} />{action.title}</button>)}</div>
          </details>
          <button className="home27-explore" onClick={() => go("/plugins")}><span aria-hidden="true">—</span> 探索更多 AI 能力 <span aria-hidden="true">→</span></button>
        </div>
      </main>
    </div>
  );
}
