// src/config/nutrition-defaults.ts
export type SizeKey = "TOY" | "SMALL" | "MEDIUM" | "LARGE" | "GIANT";

type nutritionDefaults = {
  dietType: "RAW" | "COOKED" | "COMMERCIAL" | "MIXED";
  mealsPerDay: number;
  activityLevel: "LOW" | "MODERATE" | "HIGH";
  goal: "MAINTENANCE" | "GAIN" | "LOSS";
  kcalPerKg?: number;
  minDailyCalories?: number;
  maxDailyCalories?: number;
  waterMlPerKg?: number;
};

// Valores por tamaño
export const NUTRITION_DEFAULTS_BY_SIZE: Record<SizeKey, nutritionDefaults> = {
  TOY:    { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 80,  minDailyCalories: 120, maxDailyCalories: 600,  waterMlPerKg: 60 },
  SMALL:  { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 70,  minDailyCalories: 200, maxDailyCalories: 900,  waterMlPerKg: 55 },
  MEDIUM: { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 55,  minDailyCalories: 300, maxDailyCalories: 1400, waterMlPerKg: 50 },
  LARGE:  { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 45,  minDailyCalories: 400, maxDailyCalories: 2200, waterMlPerKg: 45 },
  GIANT:  { dietType: "MIXED", mealsPerDay: 2, activityLevel: "MODERATE", goal: "MAINTENANCE", kcalPerKg: 40,  minDailyCalories: 500, maxDailyCalories: 3000, waterMlPerKg: 40 },
};

/** Normaliza a SizeKey; fallback MEDIUM si viene algo raro. */
export function normalizeSize(sizeRaw: unknown): SizeKey {
  const s = String(sizeRaw ?? "MEDIUM").toUpperCase();
  const keys: SizeKey[] = ["TOY","SMALL","MEDIUM","LARGE","GIANT"];
  return (keys as string[]).includes(s) ? (s as SizeKey) : "MEDIUM";
}

