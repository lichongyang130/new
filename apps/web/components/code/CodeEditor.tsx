import React from 'react';

export default function CodeEditor({ value = '', language = 'typescript' }: { value?: string; language?: string }) {
  return <div className="code-editor"><div>{language}</div><pre>{value}</pre></div>;
}
