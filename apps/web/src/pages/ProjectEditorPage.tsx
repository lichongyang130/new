import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { DesignProject, ProjectFile } from "../models/project";
import { getProject, updateProject } from "../store/projectStore";
import { navigateTo } from "../router/workspaceRoutes";
import { generateProjectWithAI } from "../api/generation";
import { saveProjectToCloud } from "../api/projects";
import { downloadProjectZip } from "../utils/zip";

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
  const [saveFailed, setSaveFailed] = useState(false);
  const [assistantDraft, setAssistantDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudSaved, setCloudSaved] = useState(false);

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
      setSaveFailed(false);
      setCloudSaved(false);
      setNotice("");
    } catch (cause) {
      setSaveFailed(true);
      setNotice(cause instanceof Error ? cause.message : "保存失败。");
    }
  }

  function renameProject() {
    const nextName = window.prompt("项目名称", project.name);
    if (!nextName?.trim()) return;
    try {
      setProject(updateProject({ ...project, name: nextName.trim().slice(0, 80) }));
      setSaveFailed(false);
      setNotice("项目名称已更新。");
    } catch (cause) {
      setSaveFailed(true);
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

  async function submitAssistant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = assistantDraft.trim();
    if (!prompt || generating) return;
    setGenerating(true);
    setNotice("");
    try {
      const result = await generateProjectWithAI({
        prompt,
        projectName: project.name,
        currentFiles: project.files.map(({ path, content, language }) => ({ path, content, language: language === "html" || language === "css" || language === "javascript" ? language : undefined })),
      });
      const generatedFiles: ProjectFile[] = result.files.map((file) => ({
        path: file.path,
        content: file.content,
        language: file.language ?? (file.path.endsWith(".html") ? "html" : file.path.endsWith(".css") ? "css" : file.path.endsWith(".js") ? "javascript" : "text"),
      }));
      const next: DesignProject = {
        ...project,
        name: result.name?.trim() || project.name,
        prompt: prompt,
        files: generatedFiles,
        updatedAt: new Date().toISOString(),
      };
      const saved = updateProject(next);
      setProject(saved);
      setSaveFailed(false);
      setCloudSaved(false);
      setAssistantDraft("");
      setNotice("AI 已返回源码并更新本机项目。请检查预览，确认后再同步云端。");
      setView("preview");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "AI 生成失败；现有项目未更改。");
    } finally {
      setGenerating(false);
    }
  }

  async function syncToCloud() {
    if (cloudBusy) return;
    setCloudBusy(true);
    setNotice("");
    try {
      await saveProjectToCloud(project);
      setCloudSaved(true);
      setNotice("云端服务已确认保存该项目。");
    } catch (cause) {
      setCloudSaved(false);
      setNotice(cause instanceof Error ? cause.message : "云端同步失败。");
    } finally {
      setCloudBusy(false);
    }
  }

  function downloadZip() {
    try {
      downloadProjectZip(project.name, project.files.map(({ path, content }) => ({ path, content })));
      setNotice("项目 ZIP 已开始下载。");
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "ZIP 导出失败。");
    }
  }

  return (
    <main className="db-editor-page">
      <header className="db-editor-header">
        <button className="db-back-button" onClick={() => navigateTo("/projects")} aria-label="返回项目列表">← <span>项目</span></button>
        <div className="db-editor-project-name">
          <strong>{project.name}</strong>
          <button onClick={renameProject} aria-label="重命名项目">✎</button>
          <span className={saveFailed ? "db-save-state is-error" : "db-save-state"}><i />{saveFailed ? "保存失败" : cloudSaved ? "云端已同步" : "已保存在本机"}</span>
        </div>
        <div className="db-editor-header-actions">
          <button className={view === "code" ? "db-button db-button-secondary is-selected" : "db-button db-button-secondary"} onClick={() => setView("code")}>{"</>"} 代码</button>
          <button className={view === "preview" ? "db-button db-button-secondary is-selected" : "db-button db-button-secondary"} onClick={() => setView("preview")}>◫ 预览</button>
          <button className="db-button db-button-secondary" onClick={downloadZip}>下载 ZIP</button>
          <button className="db-button db-button-secondary" onClick={() => void syncToCloud()} disabled={cloudBusy}>{cloudBusy ? "同步中…" : "同步云端"}</button>
          <button className="db-button db-button-primary" onClick={() => void copySource()}>复制源码 <span>↗</span></button>
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
            <p>描述要调整的布局、配色或内容。AI 返回的源码会先保存在本机，确认预览后再同步到云端。</p>
          </div>
          <div className="db-assistant-status"><i /> 当前项目为本机草稿模式</div>
          <form className="db-assistant-composer" onSubmit={submitAssistant}>
            <textarea value={assistantDraft} onChange={(event) => setAssistantDraft(event.target.value)} placeholder="例如：把页面改成深色风格，并加入价格方案…" rows={5} />
            <button type="submit" disabled={!assistantDraft.trim() || generating}>{generating ? "正在生成…" : "生成并应用源码"} <span>↗</span></button>
          </form>
          <div className="db-assistant-footnote">AI 生成需要配置服务端 API 密钥；云端同步需要已登录的 API 服务。失败时会显示具体原因，不会覆盖当前项目。</div>
        </aside>
      </div>
    </main>
  );
}
