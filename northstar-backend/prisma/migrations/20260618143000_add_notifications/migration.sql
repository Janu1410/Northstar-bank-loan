-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'APPLICATION_SUBMITTED',
  'DOCUMENT_REQUEST',
  'STATUS_UPDATE',
  'BANK_VERIFICATION_REMINDER',
  'APPROVAL',
  'DECLINE'
);

-- CreateTable
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "applicationIdRef" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_applicationIdRef_fkey"
FOREIGN KEY ("applicationIdRef") REFERENCES "Application"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
