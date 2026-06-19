-- AlterTable
ALTER TABLE "AdminUser"
ADD COLUMN "passwordChangeRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "passwordResetToken" TEXT,
ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN "inviteSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_passwordResetToken_key" ON "AdminUser"("passwordResetToken");
