-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLICATION_SUBMITTED', 'PHONE_VERIFICATION_PENDING', 'SIGN_LOAN_AGREEMENT', 'VERIFICATION_DEPOSIT_RETURN', 'FUNDED', 'DECLINED');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'STUDENT');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS');

-- CreateEnum
CREATE TYPE "BankAccountAge" AS ENUM ('LESS_THAN_6_MONTHS', 'SIX_TO_TWELVE_MONTHS', 'MORE_THAN_1_YEAR');

-- CreateEnum
CREATE TYPE "CreditTier" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BAD', 'UNKNOWN');

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "amountRequested" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "ssnEncrypted" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mailingAddress" TEXT NOT NULL,
    "currentStatus" "ApplicationStatus" NOT NULL DEFAULT 'APPLICATION_SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentDetail" (
    "id" TEXT NOT NULL,
    "applicationIdRef" TEXT NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL,
    "monthlyGrossIncome" INTEGER NOT NULL,
    "employerName" TEXT,
    "employerPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmploymentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankDetail" (
    "id" TEXT NOT NULL,
    "applicationIdRef" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "routingNumber" TEXT NOT NULL,
    "accountNumberEncrypted" TEXT NOT NULL,
    "bankAccountAge" "BankAccountAge" NOT NULL,
    "creditTier" "CreditTier" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" TEXT NOT NULL,
    "applicationIdRef" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalConsent" (
    "id" TEXT NOT NULL,
    "applicationIdRef" TEXT NOT NULL,
    "creditAssessment" BOOLEAN NOT NULL,
    "tcpaConsent" BOOLEAN NOT NULL,
    "consentIpAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusLog" (
    "id" TEXT NOT NULL,
    "applicationIdRef" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationId_key" ON "Application"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentDetail_applicationIdRef_key" ON "EmploymentDetail"("applicationIdRef");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetail_applicationIdRef_key" ON "BankDetail"("applicationIdRef");

-- CreateIndex
CREATE UNIQUE INDEX "Reference_applicationIdRef_key" ON "Reference"("applicationIdRef");

-- CreateIndex
CREATE UNIQUE INDEX "LegalConsent_applicationIdRef_key" ON "LegalConsent"("applicationIdRef");

-- AddForeignKey
ALTER TABLE "EmploymentDetail" ADD CONSTRAINT "EmploymentDetail_applicationIdRef_fkey" FOREIGN KEY ("applicationIdRef") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetail" ADD CONSTRAINT "BankDetail_applicationIdRef_fkey" FOREIGN KEY ("applicationIdRef") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reference" ADD CONSTRAINT "Reference_applicationIdRef_fkey" FOREIGN KEY ("applicationIdRef") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalConsent" ADD CONSTRAINT "LegalConsent_applicationIdRef_fkey" FOREIGN KEY ("applicationIdRef") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusLog" ADD CONSTRAINT "StatusLog_applicationIdRef_fkey" FOREIGN KEY ("applicationIdRef") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
