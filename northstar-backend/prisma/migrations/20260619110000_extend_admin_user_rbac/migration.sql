-- AlterTable
ALTER TABLE "AdminUser"
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "AdminUser"
ADD CONSTRAINT "AdminUser_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
