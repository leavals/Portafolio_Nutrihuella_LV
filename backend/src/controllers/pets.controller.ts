// backend/src/controllers/pets.controller.ts
// ------------------------------------------------------------
// Controladores de Mascotas, Ficha Clínica y Ficha Nutricional
// ------------------------------------------------------------
// - Compatibles con SQLite (arreglos guardados como JSON-string).
// - Requiere middleware authGuard que setea (req as any).userId.
// - Todas las rutas están montadas en src/routes/pets.routes.ts
// ------------------------------------------------------------

import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';

// ------------------ Helpers JSON/fecha ------------------
// Guardamos arreglos como string JSON en la BD (SQLite sin tipo JSON).
const JSONText = {
  toText: (v?: string[] | null) => (v ? JSON.stringify(v) : null),
  fromText: (v?: string | null) => {
    if (!v) return [] as string[];
    try { return JSON.parse(v) as string[]; } catch { return []; }
  },
};

// Convierte una fecha tipo 'YYYY-MM-DD' (string) a ISO, o null/undefined.
const toISOorNull = (s?: string | null) => (s ? new Date(s).toISOString() : null);

// ============================================================
//                        MASCOTAS
// ============================================================

export async function listPets(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const pets = await prisma.pet.findMany({ where: { ownerId: userId } });
  return res.json(pets);
}

export async function createPet(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { name, species, sex, breed, age, weightKg } = req.body as any;

  const pet = await prisma.pet.create({
    data: {
      ownerId: userId,
      name,
      species: species ?? 'DOG',
      sex: sex ?? null,
      breed: breed ?? null,
      age: typeof age === 'number' ? age : null,
      weightKg: typeof weightKg === 'number' ? weightKg : null,
    },
  });
  return res.status(201).json(pet);
}

export async function getPet(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);
  return res.json(pet);
}

export async function updatePet(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const exists = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!exists) return res.sendStatus(404);

  const b = req.body as any;
  const updated = await prisma.pet.update({
    where: { id: petId },
    data: {
      name: b.name ?? undefined,
      species: b.species ?? undefined,
      sex: b.sex ?? undefined,
      breed: b.breed ?? undefined,
      age: typeof b.age === 'number' ? b.age : undefined,
      weightKg: typeof b.weightKg === 'number' ? b.weightKg : undefined,
    },
  });
  return res.json(updated);
}

export async function deletePet(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const exists = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!exists) return res.sendStatus(404);

  await prisma.pet.delete({ where: { id: petId } });
  return res.sendStatus(204);
}

// ============================================================
//                        FICHA CLÍNICA
// ============================================================

export async function getClinical(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const cr = await prisma.clinicalRecord.findUnique({ where: { petId } });
  if (!cr) return res.json(null);

  return res.json({
    ...cr,
    allergies:         JSONText.fromText(cr.allergies),
    chronicConditions: JSONText.fromText(cr.chronicConditions),
    medications:       JSONText.fromText(cr.medications),
    surgeries:         JSONText.fromText(cr.surgeries),
  });
}

export async function upsertClinical(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const b = req.body as any;
  const data = {
    allergies:         JSONText.toText(b.allergies),
    chronicConditions: JSONText.toText(b.chronicConditions),
    medications:       JSONText.toText(b.medications),
    surgeries:         JSONText.toText(b.surgeries),
    lastVetVisit:      toISOorNull(b.lastVetVisit),
    lastDeworming:     toISOorNull(b.lastDeworming),
    lastFleaTick:      toISOorNull(b.lastFleaTick),
    bloodType:         b.bloodType ?? null,
    vetClinic:         b.vetClinic ?? null,
    vetPhone:          b.vetPhone ?? null,
    notes:             b.notes ?? null,
  };

  const cr = await prisma.clinicalRecord.upsert({
    where: { petId },
    update: data,
    create: { petId, ...data },
  });

  return res.json({
    ...cr,
    allergies:         JSONText.fromText(cr.allergies),
    chronicConditions: JSONText.fromText(cr.chronicConditions),
    medications:       JSONText.fromText(cr.medications),
    surgeries:         JSONText.fromText(cr.surgeries),
  });
}

// ------------------ Vacunas ------------------

export async function listVaccinations(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const rows = await prisma.vaccination.findMany({
    where: { petId },
    orderBy: { date: 'desc' },
  });
  return res.json(rows);
}

