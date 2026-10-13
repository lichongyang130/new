import React,{useState} from 'react';
import {Card,Button,Tag,WorkbenchStyle} from './components/WorkbenchUI';

export default function CreateSkill(){
 const [name,setName]=useState('');
 return <div className="skill-create"><WorkbenchStyle/><Card><h2>创建技能</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="技能名称"/><p>技能描述</p><Tag>办公自动化</Tag><Tag>AI执行</Tag><br/><Button>保存技能</Button></Card></div>
}
