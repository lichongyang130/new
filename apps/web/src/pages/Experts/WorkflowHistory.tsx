import React from 'react';

export default function WorkflowHistory() {
  const history = [
    { id: 1, status: 'completed', task: 'Expert workflow task' }
  ];

  return (
    <div className="workflow-history">
      <h2>Workflow History</h2>
      {history.map((item) => (
        <div key={item.id}>
          {item.task} - {item.status}
        </div>
      ))}
    </div>
  );
}
