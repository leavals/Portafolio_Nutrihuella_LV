import api from './api';

export interface Pet {
  id: string;
  name: string;
  species?: string;
  sex?: string;
  breed?: string;
  weight?: number;
  size?: string;
  neutered?: boolean;
  picture?: string | null;
}

export async function listPets(): Promise<Pet[]> {
  const { data } = await api.get('/pets');
  return data;
}

export async function getPet(petId: string): Promise<Pet> {
  const { data } = await api.get(`/pets/${petId}`);
  return data;
}

export async function createPet(payload: Partial<Pet>): Promise<Pet> {
  const { data } = await api.post('/pets', payload);
  return data;
}

export async function updatePet(petId: string, payload: Partial<Pet>): Promise<Pet> {
  const { data } = await api.patch(`/pets/${petId}`, payload);
  return data;
}

export async function deletePet(petId: string): Promise<void> {
  await api.delete(`/pets/${petId}`);
}

// Clinical: weights
export async function listWeights(petId: string) {
  const { data } = await api.get(`/pets/${petId}/clinical/weights`);
  return data;
}
export async function addWeight(petId: string, body: { date: string; weight: number }) {
  const { data } = await api.post(`/pets/${petId}/clinical/weights`, body);
  return data;
}
export async function deleteWeight(petId: string, weightId: string) {
  await api.delete(`/pets/${petId}/clinical/weights/${weightId}`);
}

// Clinical: vaccines
export async function listVaccinations(petId: string) {
  const { data } = await api.get(`/pets/${petId}/clinical/vaccinations`);
  return data;
}
export async function addVaccination(petId: string, body: { name: string; date: string }) {
  const { data } = await api.post(`/pets/${petId}/clinical/vaccinations`, body);
  return data;
}
export async function updateVaccination(petId: string, vaccinationId: string, body: any) {
  const { data } = await api.patch(`/pets/${petId}/clinical/vaccinations/${vaccinationId}`, body);
  return data;
}
export async function deleteVaccination(petId: string, vaccinationId: string) {
  await api.delete(`/pets/${petId}/clinical/vaccinations/${vaccinationId}`);
}

// Clinical: diseases
export async function listDiseases(petId: string) {
  const { data } = await api.get(`/pets/${petId}/clinical/diseases`);
  return data;
}
export async function addDisease(petId: string, body: { name: string; diagnosedAt: string; status?: 'active'|'resolved' }) {
  const { data } = await api.post(`/pets/${petId}/clinical/diseases`, body);
  return data;
}
export async function updateDisease(petId: string, diseaseId: string, body: any) {
  const { data } = await api.patch(`/pets/${petId}/clinical/diseases/${diseaseId}`, body);
  return data;
}
export async function deleteDisease(petId: string, diseaseId: string) {
  await api.delete(`/pets/${petId}/clinical/diseases/${diseaseId}`);
}

export async function ackNoDiseases(petId: string) {
  const { data } = await api.post(`/pets/${petId}/diseases/no-diseases-ack`, {});
  return data;
}

// Nutrition
export async function getNutrition(petId: string) {
  const { data } = await api.get(`/pets/${petId}/nutrition`);
  return data;
}
export async function getNutritionDefaults(petId: string) {
  const { data } = await api.get(`/pets/${petId}/nutrition/defaults`);
  return data;
}
export async function upsertNutrition(petId: string, body: any) {
  const { data } = await api.put(`/pets/${petId}/nutrition`, body);
  return data;
}

// Pantry usable items for a pet
export async function getUsablePantry(petId: string) {
  // backend exposes both /pantry/usable/:petId and /pantry/:petId/usable
  try {
    const { data } = await api.get(`/pantry/usable/${petId}`);
    return data;
  } catch (e) {
    const { data } = await api.get(`/pantry/${petId}/usable`);
    return data;
  }
}

// Photo upload
export async function uploadPetPhoto(petId: string, uri: string) {
  const form = new FormData();
  // For Expo: uri like file://... must include type and name
  const filename = uri.split('/').pop() || 'photo.jpg';
  const ext = filename.split('.').pop();
  const type = `image/${ext === 'png' ? 'png' : 'jpeg'}`;
  form.append('file', { uri, name: filename, type } as any);
  const { data } = await api.post(`/pets/${petId}/photo`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}
