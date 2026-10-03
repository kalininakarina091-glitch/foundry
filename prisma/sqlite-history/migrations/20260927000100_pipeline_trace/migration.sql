ALTER TABLE "RawItem" ADD COLUMN "extractionStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "RawItem" ADD COLUMN "extractedAt" DATETIME;
ALTER TABLE "Opportunity" ADD COLUMN "generationKey" TEXT;
ALTER TABLE "Opportunity" ADD COLUMN "provenance" TEXT;
ALTER TABLE "Opportunity" ADD COLUMN "research" TEXT;
CREATE UNIQUE INDEX "Opportunity_generationKey_key" ON "Opportunity"("generationKey");
CREATE INDEX "RawItem_sourceId_externalId_idx" ON "RawItem"("sourceId", "externalId");
CREATE INDEX "Evidence_opportunityId_signalId_idx" ON "Evidence"("opportunityId", "signalId");
-- Existing signals predate quote validation; do not present them as pending new extractions.
UPDATE "RawItem" SET "extractionStatus" = 'legacy'
WHERE EXISTS (SELECT 1 FROM "Signal" WHERE "Signal"."rawItemId" = "RawItem"."id");
