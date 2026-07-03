-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "remindedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "refillDueAt" TIMESTAMP(3),
ADD COLUMN     "refillRemindedAt" TIMESTAMP(3);
