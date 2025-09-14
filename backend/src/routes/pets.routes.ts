// backend/src/routes/pets.routes.ts
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { prisma } from '../services/prisma.js';


import { authGuard } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  listPets, createPet, getPet, updatePet, deletePet,
  getClinical, upsertClinical,
  addVaccination, listVaccinations, updateVaccination, deleteVaccination,
  addDisease, listDiseases, updateDisease, deleteDisease,
  addWeight, listWeights, deleteWeight,
  getNutrition, upsertNutrition,
  uploadPetPhoto,
} from "../controllers/pets.controller.js";

import { CreatePetSchema, UpdatePetSchema } from "../schemas/pet.schema.js";
import {
  UpsertClinicalSchema,
  VaccinationSchema,
  DiseaseSchema,
  WeightLogSchema,
} from "../schemas/clinical.schema.js";
import { UpsertNutritionSchema } from "../schemas/nutrition.schema.js";

const r = Router();
r.use(authGuard);

// ---- Multer (fotos) ----
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${req.params.petId}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ---- Mascotas ----
r.get("/", listPets);
r.post("/", validate(CreatePetSchema), createPet);
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
r.put("/:petId/nutrition", validate(UpsertNutritionSchema), upsertNutrition);

// ---- Foto ----
r.post("/:petId/photo", upload.single("file"), uploadPetPhoto);

export default r;
