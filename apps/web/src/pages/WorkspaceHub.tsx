import { useEffect, useState } from "react";
import { beginConnectorOAuth } from "../api/connectors";
import type { Connector, Expert, Skill } from "../models/workspace";
import { navigateTo, normalizeAppPath, resolveWorkspaceRoute, workspaceRoutes } from "../router/workspaceRoutes";
import { useWorkspaceStore, workspaceStore } from "../store/workspaceStore";

const buttonStyle: React.CSSProperties = { border: "1px solid #e1e5eb", borderRadius: 10, padding: "9px 13px", background: "#fff", cursor: "pointer", color: "#202632" };
const primaryStyle: React.CSSProperties = { ...buttonStyle, background: "#6758e8", color: "#fff", borderColor: "#6758e8" };
const panelStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e9ebf0", borderRadius: 16, padding: 22 };
const providers: Array<Pick<Connector, "id" | "name" | "description" | "provider" | "status" | "scopes">> = [
  { id: "google", name: "Google Workspace", description: "连接 Drive、Docs 与日历", provider: "google", status: "disconnected", scopes: ["drive.readonly", "calendar.readonly"] },
  { id: "microsoft", name: "Microsoft 365", description: "连接 OneDrive、Outlook 与 Office", provider: "microsoft", status: "disconnected", scopes: ["files.read", "mail.read"] },
  { id: "notion", name: "Notion", description: "搜索和读取工作区知识", provider: "notion", status: "disconnected", scopes: ["read_content"] },
  { id: "github", name: "GitHub", description: "访问仓库、Issue 与 Pull Request", provider: "github", status: "disconnected", scopes: ["repo"] },
];

