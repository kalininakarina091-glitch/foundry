-- CreateTable
CREATE TABLE "ValidationRun" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT,
    "model" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "report" TEXT NOT NULL,
    "evidenceSnapshot" TEXT NOT NULL,
    "evidenceStats" TEXT NOT NULL,
    "availableEvidence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ValidationRun_opportunityId_createdAt_idx" ON "ValidationRun"("opportunityId", "createdAt");

-- AddForeignKey
ALTER TABLE "ValidationRun" ADD CONSTRAINT "ValidationRun_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationRun" ADD CONSTRAINT "ValidationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

