-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "doctor" TEXT,
ADD COLUMN     "remindOffsets" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "SymptomLog" ADD COLUMN     "linkedMed" TEXT;
