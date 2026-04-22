let rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// Ensure it's an absolute URL if it's meant to be an external domain
if (rawApiUrl !== 'http://localhost:8000' && !rawApiUrl.startsWith('http')) {
  rawApiUrl = `https://${rawApiUrl}`;
}
export const API_URL = rawApiUrl;

export async function fetchProspects() {
  const res = await fetch(`${API_URL}/prospects`);
  if (!res.ok) throw new Error('Failed to fetch prospects');
  return res.json();
}

export async function fetchProspect(id: string) {
  const res = await fetch(`${API_URL}/prospects/${id}`);
  if (!res.ok) throw new Error('Failed to fetch prospect');
  return res.json();
}

export async function runPipeline(company?: string) {
  const url = company ? `${API_URL}/pipeline/run/${company}` : `${API_URL}/pipeline/run`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run pipeline');
  return res.json();
}

export async function getAnalytics() {
  const res = await fetch(`${API_URL}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function approveSequence(id: string) {
  const res = await fetch(`${API_URL}/sequences/${id}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve sequence');
  return res.json();
}

export async function sendSequence(id: string) {
  const res = await fetch(`${API_URL}/sequences/${id}/send`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to send sequence');
  return res.json();
}
