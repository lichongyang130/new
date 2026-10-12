import React from 'react';

interface Props {
  skills: string[];
  onSelect: (skill: string) => void;
}

export default function SkillSelector({ skills, onSelect }: Props) {
  return (
    <div>
      <h2>Select Skills</h2>
      {skills.map(skill => (
        <button key={skill} onClick={() => onSelect(skill)}>
          {skill}
        </button>
      ))}
    </div>
  );
}
