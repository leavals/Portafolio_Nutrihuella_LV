import api from './api';

export async function getPantrySummary() {
  const { data } = await api.get('/pantry/summary');
  return data;
}
export async function getPantryExpiring() {
  const { data } = await api.get('/pantry/expiring');
  return data;
}
