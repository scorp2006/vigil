-- CreateTable
CREATE TABLE "TrackToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TrackToken_campaignId_idx" ON "TrackToken"("campaignId");

-- CreateIndex
CREATE INDEX "TrackToken_employeeId_idx" ON "TrackToken"("employeeId");
