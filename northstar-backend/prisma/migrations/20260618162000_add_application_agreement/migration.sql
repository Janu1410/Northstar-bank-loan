-- CreateTable
CREATE TABLE "ApplicationAgreement" (
  "id" TEXT NOT NULL,
  "applicationIdRef" TEXT NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "signedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApplicationAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationAgreement_applicationIdRef_key" ON "ApplicationAgreement"("applicationIdRef");

-- AddForeignKey
ALTER TABLE "ApplicationAgreement"
ADD CONSTRAINT "ApplicationAgreement_applicationIdRef_fkey"
FOREIGN KEY ("applicationIdRef") REFERENCES "Application"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
