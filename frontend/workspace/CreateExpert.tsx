import React, {useState} from 'react';

export default function CreateExpert(){
 const [step,setStep]=useState(1);
 const [name,setName]=useState('');
 return <div className="create-expert">
  <h1>创建专家</h1>
  <p>快速创建你的 AI 专家，配置角色、技能和连接能力。</p>
  <div className="steps"><b className={step===1?'active':''}>1 基础信息</b><b className={step===2?'active':''}>2 专业技能</b><b className={step===3?'active':''}>3 连接器授权</b></div>
  {step===1&&<section><input value={name} onChange={e=>setName(e.target.value)} placeholder="专家名称"/><textarea placeholder="专家定位与介绍"/><button onClick={()=>setStep(2)}>下一步</button></section>}
  {step===2&&<section><h3>选择技能</h3><div className="tags"><span>知识检索</span><span>文档处理</span><span>数据分析</span><span>内容创作</span></div><button onClick={()=>setStep(3)}>下一步</button></section>}
  {step===3&&<section><h3>授权连接器</h3><div className="connect">企业微信　 Notion　 GitHub　 云盘</div><button>完成创建</button></section>}
  <style>{`.create-expert{padding:32px;background:#fff;border-radius:20px}.steps{display:flex;gap:20px;margin:24px 0}.steps b{padding:10px 18px;background:#eee;border-radius:20px}.active{background:#111!important;color:#fff}section{display:flex;flex-direction:column;gap:16px;max-width:520px}input,textarea{padding:14px;border:1px solid #ddd;border-radius:12px}textarea{height:100px}.tags span,.connect{display:inline-block;padding:10px 14px;background:#f5f5f5;border-radius:12px;margin:6px}button{padding:12px 22px;border:0;border-radius:12px;background:#111;color:#fff}`}</style>
 </div>
}