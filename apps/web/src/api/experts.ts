export interface Expert {
  id: string;
  name: string;
  description?: string;
  skills?: string[];
}

const API_BASE = '/api';

export async function listExperts(): Promise<Expert[]> {
  const response = await fetch(`${API_BASE}/experts`);
  if (!response.ok) {
    throw new Error('Failed to load experts');
  }
  return response.json();
}

export async function createExpert(data: Partial<Expert>): Promise<Expert> {
  const response = await fetch(`${API_BASE}/experts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to create expert');
  }

  return response.json();
}

export async function updateExpert(id: string, data: Partial<Expert>): Promise<Expert> {
  const response = await fetch(`${API_BASE}/experts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Failed to update expert');
  }

  return response.json();
}
