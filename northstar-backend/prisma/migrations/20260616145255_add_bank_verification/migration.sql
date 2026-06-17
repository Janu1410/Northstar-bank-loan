-- CreateEnum
CREATE TYPE "BankVerificationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "BankVerification" (
    "id" TEXT NOT NULL,
    "applicationIdRef" TEXT NOT NULL,
    "provider" TEXT,
    "status" "BankVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankVerification_applicationIdRef_key" ON "BankVerification"("applicationIdRef");

-- AddForeignKey
ALTER TABLE "BankVerification" ADD CONSTRAINT "BankVerification_applicationIdRef_fkey" FOREIGN KEY ("applicationIdRef") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
