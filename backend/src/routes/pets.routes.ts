import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/auth.middleware.js';
import {
  listPets, createPet, getPet, updatePet, deletePet,
  getClinical, upsertClinical,
  addVaccination, listVaccinations, updateVaccination, deleteVaccination,
  addDisease, listDiseases, updateDisease, deleteDisease,
  addWeight, listWeights, deleteWeight,
  getNutrition, upsertNutrition,
} from '../controllers/pets.controller.js';
import { CreatePetSchema, UpdatePetSchema } from '../schemas/pet.schema.js';
import { UpsertClinicalSchema, VaccinationSchema, DiseaseSchema, WeightLogSchema } from '../schemas/clinical.schema.js';
import { UpsertNutritionSchema } from '../schemas/nutrition.schema.js';

const validate = (schema: z.ZodSchema) => (req: any, res: any, next: any) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.format());
  req.body = parsed.data; next();
};

const r = Router();
r.use(authGuard);

r.get('/', listPets);
r.post('/', validate(CreatePetSchema), createPet);
r.get('/:petId', getPet);
r.patch('/:petId', validate(UpdatePetSchema), updatePet);
r.put('/:petId',   validate(UpdatePetSchema), updatePet);
r.delete('/:petId', deletePet);

r.get('/:petId/clinical',  getClinical);
r.put('/:petId/clinical',  validate(UpsertClinicalSchema), upsertClinical);

r.get('/:petId/clinical/vaccinations',  listVaccinations);
r.post('/:petId/clinical/vaccinations', validate(VaccinationSchema), addVaccination);
r.patch('/:petId/clinical/vaccinations/:vaccinationId', validate(VaccinationSchema.partial()), updateVaccination);
r.delete('/:petId/clinical/vaccinations/:vaccinationId', deleteVaccination);

r.get('/:petId/clinical/diseases',  listDiseases);
r.post('/:petId/clinical/diseases', validate(DiseaseSchema), addDisease);
r.patch('/:petId/clinical/diseases/:diseaseId', validate(DiseaseSchema.partial()), updateDisease);
r.delete('/:petId/clinical/diseases/:diseaseId', deleteDisease);

r.get('/:petId/clinical/weights',  listWeights);
r.post('/:petId/clinical/weights', validate(WeightLogSchema), addWeight);
r.delete('/:petId/clinical/weights/:weightId', deleteWeight);

r.get('/:petId/nutrition', getNutrition);
r.put('/:petId/nutrition', validate(UpsertNutritionSchema), upsertNutrition);

export default r;
