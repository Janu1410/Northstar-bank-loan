-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('REQUESTED', 'UPLOADED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('GOVERNMENT_ID', 'PROOF_OF_ADDRESS', 'INCOME_PROOF', 'BANK_STATEMENT', 'EMPLOYMENT_VERIFICATION', 'OTHER');

-- CreateTable
CREATE TABLE "DocumentRequest" (
    "id" TEXT NOT NULL,
    "applicationIdRef" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "message" TEXT,
    "token" TEXT NOT NULL,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "documentRequestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRequest_token_key" ON "DocumentRequest"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Document_documentRequestId_key" ON "Document"("documentRequestId");

-- AddForeignKey
ALTER TABLE "DocumentRequest" ADD CONSTRAINT "DocumentRequest_applicationIdRef_fkey" FOREIGN KEY ("applicationIdRef") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_documentRequestId_fkey" FOREIGN KEY ("documentRequestId") REFERENCES "DocumentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
