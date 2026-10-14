import { useEffect, useMemo, useState, type FormEvent } from "react";
import { HomeIcon } from "../../../apps/web/src/components/HomeIcon";
import { WorkBuddySidebar } from "../../../apps/web/src/components/WorkBuddySidebar";
import { listProjects } from "../projectStore";
import { MarketNavigation } from "../MarketNavigation";
import { skillCatalog, skillCategories, featuredSkillBatches, skillSuites, type CatalogSkill } from "../skillCatalog";
import { useWorkspaceStore } from "../store";
import { navigateTo, resolveWorkspaceRoute, workspaceRoutes } from "../workspaceRoutes";
import "./skills.css";

function SkillIcon({ skill }: { skill: Pick<CatalogSkill, "icon" | "name"> }) {
  return skill.icon ? <img className="skill-tile-icon" src={skill.icon} alt="" width={49} height={49} />
    : <span className="skill-tile-icon skill-icon-fallback" aria-hidden="true">{skill.name.slice(0, 1)}</span>;
}

function SkillCard({ skill, featured, installed, onInstall }: { skill: CatalogSkill; featured?: boolean; installed: boolean; onInstall(): void }) {
  return <article className={`skill-tile ${featured ? "is-featured" : ""}`}>
    {featured && <span className="skill-recommendation"><HomeIcon name="thumbsUp" size={12} />{skill.recommendation}</span>}
    <button className="skill-tile-open" aria-label={`查看${skill.name}`} onClick={() => navigateTo(workspaceRoutes.skillDetail(skill.id))}>
      <SkillIcon skill={skill} /><span className="skill-tile-copy"><span className="skill-tile-title" title={skill.name}>{skill.name}</span><span className="skill-tile-description" title={skill.description}>{skill.description}</span></span>
    </button>
    <button className={`skill-install-button ${installed ? "is-installed" : ""}`} aria-label={installed ? `${skill.name}已安装` : `安装${skill.name}`} title={installed ? "已保存到本地技能列表" : "添加到本地技能列表，不安装外部程序"} disabled={installed} onClick={onInstall}><HomeIcon name={installed ? "check" : "plus"} size={16} /></button>
    <div className="skill-tile-stats" title="本地目录尚无使用统计；0 为占位值，不代表线上数据"><span><HomeIcon name="bolt" size={15} />0</span><span><HomeIcon name="checkCircle" size={14} />0</span></div>
  </article>;
}

