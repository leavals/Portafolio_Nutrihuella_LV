/*
  Warnings:

  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `brand` on the `PantryItem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `PantryItem` table. All the data in the column will be lost.
  - You are about to drop the column `store` on the `PantryItem` table. All the data in the column will be lost.
  - You are about to drop the column `bodyCondition` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `comuna` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `devicePreferred` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Event_userId_occurredAt_idx";

-- DropIndex
DROP INDEX "Event_type_occurredAt_idx";

-- DropIndex
DROP INDEX "RecipeFeedback_rating_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Event";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "petId" TEXT,
    "city" TEXT,
    "commune" TEXT,
    "device" TEXT,
    "meta" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PantryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized" TEXT,
    "keywordsCsv" TEXT,
    "quantity" REAL,
    "unit" TEXT,
    "category" TEXT,
    "purchasedAt" DATETIME,
    "expiresAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PantryItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PantryItem" ("category", "createdAt", "expiresAt", "id", "keywordsCsv", "name", "normalized", "notes", "ownerId", "purchasedAt", "quantity", "unit", "updatedAt") SELECT "category", "createdAt", "expiresAt", "id", "keywordsCsv", "name", "normalized", "notes", "ownerId", "purchasedAt", "quantity", "unit", "updatedAt" FROM "PantryItem";
DROP TABLE "PantryItem";
ALTER TABLE "new_PantryItem" RENAME TO "PantryItem";
CREATE INDEX "PantryItem_ownerId_idx" ON "PantryItem"("ownerId");
CREATE INDEX "PantryItem_expiresAt_idx" ON "PantryItem"("expiresAt");
CREATE INDEX "PantryItem_category_idx" ON "PantryItem"("category");
CREATE TABLE "new_Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL DEFAULT 'DOG',
    "sex" TEXT,
    "breed" TEXT,
    "birthDate" DATETIME,
    "size" TEXT DEFAULT 'MEDIUM',
    "weightKg" REAL,
    "sterilized" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pet" ("birthDate", "breed", "createdAt", "id", "name", "ownerId", "photoUrl", "sex", "size", "species", "sterilized", "updatedAt", "weightKg") SELECT "birthDate", "breed", "createdAt", "id", "name", "ownerId", "photoUrl", "sex", "size", "species", "sterilized", "updatedAt", "weightKg" FROM "Pet";
DROP TABLE "Pet";
ALTER TABLE "new_Pet" RENAME TO "Pet";
CREATE INDEX "Pet_ownerId_idx" ON "Pet"("ownerId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "googleId" TEXT,
    "picture" TEXT,
    "emailVerifiedAt" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "country" TEXT DEFAULT 'CL',
    "region" TEXT DEFAULT 'Región Metropolitana',
    "city" TEXT DEFAULT 'Santiago',
    "commune" TEXT,
    "deviceType" TEXT DEFAULT 'WEB',
    "lastLoginAt" DATETIME,
    "deactivatedAt" DATETIME,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT NOT NULL DEFAULT 'BASIC',
    "membershipUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("city", "country", "createdAt", "email", "emailVerifiedAt", "googleId", "id", "membershipUpdatedAt", "name", "passwordHash", "picture", "plan", "region", "role", "updatedAt") SELECT "city", "country", "createdAt", "email", "emailVerifiedAt", "googleId", "id", "membershipUpdatedAt", "name", "passwordHash", "picture", "plan", "region", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_emailVerifiedAt_idx" ON "User"("emailVerifiedAt");
CREATE INDEX "User_city_commune_idx" ON "User"("city", "commune");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_type_idx" ON "AnalyticsEvent"("userId", "type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_city_commune_idx" ON "AnalyticsEvent"("city", "commune");
