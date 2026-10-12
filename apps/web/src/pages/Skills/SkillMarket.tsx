import React from 'react';

export default function SkillMarket() {
  const skills = ['React生成器', 'PPT生成器', '图片分析'];

  return <div>
    <h1>技能市场</h1>
    {skills.map(skill => <div key={skill}>{skill}</div>)}
  </div>;
}
