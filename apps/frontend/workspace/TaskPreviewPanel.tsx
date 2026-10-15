import { useEffect, useMemo, useState } from "react";
import { HomeIcon } from "../../apps/web/src/components/HomeIcon";
import type { DesignProject } from "./models/project";
import { buildPreviewDocument } from "./utils/previewDocument";
import { navigateTo } from "./workspaceRoutes";

export type TaskPreviewDevice = "desktop" | "tablet" | "mobile";

const DEVICE_OPTIONS: { value: TaskPreviewDevice; label: string; glyph: string }[] = [
  { value: "desktop", label: "桌面", glyph: "▰" },
  { value: "tablet", label: "平板", glyph: "▯" },
  { value: "mobile", label: "手机", glyph: "▏" },
];

export interface TaskPreviewPanelProps {
  project: DesignProject;
  open: boolean;
  onToggle: () => void;
}

/**
 * Right-hand live preview for a task conversation.
 *
 * The generated project is bundled into one standalone document and rendered in
 * a sandboxed iframe, so a preview is available immediately and never reaches
 * files outside the project.
 */
export default function TaskPreviewPanel({ project, open, onToggle }: TaskPreviewPanelProps) {
  const [device, setDevice] = useState<TaskPreviewDevice>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const previewDocument = useMemo(
    // Element picking belongs to the project editor; the conversation preview stays read-only.
    () => buildPreviewDocument(project.files, false),
    [project.files]
  );

  const hasPage = project.files.some((file) => file.path === "index.html" && file.content.trim());

  // Reload the sandbox whenever the saved project changes.
  useEffect(() => setRefreshKey((value) => value + 1), [project.updatedAt, project.files]);

  const updatedAt = useMemo(() => {
    const date = new Date(project.updatedAt);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }, [project.updatedAt]);

  function openInEditor() {
    navigateTo(`/editor/${encodeURIComponent(project.id)}`);
  }

  if (!open) {
    return (
      <aside className="task-preview-rail" aria-label="展开右侧预览">
        <button type="button" aria-label="展开右侧预览" aria-expanded={false} title="展开右侧预览" onClick={onToggle}>
          <HomeIcon name="panel" size={18} />
          <span>预览</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="task-preview-panel" aria-label="实时预览">
      <header className="task-preview-header">
        <div className="task-preview-title">
          <strong>实时预览</strong>
          <span>{project.files.length} 个文件{updatedAt ? ` · ${updatedAt}` : ""}</span>
        </div>
        <div className="task-preview-actions">
          <div className="task-preview-devices" role="group" aria-label="预览设备">
            {DEVICE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={device === option.value ? "is-active" : ""}
                aria-pressed={device === option.value}
                title={`${option.label}预览`}
                aria-label={`${option.label}预览`}
                onClick={() => setDevice(option.value)}
              >
                <span aria-hidden="true">{option.glyph}</span>
              </button>
            ))}
          </div>
          <button type="button" aria-label="刷新预览" title="刷新预览" onClick={() => setRefreshKey((value) => value + 1)}>
            <HomeIcon name="refresh" size={16} />
          </button>
          <button type="button" aria-label="在项目编辑器中打开" title="在项目编辑器中打开" onClick={openInEditor}>
            <HomeIcon name="pencil" size={16} />
          </button>
          <button type="button" aria-label="收起右侧预览" title="收起右侧预览" aria-expanded onClick={onToggle}>
            <HomeIcon name="chevron" size={14} />
          </button>
        </div>
      </header>

      <div className="task-preview-stage">
        {hasPage ? (
          <div className={`task-preview-frame task-preview-frame--${device}`}>
            <iframe
              key={refreshKey}
              className="task-preview-iframe"
              title={`${project.name} 实时预览`}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              srcDoc={previewDocument}
            />
          </div>
        ) : (
          <div className="task-preview-empty" role="status">
            <span aria-hidden="true">▱</span>
            <strong>还没有可预览的页面</strong>
            <p>在左侧用「代码开发」或「设计创意」模式描述需求，生成网页后会自动显示在这里。</p>
          </div>
        )}
      </div>

      <footer className="task-preview-footer">
        <span>沙盒预览 · 不会访问项目之外的本机文件</span>
        <button type="button" onClick={openInEditor}>打开编辑器 <HomeIcon name="chevron" size={11} /></button>
      </footer>
    </aside>
  );
}
