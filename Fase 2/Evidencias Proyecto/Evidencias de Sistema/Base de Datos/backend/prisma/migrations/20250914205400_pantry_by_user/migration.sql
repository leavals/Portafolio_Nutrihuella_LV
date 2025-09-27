-- CreateTable
CREATE TABLE "PantryItem" (
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

-- CreateIndex
CREATE INDEX "PantryItem_ownerId_idx" ON "PantryItem"("ownerId");

-- CreateIndex
CREATE INDEX "PantryItem_expiresAt_idx" ON "PantryItem"("expiresAt");

-- CreateIndex
CREATE INDEX "PantryItem_category_idx" ON "PantryItem"("category");