export default function SkillsPage({ pathname }: { pathname: string }) {
  const route = resolveWorkspaceRoute(pathname);
  const installedView = route.page === "installed";
  const listing = route.page === "marketplace" || installedView;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");
  const [tab, setTab] = useState<"recommended" | "suites">("recommended");
  const [batch, setBatch] = useState(0);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newCategory, setNewCategory] = useState("效率工具");
  const skills = useWorkspaceStore((state) => state.skills);
  const setSkills = useWorkspaceStore((state) => state.setSkills);
  const upsertSkill = useWorkspaceStore((state) => state.upsertSkill);

  useEffect(() => {
    setSearch(""); setCategory("全部"); setTab("recommended"); setNotice(""); setError("");
    if (route.page === "create") { setName(""); setDescription(""); setNewCategory("效率工具"); }
  }, [pathname, route.page]);

  const installedIds = useMemo(() => new Set(skills.map((skill) => skill.id)), [skills]);
  const allSkills = useMemo<CatalogSkill[]>(() => {
    const custom = skills.filter((skill) => !skillCatalog.some((entry) => entry.id === skill.id));
    return [...skillCatalog, ...custom.map((skill) => ({ ...skill, custom: true }))];
  }, [skills]);
  const query = search.trim().toLocaleLowerCase();
  const visibleSkills = allSkills.filter((skill) => {
    const inView = installedView ? installedIds.has(skill.id) : query.length > 0 || category !== "全部" || !featuredSkillBatches[0].includes(skill.id);
    return inView && (category === "全部" || skill.category === category)
      && [skill.name, skill.description, skill.category].join(" ").toLocaleLowerCase().includes(query);
  });
  const featured = featuredSkillBatches[batch].map((id) => skillCatalog.find((skill) => skill.id === id)!);
  const selected = allSkills.find((skill) => skill.id === route.id);
  const suites = skillSuites.filter((suite) => [suite.name, suite.description, ...suite.skillIds.map((id) => skillCatalog.find((skill) => skill.id === id)?.name)].join(" ").toLocaleLowerCase().includes(query));

  function install(items: CatalogSkill[]) {
    try {
      const current = useWorkspaceStore.getState().skills;
      const additions = items.filter((item) => !current.some((skill) => skill.id === item.id));
      if (!additions.length) return;
      setSkills([...current, ...additions.map((item) => ({ id: item.id, name: item.name, description: item.description, category: item.category, status: "published" as const, createdAt: new Date().toISOString() }))]);
      setNotice(`已添加 ${additions.length} 项技能到本地列表。仅保存任务说明，不会安装外部程序或启用第三方服务。`);
    } catch { setError("保存失败，请检查浏览器本地存储权限。"); }
  }

  function remove(skill: CatalogSkill) {
    if (skill.custom && !window.confirm(`删除自建技能“${skill.name}”？此操作无法撤销。`)) return;
    try {
      setSkills(useWorkspaceStore.getState().skills.filter((item) => item.id !== skill.id));
      if (skill.custom) navigateTo(workspaceRoutes.installedSkills);
      else setNotice(`已从本地技能列表移除“${skill.name}”。`);
    } catch { setError("移除失败，请检查浏览器本地存储权限。"); }
  }

  function launch(skill: CatalogSkill) {
    try {
      sessionStorage.setItem("designbuddy.launch-context.v1", JSON.stringify({ skill: skill.custom ? `${skill.name}：${skill.description}` : skill.name }));
      navigateTo("/");
    } catch { setError("无法将技能带入任务，请检查浏览器会话存储权限。"); }
  }

  function saveSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) { setError("请先填写技能名称。"); return; }
    try {
      const id = crypto.randomUUID();
      upsertSkill({ id, name: name.trim(), description: description.trim(), category: newCategory, status: "draft", createdAt: new Date().toISOString() });
      navigateTo(workspaceRoutes.skillDetail(id));
    } catch { setError("保存失败，请检查浏览器本地存储权限。"); }
  }

  return <div className="workbuddy-app skills-workspace">
    <WorkBuddySidebar active="skills" projectCount={listProjects().length} go={navigateTo} setNotice={setNotice} />
    <div className="skills-main">
    <header className="skills-topbar">
      <MarketNavigation active="skills" />
      <div className="skills-header-actions">
        <label className="skills-search"><HomeIcon name="search" /><input type="search" aria-label="搜索技能" placeholder="搜索技能" value={search} disabled={!listing} onChange={(event) => setSearch(event.target.value)} /></label>
        <button className={`skills-installed-control ${installedView ? "is-active" : ""}`} onClick={() => navigateTo(installedView ? workspaceRoutes.skills : workspaceRoutes.installedSkills)}><HomeIcon name="installed" />已安装({skills.length})</button>
        <button className="skills-add-control" onClick={() => navigateTo(workspaceRoutes.createSkill)}><HomeIcon name="plus" size={19} />添加技能</button>
      </div>
    </header>
    <main className="skills-content" aria-label="技能市场">
      {notice && <div className="skills-notice" role="status"><span>{notice}</span><button aria-label="关闭提示" onClick={() => setNotice("")}>×</button></div>}
      {error && <div className="skills-error" role="alert"><span>{error}</span><button aria-label="关闭错误" onClick={() => setError("")}>×</button></div>}

      {listing && <>
        {!installedView && !query && <section className="skills-featured" aria-label="精选技能">
          <div className="skills-section-heading"><h1>精选技能</h1><button className="skills-refresh" onClick={() => setBatch((value) => (value + 1) % featuredSkillBatches.length)}><HomeIcon name="refresh" size={15} />换一批</button></div>
          <div className="skills-grid">{featured.map((skill) => <SkillCard key={skill.id} skill={skill} featured installed={installedIds.has(skill.id)} onInstall={() => install([skill])} />)}</div>
        </section>}
        <section className="skills-directory" aria-label={installedView ? "已安装技能" : "技能目录"}>
          <div className="skills-directory-heading">{installedView ? <><h1>已安装技能 <span>({skills.length})</span></h1><button className="skills-back-link" onClick={() => navigateTo(workspaceRoutes.skills)}>返回技能市场</button></> : <div className="skills-list-tabs" role="group" aria-label="技能类型"><button aria-pressed={tab === "recommended"} className={tab === "recommended" ? "is-active" : ""} onClick={() => setTab("recommended")}>推荐</button><button aria-pressed={tab === "suites"} className={tab === "suites" ? "is-active" : ""} onClick={() => setTab("suites")}>套件</button></div>}</div>
          {(tab === "recommended" || installedView) && <>
            <div className="skills-category-list" role="group" aria-label="技能分类">{skillCategories.map((item) => <button key={item} className={category === item ? "is-active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
            <div className="skills-grid">{visibleSkills.map((skill) => <SkillCard key={skill.id} skill={skill} installed={installedIds.has(skill.id)} onInstall={() => install([skill])} />)}</div>
            {visibleSkills.length === 0 && <div className="skills-empty" role="status"><HomeIcon name="tools" size={32} /><h2>{installedView && !skills.length ? "还没有安装技能" : "没有找到匹配的技能"}</h2><p>{installedView && !skills.length ? "在技能卡片上点击加号，即可保存到本地列表。" : "试试其他关键词或分类。"}</p>{installedView && <button className="skills-secondary" onClick={() => navigateTo(workspaceRoutes.skills)}>浏览技能市场</button>}</div>}
          </>}
          {tab === "suites" && !installedView && <>
            <div className="skills-grid skills-suite-grid">{suites.map((suite) => {
              const entries = suite.skillIds.map((id) => skillCatalog.find((skill) => skill.id === id)!);
              const ready = entries.every((skill) => installedIds.has(skill.id));
              return <article className="skill-suite" key={suite.id}><SkillIcon skill={suite} /><h2>{suite.name}</h2><p>{suite.description}</p><ul>{entries.map((skill) => <li key={skill.id}><button onClick={() => navigateTo(workspaceRoutes.skillDetail(skill.id))}>{skill.name}</button></li>)}</ul><button className="skills-primary" disabled={ready} onClick={() => install(entries)}>{ready ? "套件已安装" : `安装套件（${entries.length} 项）`}</button></article>;
            })}</div>
            {suites.length === 0 && <div className="skills-empty" role="status">没有找到匹配的套件，试试其他关键词。</div>}
          </>}
        </section>
      </>}

      {route.page === "create" && <form className="skills-detail-panel" onSubmit={saveSkill}>
        <button type="button" className="skills-back-link" onClick={() => navigateTo(workspaceRoutes.skills)}>← 返回技能市场</button>
        <h1>添加技能</h1><p>定义可重复使用的任务说明，保存为当前浏览器中的自建技能。</p>
        <label>技能名称<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：会议纪要整理" /></label>
        <label>技能分类<select value={newCategory} onChange={(event) => setNewCategory(event.target.value)}>{skillCategories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>技能说明<textarea rows={5} maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="描述工作步骤、输入和预期结果" /></label>
        <div className="skills-detail-actions"><button className="skills-primary" type="submit">保存技能</button><button className="skills-secondary" type="button" onClick={() => navigateTo(workspaceRoutes.skills)}>取消</button></div>
      </form>}
      {route.page === "detail" && <section className="skills-detail-panel">
        <button className="skills-back-link" onClick={() => navigateTo(workspaceRoutes.skills)}>← 返回技能市场</button>
        {selected ? <><SkillIcon skill={selected} /><h1>{selected.name}</h1><span className="skills-detail-category">{selected.category}</span><p>{selected.description}</p><div className="skills-service-note"><strong>使用说明</strong><p>安装仅保存本地技能说明，使用时将技能带入首页任务；不会安装依赖、执行外部程序或自动连接第三方服务。</p>{selected.requirement && <p>{selected.requirement}</p>}</div><div className="skills-detail-actions"><button className="skills-primary" onClick={() => launch(selected)}>用于任务</button>{installedIds.has(selected.id) ? <button className="skills-secondary" onClick={() => remove(selected)}>{selected.custom ? "删除自建技能" : "移除技能"}</button> : <button className="skills-secondary" onClick={() => install([selected])}>安装技能</button>}</div></> : <><h1>未找到该技能</h1><p>该技能可能已移除，或未保存在当前浏览器中。</p></>}
      </section>}
    </main>
    </div>
  </div>;
}
