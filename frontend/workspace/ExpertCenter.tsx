import React from 'react';

const categories=['全部','OPC-一人公司','腾讯专家','高校新生攻略','产品设计','技术工程','金融投资','全球'];

const experts=[
 {name:'高校创业导师',desc:'面向高校创业项目辅导与商业规划',tags:['创业教学','项目辅导'],hot:'13.33w'},
 {name:'高级开发工程师',desc:'10年以上全栈开发经验，解决技术问题',tags:['全栈开发','架构设计'],hot:'1630.37w'},
 {name:'升学备考专家',desc:'查询高考数据并制定升学规划',tags:['高考真题','一分一段'],hot:'48.47w'},
 {name:'公益专家',desc:'腾讯公益助手，帮助公益项目成长',tags:['腾讯公益','小红花花园'],hot:'41.67w'},
 {name:'自适应成果交易专家',desc:'可靠的成果交付与经营决策顾问',tags:['成果交付','经营决策'],hot:'23.16w'},
 {name:'资讯专家',desc:'一句话获取每日行业资讯',tags:['AI资讯','每日简报'],hot:'21.57w'}
];

const banners=[['开学季','校园求职教练','论文写作导师','校园活动策划与执行顾问'],['内容创作','内容创作专家团','内容创作专家','小红书运营专家'],['投资分析','交易分析团队','股票研究专家','腾讯自选股票']];

export default function ExpertCenter(){
 return <div className="expert-page">
  <header className="top"><div className="tabs"><b>专家</b><span>技能</span><span>连接器</span></div><div className="actions"><input placeholder="搜索专家"/><button>我的专家</button></div></header>
  <section className="cards">{banners.map(b=><div className="banner"><h2>{b[0]}</h2>{b.slice(1).map(t=><p>{t}　›</p>)}</div>)}</section>
  <div className="title"><h2>专家</h2><span>专家团</span><aside><button>综合</button><button>最热</button><button>最新</button></aside></div>
  <nav>{categories.map(c=><button className={c==='全部'?'active':''}>{c}</button>)}</nav>
  <main className="grid">{experts.map(e=><article><div className="avatar">AI</div><h3>{e.name}</h3><p>{e.desc}</p><div>{e.tags.map(t=><label>{t}</label>)}</div><small>⚡ {e.hot}</small></article>)}</main>
  <style>{`
  .expert-page{padding:28px;background:#fff;color:#222;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}
  .top{display:flex;justify-content:space-between;align-items:center}.tabs{display:flex;gap:28px;font-size:18px}.tabs b{font-size:22px}.tabs span{color:#888}.actions{display:flex;gap:14px}.actions input{width:220px;padding:12px 18px;border:1px solid #ddd;border-radius:12px}.actions button{background:#fff;border:1px solid #ddd;border-radius:12px;padding:0 20px}
  .cards{display:grid;grid-template-columns:1.1fr 1.1fr .8fr;gap:18px;margin:25px 0}.banner{height:150px;border-radius:18px;padding:20px;background:linear-gradient(135deg,#eee7ff,#fff);overflow:hidden}.banner:nth-child(2){background:linear-gradient(135deg,#e8f6ff,#fff)}.banner:nth-child(3){background:linear-gradient(135deg,#f2f2f2,#fff)}.banner p{margin:8px 0;color:#666}
  .title{display:flex;align-items:center;gap:20px}.title span{color:#999}.title aside{margin-left:auto}.title button{border:1px solid #eee;background:white;padding:8px 18px}.title button:first-child{background:#f5f5f5}
  nav{display:flex;gap:12px;margin:15px 0}.active{background:#111!important;color:white}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}article{border:1px solid #eee;border-radius:18px;padding:18px;min-height:160px}.avatar{width:48px;height:48px;border-radius:50%;background:#eee;display:flex;align-items:center;justify-content:center;margin-bottom:10px}label{background:#f4f4f4;padding:5px 10px;border-radius:12px;font-size:12px;margin-right:6px}small{display:block;color:#999;margin-top:16px}
  `}</style>
 </div>
}
