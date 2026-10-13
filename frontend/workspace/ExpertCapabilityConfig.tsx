import React from 'react';
import {Card,Tag,Button,WorkbenchStyle} from './components/WorkbenchUI';

export default function ExpertCapabilityConfig(){
 return <><WorkbenchStyle/><Card><h2>专家能力配置</h2><p>配置专家知识领域、执行能力和工具权限</p><Tag>知识库</Tag><Tag>工作流</Tag><Tag>连接器</Tag><br/><Button>保存配置</Button></Card></>
}
