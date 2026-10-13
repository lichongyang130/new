import React from 'react';
import {Card,Button,Tag,WorkbenchStyle} from './components/WorkbenchUI';

export default function ConnectorOAuth(){
 const providers=['Google Workspace','Microsoft 365','Notion','GitHub'];
 return <div><WorkbenchStyle/><Card><h2>连接器授权</h2><p>OAuth 安全授权中心</p>{providers.map(p=><div key={p}><Tag>{p}</Tag><Button>授权连接</Button></div>)}</Card></div>
}
