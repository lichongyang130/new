import { useMemo, useState } from "react";
import designSystems from "../../../design-systems/catalog.json";
import templates from "../../../design-templates/catalog.json";
import plugins from "../../../plugins/_official/catalog.json";
import skills from "../../../skills/catalog.json";

type Tab = "systems" | "templates" | "plugins" | "skills" | "runtime";
type Item = { id: string; name: string; category: string; description: string; image?: string; cover?: string; tags?: string[]; screenCount?: number; screens?: Array<{id:string;name:string;kind:string;image:string;interactions:string[]}>; primary?: string; philosophy?: string; permissions?: string[]; risk?: string; level?: string; outputs?: string[] };
const tabs: Array<{id:Tab;label:string;eyebrow:string;title:string;description:string}> = [
 {id:"systems",label:"设计系统",eyebrow:"DESIGN SYSTEMS",title:"从设计规范，到一致的产品体验",description:"180 套可组合的设计语言，包含颜色、字体、间距、圆角、组件清单与无障碍基线。"},
 {id:"templates",label:"商业模板",eyebrow:"COMMERCIAL TEMPLATES",title:"从真实业务场景开始",description:"1130 个商业模板系列，每个系列包含 24 个页面/状态场景，并提供图片预览与交互清单。"},
 {id:"plugins",label:"官方插件",eyebrow:"OFFICIAL PLUGINS",title:"把工具能力接入工作流",description:"480 个插件能力定义，按设计、开发、质量、数据、办公、多媒体和交付分类。"},
 {id:"skills",label:"技能库",eyebrow:"PROFESSIONAL SKILLS",title:"把专家方法沉淀为可复用技能",description:"180 项可组合技能，覆盖设计、工程、产品、研究、质量、办公与 AI Agent。"},
 {id:"runtime",label:"插件运行时",eyebrow:"PLUGIN RUNTIME",title:"可治理、可追踪、可扩展的插件底座",description:"统一 manifest、权限确认、运行事件、超时控制和插件注册表，危险能力默认要求用户确认。"}
];
const runtimeCapabilities = [
 ["Manifest 校验","插件 ID、版本、入口和权限声明统一校验。"],
 ["最小权限","按能力请求权限，不默认授予写文件、网络、命令或密钥权限。"],
 ["人工确认门","对写入、外网访问、命令执行等操作逐次展示审批说明。"],
 ["事件追踪","统一 started / progress / completed / failed 事件，供任务时间线消费。"],
 ["超时保护","为执行设置默认超时并提供可配置上限。"],
 ["可替换注册表","按 ID 注册、查询与枚举插件定义，方便接入 UI 和服务端。"]
];
export default function DesignLibrary() {
 const [tab,setTab]=useState<Tab>("systems");
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState("全部");
 const [selected,setSelected]=useState<Item|null>(null);
 const [notice,setNotice]=useState("");
 const active=tabs.find(t=>t.id===tab)!;
 const allItems=useMemo(() => (tab==="systems"?designSystems:tab==="templates"?templates:tab==="plugins"?plugins:tab==="skills"?skills:[]) as Item[],[tab]);
 const categories=useMemo(()=>["全部",...new Set(allItems.map(i=>i.category))],[allItems]);
 const visible=allItems.filter(i=>(category==="全部"||i.category===category)&&(i.name+" "+i.description+" "+i.category).toLowerCase().includes(query.toLowerCase()));
 function changeTab(next:Tab){setTab(next);setCategory("全部");setQuery("");setSelected(null);setNotice("");}
 return <div className="db-library">
  <aside className="db-library-side">
   <button className="db-library-brand" onClick={()=>{window.location.href="/";}}>✦ <span><b>DesignBuddy</b><small>设计资产中心</small></span></button>
   <div className="db-library-side-label">资产工作台</div>
   {tabs.map(t=><button key={t.id} className={tab===t.id?"is-active":""} onClick={()=>changeTab(t.id)}><span>{({"systems":"◈","templates":"▦","plugins":"⌘","skills":"✧","runtime":"⚙"} as Record<Tab,string>)[t.id]}</span>{t.label}{tab===t.id&&<i/>}</button>)}
   <div className="db-library-side-foot"><span>DESIGNBUDDY STUDIO</span><p>为每一个产品决策提供一致、可复用的基础。</p></div>
  </aside>
  <main className="db-library-main">
   <header className="db-library-top"><div><span>DesignBuddy</span><b>/</b><strong>{active.label}</strong></div><button onClick={()=>{window.location.href="/";}}>返回工作台 ↗</button></header>
   <section className={"db-library-hero hero-"+tab}>
    <div><div className="db-library-eyebrow">{active.eyebrow}</div><h1>{active.title}</h1><p>{active.description}</p>
     <div className="db-library-metrics">
      <span><b>{tab==="systems"?designSystems.length:tab==="templates"?templates.length:tab==="plugins"?plugins.length:tab==="skills"?skills.length:"6"}</b><small>{tab==="systems"?"套设计系统":tab==="templates"?"商业模板系列":tab==="plugins"?"插件能力":tab==="skills"?"专业技能":"运行时能力"}</small></span>
      {tab==="templates"&&<span><b>3,120</b><small>页面与状态场景</small></span>}
      {tab==="systems"&&<span><b>16</b><small>组件基线</small></span>}
      {tab==="plugins"&&<span><b>Approval</b><small>高风险人工确认</small></span>}
     </div>
    </div>
    <div className="db-library-hero-art"><div className="db-art-window"><div className="db-art-dots"><i/><i/><i/></div><div className="db-art-sidebar"/><div className="db-art-canvas"><div/><div/><div/><span/></div></div><span className="db-art-orbit orbit-a"/><span className="db-art-orbit orbit-b"/></div>
   </section>
   {tab!=="runtime"?<>
    <div className="db-library-toolbar"><label><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={"搜索"+active.label+"名称、类别或用途"} /><kbd>⌘ K</kbd></label><span className="db-library-total">显示 {visible.length} / {allItems.length}</span></div>
    <div className="db-library-categories">{categories.map(c=><button key={c} className={category===c?"is-active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    <div className={tab==="templates"?"db-library-grid template-grid":"db-library-grid"}>
     {visible.map(item=><article key={item.id} className="db-library-card">
      {(item.cover||item.image)?<img className="db-library-card-image" src={item.cover||item.image} alt={item.name+" 视觉预览"} loading="lazy"/>:<div className="db-library-card-color" style={{background:item.primary||"#6558D3"}}/>}
      <div className="db-library-card-body"><div className="db-library-card-kicker">{item.category}</div><h2>{item.name}</h2><p>{item.description}</p>
       {tab==="systems"&&<div className="db-color-row">{[item.primary,"#171923","#E6E8EF","#F7F7F8","#14866D"].map((c,i)=><i key={i} style={{background:c}}/)}<span>Token + 组件规范</span></div>}
       {tab==="templates"&&<div className="db-template-meta"><span>▦ {item.screenCount} 个界面/状态</span><span>◉ 含图像预览</span></div>}
       {tab==="plugins"&&<div className="db-template-meta"><span>v1.0.0</span><span>{item.risk}</span></div>}
       {tab==="skills"&&<div className="db-template-meta"><span>{item.level}</span><span>{item.outputs?.length||2} 类交付</span></div>}
       <button className="db-library-open" onClick={()=>setSelected(item)}>{tab==="templates"?"查看 24 个界面":tab==="systems"?"查看设计规范":tab==="plugins"?"查看插件权限":"查看技能详情"} <span>↗</span></button>
      </div>
     </article>)}
    </div>
   </>:<div className="db-runtime-grid">{runtimeCapabilities.map((c,i)=><article key={c[0]}><span>0{i+1}</span><h2>{c[0]}</h2><p>{c[1]}</p></article>)}</div>}
   {notice&&<div className="db-library-notice" role="status">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
  </main>
  {selected&&<div className="db-library-overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><section className="db-library-drawer" role="dialog" aria-modal="true" aria-label={selected.name+"详情"}>
   <header><div><small>{selected.category}</small><h2>{selected.name}</h2></div><button onClick={()=>setSelected(null)} aria-label="关闭">×</button></header>
   <p>{selected.description}</p>
   {tab==="templates"&&<><div className="db-drawer-stat"><b>24</b><span>页面 / 交互状态</span><b>2+</b><span>每个场景交互</span></div><div className="db-screen-list">{selected.screens?.map((screen,index)=><article key={screen.id}><img src={screen.image} alt={screen.name+"预览"} loading="lazy"/><div><strong>{String(index+1).padStart(2,"0")} · {screen.name}</strong><small>{screen.interactions.join(" · ")}</small></div></article>)}</div></>}
   {tab==="systems"&&<><h3>核心 Token</h3><pre>{JSON.stringify((selected as any).tokens,null,2)}</pre><h3>组件基线</h3><div className="db-detail-chips">{(selected as any).components?.map((x:string)=><span key={x}>{x}</span>)}</div></>}
   {tab==="plugins"&&<><h3>权限声明</h3><div className="db-detail-chips">{selected.permissions?.map(x=><span key={x}>{x}</span>)}</div><p>高风险能力必须经过明确授权；目录中的条目为能力规格，具体执行需要配置对应的服务端适配器。</p></>}
   {tab==="skills"&&<><h3>输入</h3><div className="db-detail-chips"><span>用户目标</span><span>项目上下文</span></div><h3>交付物</h3><div className="db-detail-chips">{selected.outputs?.map(x=><span key={x}>{x}</span>)}</div></>}
   <footer><button onClick={()=>{setNotice("已将「"+selected.name+"」加入待配置清单；执行前仍需检查项目适配与权限。");setSelected(null);}}>＋ 加入工作区清单</button><button className="db-button-secondary" onClick={()=>setSelected(null)}>完成</button></footer>
  </section></div>}
 </div>;
}
