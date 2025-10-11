// backend/src/services/ai.service.ts

// Aquí puedes integrar un LLM local (Ollama/LM Studio) o futuro externo.
// Por ahora devolvemos una receta simulada bien formada para validar el flujo.

export const generateAIRecipe = async (
  pet: any,
  pantry: any[],
  goal?: string,
  mealType?: string
) => {
  const ingredients = pantry?.map((p) => p.ingredient?.name).filter(Boolean) ?? [];
  const diseases = pet?.diseases?.map((d: any) => d.name) ?? [];

  const prompt = `
Eres un experto en nutrición animal.
Genera una receta ${mealType || "completa"} personalizada para ${pet?.name}, un ${pet?.species}
de ${pet?.age ?? "N/A"} años y ${pet?.weight ?? "N/A"} kg, con el objetivo: ${goal || "mantener su salud"}.
Condiciones: ${diseases.length ? diseases.join(", ") : "sin enfermedades conocidas"}.
Ingredientes disponibles en la despensa: ${ingredients.length ? ingredients.join(", ") : "sin ingredientes declarados"}.
Responde en formato JSON con:
{
  "nombre": "...",
  "ingredientes": ["...", "..."],
  "porciones": "...",
  "instrucciones": ["Paso 1...", "Paso 2..."],
  "beneficios": ["..."]
}
`.trim();

  // TODO: Integrar aquí tu motor IA (ej. llamada HTTP a Ollama/LM Studio)
  // Retorno simulado (válido para pruebas end-to-end)
  return {
    nombre: `Receta saludable para ${pet?.name}`,
    ingredientes: ingredients.length ? ingredients : ["pollo", "arroz integral", "zanahoria"],
    porciones: "1 porción diaria (ajustar según peso/actividad)",
    instrucciones: [
      "Cocer los ingredientes de forma separada hasta que estén blandos.",
      "Mezclar y dejar enfriar a temperatura ambiente.",
      "Servir en un plato limpio y adecuado al tamaño del animal."
    ],
    beneficios: [
      "Aporta nutrientes equilibrados.",
      "Apoya el sistema digestivo.",
      "Contribuye a un pelaje saludable."
    ],
    promptUsado: prompt
  };
};
