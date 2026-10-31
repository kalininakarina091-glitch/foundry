-- CreateTable
CREATE TABLE "OpportunityPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpportunityPlan_userId_opportunityId_createdAt_idx" ON "OpportunityPlan"("userId", "opportunityId", "createdAt");

-- AddForeignKey
ALTER TABLE "OpportunityPlan" ADD CONSTRAINT "OpportunityPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityPlan" ADD CONSTRAINT "OpportunityPlan_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

