// backend/src/controllers/pets.controller.ts
// ------------------------------------------------------------
// Controladores de Mascotas, Ficha ClÃ­nica y Ficha Nutricional
// + Subida de foto de mascota
// ------------------------------------------------------------
// - Compatibles con SQLite (arreglos guardados como JSON-string).
// - Requiere middleware authGuard que setea (req as any).userId.
// - Todas las rutas estÃ¡n montadas en src/routes/pets.routes.ts
// ------------------------------------------------------------

import type { Request, Response } from 'express';
import { prisma } from '../services/prisma.ts';
import { computeNutritionDefaults, mergeNutritionDefaults, DOG_BREED_AVG_WEIGHT } from '../config/nutrition-defaults.ts';
import { JSONHelper } from "../lib/jsonText.ts"; // Asumo que tienes este helper para convertir arrays a JSON strings

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
  // Caso genÃ©rico parseable por Date
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
};

// (opcional) helper para admitir nÃºmeros que pueden venir como string
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
 * ImplementaciÃ³n sin migraciones: crea una fila sentinel con name = "[NO_DISEASES_ACK]".
 * El listado pÃºblico de enfermedades la ocultarÃ¡.
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
  const { name, species, sex, breed, birthDate, size, weightKg, sterilized } = req.body as any;

  const parsedBirth = birthDate ? new Date(birthDate) : null;
  const validBirth = parsedBirth && !isNaN(parsedBirth.getTime()) ? parsedBirth : null;

  try {
    const pet = await prisma.$transaction(async (tx) => {
      const weightNum = Number(weightKg);
      const hasWeight = !isNaN(weightNum) && weightNum > 0;
      const rounded = hasWeight ? Math.round(weightNum * 10) / 10 : null;

      // 1) Crear mascota
      const created = await tx.pet.create({
        data: {
          ownerId: userId,
          name,
          species: species ?? "DOG",
          sex: sex ?? null,
          breed: breed ?? null,
          birthDate: validBirth,
          size: size ?? "MEDIUM",
          weightKg: rounded,
          sterilized: typeof sterilized === "boolean" ? sterilized : false,
        },
        select: { id: true, createdAt: true },
      });

      // 2) Si hay peso inicial, insertar histÃ³rico por la RELACIÃ“N (independiente del nombre del modelo)
      if (rounded != null) {
        await tx.pet.update({
          where: { id: created.id },
          data: {
            weights: {
              create: {
                // usamos la fecha de creaciÃ³n de la mascota para alinear el histÃ³rico
                date: created.createdAt,
                weightKg: rounded,
              },
            },
          },
          select: { id: true },
        });
      }

      return created;
    });

    return res.status(201).json(pet);
  } catch (e: any) {
    console.error("Error creando mascota:", e);
    return res.status(500).json({ error: e.message || "Error al crear mascota" });
  }
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
  const parsedBirth = b.birthDate ? new Date(b.birthDate) : undefined;
  const validBirth = parsedBirth !== undefined
    ? (!parsedBirth || isNaN(parsedBirth.getTime()) ? null : parsedBirth)
    : undefined;

  const updated = await prisma.pet.update({
    where: { id: petId },
    data: {
      name: b.name ?? undefined,
      species: b.species ?? undefined,
      sex: b.sex ?? undefined,
      breed: b.breed ?? undefined,
      birthDate: validBirth,                                   // âŸµ NUEVO
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
    await prisma.weightHistory.deleteMany({ where: { petId } });
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
//                        FICHA CLÃNICA
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
      name: { not: NO_DISEASES_ACK_NAME }, // â¬…ï¸ oculta el ACK
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


// --------------- Pesos ------------------

export async function listWeights(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;

  // Verificar que la mascota pertenece al usuario y obtener peso actual + fechas
  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: userId },
    select: { id: true, weightKg: true, createdAt: true, updatedAt: true },
  });
  if (!pet) return res.sendStatus(404);

  // Traer histÃ³ricos (mÃ¡s recientes primero)
  const historics = await prisma.weightHistory.findMany({
    where: { petId },
    orderBy: { date: "desc" },
    select: { id: true, date: true, weightKg: true },
  });

  // Helpers para rangos del dÃ­a (evitar duplicados por hora distinta)
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  // Construir "current" desde pet
  const current =
    typeof pet.weightKg === "number"
      ? {
          weightKg: pet.weightKg,
          date: (pet.updatedAt ?? pet.createdAt)?.toISOString() ?? null,
        }
      : null;

  // Si el current y un histÃ³rico caen el mismo dÃ­a con el mismo valor, ocultamos el duplicado del histÃ³rico
  let filteredHistorics = historics;
  if (current?.date && typeof current.weightKg === "number") {
    const d = new Date(current.date);
    const s = startOfDay(d);
    const e = endOfDay(d);
    filteredHistorics = historics.filter(
      (h) =>
        !(new Date(h.date) >= s &&
          new Date(h.date) <= e &&
          Number(h.weightKg) === Number(current.weightKg))
    );
  }

  return res.json({
    current: current ?? null,
    historics: filteredHistorics,
  });
}

