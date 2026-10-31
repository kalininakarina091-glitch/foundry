-- CreateTable
CREATE TABLE "OpportunityDecision" (
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "status" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityDecision_pkey" PRIMARY KEY ("userId","opportunityId")
);

-- CreateIndex
CREATE INDEX "OpportunityDecision_userId_status_idx" ON "OpportunityDecision"("userId", "status");

-- AddForeignKey
ALTER TABLE "OpportunityDecision" ADD CONSTRAINT "OpportunityDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityDecision" ADD CONSTRAINT "OpportunityDecision_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