export async function addVaccination(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const b = req.body as any;
  const row = await prisma.vaccination.create({
    data: {
      petId,
      name: b.name,
      date: b.date ? new Date(b.date) : new Date(),
    },
  });
  return res.status(201).json(row);
}

export async function updateVaccination(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId, vaccinationId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const b = req.body as any;
  const row = await prisma.vaccination.update({
    where: { id: vaccinationId },
    data: {
      name: b.name ?? undefined,
      date: b.date ? new Date(b.date) : undefined,
    },
  });
  return res.json(row);
}

export async function deleteVaccination(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId, vaccinationId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  await prisma.vaccination.delete({ where: { id: vaccinationId } });
  return res.sendStatus(204);
}

// ------------------ Enfermedades ------------------

export async function listDiseases(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const rows = await prisma.disease.findMany({
    where: { petId },
    orderBy: { diagnosedAt: 'desc' },
  });
  return res.json(rows);
}

export async function addDisease(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const b = req.body as any;
  const row = await prisma.disease.create({
    data: {
      petId,
      name: b.name,
      diagnosedAt: b.diagnosedAt ? new Date(b.diagnosedAt) : new Date(),
      status: b.status ?? 'ACTIVE',
    },
  });
  return res.status(201).json(row);
}

export async function updateDisease(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId, diseaseId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const b = req.body as any;
  const row = await prisma.disease.update({
    where: { id: diseaseId },
    data: {
      name: b.name ?? undefined,
      diagnosedAt: b.diagnosedAt ? new Date(b.diagnosedAt) : undefined,
      status: b.status ?? undefined,
    },
  });
  return res.json(row);
}

export async function deleteDisease(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId, diseaseId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  await prisma.disease.delete({ where: { id: diseaseId } });
  return res.sendStatus(204);
}

// ------------------ Pesos ------------------

export async function listWeights(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const rows = await prisma.weight.findMany({
    where: { petId },
    orderBy: { date: 'desc' },
  });
  return res.json(rows);
}

export async function addWeight(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const b = req.body as any;
  const row = await prisma.weight.create({
    data: {
      petId,
      date: b.date ? new Date(b.date) : new Date(),
      weightKg: Number(b.weightKg),
    },
  });
  return res.status(201).json(row);
}

export async function deleteWeight(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId, weightId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  await prisma.weight.delete({ where: { id: weightId } });
  return res.sendStatus(204);
}

// ============================================================
//                        NUTRICIÓN
// ============================================================

export async function getNutrition(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const np = await prisma.nutritionProfile.findUnique({ where: { petId } });
  if (!np) return res.json(null);

  return res.json({
    ...np,
    preferredFoods: JSONText.fromText(np.preferredFoods),
    forbiddenFoods: JSONText.fromText(np.forbiddenFoods),
    intolerances:   JSONText.fromText(np.intolerances),
    foodAllergies:  JSONText.fromText(np.foodAllergies),
    supplements:    JSONText.fromText(np.supplements),
  });
}

export async function upsertNutrition(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const b = req.body as any;
  const data = {
    dietType:      b.dietType ?? 'RAW',
    mealsPerDay:   b.mealsPerDay ? Number(b.mealsPerDay) : 2,
    activityLevel: b.activityLevel ?? 'MODERATE',
    goal:          b.goal ?? 'MAINTENANCE',

    preferredFoods: JSONText.toText(b.preferredFoods),
    forbiddenFoods: JSONText.toText(b.forbiddenFoods),
    intolerances:   JSONText.toText(b.intolerances),
    foodAllergies:  JSONText.toText(b.foodAllergies),
    supplements:    JSONText.toText(b.supplements),

    dailyCalories:  b.dailyCalories ? Number(b.dailyCalories) : null,
    waterIntakeMl:  b.waterIntakeMl ? Number(b.waterIntakeMl) : null,
    notes:          b.notes ?? null,
  };

  const np = await prisma.nutritionProfile.upsert({
    where: { petId },
    update: data,
    create: { petId, ...data },
  });

  return res.json({
    ...np,
    preferredFoods: JSONText.fromText(np.preferredFoods),
    forbiddenFoods: JSONText.fromText(np.forbiddenFoods),
    intolerances:   JSONText.fromText(np.intolerances),
    foodAllergies:  JSONText.fromText(np.foodAllergies),
    supplements:    JSONText.fromText(np.supplements),
  });
}
