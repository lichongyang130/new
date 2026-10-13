import { useMemo, useState } from "react";
import type { DesignProject } from "../models/project";
import { createProject, listProjects, removeProject } from "../store/projectStore";
import { navigateTo } from "../router/workspaceRoutes";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚更新";
  return new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DesignProject[]>(() => listProjects());
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  const visibleProjects = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return needle ? projects.filter((project) =>
      project.name.toLocaleLowerCase().includes(needle) || project.prompt.toLocaleLowerCase().includes(needle)
    ) : projects;
  }, [projects, query]);

  function newProject() {
    try {
      const project = createProject("", "未命名设计项目");
      setProjects(listProjects());
      navigateTo(`/editor/${encodeURIComponent(project.id)}`);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "创建项目失败。");
    }
  }

  function deleteProject(project: DesignProject) {
    if (!window.confirm(`确定删除「${project.name}」吗？此操作会删除本机保存的项目草稿。`)) return;
    removeProject(project.id);
    setProjects(listProjects());
  }

  return (
    <main className="db-page">
      <header className="db-page-header">
        <div>
          <p className="db-eyebrow">YOUR WORKSPACE</p>
          <h1>我的项目</h1>
          <p>管理你的设计草稿，继续编辑或打开实时预览。</p>
        </div>
        <button className="db-button db-button-primary" onClick={newProject}>＋ 新建项目</button>
      </header>
      <div className="db-project-toolbar">
        <label className="db-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索项目名称或需求" aria-label="搜索项目" />
        </label>
        <span className="db-muted">{visibleProjects.length} 个项目</span>
      </div>
      {notice && <p className="db-alert" role="alert">{notice}</p>}
      {visibleProjects.length > 0 ? (
        <section className="db-project-grid" aria-label="项目列表">
          {visibleProjects.map((project) => (
            <article className="db-project-card" key={project.id}>
              <button className="db-project-thumbnail" onClick={() => navigateTo(`/editor/${encodeURIComponent(project.id)}`)} aria-label={`打开项目 ${project.name}`}>
                <div className="db-thumb-nav" />
                <div className="db-thumb-title" />
                <div className="db-thumb-title db-thumb-title-short" />
                <div className="db-thumb-cards"><i /><i /><i /></div>
              </button>
              <div className="db-project-card-body">
                <div className="db-project-title-row">
                  <h2>{project.name}</h2>
                  <button className="db-icon-button" aria-label={`删除项目 ${project.name}`} onClick={() => deleteProject(project)}>删除</button>
                </div>
                <p>{project.prompt || "从一个空白项目开始设计。"}</p>
                <div className="db-project-meta">
                  <span><i className="db-status-dot" />草稿</span>
                  <span>更新于 {formatDate(project.updatedAt)}</span>
                </div>
                <button className="db-button db-button-secondary db-open-project" onClick={() => navigateTo(`/editor/${encodeURIComponent(project.id)}`)}>继续编辑 <span>→</span></button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="db-empty-state">
          <div className="db-empty-icon">✳</div>
          <h2>{query ? "没有找到匹配的项目" : "从第一个设计开始"}</h2>
          <p>{query ? "试试其他关键词，或清空搜索条件。" : "创建项目后，源文件、编辑内容和设计需求会保存在当前浏览器中。"}</p>
          {!query && <button className="db-button db-button-primary" onClick={newProject}>创建第一个项目</button>}
          {query && <button className="db-button db-button-secondary" onClick={() => setQuery("")}>清空搜索</button>}
        </section>
      )}
      <p className="db-storage-note">当前版本将项目草稿保存在本机浏览器。跨设备同步和账号云端保存尚未接入。</p>
    </main>
  );
}
