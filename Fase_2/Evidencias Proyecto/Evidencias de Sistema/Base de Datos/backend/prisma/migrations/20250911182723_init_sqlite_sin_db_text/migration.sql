/*
  Warnings:

  - You are about to drop the `DiseaseHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeightLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `ClinicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ClinicalRecord` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `NutritionProfile` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `NutritionProfile` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PasswordResetToken` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `microchip` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `neutered` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Vaccination` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Vaccination` table. All the data in the column will be lost.
  - You are about to drop the column `lot` on the `Vaccination` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Vaccination` table. All the data in the column will be lost.
  - You are about to drop the column `vet` on the `Vaccination` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "picture" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DiseaseHistory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "WeightLog";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Disease" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "Disease_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Weight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "weightKg" REAL NOT NULL,
    CONSTRAINT "Weight_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClinicalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "medications" TEXT,
    "surgeries" TEXT,
    "lastVetVisit" DATETIME,
    "lastDeworming" DATETIME,
    "lastFleaTick" DATETIME,
    "bloodType" TEXT,
    "vetClinic" TEXT,
    "vetPhone" TEXT,
    "notes" TEXT,
    CONSTRAINT "ClinicalRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ClinicalRecord" ("allergies", "bloodType", "chronicConditions", "id", "lastDeworming", "lastFleaTick", "lastVetVisit", "medications", "notes", "petId", "surgeries", "vetClinic", "vetPhone") SELECT "allergies", "bloodType", "chronicConditions", "id", "lastDeworming", "lastFleaTick", "lastVetVisit", "medications", "notes", "petId", "surgeries", "vetClinic", "vetPhone" FROM "ClinicalRecord";
DROP TABLE "ClinicalRecord";
ALTER TABLE "new_ClinicalRecord" RENAME TO "ClinicalRecord";
CREATE UNIQUE INDEX "ClinicalRecord_petId_key" ON "ClinicalRecord"("petId");
CREATE TABLE "new_NutritionProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "dietType" TEXT NOT NULL DEFAULT 'RAW',
    "mealsPerDay" INTEGER NOT NULL DEFAULT 2,
    "activityLevel" TEXT NOT NULL DEFAULT 'MODERATE',
    "goal" TEXT NOT NULL DEFAULT 'MAINTENANCE',
    "foodAllergies" TEXT,
    "intolerances" TEXT,
    "forbiddenFoods" TEXT,
    "preferredFoods" TEXT,
    "supplements" TEXT,
    "dailyCalories" INTEGER,
    "waterIntakeMl" INTEGER,
    "notes" TEXT,
    CONSTRAINT "NutritionProfile_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_NutritionProfile" ("activityLevel", "dailyCalories", "dietType", "foodAllergies", "forbiddenFoods", "goal", "id", "intolerances", "mealsPerDay", "notes", "petId", "preferredFoods", "supplements", "waterIntakeMl") SELECT "activityLevel", "dailyCalories", "dietType", "foodAllergies", "forbiddenFoods", "goal", "id", "intolerances", "mealsPerDay", "notes", "petId", "preferredFoods", "supplements", "waterIntakeMl" FROM "NutritionProfile";
DROP TABLE "NutritionProfile";
ALTER TABLE "new_NutritionProfile" RENAME TO "NutritionProfile";
CREATE UNIQUE INDEX "NutritionProfile_petId_key" ON "NutritionProfile"("petId");
CREATE TABLE "new_PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PasswordResetToken" ("expiresAt", "id", "token", "usedAt", "userId") SELECT "expiresAt", "id", "token", "usedAt", "userId" FROM "PasswordResetToken";
DROP TABLE "PasswordResetToken";
ALTER TABLE "new_PasswordResetToken" RENAME TO "PasswordResetToken";
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE TABLE "new_Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL DEFAULT 'DOG',
    "sex" TEXT,
    "breed" TEXT,
    "age" INTEGER,
    "weightKg" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pet" ("breed", "createdAt", "id", "name", "ownerId", "sex", "species", "updatedAt", "weightKg") SELECT "breed", "createdAt", "id", "name", "ownerId", "sex", "species", "updatedAt", "weightKg" FROM "Pet";
DROP TABLE "Pet";
ALTER TABLE "new_Pet" RENAME TO "Pet";
CREATE INDEX "Pet_ownerId_idx" ON "Pet"("ownerId");
CREATE TABLE "new_Vaccination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "Vaccination_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vaccination" ("date", "id", "name", "petId") SELECT "date", "id", "name", "petId" FROM "Vaccination";
DROP TABLE "Vaccination";
ALTER TABLE "new_Vaccination" RENAME TO "Vaccination";
CREATE INDEX "Vaccination_petId_idx" ON "Vaccination"("petId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Disease_petId_idx" ON "Disease"("petId");

-- CreateIndex
CREATE INDEX "Weight_petId_idx" ON "Weight"("petId");
