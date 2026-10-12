import React from 'react';

export default function ExpertList() {
  const experts = [
    { id: 'designer', name: 'UI设计专家', skills: ['页面设计', 'React生成'] },
    { id: 'developer', name: '前端开发专家', skills: ['代码生成', '优化'] }
  ];

  return <div>
    <h1>专家中心</h1>
    {experts.map((expert) => (
      <div key={expert.id}>
        <h3>{expert.name}</h3>
        <p>{expert.skills.join(', ')}</p>
      </div>
    ))}
  </div>;
}