// Pesos promedio por raza (kg)
export const DOG_BREED_AVG_WEIGHT: Record<string, number> = {
  "AFFENPINSCHER": 3,
  "AIREDALE TERRIER": 23,
  "AKITA (AKITA INU)": 38,
  "AKITA AMERICANO (AMERICAN AKITA)": 40,
  "ALANO ESPAÑOL": 35,
  "AMERICAN BULLY": 30,
  "AMERICAN ESKIMO": 15,
  "AMERICAN LEOPARD HOUND (CATAHOULA)": 27,
  "AMERICAN STAFFORDSHIRE TERRIER": 30,
  "AZAWAKH (TUAREG SLOUGHI)": 25,
  "BASENJI": 11,
  "BASSET HOUND": 25,
  "BEAGLE": 12,
  "BICHON DE PELO RIZADO (BICHON FRISE)": 6,
  "BICHON HABANERO (HAVANESE)": 5,
  "BLOODHOUND (CHIEN DE SAN HUMBERTO)": 35,
  "BLUETICK COONHOUND": 30,
  "BORDER COLLIE": 18,
  "BORZOI (LEBREL RUSO PARA LA CAZA)": 32,
  "BOSTON TERRIER": 8,
  "BOXER": 30,
  "BOYERO AUSTRALIANO (AUSTRALIAN CATTLE DOG)": 25,
  "BOYERO DE BERNA (BERNESE MOUNTAIN DOG)": 38,
  "BOYERO DE FLANDES (BOUVIER DES FLANDRES)": 35,
  "BRACO ALEMAN DE PELO CORTO (KURZHAAR)": 30,
  "BRACO ALEMAN DE PELO DURO (DRAHTHAAR)": 32,
  "BRACO FRANCÉS (BRACO DE LOS PIRINEOS)": 28,
  "BRACO HUNGARO/VIZSLA (HUNGARIAN POINTER)": 25,
  "BRIQUET GRIFFON VENDEEN": 12,
  "BROHOLMER": 60,
  "BULL TERRIER": 25,
  "BULLDOG AMERICANO": 35,
  "BULLDOG FRANCES (FRENCH BULLDOG)": 12,
  "BULLDOG INGLES": 25,
  "BULLMASTIFF": 55,
  "CAIRN TERRIER": 7,
  "CAN DE PALLEIRO (PASTOR GALEGO)": 25,
  "CANE CORSO (ITALIAN CORSO DOG)": 45,
  "CAVALIER KING CHARLES SPANIEL": 6,
  "CHESAPEAKE BAY RETRIEVER": 32,
  "CHIHUAHUA (CHIHUAHUEÑO)": 3,
  "CHOW CHOW": 30,
  "CIMARRÓN URUGUAYO": 35,
  "CLUMBER SPANIEL": 27,
  "COCKER SPANIEL AMERICANO": 14,
  "COCKER SPANIEL INGLES": 13,
  "COLLIE BARBUDO (BEARDED COLLIE)": 25,
  "COLLIE DE PELO CORTO (COLLIE SMOOTH)": 23,
  "COLLIE DE PELO LARGO (COLLIE ROUGH)": 25,
  "CONTINENTAL TOY SPANIEL/PAPILLON": 4,
  "CORGI GALES DE CARDIGAN (WELSH CORGI CARDIGAN)": 13,
  "CORGI GALES DE PEMBROKE (WELSH CORGI PEMBROKE)": 12,
  "COTON DE TULEAR": 5,
  "CRESTADO CHINO (CHINESE CRESTED DOG)": 4,
  "CRESTADO RODESIANO (RHODESIAN RIDGEBACK)": 35,
  "DACHSHUND (TECKEL)": 7,
  "DALMATA": 25,
  "DOBERMANN": 35,
  "DOGO ARGENTINO": 40,
  "DOGO DE BURDEOS (DOUGE DE BORDEAUX)": 50,
  "EURASIER (EURASIAN DOG)": 30,
  "FILA BRASILEIRO": 50,
  "FLAT COATED RETRIEVER (COBRADOR DE PELO LISO)": 30,
  "FOX TERRIER DE PELO ALAMBRE (WIRE)": 8,
  "FOX TERRIER DE PELO LISO (SMOOTH)": 8,
  "FOXHOUND AMERICANO": 30,
  "FOXHOUND INGLES": 30,
  "GALGO (SPANISH GREYHOUND)": 28,
  "GALGO INGLES (GREYHOUND)": 30,
  "GALGO ITALIANO (ITALIAN GREYHOUND)": 6,
  "GOLDEN RETRIEVER (COBRADOR DORADO)": 32,
  "GORDON SETTER": 30,
  "GRAN DANES/DOGO ALEMAN (GREAT DANE)": 60,
  "GRAN PIRINEO/PERRO DE MONTAÑA DE LOS PIRINEOS": 50,
  "GRIFON DE BRUSELAS (GRIFFON BRUXELLOIS)": 5,
  "GRIFON PELO DURO (WIRE-HAIRED POINTING KORTHALS)": 25,
  "HOVAWART": 35,
  "HUSKY SIBERIANO": 25,
  "JACK RUSSELL TERRIER": 6,
  "KANGAL": 50,
  "KELPIE AUSTRALIANO": 20,
  "KERRY BLUE TERRIER": 16,
  "KOMONDOR": 50,
  "KUVASZ": 45,
  "LABRADOR RETRIEVER": 32,
  "LEBREL AFGANO (AFGHAN HOUND)": 27,
  "LEBREL POLACO (CHART POLSKI)": 30,
  "LEONBERGER": 55,
  "LHASA APSO": 6,
  "LOBERO IRLANDÉS (IRISH WOLFHOUND)": 55,
  "LÖWCHEN (PEQUEÑO PERRO LEÓN)": 4,
  "MALAMUTE DE ALASKA": 35,
  "MALTESE (BICHON MALTES/MALTES)": 4,
  "MASTIN INGLES (MASTIFF)": 55,
  "MASTIN NAPOLITANO (NEAPOLITAN MASTIFF)": 60,
  "MASTIN TIBETANO/DOGO DEL TIBET": 50,
  "MASTÍN ESPAÑOL (MASTÍN LEONÉS)": 50,
  "MESTIZO": 20,
  "MUDI": 10,
  "NORFOLK TERRIER": 6,
  "OLDE ENGLISH BULLDOGGE": 35,
  "OVEJERO MAGALLANICO": 30,
  "PARSON RUSSELL TERRIER": 7,
  "PASTOR ALEMAN/OVEJERO ALEMAN": 35,
  "PASTOR AUSTRALIANO (AUSTRALIAN SHEPHERD)": 25,
  "PASTOR BELGA (BELGIAN SHEPHERD DOG)": 30,
  "PASTOR BLANCO SUIZO (WHITE SWISS SHEPHERD DOG)": 35,
  "PASTOR CATALAN (CATALAN SHEEPDOG)": 25,
  "PASTOR CROATA (CROATIAN SHEPHERD DOG)": 30,
  "PASTOR DE ANATOLIA (ANATOLIAN)": 50,
  "PASTOR DE ASIA CENTRAL (ALABAY)": 50,
  "PASTOR DE BEAUCE (BERGER DE BEAUCE/BEAUCERON)": 35,
  "PASTOR DE BRIE (BRIARD)": 30,
  "PASTOR DE LOS PIRINEOS DE PELO LARGO": 45,
  "PASTOR DE MAREMMA (MAREMANNO-ABRUCENSE)": 50,
  "PASTOR DE PICARDIE (PICARDY SHEEPDOG)": 30,
  "PASTOR DE SHETLAND (SHETLAND SHEEPDOG)": 10,
  "PASTOR DEL CAUCASO (CAUCASIAN SHEPHERD DOG)": 50,
  "PASTOR HOLANDES (DUTCH SHEPHERD DOG)": 30,
  "PASTOR INGLES (OLD ENGLISH SHEEPDOG)": 35,
  "PASTOR MALLORQUIN (CA DE BESTIAR)": 25,
  "PASTOR POLACO DE LAS LLANURAS (POLISH LOWLAND SHEEPDOG)": 35,
  "PASTOR POLACO DE PODHALE (TRATA SHEPHERD DOG)": 35,
  "PASTOR PORTUGUÉS (PORTUGUESE SHEEPDOG)": 25,
  "PEKINES (PEKINGESE)": 6,
  "PERDIGUERO DE BURGOS (BURGOS POINTING DOG)": 25,
  "PERRO DE AGUA ESPAÑOL (SPANISH WATER DOG)": 25,
  "PERRO DE AGUA FRISON (FRISIAN WATER DOG)": 25,
  "PERRO LOBO CHECOSLOVACO (CZECHOSLOVAKIAN WOLFDOG)": 35,
  "PERRO SIN PELO DEL PERU (PERUVIAN HAIRLESS DOG)": 12,
  "PINSCHER ALEMÁN (GERMAN PINSCHER)": 7,
  "PINSCHER AUSTRIACO (AUSTRIAN PINSCHER)": 7,
  "PINSCHER MINIATURA (MINIATURE PINSCHER)": 4,
  "PIT BULL TERRIER AMERICANO": 30,
  "PODENCO": 20,
  "POINTER ALEMAN PELO LARGO (DEUTSCH LANGHAAR)": 30,
  "POINTER INGLES (ENGLISH POINTER)": 30,
  "POMERANIA/SPITZ ALEMAN ENANO": 3,
  "POODLE (CANICHE)": 20,
  "PRESA CANARIO/DOGO CANARIO": 45,
  "PRESA MALLORQUÍN (CA DE BOU)": 40,
  "PUG (DOGUILLO)": 8,
  "PULI": 13,
  "PUMI": 12,
  "RATONERO MALLORQUÍN (CA RATER)": 7,
  "RETRIEVER DE NUEVA ESCOCIA (DUCK TOLLING)": 25,
  "ROTTWEILER": 50,
  "SALUKI": 20,
  "SAMOYEDO": 30,
  "SAN BERNARDO (ST. BERNARD)": 60,
  "SCHNAUZER": 25,
  "SCOTTISH TERRIER": 9,
  "SEALYHAM TERRIER": 8,
  "SETTER INGLES (ENGLISH SETTER)": 30,
  "SETTER IRLANDES (IRISH RED SETTER)": 30,
  "SETTER IRLANDES ROJO Y BLANCO (IRISH RED AND WHITE SETTER)": 30,
  "SHAR PEI": 25,
  "SHIBA (SHIBA INU)": 10,
  "SHIH TZU": 5,
  "SHIPPERKE": 6,
  "SILKY TERRIER AUSTRALIANO (AUSTRALIAN SILKY TERRIER)": 4,
  "SKYE TERRIER": 8,
  "SPANIEL BRETON (BRITTANY SPANIEL)": 14,
  "SPANIEL TIBETANO (TIBETAN SPANIEL)": 5,
  "SPITZ ALEMAN": 7,
  "SPITZ JAPONES": 5,
  "SPRINGER SPANIEL INGLES": 18,
  "STAFFORDSHIRE BULL TERRIER": 25,
  "TCHUVATCH ESLOVACO (SLOVAKIAN CHUVACH)": 35,
  "TERRANOVA (NEWFOUNDLAND)": 50,
  "TERRIER ALEMAN (GERMAN HUNTING TERRIER)": 8,
  "TERRIER AUSTRALIANO (AUSTRALIAN SILKY TERRIER)": 4,
  "TERRIER BRASILEÑO (BRAZILIAN TERRIER)": 8,
  "TERRIER CHILENO": 8,
  "TERRIER IRLANDÉS (IRISH TERRIER)": 14,
  "TERRIER RUSO NEGRO (RUSSIAN BLACK TERRIER)": 48,
  "TERRIER TIBETANO": 7,
  "TOSA INU": 45,
  "VOLPINO ITALIANO": 5,
  "WEIMARANER": 35,
  "WELSH TERRIER": 9,
  "WEST HIGHLAND WHITE TERRIER": 8,
  "WHIPPET": 12,
  "XOLOITZCUINTLE": 12,
  "YORKSHIRE TERRIER": 4
};


