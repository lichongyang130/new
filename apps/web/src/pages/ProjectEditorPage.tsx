import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { DesignProject, ProjectFile } from "../models/project";
import { getProject, updateProject } from "../store/projectStore";
import { navigateTo } from "../router/workspaceRoutes";

function buildPreviewDocument(files: ProjectFile[]): string {
  const htmlFile = files.find((file) => file.path === "index.html");
  const css = files.find((file) => file.path === "src/styles.css")?.content ?? "";
  const js = files.find((file) => file.path === "src/main.js")?.content ?? "";
  let html = htmlFile?.content ?? "<!doctype html><html><body><h1>新建页面</h1></body></html>";
  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const safeJs = js.replace(/<\/script/gi, "<\\/script");
  html = html.replace(/<link[^>]+href=["']\.\/src\/styles\.css["'][^>]*>/i, `<style>${safeCss}</style>`);
  html = html.replace(/<script[^>]+src=["']\.\/src\/main\.js["'][^>]*><\/script>/i, `<script>${safeJs}<\/script>`);
  return html;
}

export default function ProjectEditorPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<DesignProject | null>(() => getProject(projectId) ?? null);
  const [activePath, setActivePath] = useState("index.html");
  const [view, setView] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [notice, setNotice] = useState("");
  const [assistantDraft, setAssistantDraft] = useState("");

  useEffect(() => {
    setProject(getProject(projectId) ?? null);
    setActivePath("index.html");
    setNotice("");
  }, [projectId]);

  const activeFile = project?.files.find((file) => file.path === activePath) ?? project?.files[0];
  const previewDocument = useMemo(() => buildPreviewDocument(project?.files ?? []), [project?.files]);

  if (!project) {
    return (
      <main className="db-not-found">
        <h1>没有找到这个项目</h1>
        <p>项目可能已删除，或保存在另一个浏览器中。</p>
        <button className="db-button db-button-primary" onClick={() => navigateTo("/projects")}>返回项目列表</button>
      </main>
    );
  }

  function changeFile(nextContent: string) {
    if (!project || !activeFile) return;
    const updated: DesignProject = {
      ...project,
      files: project.files.map((file) => file.path === activeFile.path ? { ...file, content: nextContent } : file),
      updatedAt: new Date().toISOString(),
    };
    try {
      const saved = updateProject(updated);
      setProject(saved);
      setNotice("修改已保存在此浏览器中。");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "保存失败。");
    }
  }

  function renameProject() {
    const nextName = window.prompt("项目名称", project.name);
    if (!nextName?.trim()) return;
    try {
      setProject(updateProject({ ...project, name: nextName.trim().slice(0, 80) }));
      setNotice("项目名称已更新。");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "重命名失败。");
    }
  }

  async function copySource() {
    try {
      await navigator.clipboard.writeText(project.files.map((file) => `/* ${file.path} */\n${file.content}`).join("\n\n"));
      setNotice("项目源码已复制到剪贴板。");
    } catch {
      setNotice("浏览器未授予剪贴板权限，请在代码模式中手动复制。");
    }
  }

  function submitAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assistantDraft.trim()) return;
    setNotice("需求已记录。当前版本尚未连接 AI 生成接口，因此不会伪称已经自动修改项目。你可以在代码模式中编辑文件并立即预览。");
    setAssistantDraft("");
  }

  return (
    <main className="db-editor-page">
      <header className="db-editor-header">
        <button className="db-back-button" onClick={() => navigateTo("/projects")} aria-label="返回项目列表">← <span>项目</span></button>
        <div className="db-editor-project-name">
          <strong>{project.name}</strong>
          <button onClick={renameProject} aria-label="重命名项目">✎</button>
          <span className="db-save-state"><i /> 已保存</span>
        </div>
        <div className="db-editor-header-actions">
          <button className={view === "code" ? "db-button db-button-secondary is-selected" : "db-button db-button-secondary"} onClick={() => setView("code")}>{"</>"} 代码</button>
          <button className={view === "preview" ? "db-button db-button-secondary is-selected" : "db-button db-button-secondary"} onClick={() => setView("preview")}>◫ 预览</button>
          <button className="db-button db-button-primary" onClick={() => void copySource()}>导出源码 <span>↗</span></button>
        </div>
      </header>

      <div className="db-editor-layout">
        <aside className="db-file-sidebar">
          <div className="db-panel-heading"><span>项目文件</span><span>{project.files.length}</span></div>
          <div className="db-file-list">
            {project.files.map((file) => (
              <button key={file.path} className={activePath === file.path ? "db-file-item is-active" : "db-file-item"} onClick={() => setActivePath(file.path)}>
                <span className={`db-file-badge db-file-${file.language}`}>{file.language === "html" ? "H" : file.language === "css" ? "#" : file.language === "javascript" ? "JS" : "{}"}</span>
                <span>{file.path}</span>
              </button>
            ))}
          </div>
          <div className="db-file-sidebar-note">
            <strong>需求描述</strong>
            <p>{project.prompt || "尚未填写需求描述。"}</p>
          </div>
        </aside>

        <section className="db-editor-main">
          <div className="db-canvas-toolbar">
            <div className="db-canvas-tabs">
              <button className={view === "preview" ? "is-active" : ""} onClick={() => setView("preview")}>设计预览</button>
              <button className={view === "code" ? "is-active" : ""} onClick={() => setView("code")}>源代码</button>
            </div>
            {view === "preview" && (
              <div className="db-device-picker" aria-label="预览设备">
                <button title="桌面" aria-label="桌面预览" className={device === "desktop" ? "is-active" : ""} onClick={() => setDevice("desktop")}>▰</button>
                <button title="平板" aria-label="平板预览" className={device === "tablet" ? "is-active" : ""} onClick={() => setDevice("tablet")}>▯</button>
                <button title="手机" aria-label="手机预览" className={device === "mobile" ? "is-active" : ""} onClick={() => setDevice("mobile")}>▏</button>
              </div>
            )}
          </div>
          {view === "preview" ? (
            <div className="db-live-preview-stage">
              <div className={`db-preview-frame db-preview-${device}`}>
                <iframe title={`${project.name} 实时预览`} sandbox="allow-scripts" srcDoc={previewDocument} />
              </div>
              <p className="db-preview-caption">沙盒预览 · 不会访问项目之外的本机文件</p>
            </div>
          ) : (
            <div className="db-code-editor">
              <div className="db-code-file-header"><span>{activeFile?.path ?? "index.html"}</span><span>{activeFile?.language ?? "text"}</span></div>
              <textarea
                aria-label={`${activeFile?.path ?? "源文件"} 源码`}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                value={activeFile?.content ?? ""}
                onChange={(event) => changeFile(event.target.value)}
              />
              <p className="db-code-hint">源文件修改后会自动保存在本机，切换到“设计预览”查看结果。</p>
            </div>
          )}
          {notice && <p className="db-editor-notice" role="status">{notice}</p>}
        </section>

        <aside className="db-assistant-sidebar">
          <div className="db-panel-heading"><span>AI 设计助手</span><span className="db-beta">预览版</span></div>
          <div className="db-assistant-intro">
            <div className="db-assistant-avatar">✳</div>
            <h2>继续打磨你的想法</h2>
            <p>描述要调整的布局、配色或内容。接入 AI 服务后，这里将生成可审阅的代码变更。</p>
          </div>
          <div className="db-assistant-status"><i /> 当前项目为本机草稿模式</div>
          <form className="db-assistant-composer" onSubmit={submitAssistant}>
            <textarea value={assistantDraft} onChange={(event) => setAssistantDraft(event.target.value)} placeholder="例如：把页面改成深色风格，并加入价格方案…" rows={5} />
            <button type="submit" disabled={!assistantDraft.trim()}>记录修改需求 <span>↗</span></button>
          </form>
          <div className="db-assistant-footnote">不会伪造 AI 生成结果。当前可在代码模式编辑，并即时查看预览。</div>
        </aside>
      </div>
    </main>
  );
}
