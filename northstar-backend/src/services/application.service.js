import prisma from "../config/prisma.js";
import {
  sendApplicationSubmittedEmail,
  sendNotificationEmailSafely,
} from "./notificationEmail.service.js";

const generateApplicationId = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `NS-${year}-${random}`;
};

const fakeEncrypt = (value) => {
  return Buffer.from(value).toString("base64");
};

export const createApplicationService = async (body, ipAddress) => {
  const {
    amountRequested,
    firstName,
    lastName,
    dateOfBirth,
    ssn,
    email,
    phone,
    mailingAddress,

    employmentStatus,
    monthlyGrossIncome,
    employerName,
    employerPhone,

    accountType,
    routingNumber,
    accountNumber,
    bankAccountAge,
    creditTier,

    referenceName,
    referencePhone,
    referenceRelationship,

    creditAssessmentConsent,
    tcpaConsent,
  } = body;

  if (!creditAssessmentConsent || !tcpaConsent) {
    throw new Error("Both legal consents are required");
  }

  if (amountRequested < 2000 || amountRequested > 10000) {
    throw new Error("Loan amount must be between $2,000 and $10,000");
  }

  const applicationId = generateApplicationId();

  const application = await prisma.application.create({
    data: {
      applicationId,
      amountRequested: Number(amountRequested),
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      ssnEncrypted: fakeEncrypt(ssn),
      email,
      phone,
      mailingAddress,

      employmentDetail: {
        create: {
          employmentStatus,
          monthlyGrossIncome: Number(monthlyGrossIncome),
          employerName,
          employerPhone,
        },
      },

      bankDetail: {
        create: {
          accountType,
          routingNumber,
          accountNumberEncrypted: fakeEncrypt(accountNumber),
          bankAccountAge,
          creditTier,
        },
      },

      reference: {
        create: {
          name: referenceName,
          phone: referencePhone,
          relationship: referenceRelationship,
        },
      },

      legalConsent: {
        create: {
          creditAssessment: creditAssessmentConsent,
          tcpaConsent,
          consentIpAddress: ipAddress,
        },
      },

      statusLogs: {
        create: {
          status: "APPLICATION_SUBMITTED",
          note: "Application submitted by customer",
        },
      },
    },
    select: {
      id: true,
      applicationId: true,
      currentStatus: true,
      createdAt: true,
    },
  });

  void sendNotificationEmailSafely(sendApplicationSubmittedEmail, {
    applicationId: application.applicationId,
    email,
    firstName,
    lastName,
  });

  return {
    ...application,
    notificationDelivery: {
      email: "QUEUED",
    },
  };
};


export const getApplicationStatusService = async (body) => {
  const { applicationId, lastName } = body;

  if (!applicationId || !lastName) {
    throw new Error("Application ID and Last Name are required");
  }

  const application = await prisma.application.findFirst({
    where: {
      applicationId: applicationId,
      lastName: {
        equals: lastName,
        mode: "insensitive",
      },
    },
    include: {
      bankVerification: true,
      statusLogs: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!application) {
    throw new Error("Application not found. Please check your Application ID and Last Name.");
  }

  return {
    applicationId: application.applicationId,
    customerName: `${application.firstName} ${application.lastName}`,
    amountRequested: application.amountRequested,
    currentStatus: application.currentStatus,
    bankVerificationStatus: application.bankVerification?.status || "PENDING",
    submittedAt: application.createdAt,
    statusHistory: application.statusLogs.map((log) => ({
      status: log.status,
      note: log.note,
      createdAt: log.createdAt,
    })),
  };
};
