-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LinkStatus" ADD VALUE 'declined';
ALTER TYPE "LinkStatus" ADD VALUE 'revoked';

-- AlterTable
ALTER TABLE "FamilyLink" ADD COLUMN     "memberPhone" TEXT;

-- CreateIndex
CREATE INDEX "FamilyLink_ownerId_idx" ON "FamilyLink"("ownerId");

-- CreateIndex
CREATE INDEX "FamilyLink_memberId_idx" ON "FamilyLink"("memberId");

-- CreateIndex
CREATE INDEX "FamilyLink_memberPhone_idx" ON "FamilyLink"("memberPhone");
