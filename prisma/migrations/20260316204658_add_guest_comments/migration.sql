-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "allowGuestComments" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("adminKey", "bannerImageUrl", "createdAt", "createdById", "description", "endTime", "hostEmail", "hostName", "id", "location", "notifyOnNewGuest", "notifyOnRsvpChange", "publicId", "showAttendeesToGuests", "startTime", "subtitle", "themeColor", "title", "updatedAt") SELECT "adminKey", "bannerImageUrl", "createdAt", "createdById", "description", "endTime", "hostEmail", "hostName", "id", "location", "notifyOnNewGuest", "notifyOnRsvpChange", "publicId", "showAttendeesToGuests", "startTime", "subtitle", "themeColor", "title", "updatedAt" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_publicId_key" ON "Event"("publicId");
CREATE INDEX "Event_publicId_idx" ON "Event"("publicId");
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Comment_eventId_idx" ON "Comment"("eventId");

-- CreateIndex
CREATE INDEX "Comment_guestId_idx" ON "Comment"("guestId");