export default function WorkspaceHub() {
  const [pathname, setPathname] = useState(normalizeAppPath(window.location.pathname));
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const experts = useWorkspaceStore((state) => state.experts);
  const skills = useWorkspaceStore((state) => state.skills);
  const connectors = useWorkspaceStore((state) => state.connectors);
  useEffect(() => {
    const updatePath = () => setPathname(normalizeAppPath(window.location.pathname));
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);
  const route = resolveWorkspaceRoute(pathname);
  const go = (path: string) => { navigateTo(path); setPathname(normalizeAppPath(window.location.pathname)); setError(""); };
  const saveExpert = () => {
    if (!name.trim()) { setError("请先填写名称"); return; }
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
  const heading = route.section === "experts" ? "专家中心" : route.section === "skills" ? "技能中心" : "连接器中心";
  const nav = [
    ["专家广场", workspaceRoutes.experts, "experts"], ["我的专家", workspaceRoutes.myExperts, "experts"],
    ["创建专家", workspaceRoutes.createExpert, "experts"], ["技能市场", workspaceRoutes.skills, "skills"],
    ["创建技能", workspaceRoutes.createSkill, "skills"], ["连接器授权", workspaceRoutes.connectors, "connectors"],
  ] as const;
  const card = (title: string, desc: string, action: () => void, label: string) => <article key={title} style={panelStyle}><h3 style={{ marginTop: 0 }}>{title}</h3><p style={{ color: "#6b7280", minHeight: 40 }}>{desc}</p><button style={buttonStyle} onClick={action}>{label}</button></article>;

  return <div style={{ minHeight: "100vh", background: "#f7f8fb", color: "#202632", display: "flex", fontFamily: "Inter, system-ui, sans-serif" }}>
    <aside style={{ width: 228, flexShrink: 0, padding: 20, background: "#fff", borderRight: "1px solid #e9ebf0" }}>
      <strong style={{ display: "block", fontSize: 20, marginBottom: 28 }}>DesignBuddy</strong>
      <button style={{ ...buttonStyle, width: "100%", textAlign: "left", marginBottom: 18 }} onClick={() => go("/")}>← 返回工作台</button>
      <div style={{ fontSize: 12, color: "#8b91a0", margin: "12px 8px" }}>专家 · 技能 · 连接器</div>
      {nav.map(([label, path, section]) => <button key={path} style={{ ...buttonStyle, display: "block", width: "100%", textAlign: "left", marginBottom: 7, background: route.section === section && pathname === path ? "#f0efff" : "#fff", borderColor: route.section === section && pathname === path ? "#d8d3ff" : "#e1e5eb" }} onClick={() => go(path)}>{label}</button>)}
    </aside>
    <main style={{ flex: 1, padding: "36px clamp(20px, 4vw, 64px)", maxWidth: 1440 }}>
      <div style={{ color: "#747b8b", fontSize: 13, marginBottom: 8 }}>工作台 / 专家 · 技能 · 连接器</div>
      <h1 style={{ fontSize: 30, margin: "0 0 8px" }}>{heading}</h1>
      <p style={{ color: "#737b8a", marginTop: 0, marginBottom: 28 }}>集中管理可复用的专业能力、自动化技能与外部工作空间连接。</p>
      {error && <div role="alert" style={{ ...panelStyle, color: "#b42318", marginBottom: 16 }}>{error}</div>}
      {route.section === "experts" && route.page === "create" && <section style={{ ...panelStyle, maxWidth: 680 }}><h2>创建专家</h2><label style={{ display: "block", marginBottom: 14 }}>专家名称<input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：产品分析专家" style={{ display: "block", boxSizing: "border-box", width: "100%", padding: 12, marginTop: 7, border: "1px solid #d9dde6", borderRadius: 8 }} /></label><label style={{ display: "block", marginBottom: 18 }}>职责描述<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="说明专家擅长的工作、输入和输出" rows={4} style={{ display: "block", boxSizing: "border-box", width: "100%", padding: 12, marginTop: 7, border: "1px solid #d9dde6", borderRadius: 8 }} /></label><button style={primaryStyle} onClick={saveExpert}>保存专家</button></section>}
      {route.section === "skills" && route.page === "create" && <section style={{ ...panelStyle, maxWidth: 680 }}><h2>创建技能</h2><label style={{ display: "block", marginBottom: 14 }}>技能名称<input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：会议纪要整理" style={{ display: "block", boxSizing: "border-box", width: "100%", padding: 12, marginTop: 7, border: "1px solid #d9dde6", borderRadius: 8 }} /></label><label style={{ display: "block", marginBottom: 18 }}>技能说明<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述技能的用途和预期结果" rows={4} style={{ display: "block", boxSizing: "border-box", width: "100%", padding: 12, marginTop: 7, border: "1px solid #d9dde6", borderRadius: 8 }} /></label><button style={primaryStyle} onClick={saveSkill}>保存技能</button></section>}
      {route.section === "experts" && route.page !== "create" && <><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h2>{route.page === "mine" ? "我的专家" : route.page === "detail" ? "专家详情" : "专家广场"}</h2><button style={primaryStyle} onClick={() => go(workspaceRoutes.createExpert)}>＋ 创建专家</button></div>{route.page === "detail" ? <>{experts.find((item) => item.id === route.id) ? <div style={panelStyle}><h2>{experts.find((item) => item.id === route.id)?.name}</h2><p>{experts.find((item) => item.id === route.id)?.description || "暂无职责描述"}</p><h3>能力配置</h3><p>技能：{experts.find((item) => item.id === route.id)?.skills.join("、") || "尚未关联技能"}</p><p>能力：{experts.find((item) => item.id === route.id)?.capabilities.join("、") || "尚未配置能力"}</p></div> : <div style={panelStyle}>未找到该专家。请从专家广场选择或新建专家。</div>}</> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>{(route.page === "mine" ? experts : experts).length ? (route.page === "mine" ? experts : experts).map((item) => card(item.name, item.description || "尚未填写介绍", () => go(workspaceRoutes.expertDetail(item.id)), "查看详情")) : <div style={panelStyle}>暂无专家。创建专家后会显示在这里。</div>}</div>}</>}
      {route.section === "skills" && route.page !== "create" && <><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h2>技能市场</h2><button style={primaryStyle} onClick={() => go(workspaceRoutes.createSkill)}>＋ 创建技能</button></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>{skills.length ? skills.map((item) => card(item.name, item.description || item.category, () => setError(`技能「${item.name}」已选中`), item.status === "published" ? "已发布" : "草稿")) : <div style={panelStyle}>暂无技能。创建技能后会显示在这里。</div>}</div></>}
      {route.section === "connectors" && <><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}><h2>连接外部服务</h2><span style={{ color: "#737b8a", fontSize: 13 }}>OAuth 由服务端启动和回调</span></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>{providers.map((provider) => { const current = connectors.find((item) => item.id === provider.id); return <article key={provider.id} style={panelStyle}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><h3 style={{ marginTop: 0 }}>{provider.name}</h3><span style={{ fontSize: 12, color: current?.status === "connected" ? "#16803d" : "#737b8a" }}>{current?.status === "connected" ? "已连接" : "未连接"}</span></div><p style={{ color: "#6b7280", minHeight: 40 }}>{provider.description}</p><button disabled={busy === provider.provider} style={primaryStyle} onClick={() => void startOAuth(provider.provider)}>{busy === provider.provider ? "正在跳转…" : "授权连接"}</button></article>; })}</div><p style={{ color: "#737b8a", fontSize: 13, marginTop: 18 }}>提示：OAuth 需要后端实现 /api/connectors/oauth/start、校验 state/PKCE 并安全保存令牌。此页面不会收集或存储客户端密钥。</p></>}
    </main>
  </div>;
}
