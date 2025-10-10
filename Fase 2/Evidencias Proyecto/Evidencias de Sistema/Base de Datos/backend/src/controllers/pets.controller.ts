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
import { computeNutritionDefaults, mergeNutritionDefaults, DOG_BREED_AVG_WEIGHT } from '../config/nutrition-defaults.js';
import { JSONHelper } from "../lib/jsonText.js"; // Asumo que tienes este helper para convertir arrays a JSON strings

// ------------------ Helpers JSON/fecha ------------------
// Adaptador local: delega en el helper global
const JSONText = {
  toText: (v?: string[] | null): string | null =>
    v == null ? null : JSONHelper.toText(v),
  fromText: (v?: string | null): string[] =>
    JSONHelper.toArray<string>(v),
};

// Convierte 'YYYY-MM-DD' a ISO en UTC sin desfase local.
// Si recibe otra cosa parseable, intenta parsear; si falla, null.
const toISOorNull = (s?: string | null) => {
  if (!s) return null;
  // Caso 'YYYY-MM-DD'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const [_, yy, mm, dd] = m;
    const iso = new Date(Date.UTC(Number(yy), Number(mm) - 1, Number(dd))).toISOString();
    return iso;
  }
  // Caso genérico parseable por Date
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
};

// (opcional) helper para admitir números que pueden venir como string
const num = (v: unknown): number | undefined => {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
};


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

// ------------------------------------------------------------
// Obtener ficha nutricional
// ------------------------------------------------------------
export async function getNutrition(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: userId },
  });
  if (!pet) return res.sendStatus(404);

  // Si petId es UNIQUE en nutritionProfile, esto está OK.
  const np = await prisma.nutritionProfile.findUnique({ where: { petId } });
  if (!np) return res.json(null);

  // 🔁 Al responder: arrays reales (no strings)
  return res.json({
    ...np,
    preferredFoods: JSONHelper.toArray<string>(np.preferredFoods),
    forbiddenFoods: JSONHelper.toArray<string>(np.forbiddenFoods),
    intolerances: JSONHelper.toArray<string>(np.intolerances),
    foodAllergies: JSONHelper.toArray<string>(np.foodAllergies),
    supplements: JSONHelper.toArray<string>(np.supplements),
  });
}

// ------------------------------------------------------------
// Obtener defaults nutricionales
// ------------------------------------------------------------
export async function getNutritionDefaults(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: userId },
  });
  if (!pet) return res.sendStatus(404);

  const defaults = computeNutritionDefaults({
    size: pet.size ?? undefined,
    weightKg: pet.weightKg ?? undefined,
    breed: pet.breed ?? undefined,
  });

  return res.json(defaults);
}

// ------------------------------------------------------------
// Crear o actualizar ficha nutricional
// ------------------------------------------------------------
export async function upsertNutrition(req: Request, res: Response) {
  try {
    const userId = (req as any).userId as string;
    const { petId } = req.params;

    // Verificar que la mascota existe y pertenece al usuario
    const pet = await prisma.pet.findFirst({
      where: { id: petId, ownerId: userId },
    });
    if (!pet) {
      return res.status(404).json({ error: "Mascota no encontrada" });
    }

    const b = req.body as any;

    // Determinar peso base (solo para calcular defaults, NO se guarda en nutritionProfile)
    let weightKg: number = pet.weightKg ?? 0;
    if ((!weightKg || weightKg <= 0) && pet.breed) {
      const avg = DOG_BREED_AVG_WEIGHT[pet.breed.toUpperCase().trim()];
      if (avg) weightKg = avg;
    }
    if (!weightKg || weightKg <= 0) weightKg = 10; // fallback mínimo

    // Defaults dinámicos
    const defaults = computeNutritionDefaults({
      size: pet.size ?? undefined,
      weightKg,
      breed: pet.breed ?? undefined,
    });

    // Saneamos notas para que no quede undefined
    const notes =
      typeof b.notes === "string" && b.notes.trim() !== "" ? b.notes : undefined;

    // Mezcla con datos del body (merge ignora undefined, null y [])
    const data = mergeNutritionDefaults(defaults, {
      dietType: b.dietType,
      mealsPerDay: num(b.mealsPerDay),
      activityLevel: b.activityLevel,
      goal: b.goal,
      preferredFoods: b.preferredFoods,
      forbiddenFoods: b.forbiddenFoods,
      intolerances: b.intolerances,
      foodAllergies: b.foodAllergies,
      supplements: b.supplements,
      notes,
      dailyCalories: num(b.dailyCalories),
      waterIntakeMl: num(b.waterIntakeMl),
    });

    // ⚠️ 'weightKg' NO es campo de nutritionProfile → lo excluimos del payload a Prisma
    const { weightKg: _omitWeightKg, ...dataForNutrition } = data;

    // Antes de guardar: serializar arrays a texto JSON
    const prismaData = {
      ...dataForNutrition,
      preferredFoods: JSONHelper.toText(dataForNutrition.preferredFoods),
      forbiddenFoods: JSONHelper.toText(dataForNutrition.forbiddenFoods),
      intolerances: JSONHelper.toText(dataForNutrition.intolerances),
      foodAllergies: JSONHelper.toText(dataForNutrition.foodAllergies),
      supplements: JSONHelper.toText(dataForNutrition.supplements),
    };

    // Upsert por petId (requiere índice único en petId)
    const saved = await prisma.nutritionProfile.upsert({
      where: { petId },
      update: prismaData,
      create: { petId, ...prismaData },
    });

    // Al responder: devolver arrays deserializados
    return res.json({
      ...saved,
      preferredFoods: JSONHelper.toArray<string>(saved.preferredFoods),
      forbiddenFoods: JSONHelper.toArray<string>(saved.forbiddenFoods),
      intolerances: JSONHelper.toArray<string>(saved.intolerances),
      foodAllergies: JSONHelper.toArray<string>(saved.foodAllergies),
      supplements: JSONHelper.toArray<string>(saved.supplements),
    });
  } catch (error) {
    console.error("Error upserting nutrition:", error);
    return res
      .status(500)
      .json({ error: "Error al guardar la ficha nutricional" });
  }
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
