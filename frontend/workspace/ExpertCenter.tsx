import React from 'react';

const categories = ['全部', 'OPC-一人公司', '腾讯专家', '高校新生攻略', '产品设计', '技术工程', '金融投资'];

const experts = [
  {name:'高校创业导师',desc:'面向高校创业项目辅导',tags:['创业教学','项目辅导'],hot:'13.33w'},
  {name:'高级开发工程师',desc:'10年以上全栈经验',tags:['全栈开发','架构设计'],hot:'1630.37w'},
  {name:'升学备考专家',desc:'查询高考数据并规划',tags:['高考真题','一分一段'],hot:'48.47w'},
  {name:'公益专家',desc:'腾讯公益助手',tags:['腾讯公益','小红花花园'],hot:'41.67w'},
  {name:'自适应成果交易专家',desc:'可靠的成果交付顾问',tags:['成果交付','经营决策'],hot:'23.16w'},
  {name:'资讯专家',desc:'一句话查到每日资讯',tags:['AI资讯','每日简报'],hot:'21.57w'},
];

export default function ExpertCenter(){
 return <div className="expert-page">
  <header className="expert-header"><h1>专家</h1><span>技能</span><span>连接器</span><input placeholder="搜索专家"/><button>我的专家</button></header>
  <section className="recommend">
   {['开学季','内容创作','投资分析'].map((x)=><div className="banner" key={x}><h2>{x}</h2><p>{x}专家团</p><p>热门专家服务 ></p></div>)}
  </section>
  <nav>{categories.map(c=><button key={c}>{c}</button>)}</nav>
  <main className="grid">{experts.map(e=><article key={e.name}><div className="avatar">AI</div><h3>{e.name}</h3><p>{e.desc}</p><div>{e.tags.map(t=><label key={t}>{t}</label>)}</div><small>⚡ {e.hot}</small></article>)}</main>
  <style>{`
   .expert-page{padding:28px;font-family:Arial;color:#222;background:#fff;min-height:100vh}
   .expert-header{display:flex;gap:28px;align-items:center}.expert-header input{margin-left:auto;padding:12px 20px;border:1px solid #ddd;border-radius:20px}.expert-header button{padding:10px 20px;border-radius:20px;background:white;border:1px solid #ddd}
   .recommend{display:flex;gap:18px;margin:24px 0}.banner{flex:1;padding:24px;border-radius:18px;background:linear-gradient(135deg,#f0e8ff,#fff);min-height:90px}
   nav{display:flex;gap:20px;margin:20px 0}nav button{border:0;background:#fff;padding:8px 14px}
   .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}article{border:1px solid #eee;border-radius:18px;padding:20px;box-shadow:0 4px 15px #eee}.avatar{width:48px;height:48px;border-radius:50%;background:#eee;display:flex;align-items:center;justify-content:center}label{background:#f5f5f5;padding:5px 10px;border-radius:12px;margin-right:6px;font-size:12px}small{display:block;margin-top:15px;color:#777}
  `}</style>
 </div>
}
