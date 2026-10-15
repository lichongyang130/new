import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { TaskMarkdown } from "../../../apps/web/src/components/TaskMarkdown";
import { HomeIcon } from "../../../apps/web/src/components/HomeIcon";
import { WorkBuddySidebar } from "../../../apps/web/src/components/WorkBuddySidebar";
import { AIProviderSettings, getAIProviderCredentials } from "../AIProviderSettings";
import { PromptInput } from "../PromptInput";
import TaskPreviewPanel from "../TaskPreviewPanel";
import { generateProjectWithAI } from "../api/generation";
import { streamTaskReply } from "../api/taskChat";
import { getProject, listProjects, updateProject } from "../projectStore";
import { loadTaskConversation, pendingTaskKey, projectTaskPath, saveTaskConversation, type TaskConversation, type TaskMessage } from "../taskConversation";
import { useModelOptions } from "../settingsStore";
import { navigateTo } from "../workspaceRoutes";
import "./task-conversation.css";

type Attachment = { name: string; text: string };
const statusLabels = { waiting: "正在思考", streaming: "正在回复", complete: "已完成", error: "回复失败", stopped: "已停止", local: "仅本地 · 未发送" };
const newId = () => crypto.randomUUID();

export default function TaskConversationPage({ projectId }: { projectId: string }) {
  const modelOptions = useModelOptions();
  const [task, setTask] = useState(() => loadTaskConversation(projectId));
  const [project, setProject] = useState(() => getProject(projectId));
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [speaking, setSpeaking] = useState("");
  const [previewOpen, setPreviewOpen] = useState(() => {
    try { return window.localStorage.getItem("designbuddy.task.preview.v1") !== "closed"; } catch { return true; }
  });
  const taskRef = useRef(task);
  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const startedAt = useRef(0);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const followBottom = useRef(true);
  const busy = activeId !== null;

  function persist(next: TaskConversation) {
    try { saveTaskConversation(next); }
    catch { if (mounted.current) setNotice("浏览器存储已满或不可用；本次回复仍在页面中，请及时复制或下载。"); }
  }
  function commit(next: TaskConversation, immediate = true) {
    taskRef.current = next;
    if (mounted.current) setTask(next);
    if (immediate) {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = null;
      persist(next);
    } else if (!persistTimer.current) {
      persistTimer.current = setTimeout(() => { persistTimer.current = null; if (taskRef.current) persist(taskRef.current); }, 200);
    }
  }
  function patch(id: string, changes: Partial<TaskMessage>, immediate = true) {
    if (taskRef.current) commit({ ...taskRef.current, messages: taskRef.current.messages.map((item) => item.id === id ? { ...item, ...changes } : item) }, immediate);
  }

  useEffect(() => {
    mounted.current = true;
    // Deferring until after StrictMode's setup/cleanup cycle avoids duplicate requests.
    const start = setTimeout(() => {
      const pending = sessionStorage.getItem(pendingTaskKey(projectId));
      if (!pending || !taskRef.current) return;
      sessionStorage.removeItem(pendingTaskKey(projectId));
      const user = taskRef.current.messages.at(-1);
      if (user?.role === "user") void runReply(user.id);
    }, 0);
    return () => {
      mounted.current = false;
      clearTimeout(start);
      controller.current?.abort();
      if (persistTimer.current) clearTimeout(persistTimer.current);
      if (taskRef.current) persist(taskRef.current);
      window.speechSynthesis?.cancel();
    };
  }, [projectId]);

  useEffect(() => {
    if (!busy) return;
    const timer = setInterval(() => setTick((value) => value + 1), 250);
    return () => clearInterval(timer);
  }, [busy]);
  useEffect(() => {
    if (followBottom.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [task?.messages, busy]);

  async function runReply(userId: string, retryId?: string) {
    const current = taskRef.current;
    if (!current || controller.current) return;
    const index = current.messages.findIndex((item) => item.id === userId && item.role === "user");
    if (index < 0) return;
    const user = current.messages[index];
    const id = retryId || newId();
    const reply: TaskMessage = { id, role: "assistant", content: "", createdAt: new Date().toISOString(), status: "waiting", elapsedMs: 0 };
    const history = current.messages.slice(0, index + 1);
    if (current.permission === "需要确认后执行" && !window.confirm("确认将本次问题和对话上下文发送给已配置的 AI 服务？")) {
      commit({ ...current, messages: [...history, { ...reply, status: "stopped", error: "已取消发送，没有请求 AI 服务。可点击重新生成再次确认。" }] });
      return;
    }
    commit({ ...current, messages: [...history, reply] });
    followBottom.current = true;
    if (current.permission === "仅本地") {
      patch(id, { status: "local", content: "已按“仅本地”策略保存问题，没有发送 AI 网络请求。你可以继续记录想法，或打开项目编辑器手动编辑。需要在线回复时，请先切换任务权限，再重新生成。" });
      return;
    }
    const abort = new AbortController();
    controller.current = abort;
    startedAt.current = performance.now();
    setActiveId(id);
    setNotice("");
    let content = "";
    let actualModel = "";
    try {
      if (current.mode === "office") {
        const messages = history.filter((item) => item.role === "user" || item.status === "complete")
          .map((item) => ({ role: item.role, content: item.requestContent || item.content }));
        if (messages.length > 60) throw new Error("本次对话已达到 60 条上下文限制，请新建任务继续。");
        await streamTaskReply({ messages, model: current.model || undefined, ...getAIProviderCredentials() }, abort.signal, (delta, model) => {
          content += delta;
          if (model) actualModel = model;
          patch(id, { content, status: "streaming", model: actualModel || undefined, elapsedMs: performance.now() - startedAt.current }, false);
        });
      } else {
        const latest = getProject(projectId);
        if (!latest) throw new Error("项目草稿已不存在，请重新创建任务。");
        const result = await generateProjectWithAI({ prompt: user.requestContent || user.content, projectName: latest.name, model: current.model || undefined, ...getAIProviderCredentials(), currentFiles: latest.files }, abort.signal);
        if (abort.signal.aborted) throw new DOMException("Aborted", "AbortError");
        const generated = result.files.map((file) => ({ ...file, language: file.language ?? (file.path.endsWith(".html") ? "html" as const : file.path.endsWith(".css") ? "css" as const : file.path.endsWith(".js") ? "javascript" as const : "text" as const) }));
        const extras = latest.files.filter((file) => !generated.some((entry) => entry.path === file.path));
        const saved = updateProject({ ...latest, files: [...generated, ...extras], updatedAt: new Date().toISOString() });
        if (mounted.current) setProject(saved);
        content = `已根据你的需求生成并保存了 **${generated.length} 个项目文件**。\n\n${generated.map((file) => `- \`${file.path}\``).join("\n")}\n\n可以打开项目编辑器查看预览和源码；如需调整，请继续告诉我。`;
        actualModel = result.model || "";
        patch(id, { artifact: true });
      }
      if (abort.signal.aborted) throw new DOMException("Aborted", "AbortError");
      patch(id, { content, model: actualModel || undefined, status: "complete", elapsedMs: performance.now() - startedAt.current });
    } catch (cause) {
      patch(id, { content, model: actualModel || undefined, status: abort.signal.aborted ? "stopped" : "error", error: abort.signal.aborted ? "已停止本次回复，收到的内容已保留。" : cause instanceof Error ? cause.message : "回复失败，请稍后重试。", elapsedMs: performance.now() - startedAt.current });
    } finally {
      if (controller.current === abort) controller.current = null;
      if (mounted.current) setActiveId(null);
    }
  }

  function send() {
    const value = draft.trim();
    const current = taskRef.current;
    if (!value || !current || controller.current) return;
    const attachmentText = attachments.map((file) => `\n\n--- 附件：${file.name} ---\n${file.text}`).join("");
    const user: TaskMessage = { id: newId(), role: "user", content: value, requestContent: value + attachmentText, createdAt: new Date().toISOString(), status: "complete" };
    commit({ ...current, messages: [...current.messages, user] });
    setDraft(""); setAttachments([]);
    void runReply(user.id);
  }

  async function readAttachments(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = "";
    const readable = files.filter((file) => (file.type.startsWith("text/") || /\.(txt|md|json|csv|html|css|js|xml|ya?ml)$/i.test(file.name)) && file.size <= 160_000);
    try {
      const values = await Promise.all(readable.map(async (file) => ({ name: file.name, text: (await file.text()).slice(0, 80_000) })));
      setAttachments((items) => [...items, ...values].slice(-4));
      if (readable.length !== files.length) setNotice("仅支持每个不超过 160 KB 的文本附件，最多保留 4 个；图片和 PDF 不会被解析。");
    } catch { setNotice("附件读取失败，请重新选择。"); }
  }
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setNotice("已复制到剪贴板。"); }
    catch { setNotice("剪贴板不可用，请选中文字手动复制。"); }
  }
  function exportChat() {
    if (!task) return;
    const text = `# ${project?.name || "任务对话"}\n\n` + task.messages.map((item) => `## ${item.role === "user" ? "你" : "WorkBuddy"}\n\n${item.content}${item.error ? `\n\n状态：${item.error}` : ""}`).join("\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "WorkBuddy-对话.md"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function speak(message: TaskMessage) {
    if (!("speechSynthesis" in window)) { setNotice("此浏览器不支持朗读。"); return; }
    window.speechSynthesis.cancel();
    if (speaking === message.id) { setSpeaking(""); return; }
    const speech = new SpeechSynthesisUtterance(message.content); speech.lang = "zh-CN";
    speech.onend = () => setSpeaking(""); speech.onerror = () => { setSpeaking(""); setNotice("朗读不可用，请检查浏览器语音支持。"); };
    setSpeaking(message.id); window.speechSynthesis.speak(speech);
  }
  function togglePreview() {
    setPreviewOpen((value) => {
      const next = !value;
      try { window.localStorage.setItem("designbuddy.task.preview.v1", next ? "open" : "closed"); } catch { /* 存储不可用时保持本次会话的选择 */ }
      return next;
    });
  }

  function changeSettings(changes: Partial<Pick<TaskConversation, "model" | "permission">>) {
    if (!taskRef.current || busy) return;
    commit({ ...taskRef.current, ...changes });
    if (project && changes.permission) {
      try { setProject(updateProject({ ...project, executionPolicy: changes.permission })); }
      catch { setNotice("项目策略未能保存，请检查浏览器存储。"); }
    }
  }

  if (!task || !project) return <main className="db-not-found"><h1>没有找到这个任务</h1><p>任务可能已删除，或保存在另一个浏览器中。</p><button onClick={() => navigateTo("/")}>返回首页</button></main>;
  const latestAssistant = [...task.messages].reverse().find((item) => item.role === "assistant")?.id;
  const matches = search.trim() ? task.messages.filter((item) => item.content.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())) : [];
  const elapsed = (message: TaskMessage) => Math.max(0, Math.floor((activeId === message.id ? performance.now() - startedAt.current : message.elapsedMs || 0) / 1000));
  void tick;

  return <div className="workbuddy-app task-workspace">
    <WorkBuddySidebar active="task" projectCount={listProjects().length} go={navigateTo} setNotice={setNotice} />
    <main className="task-main" aria-label="任务对话">
      <header className="task-topbar"><h1 title={project.name}>{project.name}</h1><div className="task-top-actions">
        <button aria-label={previewOpen ? "收起右侧预览" : "展开右侧预览"} aria-pressed={previewOpen} className={previewOpen ? "is-active" : ""} onClick={togglePreview}><HomeIcon name="panel" /></button>
        <button aria-label="搜索对话" aria-expanded={searchOpen} onClick={() => setSearchOpen((value) => !value)}><HomeIcon name="search" /></button>
        <button aria-label="复制分享文本" onClick={() => void copy(task.messages.map((item) => `${item.role === "user" ? "你" : "WorkBuddy"}：${item.content}`).join("\n\n"))}><HomeIcon name="share" /></button>
        <button aria-label="任务历史" aria-expanded={historyOpen} onClick={() => setHistoryOpen((value) => !value)}><HomeIcon name="history" /></button>
        <button aria-label="下载对话" onClick={exportChat}><HomeIcon name="document" /></button>
        <button aria-label="打开项目编辑器" onClick={() => navigateTo(`/editor/${encodeURIComponent(projectId)}`)}><HomeIcon name="panel" /></button>
      </div></header>
      {searchOpen && <div className="task-search"><input autoFocus aria-label="查找对话内容" placeholder="查找对话内容" value={search} onChange={(event) => setSearch(event.target.value)} /><span>{matches.length} 条匹配</span><button disabled={!matches.length} onClick={() => document.getElementById(`message-${matches[0]?.id}`)?.scrollIntoView({ block: "center" })}>定位</button></div>}
      {historyOpen && <aside className="task-history" aria-label="最近任务"><strong>最近任务</strong>{listProjects().slice(0, 12).map((item) => <button key={item.id} aria-current={item.id === projectId ? "page" : undefined} onClick={() => navigateTo(projectTaskPath(item.id))}>{item.name}</button>)}</aside>}
      <div className="task-scroll" ref={scroller} onScroll={() => { const el = scroller.current; if (el) followBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
        <div className="task-transcript" aria-label="对话记录">
          {task.messages.map((message) => message.role === "user" ? <article className="task-user-message" id={`message-${message.id}`} key={message.id} aria-label="你的问题"><p>{message.content}</p></article> : <article className="task-assistant-message" id={`message-${message.id}`} key={message.id} aria-label="WorkBuddy 回复" aria-busy={message.status === "waiting" || message.status === "streaming"}>
            <div className="task-assistant-brand"><span><HomeIcon name="assistant" size={19} /></span><strong>WorkBuddy</strong></div>
            <details className={`task-progress is-${message.status}`}><summary><span className={message.id === activeId ? "task-pulse" : ""}>{statusLabels[message.status]}{message.status !== "local" && ` ${elapsed(message)}s`}</span><HomeIcon name="chevron" size={10} /></summary><ol><li>已接收你的问题</li><li>{message.status === "local" ? "按本地策略保留草稿，未请求 AI" : message.status === "waiting" ? "已提交 AI 请求，等待服务返回" : message.status === "error" ? "服务返回错误或连接中断" : message.status === "stopped" ? "请求已停止，不会自动重发" : message.status === "streaming" ? "正在接收回复内容" : message.artifact ? "已生成文件并保存到本机项目" : "已接收完整回复"}</li></ol><small>这里显示请求执行状态，不是模型内部思维过程。</small></details>
            <div className="task-thinking-label">{task.mode === "office" ? "深度思考" : "设计生成"}{message.id === activeId && <span aria-hidden="true"> ···</span>}</div>
            {message.content && <div className="task-reply-markdown"><TaskMarkdown content={message.content} />{message.status === "streaming" && <span className="task-stream-cursor" aria-hidden="true" />}</div>}
            {message.status === "waiting" && <p className="task-waiting" role="status">正在等待 AI 服务回复…</p>}
            {message.error && <p className="task-message-error" role={message.status === "error" ? "alert" : "status"}>{message.error}</p>}
            {message.artifact && <button className="task-artifact" onClick={() => navigateTo(`/editor/${encodeURIComponent(projectId)}`)}><HomeIcon name="document" />打开生成的项目<HomeIcon name="chevron" size={12} /></button>}
            {message.id !== activeId && <div className="task-reply-actions">
              <button aria-label="复制回复" disabled={!message.content} onClick={() => void copy(message.content)}><HomeIcon name="copy" /></button>
              <button aria-label="赞同回复" aria-pressed={message.feedback === "up"} disabled={!message.content} onClick={() => patch(message.id, { feedback: message.feedback === "up" ? undefined : "up" })}><HomeIcon name="thumbsUp" /></button>
              <button aria-label="不赞同回复" aria-pressed={message.feedback === "down"} disabled={!message.content} onClick={() => patch(message.id, { feedback: message.feedback === "down" ? undefined : "down" })}><HomeIcon name="thumbsUp" /></button>
              <button aria-label={speaking === message.id ? "停止朗读" : "朗读回复"} disabled={!message.content} onClick={() => speak(message)}><HomeIcon name="speaker" /></button>
              <button aria-label="重新生成" disabled={busy || message.id !== latestAssistant} onClick={() => { const i = task.messages.findIndex((item) => item.id === message.id); const user = task.messages.slice(0, i).reverse().find((item) => item.role === "user"); if (user) void runReply(user.id, message.id); }}><HomeIcon name="refresh" /></button>
              <button aria-label="分享回复文本" disabled={!message.content} onClick={() => void copy(`WorkBuddy：\n${message.content}`)}><HomeIcon name="share" /></button>
              <button aria-label="AI 服务设置" onClick={() => setSettingsOpen((value) => !value)}><HomeIcon name="ellipsis" /></button>
              <span className="task-reply-meta"><HomeIcon name="step" size={13} />{message.model || (message.status === "complete" ? "AI 服务" : "未完成回复")}<time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</time></span>
            </div>}
          </article>)}
        </div>
      </div>
      <div className="task-composer-area">
        {notice && <div className="task-notice" role="status"><span>{notice}</span><button aria-label="关闭提示" onClick={() => setNotice("")}>×</button></div>}
        {settingsOpen && <div className="task-service-settings"><AIProviderSettings /></div>}
        <section className="task-composer" aria-label="继续对话">
          {attachments.length > 0 && <div className="task-attachments">{attachments.map((file, i) => <span key={`${file.name}-${i}`}>{file.name}<button aria-label={`移除附件 ${file.name}`} onClick={() => setAttachments((items) => items.filter((_, index) => index !== i))}>×</button></span>)}</div>}
          <PromptInput value={draft} onChange={setDraft} onSubmit={send} ariaLabel="继续描述任务" placeholder="今天要帮你做些什么？ @ 添加上下文，/ 调用技能与指令" rows={3} />
          <div className="task-composer-controls">
            <button className="task-icon-button" aria-label="添加附件" disabled={busy} onClick={() => fileInput.current?.click()}><HomeIcon name="plus" size={20} /></button>
            <input type="file" className="visually-hidden-input" ref={fileInput} multiple onChange={(event) => void readAttachments(event)} />
            <label className="task-policy"><HomeIcon name="shield" size={15} /><select aria-label="任务权限" value={task.permission} disabled={busy} onChange={(event) => changeSettings({ permission: event.target.value })}><option>默认权限</option><option>仅本地</option><option>需要确认后执行</option></select></label>
            <div className="task-send-controls"><label className="task-model"><HomeIcon name="step" size={13} /><select aria-label="对话模型" value={task.model} disabled={busy} onChange={(event) => changeSettings({ model: event.target.value })}>{!modelOptions.some(option => option.id === task.model) && <option value={task.model}>{task.model}（原任务模型）</option>}{modelOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
              <button className="task-icon-button" aria-label="语音输入" onClick={() => setNotice("语音输入尚未接入，请在输入框中描述任务。") }><HomeIcon name="microphone" size={15} /></button>
              {busy ? <button className="task-send is-stop" aria-label="停止生成" onClick={() => controller.current?.abort()}><HomeIcon name="stop" size={15} /></button> : <button className="task-send" aria-label="发送消息" disabled={!draft.trim()} onClick={send}><HomeIcon name="send" size={19} /></button>}
            </div>
          </div>
        </section>
        <p className="task-disclaimer">内容由 AI 生成，请核实重要信息</p>
      </div>
    </main>
    <TaskPreviewPanel project={project} open={previewOpen} onToggle={togglePreview} />
  </div>;
}