/** Calcula defaults dinámicos por tamaño/peso/raza */
export function computeNutritionDefaults(args: { size?: SizeKey | string; weightKg?: number; breed?: string }) {
  const size = normalizeSize(args.size);
  const profile = NUTRITION_DEFAULTS_BY_SIZE[size];

  let w = Number(args.weightKg ?? 0);
  if ((!w || w <= 0) && args.breed) {
    w = DOG_BREED_AVG_WEIGHT[args.breed.toUpperCase().trim()] ?? w;
  }

  const dailyCalories = profile.kcalPerKg && w > 0
    ? Math.min(Math.max(Math.round(profile.kcalPerKg * w), profile.minDailyCalories ?? 100), profile.maxDailyCalories ?? 5000)
    : undefined;

  const waterIntakeMl = profile.waterMlPerKg && w > 0
    ? Math.round(profile.waterMlPerKg * w)
    : undefined;

  return {
    dietType: profile.dietType,
    mealsPerDay: profile.mealsPerDay,
    activityLevel: profile.activityLevel,
    goal: profile.goal,

    preferredFoods: [] as string[],
    forbiddenFoods: [] as string[],
    intolerances: [] as string[],
    foodAllergies: [] as string[],
    supplements: [] as string[],

    dailyCalories,
    waterIntakeMl,
    weightKg: w || undefined,
    notes: undefined as string | undefined,
  };
}


/**
 * Mezcla defaults -> override.
 * REGLA: si override[k] es undefined **o** es un array vacío ([]), se IGNORA y se
 * mantiene el valor de defaults. Para cualquier otro valor (incluye null),
 * se sobrescribe.
 */
export function mergeNutritionDefaults<T extends Record<string, any>>(defaults: T, override: Partial<T>): T {
  const out: any = { ...defaults };
  for (const k of Object.keys(override ?? {})) {
    const v = (override as any)[k];

    // Ignorar undefined o null (usar default)
    if (v === undefined || v === null) continue;

    // Ignorar arrays vacíos (usar default)
    if (Array.isArray(v) && v.length === 0) continue;

    // En cualquier otro caso, usar el valor del usuario
    out[k] = v;
  }
  return out;
}