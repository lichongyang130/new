import { useEffect, useMemo, useState } from "react";
import { beginConnectorOAuth } from "../api/connectors";
import type { Connector, Expert, Skill } from "../models/workspace";
import { navigateTo, normalizeAppPath, resolveWorkspaceRoute, workspaceRoutes } from "../router/workspaceRoutes";
import { useWorkspaceStore, workspaceStore } from "../store/workspaceStore";

type HubSection = "experts" | "skills" | "connectors";

const expertCategories = ["全部", "OPC-一人公司", "腾讯专家", "高校新生攻略", "产品设计", "技术工程", "金融投资"];
const featuredExperts = [
  { name: "高级开发工程师", role: "技术工程", description: "10年以上全栈经验，擅长复杂系统架构与工程效率提升。", tags: ["全栈开发", "架构设计"], usage: "1630.37w", avatar: "⌘", tone: "violet" },
  { name: "产品策略顾问", role: "产品设计", description: "从用户研究到产品路线图，帮助想法快速变成可执行方案。", tags: ["产品规划", "用户研究"], usage: "928.6w", avatar: "✳", tone: "blue" },
  { name: "小红书增长专家", role: "OPC-一人公司", description: "制定内容策略、账号定位与可持续的增长计划。", tags: ["内容运营", "增长策略"], usage: "786.2w", avatar: "✿", tone: "coral" },
  { name: "金融研究分析师", role: "金融投资", description: "整理公开信息、分析行业趋势并构建研究框架。", tags: ["行业研究", "数据分析"], usage: "642.8w", avatar: "↗", tone: "green" },
  { name: "高校求职导师", role: "高校新生攻略", description: "简历优化、面试准备与校园职业发展规划。", tags: ["求职规划", "简历优化"], usage: "521.4w", avatar: "✦", tone: "amber" },
  { name: "腾讯产品专家", role: "腾讯专家", description: "聚焦产品体验、协作流程与商业化落地。", tags: ["产品方法", "体验设计"], usage: "418.9w", avatar: "◈", tone: "cyan" },
];
const expertCollections = [
  { title: "开学季", subtitle: "从校园生活到职业启程", tone: "lavender", icon: "✦", items: ["校园求职导师", "论文写作导师", "校园活动策划"] },
  { title: "内容创作", subtitle: "让每个创意都更有影响力", tone: "peach", icon: "✎", items: ["内容创作专家团", "小红书运营专家"] },
  { title: "投资分析", subtitle: "用研究框架辅助理性决策", tone: "mint", icon: "↗", items: ["股票研究专家", "投资顾问"] },
];
const featuredSkills = [
  { name: "AI设计技能", category: "视觉设计", description: "生成页面布局、配色方案与可复用设计规范。", icon: "✧", tone: "violet" },
  { name: "代码开发技能", category: "技术工程", description: "协助编写、解释、重构代码并定位常见问题。", icon: "</>", tone: "blue" },
  { name: "办公效率技能", category: "日常办公", description: "整理资料、提炼重点、生成会议纪要与文档。", icon: "▤", tone: "green" },
  { name: "产品管理技能", category: "产品设计", description: "把产品想法转化为需求、流程和优先级计划。", icon: "◫", tone: "amber" },
  { name: "视觉设计技能", category: "视觉设计", description: "优化视觉层级、组件状态和跨页面一致性。", icon: "◉", tone: "coral" },
];
const providers: Array<Pick<Connector, "id" | "name" | "description" | "provider" | "status" | "scopes">> = [
  { id: "github", name: "GitHub", description: "连接代码仓库，协作处理代码、Issue 与 Pull Request。", provider: "github", status: "disconnected", scopes: ["repo"] },
  { id: "figma", name: "Figma", description: "连接设计文件与团队设计资产。", provider: "notion", status: "disconnected", scopes: ["read_content"] },
  { id: "notion", name: "Notion", description: "搜索和读取工作区知识、项目文档与资料。", provider: "notion", status: "disconnected", scopes: ["read_content"] },
  { id: "feishu", name: "飞书", description: "连接文档、消息与团队协作空间。", provider: "google", status: "disconnected", scopes: ["drive.readonly"] },
  { id: "database", name: "数据库", description: "为项目接入结构化数据源与查询工作流。", provider: "microsoft", status: "disconnected", scopes: ["files.read"] },
  { id: "cloud", name: "云服务", description: "为后续部署、存储与运行环境集成做好准备。", provider: "microsoft", status: "disconnected", scopes: ["files.read"] },
];
const connectorMarks: Record<string, string> = { github: "⌘", figma: "◈", notion: "N", feishu: "飞", database: "▦", cloud: "☁" };

