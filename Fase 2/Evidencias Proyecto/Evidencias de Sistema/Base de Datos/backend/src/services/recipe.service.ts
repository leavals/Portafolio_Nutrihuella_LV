import { aiGenerate } from '@/ai';
import { GenerateRecipeBody, GeneratedRecipeSchema, GeneratedRecipe } from '@/schemas/recipe.schema';
import { extractJson } from '@/utils/json-extract';

const DISCLAIMER = 'Estos resultados son solo de referencia y no deben tratarse como base para un tratamiento médico o para determinar las condiciones de salud.';

export async function generateRecipeService(payload: GenerateRecipeBody, userPreferencesText: string | null = null): Promise<GeneratedRecipe> {
  const { petProfile, pantry, goals, planType } = payload;

  const planMap = {
    BREAKFAST: 'desayuno',
    LUNCH: 'almuerzo',
    DINNER: 'cena',
    DAILY: 'menú diario (desayuno, almuerzo, cena)',
    WEEKLY: 'menú semanal (7 días)'
  } as const;

  const pantryText = pantry.length
    ? pantry.map(p => `- ${p.name}${p.quantity ? `: ${p.quantity}${p.unit ?? ''}` : ''}`).join('\n')
    : 'El usuario no tiene ingredientes cargados en la despensa.';

  const diseases = petProfile.diseases?.length ? petProfile.diseases.join(', ') : 'N/A';
  const allergies = petProfile.allergies?.length ? petProfile.allergies.join(', ') : 'N/A';
  const vaccines  = petProfile.vaccines?.length ? petProfile.vaccines.join(', ')  : 'N/A';
  const weights   = petProfile.lastWeights?.length
    ? petProfile.lastWeights.map(w => `${w.date}: ${w.kg}kg`).join('; ')
    : 'N/A';

  const preferenceBlock = userPreferencesText
    ? `\n### Preferencias aprendidas del usuario\n${userPreferencesText}\n`
    : '';

  const prompt = `
Eres un/a nutricionista veterinario/a. Genera un ${planMap[planType]} para una mascota **usando preferentemente ingredientes de la despensa** y **evitando alergias**. Ajusta por especie, peso, tamaño y nivel de actividad. Si falta un ingrediente clave, sugiere alternativa segura. Devuelve **SOLO JSON válido** con la estructura exacta de "output_format" sin texto adicional, dame siempre los ingredientes en gramos para una mejor exactitud y una preparacion detallada profesionalmente.

### Mascota
- Nombre: ${petProfile.name}
- Especie: ${petProfile.species}
- Raza: ${petProfile.breed ?? 'N/A'}
- Sexo: ${petProfile.sex ?? 'N/A'}
- Esterilizado: ${petProfile.sterilized ? 'Sí' : 'No/Desconocido'}
- Edad (años): ${petProfile.ageYears ?? 'N/A'}
- Peso (kg): ${petProfile.weightKg ?? 'N/A'}
- Tamaño: ${petProfile.size ?? 'N/A'}
- Actividad: ${petProfile.activityLevel ?? 'N/A'}
- Enfermedades: ${diseases}
- Alergias: ${allergies}
- Vacunas: ${vaccines}
- Historial de peso (reciente): ${weights}
- Notas de nutrición: ${petProfile.nutritionNotes ?? 'N/A'}

### Objetivos del usuario
${goals ?? 'N/A'}

### Despensa del usuario
${pantryText}
${preferenceBlock}

### Reglas de formulación
- Ajusta por especie (perro/gato), peso y actividad.
- Evita ingredientes en alergias y considera enfermedades.
- Usa la despensa disponible; si falta algo, sugiere sustitutos razonables.
- Incluye cantidades aproximadas (g/ml/unid) cuando sea apropiado.
- Si es menú semanal, genera 7 días (cada día con sus comidas).
- Incluye kcal estimadas por comida si es razonable y un total diario.
- Agrega advertencias si alguna receta requiere supervisión.
- Incluye SIEMPRE el disclaimer adjunto.
- Devuelve **solo** JSON válido (sin backticks, sin texto extra).

### output_format
{
  "title": "string",
  "planType": "BREAKFAST|LUNCH|DINNER|DAILY|WEEKLY",
  "totalDailyKcal": 0,
  "meals": [
    {
      "name": "string",
      "kcal": 0,
      "instructions": "string",
      "ingredients": [
        {"name": "string", "qty": 0, "unit": "g|ml|unid"}
      ]
    }
  ],
  "notes": "string",
  "warnings": ["string"],
  "disclaimer": "string"
}
`;

  const raw = await aiGenerate(prompt.trim());
  const json = extractJson(raw);
  const parsed = GeneratedRecipeSchema.safeParse({
    ...(json ?? {}),
    planType,
    disclaimer: DISCLAIMER
  });

  if (!parsed.success) {
    throw new Error(`La IA no devolvió JSON válido: ${parsed.error.message}`);
  }
  return parsed.data;
}
