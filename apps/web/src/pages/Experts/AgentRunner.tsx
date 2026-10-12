import React, { useState } from 'react';

export default function AgentRunner() {
  const [status, setStatus] = useState('idle');

  async function run() {
    setStatus('running');
    await new Promise(resolve => setTimeout(resolve, 500));
    setStatus('completed');
  }

  return (
    <div>
      <h2>Agent Runner</h2>
      <button onClick={run}>Run Expert Task</button>
      <p>Status: {status}</p>
    </div>
  );
}
