import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { HomeIcon } from "../../../apps/web/src/components/HomeIcon";
import { WorkBuddySidebar } from "../../../apps/web/src/components/WorkBuddySidebar";
import { expertCatalog, expertCategories, expertCollections, expertTeams, type CatalogExpert } from "../expertCatalog";
import { MarketNavigation } from "../MarketNavigation";
import { listProjects } from "../projectStore";
import { useWorkspaceStore } from "../store";
import { navigateTo, resolveWorkspaceRoute, workspaceRoutes } from "../workspaceRoutes";
import "./experts.css";

type Sort = "综合" | "最热" | "最新";

function scrollNext(element: HTMLDivElement | null) {
  if (!element) return;
  const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
  element.scrollTo({ left: end ? 0 : element.scrollLeft + element.clientWidth * 0.8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

function Avatar({ expert }: { expert: CatalogExpert }) {
  return expert.avatar
    ? <img className="expert-avatar" src={expert.avatar} alt="" width={48} height={48} />
    : <span className="expert-avatar expert-avatar-fallback" aria-hidden="true">{expert.name.slice(0, 1)}</span>;
}

export default function ExpertsPage({ pathname }: { pathname: string }) {
  const route = resolveWorkspaceRoute(pathname);
  const mine = route.page === "mine";
  const listing = route.page === "marketplace" || mine;
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");
  const [tab, setTab] = useState<"experts" | "teams">("experts");
  const [sort, setSort] = useState<Sort>("综合");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const experts = useWorkspaceStore((state) => state.experts);
  const upsertExpert = useWorkspaceStore((state) => state.upsertExpert);
  const collectionsRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotice("");
    setError("");
    setSearch("");
    setCategory("全部");
    setTab("experts");
    if (route.page === "create") { setName(""); setDescription(""); }
  }, [pathname, route.page]);

  const customExperts = useMemo<CatalogExpert[]>(() => experts.map((expert) => ({
    id: expert.id,
    name: expert.name,
    description: expert.description || "自定义专家，继续完善你的专业能力。",
    category: "我的专家",
    tags: expert.skills.length ? expert.skills.slice(0, 2) : ["自定义专家", expert.status === "draft" ? "草稿" : "已启用"],
    createdAt: expert.createdAt,
    custom: true,
  })), [experts]);
  const allExperts = useMemo(() => [...customExperts, ...expertCatalog], [customExperts]);
  const visibleExperts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const filtered = (mine ? customExperts : allExperts).filter((expert) =>
      (mine || category === "全部" || expert.category === category)
      && [expert.name, expert.description, expert.category, ...expert.tags].join(" ").toLocaleLowerCase().includes(query));
    if (sort === "最热") filtered.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    if (sort === "最新") filtered.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return filtered;
  }, [allExperts, customExperts, mine, category, search, sort]);
  const visibleTeams = expertTeams.filter((team) => [team.name, team.description, ...team.members].join(" ").includes(search.trim()));
  const selectedExpert = allExperts.find((expert) => expert.id === route.id);

  function launch(expert: string) {
    try {
      sessionStorage.setItem("designbuddy.launch-context.v1", JSON.stringify({ expert }));
      navigateTo("/");
    } catch { setError("无法将专家带入任务，请检查浏览器会话存储权限。"); }
  }

  function saveExpert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) { setError("请先填写专家名称。"); return; }
    try {
      const id = crypto.randomUUID();
      upsertExpert({ id, name: name.trim(), description: description.trim(), skills: [], capabilities: [], status: "draft", createdAt: new Date().toISOString() });
      navigateTo(workspaceRoutes.expertDetail(id));
    } catch { setError("保存失败，请检查浏览器本地存储权限。"); }
  }

  return <div className="workbuddy-app expert-workspace">
    <WorkBuddySidebar active="experts" projectCount={listProjects().length} go={navigateTo} setNotice={setNotice} />
    <main className="experts-main" aria-label="专家工作区">
      <header className="experts-topbar">
        <MarketNavigation active="experts" className="experts-main-nav" />
        <label className="experts-search"><HomeIcon name="search" /><input type="search" aria-label="搜索专家" placeholder={mine ? "搜索我的专家" : "搜索专家"} value={search} disabled={!listing} onChange={(event) => setSearch(event.target.value)} /></label>
        <button className={`experts-mine-button ${mine ? "is-active" : ""}`} onClick={() => navigateTo(workspaceRoutes.myExperts)}><HomeIcon name="assistant" />我的专家</button>
      </header>
      <div className="experts-content">
        {notice && <div className="experts-message" role="status">{notice}<button aria-label="关闭提示" onClick={() => setNotice("")}>×</button></div>}
        {error && <div className="experts-message is-error" role="alert">{error}<button aria-label="关闭错误" onClick={() => setError("")}>×</button></div>}

        {listing && <>
          {!mine && <section className="expert-collections" aria-label="专家专题">
            <div className="expert-collection-track" ref={collectionsRef}>
              {expertCollections.map((collection) => <article className="expert-collection" key={collection.title}>
                <div className={`expert-collection-banner banner-${collection.tone}`}>
                  {collection.art && <img src={collection.art} alt="" />}
                  <h2>{collection.title}</h2>
                </div>
                <div className="expert-collection-links">{collection.items.map((item) => <button key={item} onClick={() => launch(item)} title={`使用${item}`}><span>{item}</span><HomeIcon name="chevron" size={10} /></button>)}</div>
              </article>)}
            </div>
            <button className="expert-scroll-next" aria-label="查看更多专家专题" onClick={() => scrollNext(collectionsRef.current)}><HomeIcon name="chevron" size={12} /></button>
          </section>}

          <section className="expert-directory" aria-label={mine ? "我的专家列表" : "专家目录"}>
            <div className="expert-directory-toolbar">
              {mine ? <h1>我的专家</h1> : <div className="expert-list-tabs" role="group" aria-label="专家类型">
                <button aria-pressed={tab === "experts"} className={tab === "experts" ? "is-active" : ""} onClick={() => setTab("experts")}>专家</button>
                <button aria-pressed={tab === "teams"} className={tab === "teams" ? "is-active" : ""} onClick={() => setTab("teams")}>专家团</button>
              </div>}
              {mine && <button className="expert-create-button" onClick={() => navigateTo(workspaceRoutes.createExpert)}><HomeIcon name="plus" />创建专家</button>}
              {(tab === "experts" || mine) && <div className="expert-sort" role="group" aria-label="专家排序">{(["综合", "最热", "最新"] as Sort[]).map((item) => <button key={item} aria-pressed={sort === item} className={sort === item ? "is-active" : ""} title={item === "最热" ? "按示例热度排序，非实时数据" : item === "最新" ? "按自建专家创建时间排序，内置专家保持目录顺序" : "目录默认顺序"} onClick={() => setSort(item)}>{item}</button>)}</div>}
            </div>
            {tab === "experts" && !mine && <div className="expert-categories">
              <div className="expert-category-track" ref={categoriesRef} role="group" aria-label="专家分类">{expertCategories.map((item) => <button key={item} className={category === item ? "is-active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
              <button className="expert-scroll-next" aria-label="查看更多专家分类" onClick={() => scrollNext(categoriesRef.current)}><HomeIcon name="chevron" size={12} /></button>
            </div>}
            {tab === "experts" || mine ? <>
              <div className="expert-card-grid">{visibleExperts.map((expert) => <button className="expert-directory-card" key={expert.id} aria-label={`查看${expert.name}`} onClick={() => navigateTo(workspaceRoutes.expertDetail(expert.id))}>
                <span className="expert-card-heading"><Avatar expert={expert} /><span className="expert-card-copy"><span className="expert-card-name" title={expert.name}>{expert.name}</span><span className="expert-card-description" title={expert.description}>{expert.description}</span></span>{expert.featured && <span className="expert-featured"><HomeIcon name="shield" size={12} />精选</span>}</span>
                <span className="expert-card-tags">{expert.tags.map((tag) => <span key={tag}>{tag}</span>)}</span>
                <span className="expert-card-popularity" title={expert.custom ? "保存在当前浏览器的自定义专家" : "参考截图的示例热度，非实时使用数据"}><HomeIcon name="bolt" size={15} />{expert.popularity === undefined ? "自建专家" : `${expert.popularity}w`}</span>
              </button>)}</div>
              {visibleExperts.length === 0 && <div className="expert-empty" role="status"><HomeIcon name="experts" size={32} /><h2>{mine && !search ? "还没有自己的专家" : "没有找到匹配的专家"}</h2><p>{mine && !search ? "定义一个专业角色，保存后即可用于任务。" : "试试其他关键词，或切换专家分类。"}</p>{mine && <button className="expert-primary" onClick={() => navigateTo(workspaceRoutes.createExpert)}>创建第一个专家</button>}</div>}
            </> : <>
              <div className="expert-team-grid">{visibleTeams.map((team) => <article className="expert-team-card" key={team.name}><HomeIcon name="experts" size={26} /><h2>{team.name}</h2><p>{team.description}</p><div className="expert-card-tags">{team.members.map((member) => <span key={member}>{member}</span>)}</div><button className="expert-primary" onClick={() => launch(`${team.name}（${team.members.join("、")}）`)}>开始协作</button></article>)}</div>
              {visibleTeams.length === 0 && <p className="expert-empty" role="status">没有找到匹配的专家团，试试其他关键词。</p>}
            </>}
          </section>
        </>}

        {route.page === "create" && <form className="expert-detail-panel" onSubmit={saveExpert}>
          <button type="button" className="expert-back" onClick={() => navigateTo(workspaceRoutes.myExperts)}>← 返回我的专家</button>
          <h1>创建你的专家</h1><p>定义专家的专业方向和职责，保存到当前浏览器。</p>
          <label>专家名称<input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：产品分析专家" maxLength={80} required /></label>
          <label>职责描述<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="描述专家擅长的工作、输入与输出" rows={5} maxLength={4000} /></label>
          <button className="expert-primary" type="submit">保存专家</button>
        </form>}
        {route.page === "detail" && <section className="expert-detail-panel">
          <button className="expert-back" onClick={() => navigateTo(selectedExpert?.custom ? workspaceRoutes.myExperts : workspaceRoutes.experts)}>← 返回专家列表</button>
          {selectedExpert ? <><Avatar expert={selectedExpert} /><h1>{selectedExpert.name}</h1><p>{selectedExpert.description}</p><div className="expert-card-tags">{selectedExpert.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><p className="expert-detail-note">{selectedExpert.custom ? "该专家保存在当前浏览器，可将角色带入首页任务。" : "内置示例角色，非官方认证服务；回复依赖任务所配置的 AI 服务。"}</p><button className="expert-primary" onClick={() => launch(selectedExpert.name)}>用于任务</button></> : <><h1>未找到该专家</h1><p>该专家可能尚未创建，或不在当前浏览器中。</p></>}
        </section>}
      </div>
    </main>
  </div>;
}
