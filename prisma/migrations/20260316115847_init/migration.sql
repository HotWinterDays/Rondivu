-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "adminKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "hostName" TEXT NOT NULL,
    "hostEmail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "plusOnesAllowed" INTEGER NOT NULL DEFAULT 0,
    "plusOnesConfirmed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "respondedAt" DATETIME,
    "guestMessage" TEXT,
    "note" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_publicId_key" ON "Event"("publicId");

-- CreateIndex
CREATE INDEX "Event_publicId_idx" ON "Event"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_token_key" ON "Guest"("token");

-- CreateIndex
CREATE INDEX "Guest_eventId_idx" ON "Guest"("eventId");

-- CreateIndex
CREATE INDEX "Guest_token_idx" ON "Guest"("token");
