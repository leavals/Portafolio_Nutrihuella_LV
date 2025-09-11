-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL DEFAULT 'DOG',
    "breed" TEXT,
    "sex" TEXT NOT NULL,
    "birthDate" DATETIME,
    "weightKg" REAL,
    "color" TEXT,
    "microchip" TEXT,
    "neutered" BOOLEAN,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClinicalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "allergies" JSONB,
    "chronicConditions" JSONB,
    "medications" JSONB,
    "surgeries" JSONB,
    "lastVetVisit" DATETIME,
    "lastDeworming" DATETIME,
    "lastFleaTick" DATETIME,
    "bloodType" TEXT,
    "vetClinic" TEXT,
    "vetPhone" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClinicalRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "vet" TEXT,
    "lot" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vaccination_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiseaseHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosedAt" DATETIME,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiseaseHistory_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeightLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" REAL NOT NULL,
    "bodyConditionScore" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeightLog_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "dietType" TEXT NOT NULL,
    "mealsPerDay" INTEGER NOT NULL DEFAULT 2,
    "activityLevel" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "foodAllergies" JSONB,
    "intolerances" JSONB,
    "forbiddenFoods" JSONB,
    "preferredFoods" JSONB,
    "supplements" JSONB,
    "dailyCalories" INTEGER,
    "waterIntakeMl" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionProfile_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Pet_microchip_key" ON "Pet"("microchip");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalRecord_petId_key" ON "ClinicalRecord"("petId");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionProfile_petId_key" ON "NutritionProfile"("petId");
