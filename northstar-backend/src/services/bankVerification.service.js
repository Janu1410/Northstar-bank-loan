import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";

const verificationSelect = {
  id: true,
  provider: true,
  status: true,
  verifiedAt: true,
  createdAt: true,
  application: {
    select: {
      applicationId: true,
      currentStatus: true,
    },
  },
};

const mapVerificationResponse = (verification) => ({
  id: verification.id,
  provider: verification.provider,
  status: verification.status,
  verifiedAt: verification.verifiedAt,
  createdAt: verification.createdAt,
  applicationId: verification.application.applicationId,
  applicationStatus: verification.application.currentStatus,
});

const verificationTokenTtlMinutes = 15;

const getVerificationSecret = () =>
  process.env.BANK_VERIFICATION_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "northstar-dev-bank-verification-secret";

const createLaunchToken = ({ applicationId, verificationId }) =>
  jwt.sign(
    {
      applicationId,
      verificationId,
      purpose: "bank_verification_launch",
    },
    getVerificationSecret(),
    {
      expiresIn: `${verificationTokenTtlMinutes}m`,
      issuer: "northstar-backend",
      audience: "northstar-frontend",
    },
  );

const verifyLaunchToken = (launchToken) =>
  jwt.verify(launchToken, getVerificationSecret(), {
    issuer: "northstar-backend",
    audience: "northstar-frontend",
  });

const buildProviderLaunch = (verification) => {
  const launchToken = createLaunchToken({
    applicationId: verification.applicationId,
    verificationId: verification.id,
  });

  return {
    provider: verification.provider,
    launchToken,
    expiresInSeconds: verificationTokenTtlMinutes * 60,
  };
};

const getApplicationOrThrow = async (applicationId) => {
  const application = await prisma.application.findUnique({
    where: {
      applicationId,
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  return application;
};

const advanceApplicationAfterVerification = async (application) => {
  if (application.currentStatus !== "APPLICATION_SUBMITTED") {
    return;
  }

  await prisma.application.update({
    where: {
      id: application.id,
    },
    data: {
      currentStatus: "PHONE_VERIFICATION_PENDING",
      statusLogs: {
        create: {
          status: "PHONE_VERIFICATION_PENDING",
          note: "Bank verification completed. Phone confirmation is the next step.",
        },
      },
    },
  });
};

export const startBankVerificationService = async (applicationId) => {
  const application = await getApplicationOrThrow(applicationId);

  const existing = await prisma.bankVerification.findUnique({
    where: {
      applicationIdRef: application.id,
    },
    select: verificationSelect,
  });

  if (existing) {
    return mapVerificationResponse(existing);
  }

  const verification = await prisma.bankVerification.create({
    data: {
      applicationIdRef: application.id,
      provider: "PLAID",
      status: "PENDING",
    },
    select: verificationSelect,
  });

  return mapVerificationResponse(verification);
};

export const createBankVerificationLaunchService = async (applicationId) => {
  const verification = await startBankVerificationService(applicationId);

  return {
    verification,
    launch: buildProviderLaunch(verification),
  };
};

export const completeBankVerificationService = async (applicationId) => {
  const application = await getApplicationOrThrow(applicationId);

  const existing = await prisma.bankVerification.findUnique({
    where: {
      applicationIdRef: application.id,
    },
  });

  if (!existing) {
    throw new Error("Verification session not found");
  }

  await advanceApplicationAfterVerification(application);

  const verification = await prisma.bankVerification.update({
    where: {
      applicationIdRef: application.id,
    },
    data: {
      status: "COMPLETED",
      verifiedAt: new Date(),
    },
    select: verificationSelect,
  });

  return mapVerificationResponse(verification);
};

export const failBankVerificationService = async (applicationId) => {
  const application = await getApplicationOrThrow(applicationId);

  const existing = await prisma.bankVerification.findUnique({
    where: {
      applicationIdRef: application.id,
    },
  });

  if (!existing) {
    throw new Error("Verification session not found");
  }

  const verification = await prisma.bankVerification.update({
    where: {
      applicationIdRef: application.id,
    },
    data: {
      status: "FAILED",
      verifiedAt: null,
    },
    select: verificationSelect,
  });

  return mapVerificationResponse(verification);
};

export const processBankVerificationCallbackService = async ({
  applicationId,
  launchToken,
  outcome,
}) => {
  const payload = verifyLaunchToken(launchToken);

  if (payload.purpose !== "bank_verification_launch") {
    throw new Error("Invalid verification launch token");
  }

  if (payload.applicationId !== applicationId) {
    throw new Error("Verification launch token does not match the application");
  }

  if (outcome === "SUCCESS") {
    return completeBankVerificationService(applicationId);
  }

  return failBankVerificationService(applicationId);
};
