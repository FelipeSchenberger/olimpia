-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FixedSlot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "courtId" INTEGER NOT NULL DEFAULT 1
);
INSERT INTO "new_FixedSlot" ("clientName", "dayOfWeek", "endDate", "endTime", "id", "startDate", "startTime") SELECT "clientName", "dayOfWeek", "endDate", "endTime", "id", "startDate", "startTime" FROM "FixedSlot";
DROP TABLE "FixedSlot";
ALTER TABLE "new_FixedSlot" RENAME TO "FixedSlot";
CREATE TABLE "new_Appointment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "clientName" TEXT,
    "clientPhone" TEXT,
    "courtId" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Appointment" ("clientName", "clientPhone", "createdAt", "date", "endTime", "id", "startTime", "status") SELECT "clientName", "clientPhone", "createdAt", "date", "endTime", "id", "startTime", "status" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