export async function addWeight(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId } = req.params;
  const b = req.body as any;

  const pet = await prisma.pet.findFirst({
    where: { id: petId, ownerId: userId },
    select: { id: true, weightKg: true, createdAt: true, updatedAt: true },
  });
  if (!pet) return res.sendStatus(404);

  const newWeight = Number(b.weightKg);
  if (!newWeight || Number.isNaN(newWeight) || newWeight <= 0) {
    return res.status(400).json({ error: "Peso invÃ¡lido" });
  }

  // Fecha del nuevo peso (si no viene, hoy)
  const newDate = b.date ? new Date(b.date) : new Date();

  // Fecha a la que se â€œanotaâ€ el peso anterior como histÃ³rico
  const archiveDate = pet.updatedAt ?? pet.createdAt ?? new Date();

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  await prisma.$transaction(async (tx) => {
    // 1) Si habÃ­a peso actual, lo pasamos a histÃ³rico (en la fecha del "anterior current"),
    //    evitando duplicar si ya existe igual valor el mismo dÃ­a.
    if (typeof pet.weightKg === "number") {
      const s = startOfDay(archiveDate);
      const e = endOfDay(archiveDate);
      const exists = await tx.weightHistory.findFirst({
        where: {
          petId,
          date: { gte: s, lte: e },
          weightKg: pet.weightKg,
        },
        select: { id: true },
      });

      if (!exists) {
        await tx.weightHistory.create({
          data: { petId, date: archiveDate, weightKg: pet.weightKg },
        });
      }
    }

    // 2) Actualizar el peso actual de la mascota (esto setea updatedAt)
    await tx.pet.update({
      where: { id: petId },
      data: { weightKg: newWeight, updatedAt: new Date() },
      select: { id: true },
    });

    // 3) Registrar explÃ­citamente el nuevo peso en histÃ³ricos en su propia fecha,
    //    evitando duplicar (mismo dÃ­a, mismo valor).
    const s2 = startOfDay(newDate);
    const e2 = endOfDay(newDate);
    const existsNew = await tx.weightHistory.findFirst({
      where: {
        petId,
        date: { gte: s2, lte: e2 },
        weightKg: newWeight,
      },
      select: { id: true },
    });

    if (!existsNew) {
      await tx.weightHistory.create({
        data: { petId, date: newDate, weightKg: newWeight },
      });
    }
  });

  // Responder con el shape consistente
  return listWeights(req, res);
}

// ELIMINAR: solo borra histÃ³ricos (si envÃ­an "current" no encontrarÃ¡ nada â†’ 404)
export async function deleteWeight(req: Request, res: Response) {
  const userId = (req as any).userId as string;
  const { petId, weightId } = req.params;

  const pet = await prisma.pet.findFirst({ where: { id: petId, ownerId: userId } });
  if (!pet) return res.sendStatus(404);

  const del = await prisma.weightHistory.deleteMany({
    where: { id: weightId, petId },
  });

  if (del.count === 0) return res.sendStatus(404);
  return res.sendStatus(204);
}


// ============================================================
//                        NUTRICIÃ“N
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

  // Si petId es UNIQUE en nutritionProfile, esto estÃ¡ OK.
  const np = await prisma.nutritionProfile.findUnique({ where: { petId } });
  if (!np) return res.json(null);

  // ðŸ” Al responder: arrays reales (no strings)
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
    if (!weightKg || weightKg <= 0) weightKg = 10; // fallback mÃ­nimo

    // Defaults dinÃ¡micos
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

    // âš ï¸ 'weightKg' NO es campo de nutritionProfile â†’ lo excluimos del payload a Prisma
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

    // Upsert por petId (requiere Ã­ndice Ãºnico en petId)
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


