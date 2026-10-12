import React, { useState } from 'react';

export default function ExpertCreate() {
  const [name, setName] = useState('');

  return <div>
    <h1>创建 AI 专家</h1>
    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="专家名称" />
    <button>创建专家</button>
  </div>;
}
