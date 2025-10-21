// backend/src/routes/pets.routes.ts
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { prisma } from '../services/prisma.ts';

import { authGuard } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";

import {
  listPets, createPet, getPet, updatePet, deletePet,
  getClinical, upsertClinical,
  addVaccination, listVaccinations, updateVaccination, deleteVaccination,
  addDisease, listDiseases, updateDisease, deleteDisease,
  addWeight, listWeights, deleteWeight,
  getNutrition, upsertNutrition,
  uploadPetPhoto,
  getWizardCompletion,
  ackNoDiseasesForPet,
  getNutritionDefaults,
} from "../controllers/pets.controller.ts";

import { CreatePetSchema, UpdatePetSchema } from "../schemas/pet.schema.ts";
import {
  UpsertClinicalSchema,
  VaccinationSchema,
  DiseaseSchema,
  WeightLogSchema,
} from "../schemas/clinical.schema.ts";
import { UpsertNutritionSchema } from "../schemas/nutrition.schema.ts";

const r = Router();
r.use(authGuard);

// ---- LÍMITE BASIC: 2 mascotas ----
const BASIC_PET_LIMIT = 2;
async function enforcePetLimit(req: any, res: any, next: any) {
  try {
    const userId = req.userId as string | undefined;
    if (!userId) return res.status(401).json({ message: "No autorizado" });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    if (user?.plan !== "BASIC") return next();

    const count = await prisma.pet.count({ where: { ownerId: userId } });
    if (count >= BASIC_PET_LIMIT) {
      return res.status(409).json({
        message: "Alcanzaste tu límite de mascotas en el plan Básico.",
        code: "LIMIT_PETS_REACHED",
        quota: { used: count, limit: BASIC_PET_LIMIT },
      });
    }
    return next();
  } catch (e) {
    console.error("enforcePetLimit error", e);
    return res.status(500).json({ message: "Error validando límite de mascotas" });
  }
}

// ---- Multer (fotos) ----
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${req.params.petId ?? "pet"}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ---- Mascotas ----
r.get("/", listPets);
r.post("/", enforcePetLimit, validate(CreatePetSchema), createPet);
r.get("/:petId", getPet);
r.patch("/:petId", validate(UpdatePetSchema), updatePet);
r.put("/:petId", validate(UpdatePetSchema), updatePet);
r.delete("/:petId", deletePet);

// ---- Clínica ----
r.get("/:petId/clinical", getClinical);
r.put("/:petId/clinical", validate(UpsertClinicalSchema), upsertClinical);

// ---- Vacunas ----
r.get("/:petId/clinical/vaccinations", listVaccinations);
r.post("/:petId/clinical/vaccinations", validate(VaccinationSchema), addVaccination);
r.patch("/:petId/clinical/vaccinations/:vaccinationId", validate(VaccinationSchema.partial()), updateVaccination);
r.delete("/:petId/clinical/vaccinations/:vaccinationId", deleteVaccination);

// ---- Enfermedades ----
r.get("/:petId/clinical/diseases", listDiseases);
r.post("/:petId/clinical/diseases", validate(DiseaseSchema), addDisease);
r.patch("/:petId/clinical/diseases/:diseaseId", validate(DiseaseSchema.partial()), updateDisease);
r.delete("/:petId/clinical/diseases/:diseaseId", deleteDisease);

// ---- Pesos ----
r.get("/:petId/clinical/weights", listWeights);
r.post("/:petId/clinical/weights", validate(WeightLogSchema), addWeight);
r.delete("/:petId/clinical/weights/:weightId", deleteWeight);

// ---- Nutrición ----
r.get("/:petId/nutrition", getNutrition);
r.get("/:petId/nutrition/defaults", getNutritionDefaults); 
r.put("/:petId/nutrition", validate(UpsertNutritionSchema), upsertNutrition);

// ---- Foto ----
r.post("/:petId/photo", upload.single("file"), uploadPetPhoto);

// ---- Wizard ----
r.get("/:petId/wizard/completion", getWizardCompletion);
r.post("/:petId/diseases/no-diseases-ack", ackNoDiseasesForPet);

export default r;