export default function WorkspaceHub() {
  const [pathname, setPathname] = useState(normalizeAppPath(window.location.pathname));
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部");
  const [expertTab, setExpertTab] = useState<"experts" | "teams">("experts");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const experts = useWorkspaceStore((state) => state.experts);
  const skills = useWorkspaceStore((state) => state.skills);
  const connectors = useWorkspaceStore((state) => state.connectors);

  useEffect(() => {
    const updatePath = () => setPathname(normalizeAppPath(window.location.pathname));
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  const route = resolveWorkspaceRoute(pathname);
  const section: HubSection = route.section === "skills" || route.section === "connectors" ? route.section : "experts";
  const go = (path: string) => {
    navigateTo(path);
    setPathname(normalizeAppPath(window.location.pathname));
    setError("");
    setToast("");
  };
  const saveExpert = () => {
    if (!name.trim()) { setError("请先填写专家名称"); return; }
    const expert: Expert = { id: crypto.randomUUID(), name: name.trim(), description: description.trim(), skills: [], capabilities: [], status: "draft", createdAt: new Date().toISOString() };
    workspaceStore.upsertExpert(expert);
    setName(""); setDescription(""); go(workspaceRoutes.expertDetail(expert.id));
  };
  const saveSkill = () => {
    if (!name.trim()) { setError("请先填写技能名称"); return; }
    const skill: Skill = { id: crypto.randomUUID(), name: name.trim(), description: description.trim(), category: "通用办公", status: "draft", createdAt: new Date().toISOString() };
    workspaceStore.upsertSkill(skill);
    setName(""); setDescription(""); go(workspaceRoutes.skills);
  };
  const startOAuth = async (provider: Connector["provider"]) => {
    setBusy(provider); setError("");
    try {
      const result = await beginConnectorOAuth(provider);
      if (!result.authorizationUrl || !/^https:\/\//i.test(result.authorizationUrl)) throw new Error("授权服务未返回有效的 HTTPS 授权地址");
      window.location.assign(result.authorizationUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "无法启动授权。请确认后端 OAuth 接口已配置。");
    } finally { setBusy(""); }
  };

  const visibleExperts = useMemo(() => {
    const builtIns = featuredExperts.filter((item) => (category === "全部" || item.role === category) && (item.name + item.description + item.role + item.tags.join(" ")).toLowerCase().includes(search.toLowerCase()));
    const custom = experts.filter((item) => (item.name + item.description).toLowerCase().includes(search.toLowerCase())).map((item) => ({
      name: item.name, role: "我的专家", description: item.description || "自定义专家，点击查看详情并继续完善能力。", tags: item.skills.length ? item.skills.slice(0, 2) : ["自定义专家", "草稿"], usage: "新建", avatar: item.name.slice(0, 1), tone: "violet", id: item.id,
    }));
    return [...custom, ...builtIns];
  }, [category, experts, search]);

  const heading = route.section === "experts" && route.page === "create" ? "创建专家" : route.section === "skills" && route.page === "create" ? "创建技能" : route.page === "detail" ? "专家详情" : section === "skills" ? "技能市场" : section === "connectors" ? "连接器市场" : "发现优秀专家";
  const navTabs: Array<{ id: HubSection; label: string; path: string }> = [
    { id: "experts", label: "专家", path: workspaceRoutes.experts },
    { id: "skills", label: "技能", path: workspaceRoutes.skills },
    { id: "connectors", label: "连接器", path: workspaceRoutes.connectors },
  ];

  return <div className="wb-hub">
    <aside className="wb-hub-sidebar">
      <button className="wb-hub-brand" onClick={() => go("/")} aria-label="返回 DesignBuddy 首页"><span className="wb-brand-symbol">✦</span><span><strong>DesignBuddy</strong><small>AI 设计工作台</small></span></button>
      <button className="wb-back-workspace" onClick={() => go("/")}>‹ <span>返回工作台</span></button>
      <div className="wb-side-caption">工作空间</div>
      <button className="wb-side-link" onClick={() => go("/")}><span>⌂</span>工作台</button>
      <div className="wb-side-caption wb-side-caption-spaced">发现与扩展</div>
      {navTabs.map((item) => <button key={item.id} className={"wb-side-link" + (section === item.id ? " is-active" : "")} onClick={() => go(item.path)}><span>{item.id === "experts" ? "♙" : item.id === "skills" ? "✧" : "⌘"}</span>{item.label}{section === item.id && <i />}</button>)}\n      <button className="wb-side-link" onClick={() => { window.location.href = "/library"; }}><span>◈</span>设计资产中心</button>
      <div className="wb-sidebar-spacer" />
      <div className="wb-sidebar-tip"><span>✦</span><strong>让专业能力成为生产力</strong><p>组合专家、技能与连接器，打造适合自己的工作流。</p></div>
      <div className="wb-profile"><span className="wb-profile-avatar">D</span><span><strong>DesignBuddy</strong><small>个人工作空间</small></span><span className="wb-profile-more">•••</span></div>
    </aside>

    <main className="wb-hub-main">
      <header className="wb-hub-topbar">
        <div className="wb-breadcrumb">工作台 <span>/</span> 专家 · 技能 · 连接器</div>
        <div className="wb-topbar-actions"><button onClick={() => setToast("当前为 DesignBuddy 个人工作空间。")}>ⓘ <span>帮助</span></button><span className="wb-top-avatar">D</span></div>
      </header>
      <div className="wb-hub-content">
        <nav className="wb-hub-tabs" aria-label="专家技能连接器导航">
          {navTabs.map((item) => <button key={item.id} className={section === item.id ? "is-active" : ""} onClick={() => go(item.path)}>{item.label}{section === item.id && <i />}</button>)}
          <span className="wb-tabs-fill" />
          <button className="wb-tab-secondary" onClick={() => go(workspaceRoutes.myExperts)}>我的专家 <span className="wb-count">{experts.length}</span></button>
        </nav>

        {error && <div className="wb-hub-alert" role="alert">{error}<button onClick={() => setError("")}>×</button></div>}
        {toast && <div className="wb-hub-toast" role="status">{toast}<button onClick={() => setToast("")}>×</button></div>}

        {route.section === "experts" && route.page === "create" && <section className="wb-form-panel"><div className="wb-section-kicker">MY EXPERT</div><h1>创建你的专家</h1><p>定义一个可复用的专业角色，让日常工作更高效。</p><label>专家名称<input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：产品分析专家" /></label><label>职责描述<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述专家擅长的工作、输入与输出" rows={4} /></label><div className="wb-form-actions"><button className="wb-btn-quiet" onClick={() => go(workspaceRoutes.experts)}>取消</button><button className="wb-btn-primary" onClick={saveExpert}>保存专家</button></div></section>}

        {route.section === "skills" && route.page === "create" && <section className="wb-form-panel"><div className="wb-section-kicker">MY SKILL</div><h1>创建新技能</h1><p>把常用步骤沉淀成可重复使用的工作能力。</p><label>技能名称<input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：会议纪要整理" /></label><label>技能说明<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述技能用途与预期结果" rows={4} /></label><div className="wb-form-actions"><button className="wb-btn-quiet" onClick={() => go(workspaceRoutes.skills)}>取消</button><button className="wb-btn-primary" onClick={saveSkill}>保存技能</button></div></section>}

        {route.section === "experts" && route.page === "detail" && <section className="wb-form-panel"><button className="wb-back-inline" onClick={() => go(workspaceRoutes.experts)}>← 返回专家广场</button>{experts.find((item) => item.id === route.id) ? <><div className="wb-expert-avatar tone-violet">{experts.find((item) => item.id === route.id)?.name.slice(0, 1)}</div><h1>{experts.find((item) => item.id === route.id)?.name}</h1><p>{experts.find((item) => item.id === route.id)?.description || "尚未填写职责描述"}</p><h3>能力配置</h3><p>技能：{experts.find((item) => item.id === route.id)?.skills.join("、") || "尚未关联技能"}</p><p>能力：{experts.find((item) => item.id === route.id)?.capabilities.join("、") || "尚未配置能力"}</p></> : <p>未找到该专家，请返回专家广场选择或新建专家。</p>}</section>}

        {route.section === "experts" && route.page !== "create" && route.page !== "detail" && <div className="wb-experts-view">
          <section className="wb-expert-hero">
            <div className="wb-hero-copy"><div className="wb-section-kicker">EXPERT WORKSPACE</div><h1>找到你的专属专家</h1><p>汇集专业经验与实战方法，让每一个复杂任务都有得力助手。</p><div className="wb-hero-metrics"><span><strong>{featuredExperts.length + experts.length}</strong> 位精选专家</span><i /><span><strong>20+</strong> 专业领域</span><i /><span><strong>持续更新</strong> 能力库</span></div></div>
            <div className="wb-hero-art" aria-hidden="true"><span className="wb-art-orbit orbit-one" /><span className="wb-art-orbit orbit-two" /><span className="wb-art-spark spark-one">✦</span><span className="wb-art-spark spark-two">✧</span><div className="wb-art-avatar avatar-one">✳</div><div className="wb-art-avatar avatar-two">⌘</div><div className="wb-art-avatar avatar-three">◈</div><div className="wb-art-center">✦</div></div>
          </section>
          <div className="wb-search-row"><label className="wb-search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索专家名称、能力或领域" /><kbd>⌘ K</kbd></label><button className="wb-btn-primary" onClick={() => go(workspaceRoutes.createExpert)}>＋ 我的专家</button></div>
          <section className="wb-collections-section"><div className="wb-section-heading"><div><h2>为你推荐</h2><p>从热门场景开始，快速找到合适的专业伙伴</p></div><button onClick={() => setToast("已为你展示当前全部推荐分类。")}>查看全部 <span>→</span></button></div><div className="wb-collection-grid">{expertCollections.map((item) => <button key={item.title} className={"wb-collection-card tone-" + item.tone} onClick={() => { setCategory(item.title === "投资分析" ? "金融投资" : item.title === "开学季" ? "高校新生攻略" : "OPC-一人公司"); document.querySelector(".wb-expert-list-section")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span className="wb-collection-icon">{item.icon}</span><span className="wb-collection-title">{item.title}</span><span className="wb-collection-subtitle">{item.subtitle}</span><span className="wb-collection-items">{item.items.map((label) => <i key={label}>{label}</i>)}</span><span className="wb-collection-arrow">↗</span></button>)}</div></section>
          <section className="wb-expert-list-section"><div className="wb-section-heading wb-list-heading"><div><h2>专家广场</h2><p>发现值得加入工作流的专业能力</p></div><div className="wb-segmented"><button className={expertTab === "experts" ? "is-active" : ""} onClick={() => setExpertTab("experts")}>专家</button><button className={expertTab === "teams" ? "is-active" : ""} onClick={() => setExpertTab("teams")}>专家团</button></div></div><div className="wb-category-chips">{expertCategories.map((item) => <button key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="wb-expert-grid">{visibleExperts.map((item) => <article className="wb-expert-card" key={String("id" in item ? item.id : item.name)}><div className="wb-expert-card-top"><div className={"wb-expert-avatar tone-" + item.tone}>{item.avatar}</div><button className="wb-card-more" aria-label={"更多关于" + item.name} onClick={() => setToast(item.name + "：可从专家详情了解能力与使用方式。")}>•••</button></div><div className="wb-expert-card-title">{item.name}</div><div className="wb-expert-role">{item.role}</div><p>{item.description}</p><div className="wb-expert-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="wb-expert-card-footer"><span>◉ <strong>{item.usage}</strong> 使用</span><button onClick={() => setToast("已选择「" + item.name + "」。自定义专家可进入我的专家继续配置。")}>使用专家 <span>→</span></button></div></article>)}</div>{visibleExperts.length === 0 && <div className="wb-empty-state">没有找到匹配的专家，试试其他关键词或分类。</div>}</section>
        </div>}

        {route.section === "skills" && route.page !== "create" && <div className="wb-market-view"><section className="wb-market-hero skill-hero"><div className="wb-section-kicker">SKILL LIBRARY</div><h1>把好方法，变成可复用的技能</h1><p>为 DesignBuddy 添加专业能力，让重复工作更简单，让创意落地更快。</p><button className="wb-btn-primary" onClick={() => go(workspaceRoutes.createSkill)}>＋ 创建技能</button><div className="wb-skill-hero-decoration">✧</div></section><label className="wb-market-search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索技能名称或使用场景" /></label><div className="wb-section-heading"><div><h2>精选技能</h2><p>覆盖设计、开发、办公与产品管理场景</p></div><span className="wb-results-count">{featuredSkills.length + skills.length} 项能力</span></div><div className="wb-skill-grid">{[...featuredSkills, ...skills.map((item) => ({ name: item.name, category: item.category, description: item.description || item.category, icon: "✧", tone: "violet" }))].filter((item) => (item.name + item.category + item.description).toLowerCase().includes(search.toLowerCase())).map((item) => <article className="wb-skill-card" key={item.name}><div className={"wb-skill-icon tone-" + item.tone}>{item.icon}</div><span className="wb-skill-category">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p><div className="wb-skill-card-bottom"><span>可添加至工作流</span><button onClick={() => setToast("已选择技能「" + item.name + "」。技能执行器接入后即可加入工作流。")}>查看技能 <span>→</span></button></div></article>)}</div><div className="wb-create-inline"><div><strong>有自己的工作方法？</strong><p>将它整理为专属技能，在不同项目中重复使用。</p></div><button className="wb-btn-quiet" onClick={() => go(workspaceRoutes.createSkill)}>创建自定义技能 →</button></div></div>}

        {route.section === "connectors" && <div className="wb-market-view"><section className="wb-market-hero connector-hero"><div className="wb-section-kicker">CONNECTED WORKSPACE</div><h1>连接你每天使用的工具</h1><p>将设计、文档、代码与数据整合到一个工作空间，减少来回切换。</p><div className="wb-connector-hero-pills"><span>设计协作</span><span>知识管理</span><span>开发工具</span><span>数据与云服务</span></div><div className="wb-connector-hero-decoration">⌘</div></section><label className="wb-market-search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索连接器或工具类型" /></label><div className="wb-section-heading"><div><h2>可用连接器</h2><p>按需连接外部工具，授权状态会显示在对应卡片中</p></div><span className="wb-results-count">{connectors.filter((item) => item.status === "connected").length} 个已连接</span></div><div className="wb-connector-grid">{providers.filter((item) => (item.name + item.description).toLowerCase().includes(search.toLowerCase())).map((provider) => { const current = connectors.find((item) => item.id === provider.id); const connected = current?.status === "connected"; return <article className="wb-connector-card" key={provider.id}><div className="wb-connector-card-head"><div className={"wb-connector-logo logo-" + provider.id}>{connectorMarks[provider.id]}</div><span className={"wb-connection-status" + (connected ? " is-connected" : "")}><i />{connected ? "已连接" : "未连接"}</span></div><h3>{provider.name}</h3><p>{provider.description}</p><div className="wb-connector-card-bottom"><span>{provider.id === "database" ? "数据工具" : provider.id === "cloud" ? "云服务" : provider.id === "figma" ? "设计工具" : provider.id === "github" ? "开发工具" : provider.id === "feishu" ? "协作工具" : "知识管理"}</span>{["github", "notion"].includes(provider.id) ? <button disabled={busy === provider.provider} onClick={() => void startOAuth(provider.provider)}>{busy === provider.provider ? "连接中…" : connected ? "管理连接" : "授权连接"} <span>→</span></button> : <button onClick={() => setToast(provider.name + "连接器卡片已就绪；该服务的 OAuth/API 适配尚未配置。")}>查看接入方式 <span>→</span></button>}</div></article>; })}</div><p className="wb-connector-note">安全提示：授权流程由服务端启动与回调，客户端不会收集或保存第三方密钥。部分连接器目前为展示与接入规划状态。</p></div>}
      </div>
    </main>
  </div>;
}
