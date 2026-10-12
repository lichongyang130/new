import React from 'react';

interface Props {
  skill: {
    name: string;
  };
}

export default function SkillNode({ skill }: Props) {
  return (
    <div className="skill-node" draggable>
      <strong>{skill.name}</strong>
      <p>Workflow Skill Node</p>
    </div>
  );
}
