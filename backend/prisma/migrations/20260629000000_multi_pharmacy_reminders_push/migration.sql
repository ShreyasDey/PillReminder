-- AlterTable: a patient can link multiple pharmacies
ALTER TABLE "PatientProfile" ADD COLUMN "linkedPharmacyCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill the new array from the existing single linked pharmacy code
UPDATE "PatientProfile" SET "linkedPharmacyCodes" = ARRAY["linkedPharmacyCode"]
WHERE "linkedPharmacyCode" IS NOT NULL AND "linkedPharmacyCode" <> '';

-- AlterTable: reminder bookkeeping on each dose
ALTER TABLE "DoseLog" ADD COLUMN "lastRemindedAt" TIMESTAMP(3);
ALTER TABLE "DoseLog" ADD COLUMN "nextRemindAt" TIMESTAMP(3);

-- CreateTable: browser Web Push subscriptions
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
