// backend/src/controllers/pets.controller.ts
// ------------------------------------------------------------
// Controladores de Mascotas, Ficha Clínica y Ficha Nutricional
// + Subida de foto de mascota
// ------------------------------------------------------------
// - Compatibles con SQLite (arreglos guardados como JSON-string).
// - Requiere middleware authGuard que setea (req as any).userId.
// - Todas las rutas están montadas en src/routes/pets.routes.ts
// ------------------------------------------------------------

import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.js';
import { computeNutritionDefaults, mergeNutritionDefaults } from '../config/nutrition-defaults.js';

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

// Sentinel para marcar "sin enfermedades"
const NO_DISEASES_ACK_NAME = "[NO_DISEASES_ACK]";

/**
 * Devuelve el estado del wizard:
 * - nutrition: existe nutritionProfile
 * - diseasesCount: cantidad de enfermedades reales (excluye el ACK)
 * - noDiseasesAck: true si existe el placeholder [NO_DISEASES_ACK]
 * - complete: nutrition && (diseasesCount > 0 || noDiseasesAck)
 */
export async function getWizardCompletion(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const [np, diseasesCount, ackCount] = await Promise.all([
    prisma.nutritionProfile.findUnique({ where: { petId } }),
    prisma.disease.count({ where: { petId, name: { not: NO_DISEASES_ACK_NAME } } }),
    prisma.disease.count({ where: { petId, name: NO_DISEASES_ACK_NAME } }),
  ]);

  const nutrition = !!np;
  const noDiseasesAck = ackCount > 0;
  const complete = nutrition && (diseasesCount > 0 || noDiseasesAck);

  return res.json({ nutrition, diseasesCount, noDiseasesAck, complete });
}

/**
 * Marca el paso "Enfermedades" como revisado aunque no se agreguen enfermedades.
 * Implementación sin migraciones: crea una fila sentinel con name = "[NO_DISEASES_ACK]".
 * El listado público de enfermedades la ocultará.
 */
export async function ackNoDiseasesForPet(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  // Si ya existe el ACK, no duplica
  const ack = await prisma.disease.findFirst({
    where: { petId, name: NO_DISEASES_ACK_NAME },
  });

  if (!ack) {
    await prisma.disease.create({
      data: {
        petId,
        name: NO_DISEASES_ACK_NAME,
        status: "ACK",          // valor neutro; tu schema acepta string
        diagnosedAt: new Date() // fecha actual como marca
      },
    });
  }

  return res.json({ ok: true });
}

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
  const { name, species, sex, breed, age, size , weightKg, sterilized } = req.body as any;

  const pet = await prisma.pet.create({
    data: {
      ownerId: userId,
      name,
      species: species ?? 'DOG',
      sex: sex ?? null,
      breed: breed ?? null,
      age: typeof age === 'number' ? age : null,
      size: size ?? 'MEDIUM',
      weightKg: typeof weightKg === 'number' ? weightKg : null,
      sterilized: typeof sterilized === 'boolean' ? sterilized : false,
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
      size: b.size ?? undefined,
      weightKg: typeof b.weightKg === 'number' ? b.weightKg : undefined,
      sterilized: typeof b.sterilized === 'boolean' ? b.sterilized : undefined,
    },
  });
  return res.json(updated);
}

export async function deletePet(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  try {
    // Verificar que la mascota exista
    const exists = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
    if (!exists) return res.sendStatus(404);

    // Eliminar registros relacionados
    await prisma.nutritionProfile.deleteMany({ where: { petId } });
    await prisma.disease.deleteMany({ where: { petId } });
    await prisma.vaccination.deleteMany({ where: { petId } });
    await prisma.weight.deleteMany({ where: { petId } });
    await prisma.clinicalRecord.deleteMany({ where: { petId } });

    // Finalmente eliminar la mascota
    await prisma.pet.delete({ where: { id: petId } });

    return res.sendStatus(204);
  } catch (error) {
    console.error("Error eliminando mascota:", error);
    return res.status(500).json({ message: "Error interno al eliminar la mascota", error });
  }
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

/**
 * Lista de enfermedades de la mascota, ocultando el sentinel [NO_DISEASES_ACK].
 */
export async function listDiseases(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const diseases = await prisma.disease.findMany({
    where: {
      petId,
      name: { not: NO_DISEASES_ACK_NAME }, // ⬅️ oculta el ACK
    },
    orderBy: { diagnosedAt: 'desc' },
  });

  return res.json(diseases);
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

export async function getNutritionDefaults(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const defaults = computeNutritionDefaults({ size: (pet as any).size, weightKg: (pet as any).weightKg });
  return res.json(defaults);
}


export async function upsertNutrition(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.status(404).json({ error: "Mascota no encontrada" });

  const b = req.body as any;

  // Obtener valores predeterminados dinámicos basados en el tamaño y peso de la mascota
  const defaults = computeNutritionDefaults({ size: pet.size, weightKg: pet.weightKg });

  // Mezclar los valores enviados por el usuario con los valores predeterminados
  const data = mergeNutritionDefaults(defaults, {
    dietType: b.dietType ?? undefined,
    mealsPerDay: typeof b.mealsPerDay === "number" ? b.mealsPerDay : undefined,
    activityLevel: b.activityLevel ?? undefined,
    goal: b.goal ?? undefined,
    preferredFoods: b.preferredFoods ?? undefined,
    forbiddenFoods: b.forbiddenFoods ?? undefined,
    intolerances: b.intolerances ?? undefined,
    foodAllergies: b.foodAllergies ?? undefined,
    supplements: b.supplements ?? undefined,
    dailyCalories: typeof b.dailyCalories === "number" ? b.dailyCalories : undefined,
    waterIntakeMl: typeof b.waterIntakeMl === "number" ? b.waterIntakeMl : undefined,
    notes: b.notes ?? undefined,
  });

  // Convertir arrays a cadenas JSON para Prisma
  const prismaData = {
    ...data,
    preferredFoods: JSONText.toText(data.preferredFoods),
    forbiddenFoods: JSONText.toText(data.forbiddenFoods),
    intolerances: JSONText.toText(data.intolerances),
    foodAllergies: JSONText.toText(data.foodAllergies),
    supplements: JSONText.toText(data.supplements),
  };

  const nutrition = await prisma.nutritionProfile.upsert({
    where: { petId },
    update: prismaData,
    create: { petId, ...prismaData },
  });

  return res.json(nutrition);
}



// ============================================================
//                         FOTO DE MASCOTA
// ============================================================

export async function uploadPetPhoto(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;
  const file = (req as any).file as Express.Multer.File | undefined;

  if (!file) return res.status(400).json({ message: 'Archivo requerido' });

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const url = `/uploads/${file.filename}`;
  await prisma.pet.update({ where: { id: petId }, data: { photoUrl: url } });

  return res.json({ photoUrl: url });
}
