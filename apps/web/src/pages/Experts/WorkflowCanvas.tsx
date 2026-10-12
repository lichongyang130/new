import React, { useState } from 'react';
import SkillNode from './SkillNode';

export default function WorkflowCanvas() {
  const [nodes, setNodes] = useState<any[]>([]);

  const addSkillNode = (skill: any) => {
    setNodes([...nodes, { id: Date.now(), skill }]);
  };

  return (
    <div className="workflow-canvas">
      <h2>Expert Workflow Canvas</h2>
      <div>
        {nodes.map((node) => (
          <SkillNode key={node.id} skill={node.skill} />
        ))}
      </div>
      <button onClick={() => addSkillNode({ name: 'New Skill' })}>
        Add Skill Node
      </button>
    </div>
  );
}
