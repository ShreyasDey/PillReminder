-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "remindBeforeMin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "remindersOn" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Pharmacy" ADD COLUMN     "restockLeadDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "restockRemindHour" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN     "restockRemindersOn" BOOLEAN NOT NULL DEFAULT true;
