/**
 * prisma/seed.ts — NutriHuella (SQLite/Prisma)
 * Objetivos:
 *  - Reset total opcional manteniendo admin/analyst (SEED_KEEP_SPECIAL=1)
 *  - Usuarios distribuidos entre SEP/OCT/NOV del año actual
 *  - Recetas y favoritos por tipo (BREAKFAST/LUNCH/DINNER/DAILY/WEEKLY)
 *  - Eventos de uso por hora (LOGIN, RECIPE_GENERATED, FAVORITE_ADDED, PANTRY_ADDED)
 *  - Métricas de membresía PLUS con membershipUpdatedAt (tenencia)
 *  - Idempotente y sin duplicar emails
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// -------------------- Parámetros --------------------
const TOTAL_USERS = 100;
const PASSWORD_PLAIN = "Nutri123!";
const BCRYPT_ROUNDS = 8;

const REGION = "Metropolitana";
const CITY = "Santiago";
const THIS_YEAR = new Date().getFullYear();

// Rango de altas deseado (SEP-OCT-NOV)
const PERIOD_START = new Date(THIS_YEAR, 8, 1, 0, 0, 0);  // 1 Sep
const PERIOD_END   = new Date(THIS_YEAR, 10, 30, 23, 59); // 30 Nov

// Probabilidades por hora para heatmap (picos noche)
const HOUR_WEIGHTS = Array.from({ length: 24 }, (_, h) =>
  h >= 20 || h <= 1 ? 3 : h >= 12 && h <= 14 ? 2 : h >= 8 && h <= 10 ? 2 : 1
);

const COMUNAS = [
  "Santiago","Maipú","Puente Alto","La Florida","Ñuñoa","Providencia","Las Condes","Vitacura","La Reina",
  "Peñalolén","Macul","San Miguel","Independencia","Recoleta","Quilicura","Renca","Huechuraba","Conchalí",
  "Lo Barnechea","Cerro Navia","Lo Prado","Quinta Normal","Estación Central","La Granja","San Joaquín",
  "San Ramón","La Cisterna","Pedro Aguirre Cerda","El Bosque","Pudahuel","Lo Espejo","Cerrillos"
];

// Nombres (resumidos por brevedad; puedes mantener los tuyos completos)
const FIRST_NAMES_MALE = ["Juan","Pedro","Diego","Carlos","Jorge","Luis","Felipe","Matías","Sebastián","Francisco"];
const FIRST_NAMES_FEMALE = ["María","Camila","Daniela","Fernanda","Constanza","Carolina","Francisca","Catalina","Valentina","Javiera"];
const MIDDLE_NAMES = ["Andrés","José","Antonio","Ignacio","Alejandro","María","Belén","Antonia","Sofía","Valentina"];
const SURNAMES = ["González","Muñoz","Rojas","Díaz","Pérez","Soto","Contreras","Silva","Martínez","Sepúlveda"];

const DOG_NAMES = ["Luna","Nala","Kira","Lola","Maya","Thor","Coco","Max","Bruno","Leo","Simba","Rocky","Zeus","Toby"];
const CAT_NAMES = ["Luna","Nala","Mia","Nina","Misha","Simba","Tom","Milo","Salem","Garfield","Felix","Max","Leo"];

const PANTRY_ITEMS = [
  { name: "Pechuga de pollo", unit: "g", category: "proteína" },
  { name: "Hígado de vacuno", unit: "g", category: "vísceras" },
  { name: "Arroz", unit: "g", category: "carbohidrato" },
  { name: "Avena", unit: "g", category: "carbohidrato" },
  { name: "Zanahoria", unit: "g", category: "vegetal" },
  { name: "Zapallo", unit: "g", category: "vegetal" },
  { name: "Aceite de salmón", unit: "ml", category: "suplemento" },
  { name: "Huevo", unit: "un", category: "proteína" },
  { name: "Espinaca", unit: "g", category: "vegetal" },
  { name: "Quinoa", unit: "g", category: "carbohidrato" },
];

const RECIPE_TITLES = [
  "Desayuno energético",
  "Almuerzo liviano",
  "Cena alta en proteína",
  "Menú balanceado diario",
  "Plan semanal variado",
];
const PLAN_TYPES = ["BREAKFAST","LUNCH","DINNER","DAILY","WEEKLY"] as const;

// -------------------- Utils --------------------
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)];
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const toDate = (d: Date) => new Date(d.getTime());

function stripAccents(s: string) { return s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

function slugEmailBase(fullName: string) {
  const base = stripAccents(fullName.toLowerCase()).replace(/[^a-z0-9\s.]/g, "").replace(/\s+/g, " ").trim();
  const parts = base.split(" ");
  if (parts.length >= 2) return `${parts[0]}.${parts[1]}`;
  return base.replace(/\s+/g, ".");
}

function randomPetWeight(species: "DOG" | "CAT") {
  return species === "DOG" ? +(Math.random() * 25 + 3).toFixed(1) : +(Math.random() * 7 + 2).toFixed(1);
}
function randomPetSize(species: "DOG" | "CAT") {
  return species === "DOG" ? pick(["SMALL","MEDIUM","LARGE"]) : pick(["SMALL","MEDIUM"]);
}
function randomPetSex() { return pick(["MALE","FEMALE"]); }

// Fecha aleatoria entre [a,b]
function randomDateBetween(a: Date, b: Date) {
  const t = a.getTime() + Math.random() * (b.getTime() - a.getTime());
  return new Date(t);
}
// Hora ponderada
function weightedRandomHour() {
  const sum = HOUR_WEIGHTS.reduce((s, w) => s + w, 0);
  let r = Math.random() * sum;
  for (let h = 0; h < 24; h++) { r -= HOUR_WEIGHTS[h]; if (r <= 0) return h; }
  return rand(0, 23);
}
// Nombre completo (única vez, evita duplicados de definición)
function buildFullNameOnce(g: "M" | "F") {
  const first = g === "M" ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
  const middle = Math.random() < 0.45 ? pick(MIDDLE_NAMES) : null;
  const s1 = pick(SURNAMES), s2 = pick(SURNAMES);
  return middle ? `${first} ${middle} ${s1} ${s2}` : `${first} ${s1} ${s2}`;
}

// -------------------- Reset --------------------
async function resetAll(keepSpecial: boolean) {
  const adminEmail = "admin@nutrihuella.cl";
  const analystEmail = "analyst@nutrihuella.cl";
  const special = await prisma.user.findMany({ where: { email: { in: [adminEmail, analystEmail] } }, select: { id: true } });
  const specialIds = special.map(s => s.id);

  // Borra hijos primero
  await prisma.favoriteRecipe.deleteMany(keepSpecial ? { where: { userId: { notIn: specialIds } } } : {});
  await prisma.recipeFeedback.deleteMany(keepSpecial ? { where: { userId: { notIn: specialIds } } } : {});
  await prisma.recipe.deleteMany(keepSpecial ? { where: { userId: { notIn: specialIds } } } : {});
  await prisma.analyticsEvent.deleteMany(keepSpecial ? { where: { userId: { notIn: specialIds } } } : {});
  await prisma.pantryItem.deleteMany(keepSpecial ? { where: { ownerId: { notIn: specialIds } } } : {});
  await prisma.payment.deleteMany(keepSpecial ? { where: { userId: { notIn: specialIds } } } : {});
  await prisma.dailyStat.deleteMany(keepSpecial ? { where: { userId: { notIn: specialIds } } } : {});
  await prisma.weightHistory.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.disease.deleteMany();
  await prisma.nutritionProfile.deleteMany();
  await prisma.clinicalRecord.deleteMany();
  await prisma.pet.deleteMany(keepSpecial ? { where: { ownerId: { notIn: specialIds } } } : {});
  await prisma.passwordResetToken.deleteMany();
  await prisma.emailVerifyToken.deleteMany();

  // Borra usuarios (excepto especiales si corresponde)
  if (keepSpecial) {
    await prisma.user.deleteMany({ where: { id: { notIn: specialIds } } });
  } else {
    await prisma.user.deleteMany({});
  }
}

// -------------------- Poblado hijos --------------------
async function populateUserChildren(userId: string, createdAt: Date) {
  // Mascotas
  const petsCount = await prisma.pet.count({ where: { ownerId: userId } });
  if (petsCount === 0) {
    const nPets = rand(1, 2);
    for (let p = 0; p < nPets; p++) {
      const species: "DOG" | "CAT" = Math.random() < 0.7 ? "DOG" : "CAT";
      const pet = await prisma.pet.create({
        data: {
          ownerId: userId,
          name: species === "DOG" ? pick(DOG_NAMES) : pick(CAT_NAMES),
          species,
          sex: randomPetSex(),
          breed: species === "DOG" ? pick(["Mestizo","Labrador Retriever","Poodle","Beagle"]) : pick(["Doméstico","Siames","Persa"]),
          birthDate: daysAgo(rand(200, 2800)),
          size: randomPetSize(species),
          weightKg: randomPetWeight(species),
          sterilized: Math.random() < 0.6,
          createdAt: randomDateBetween(PERIOD_START, PERIOD_END),
        },
      });

      await prisma.clinicalRecord.create({
        data: {
          petId: pet.id,
          allergies: Math.random() < 0.2 ? "Pollo" : null,
          chronicConditions: Math.random() < 0.1 ? "Dermatitis" : null,
          lastVetVisit: toDate(daysAgo(rand(30, 240))),
        },
      });

      await prisma.nutritionProfile.create({
        data: {
          petId: pet.id, dietType: Math.random() < 0.5 ? "MIXED" : "RAW",
          mealsPerDay: rand(2, 3), activityLevel: pick(["LOW","MODERATE","HIGH"]),
          goal: pick(["MAINTENANCE","WEIGHT_LOSS","WEIGHT_GAIN"]),
          preferredFoods: "pollo, pavo, zapallo",
          forbiddenFoods: "chocolate, cebolla",
          dailyCalories: species === "DOG" ? rand(450, 900) : rand(180, 350),
        },
      });

      const vacCount = rand(1, 2);
      for (let v = 0; v < vacCount; v++) {
        await prisma.vaccination.create({
          data: { petId: pet.id, name: species === "DOG" ? pick(["Rabia","Séxtuple"]) : pick(["Rabia","Triple Felina"]), date: daysAgo(rand(60, 720)) },
        });
      }

      // Historial de peso
      const points = rand(5, 9);
      let base = (pet.weightKg ?? 8) - Math.random() * 1.5;
      for (let w = points; w >= 1; w--) {
        base += (Math.random() - 0.5) * 0.6;
        await prisma.weightHistory.create({
          data: { petId: pet.id, date: toDate(daysAgo(w * 14)), weightKg: +Math.max(0.8, base).toFixed(1) },
        });
      }

      // Recetas generadas y favoritas por tipo (para gráfico by-type)
      const genCount = rand(1, 3);
      const genIds: string[] = [];
      for (let r = 0; r < genCount; r++) {
        const planType = pick(PLAN_TYPES);
        const created = randomDateBetween(PERIOD_START, PERIOD_END);
        const atHour = weightedRandomHour();
        created.setHours(atHour, rand(0, 59), rand(0, 59), 0);

        const recipe = await prisma.recipe.create({
          data: {
            userId, petId: pet.id,
            title: pick(RECIPE_TITLES),
            planType,
            content: JSON.stringify({ planType, kcal: rand(180, 950) }),
            createdAt: created,
          },
        });
        genIds.push(recipe.id);

        // Evento de generación
        await prisma.analyticsEvent.create({
          data: { userId, type: "RECIPE_GENERATED", petId: pet.id, device: "WEB", createdAt: created },
        });
      }

      const favCount = Math.min(rand(0, 2), genIds.length);
      for (let f = 0; f < favCount; f++) {
        const planType = pick(PLAN_TYPES);
        const created = randomDateBetween(PERIOD_START, PERIOD_END);
        const atHour = weightedRandomHour();
        created.setHours(atHour, rand(0, 59), rand(0, 59), 0);

        await prisma.favoriteRecipe.create({
          data: {
            userId, petId: pet.id,
            title: "Receta favorita",
            planType,
            contentJson: JSON.stringify({ refRecipeId: genIds[f] }),
            createdAt: created,
          },
        });

        await prisma.analyticsEvent.create({
          data: { userId, type: "FAVORITE_ADDED", petId: pet.id, device: "WEB", createdAt: created },
        });
      }
    }
  }

  // Despensa
  const pantryCnt = await prisma.pantryItem.count({ where: { ownerId: userId } });
  if (pantryCnt === 0) {
    const n = rand(7, 13);
    for (let i = 0; i < n; i++) {
      const base = PANTRY_ITEMS[rand(0, PANTRY_ITEMS.length - 1)];
      const created = randomDateBetween(PERIOD_START, PERIOD_END);
      const atHour = weightedRandomHour();
      created.setHours(atHour, rand(0, 59), rand(0, 59), 0);

      await prisma.pantryItem.create({
        data: {
          ownerId: userId,
          name: base.name, normalized: base.name.toLowerCase(),
          keywordsCsv: `${base.category},${base.name}`,
          quantity: +(Math.random() * 800 + 100).toFixed(0),
          unit: base.unit, category: base.category,
          purchasedAt: created, createdAt: created,
        },
      });

      await prisma.analyticsEvent.create({
        data: { userId, type: "PANTRY_ADDED", device: "WEB", createdAt: created },
      });
    }
  }

  // Stats diarias (solo SEP-NOV; distribuye actividad)
  const cursor = new Date(PERIOD_START);
  while (cursor <= PERIOD_END) {
    const ymd = cursor.toISOString().slice(0, 10);
    await prisma.dailyStat.create({
      data: {
        userId,
        dateKey: ymd,
        recipesGeneratedCount: Math.random() < 0.45 ? rand(1, 4) : 0,
        createdAt: new Date(cursor),
      },
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Algunos pagos
  if (Math.random() < 0.25) {
    await prisma.payment.create({
      data: {
        userId,
        buyOrder: `BO-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sessionId: `SESS-${Math.random().toString(36).slice(2, 10)}`,
        amount: pick([5990, 7990, 9990, 12990]),
        status: pick(["AUTHORIZED", "FAILED", "ABORTED", "INIT"]),
        raw: JSON.stringify({ notes: "seed payment" }),
      },
    });
  }

  // Logins (para heatmap)
  const logins = rand(3, 8);
  for (let i = 0; i < logins; i++) {
    const created = randomDateBetween(PERIOD_START, PERIOD_END);
    created.setHours(weightedRandomHour(), rand(0, 59), rand(0, 59), 0);
    await prisma.analyticsEvent.create({
      data: { userId, type: "LOGIN", device: pick(["WEB", "ANDROID", "IOS"]), createdAt: created },
    });
  }
}

// -------------------- Usuarios --------------------
type CreatedUser = { id: string; email: string };

async function upsertUserReal(
  name: string,
  emailBase: string,
  opts: { role?: string | null; verified?: boolean; plan?: "BASIC" | "PLUS"; commune?: string; createdAt?: Date }
): Promise<CreatedUser> {
  const domains = ["gmail.com", "outlook.com", "hotmail.com", "icloud.com"];
  const domain = pick(domains);
  let email = `${emailBase}@${domain}`;
  let idx = 2;

  while (await prisma.user.findUnique({ where: { email } })) {
    email = `${emailBase}.${idx}@${domain}`;
    idx++;
  }

  const data: any = {
    email,
    passwordHash: await bcrypt.hash(PASSWORD_PLAIN, BCRYPT_ROUNDS),
    name,
    plan: opts.plan ?? (Math.random() < 0.3 ? "PLUS" : "BASIC"),
    emailVerifiedAt: (opts.verified ?? Math.random() < 0.9) ? new Date() : null,
    region: REGION,
    city: CITY,
    commune: opts.commune ?? "Santiago",
    role: opts.role ?? "USER",
    createdAt: opts.createdAt ?? randomDateBetween(PERIOD_START, PERIOD_END),
  };

  // Si quedó PLUS, setea membershipUpdatedAt para calcular tenencia
  if (data.plan === "PLUS") {
    data.membershipUpdatedAt = randomDateBetween(data.createdAt, PERIOD_END);
  }

  const user = await prisma.user.create({ data });
  return { id: user.id, email: user.email };
}

// -------------------- Main --------------------
async function main() {
  const KEEP_SPECIAL = process.env.SEED_KEEP_SPECIAL === "1";
  const DO_RESET = process.env.SEED_RESET === "1";

  console.log("▶️  Seed NutriHuella — SEP/OCT/NOV");

  if (DO_RESET) {
    console.log(`⚠  Reset (${KEEP_SPECIAL ? "manteniendo admin/analyst" : "completo"})…`);
    await resetAll(KEEP_SPECIAL);
  }

  // Cuentas especiales (si faltan)
  const pwHash = await bcrypt.hash(PASSWORD_PLAIN, BCRYPT_ROUNDS);

  const ensureUser = async (email: string, name: string, role: string, plan: "BASIC" | "PLUS", commune: string) => {
    let u = await prisma.user.findUnique({ where: { email } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          email,
          passwordHash: pwHash,
          name,
          role,
          plan,
          region: REGION,
          city: CITY,
          commune,
          emailVerifiedAt: new Date(),
          createdAt: randomDateBetween(PERIOD_START, PERIOD_END),
          membershipUpdatedAt: plan === "PLUS" ? randomDateBetween(PERIOD_START, PERIOD_END) : null,
        },
      });
    }
    // Limpia hijos del especial para repoblar coherente con el periodo
    await prisma.favoriteRecipe.deleteMany({ where: { userId: u.id } });
    await prisma.recipeFeedback.deleteMany({ where: { userId: u.id } });
    await prisma.recipe.deleteMany({ where: { userId: u.id } });
    await prisma.analyticsEvent.deleteMany({ where: { userId: u.id } });
    await prisma.pantryItem.deleteMany({ where: { ownerId: u.id } });
    await prisma.payment.deleteMany({ where: { userId: u.id } });
    await prisma.dailyStat.deleteMany({ where: { userId: u.id } });
    await prisma.pet.deleteMany({ where: { ownerId: u.id } });
    await populateUserChildren(u.id, u.createdAt);
  };

  await ensureUser("admin@nutrihuella.cl", "Administrador Sistema", "ADMIN", "PLUS", "Santiago");
  await ensureUser("analyst@nutrihuella.cl", "Analista de Negocios", "ANALYST", "BASIC", "Providencia");

  // Crea 100 usuarios repartidos en SEP/OCT/NOV
  for (let i = 0; i < TOTAL_USERS; i++) {
    const gender: "M" | "F" = Math.random() < 0.48 ? "M" : "F";
    const fullName = buildFullNameOnce(gender);
    const emailBase = slugEmailBase(fullName.replace(/\s+/g, " ").trim());

    const commune = pick(COMUNAS);
    const createdAt = randomDateBetween(PERIOD_START, PERIOD_END);
    const plan = Math.random() < 0.3 ? "PLUS" : "BASIC";

    const u = await upsertUserReal(fullName, emailBase, { role: "USER", verified: true, plan, commune, createdAt });
    await populateUserChildren(u.id, createdAt);
  }

  console.log("✅ Seed finalizado.");
}

main()
  .catch((e) => { console.error("❌ Error en seed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
