-- AlterTable
ALTER TABLE "PantryItem" ADD COLUMN "brand" TEXT;
ALTER TABLE "PantryItem" ADD COLUMN "price" INTEGER;
ALTER TABLE "PantryItem" ADD COLUMN "store" TEXT;

-- AlterTable
ALTER TABLE "Pet" ADD COLUMN "bodyCondition" TEXT;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'LOGIN',
    "device" TEXT NOT NULL DEFAULT 'WEB',
    "comuna" TEXT,
    "payload" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "googleId" TEXT,
    "picture" TEXT,
    "emailVerifiedAt" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "country" TEXT NOT NULL DEFAULT 'Chile',
    "region" TEXT NOT NULL DEFAULT 'RM',
    "city" TEXT NOT NULL DEFAULT 'Santiago',
    "comuna" TEXT NOT NULL DEFAULT 'Santiago',
    "devicePreferred" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'BASIC',
    "membershipUpdatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerifiedAt", "googleId", "id", "membershipUpdatedAt", "name", "passwordHash", "picture", "plan", "updatedAt") SELECT "createdAt", "email", "emailVerifiedAt", "googleId", "id", "membershipUpdatedAt", "name", "passwordHash", "picture", "plan", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_comuna_idx" ON "User"("comuna");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Event_type_occurredAt_idx" ON "Event"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "Event_userId_occurredAt_idx" ON "Event"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "Pet_species_size_idx" ON "Pet"("species", "size");

-- CreateIndex
CREATE INDEX "RecipeFeedback_rating_idx" ON "RecipeFeedback"("rating");
