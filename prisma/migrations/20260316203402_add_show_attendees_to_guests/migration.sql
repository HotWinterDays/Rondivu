-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "adminKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "location" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "hostName" TEXT NOT NULL,
    "hostEmail" TEXT NOT NULL,
    "bannerImageUrl" TEXT,
    "themeColor" TEXT,
    "notifyOnRsvpChange" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnNewGuest" BOOLEAN NOT NULL DEFAULT false,
    "showAttendeesToGuests" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("adminKey", "bannerImageUrl", "createdAt", "createdById", "description", "endTime", "hostEmail", "hostName", "id", "location", "notifyOnNewGuest", "notifyOnRsvpChange", "publicId", "startTime", "subtitle", "themeColor", "title", "updatedAt") SELECT "adminKey", "bannerImageUrl", "createdAt", "createdById", "description", "endTime", "hostEmail", "hostName", "id", "location", "notifyOnNewGuest", "notifyOnRsvpChange", "publicId", "startTime", "subtitle", "themeColor", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_publicId_key" ON "Event"("publicId");
CREATE INDEX "Event_publicId_idx" ON "Event"("publicId");
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
