import prisma from "../config/prisma.js";

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

const MANAGEABLE_STATUSES = [
  "APPLICATION_SUBMITTED",
  "PHONE_VERIFICATION_PENDING",
  "SIGN_LOAN_AGREEMENT",
  "VERIFICATION_DEPOSIT_RETURN",
  "FUNDED",
  "DECLINED",
];

const decodeMaskedValue = (value) => {
  if (!value) {
    return "";
  }

  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return "";
  }
};

const maskSsn = (encryptedValue) => {
  const decoded = decodeMaskedValue(encryptedValue).replace(/\D/g, "");

  if (decoded.length < 4) {
    return "Not available";
  }

  return `***-**-${decoded.slice(-4)}`;
};

const maskAccountNumber = (encryptedValue) => {
  const decoded = decodeMaskedValue(encryptedValue).replace(/\D/g, "");

  if (decoded.length < 4) {
    return "Not available";
  }

  return `*****${decoded.slice(-4)}`;
};

const getAgreementStatus = (agreement) => {
  if (!agreement) {
    return "NOT_GENERATED";
  }

  if (agreement.signedAt) {
    return "SIGNED";
  }

  return "GENERATED";
};

const buildAgreementUrl = (application) => {
  if (!FRONTEND_BASE_URL) {
    return null;
  }

  const params = new URLSearchParams({
    applicationId: application.applicationId,
    lastName: application.lastName,
  });

  return `${FRONTEND_BASE_URL}/loan-status?${params.toString()}`;
};

const buildAuditActivity = (application) => {
  const activity = [
    {
      type: "Viewed by admin",
      detail: "Application opened in admin review workspace",
      createdAt: application.updatedAt,
    },
  ];

  if (application.bankVerification?.verifiedAt) {
    activity.push({
      type: "Bank verification completed",
      detail: "Bank verification status moved to completed",
      createdAt: application.bankVerification.verifiedAt,
    });
  }

  if (application.documentRequests?.length) {
    application.documentRequests.forEach((request) => {
      activity.push({
        type: "Document requested",
        detail: request.message || request.documentType,
        createdAt: request.createdAt,
      });
    });
  }

  application.statusLogs.forEach((log) => {
    activity.push({
      type: "Status changed",
      detail: log.note || log.status,
      createdAt: log.createdAt,
    });
  });

  if (application.currentStatus === "FUNDED") {
    activity.push({
      type: "Approved",
      detail: "Application reached funded state",
      createdAt: application.updatedAt,
    });
  }

  if (application.currentStatus === "DECLINED") {
    activity.push({
      type: "Declined",
      detail: "Application was declined during review",
      createdAt: application.updatedAt,
    });
  }

  if (application.agreement?.generatedAt) {
    activity.push({
      type: "Agreement generated",
      detail: "Loan agreement prepared for status portal signing",
      createdAt: application.agreement.generatedAt,
    });
  }

  return activity.sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
  );
};

const buildTimeline = (application) => {
  const statusByCode = new Map(
    application.statusLogs.map((log) => [log.status, log]),
  );
  const latestStatusLog =
    application.statusLogs[application.statusLogs.length - 1] ?? null;
  const latestDocumentRequest =
    application.documentRequests?.[application.documentRequests.length - 1] ?? null;

  return [
    {
      label: "Application Submitted",
      status: "APPLICATION_SUBMITTED",
      completed: statusByCode.has("APPLICATION_SUBMITTED"),
      createdAt: statusByCode.get("APPLICATION_SUBMITTED")?.createdAt ?? application.createdAt,
      note:
        statusByCode.get("APPLICATION_SUBMITTED")?.note ??
        "Application submitted by customer",
    },
    {
      label: "Bank Verification Completed",
      status: "BANK_VERIFICATION_COMPLETED",
      completed: Boolean(application.bankVerification?.verifiedAt),
      createdAt: application.bankVerification?.verifiedAt ?? null,
      note: application.bankVerification?.verifiedAt
        ? "Secure bank verification completed"
        : "Waiting for bank verification completion",
    },
    {
      label: "Documents Requested",
      status: "DOCUMENTS_REQUESTED",
      completed: Boolean(application.documentRequests?.length),
      createdAt: latestDocumentRequest?.createdAt ?? null,
      note: latestDocumentRequest
        ? "Manager requested supporting documents"
        : "No document request recorded yet",
    },
    {
      label: "Status Changed",
      status: "STATUS_CHANGED",
      completed: Boolean(latestStatusLog && application.statusLogs.length > 1),
      createdAt:
        latestStatusLog && application.statusLogs.length > 1
          ? latestStatusLog.createdAt
          : null,
      note:
        latestStatusLog && application.statusLogs.length > 1
          ? latestStatusLog.note || latestStatusLog.status
          : "No manager status change recorded yet",
    },
    {
      label: "Approved by Manager",
      status: "APPROVED_BY_MANAGER",
      completed: application.currentStatus === "FUNDED",
      createdAt:
        application.currentStatus === "FUNDED"
          ? statusByCode.get("FUNDED")?.createdAt ?? application.updatedAt
          : null,
      note:
        application.currentStatus === "FUNDED"
          ? "Application approved and moved to funded status"
          : "Manager approval pending",
    },
    {
      label: "Agreement Generated",
      status: "AGREEMENT_GENERATED",
      completed: Boolean(application.agreement?.generatedAt),
      createdAt: application.agreement?.generatedAt ?? null,
      note: application.agreement?.generatedAt
        ? "Loan agreement generated for customer signature"
        : "Agreement not generated yet",
    },
  ];
};

const applicationSelect = {
  applicationId: true,
  firstName: true,
  lastName: true,
  amountRequested: true,
  currentStatus: true,
  createdAt: true,
  bankVerification: {
    select: {
      status: true,
      verifiedAt: true,
    },
  },
};

export const getAdminDashboardService = async () => {
  const [
    totalApplications,
    pendingPhoneConfirmation,
    fundedApplications,
    completedBankVerifications,
    recentApplications,
  ] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({
      where: {
        currentStatus: "PHONE_VERIFICATION_PENDING",
      },
    }),
    prisma.application.count({
      where: {
        currentStatus: "FUNDED",
      },
    }),
    prisma.bankVerification.count({
      where: {
        status: "COMPLETED",
      },
    }),
    prisma.application.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: applicationSelect,
    }),
  ]);

  return {
    overview: {
      totalApplications,
      pendingPhoneConfirmation,
      fundedApplications,
      completedBankVerifications,
    },
    recentApplications: recentApplications.map((application) => ({
      applicationId: application.applicationId,
      applicantName: `${application.firstName} ${application.lastName}`,
      amountRequested: application.amountRequested,
      currentStatus: application.currentStatus,
      bankVerificationStatus: application.bankVerification?.status ?? "PENDING",
      submittedAt: application.createdAt,
      verifiedAt: application.bankVerification?.verifiedAt ?? null,
    })),
  };
};


export const getAdminApplicationsService = async (query) => {
  const {
    search,
    status,
    bankVerification,
    fromDate,
    toDate,
    page = 1,
    limit = 10,
  } = query;

  const skip = (Number(page) - 1) * Number(limit);

  const where = {};

  if (status && status !== "ALL") {
    where.currentStatus = status;
  }

  if (fromDate || toDate) {
    where.createdAt = {};

    if (fromDate) {
      where.createdAt.gte = new Date(fromDate);
    }

    if (toDate) {
      where.createdAt.lte = new Date(toDate);
    }
  }

  if (search) {
    where.OR = [
      {
        applicationId: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        firstName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        lastName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        phone: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (bankVerification && bankVerification !== "ALL") {
    where.bankVerification = {
      status: bankVerification,
    };
  }

  const [applications, totalApplications] = await Promise.all([
    prisma.application.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        bankVerification: true,
        employmentDetail: true,
        bankDetail: true,
      },
    }),

    prisma.application.count({
      where,
    }),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalCount,
    newTodayCount,
    awaitingReviewCount,
    phoneVerificationCount,
    fundedCount,
    declinedCount,
    bankPendingCount,
    bankCompletedCount,
  ] = await Promise.all([
    prisma.application.count(),

    prisma.application.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    }),

    prisma.application.count({
      where: {
        currentStatus: "APPLICATION_SUBMITTED",
      },
    }),

    prisma.application.count({
      where: {
        currentStatus: "PHONE_VERIFICATION_PENDING",
      },
    }),

    prisma.application.count({
      where: {
        currentStatus: "FUNDED",
      },
    }),

    prisma.application.count({
      where: {
        currentStatus: "DECLINED",
      },
    }),

    prisma.bankVerification.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.bankVerification.count({
      where: {
        status: "COMPLETED",
      },
    }),
  ]);

  const formattedApplications = applications.map((app) => ({
    id: app.id,
    applicationId: app.applicationId,
    applicantName: `${app.firstName} ${app.lastName}`,
    amountRequested: app.amountRequested,
    email: app.email,
    phone: app.phone,
    employmentStatus: app.employmentDetail?.employmentStatus ?? "UNKNOWN",
    creditTier: app.bankDetail?.creditTier ?? "UNKNOWN",
    currentStatus: app.currentStatus,
    bankVerificationStatus:
      app.bankVerification?.status || "PENDING",
    submittedAt: app.createdAt,
    updatedAt: app.updatedAt,
  }));

  return {
    kpis: {
      totalApplications: totalCount,
      newApplicationsToday: newTodayCount,
      awaitingReview: awaitingReviewCount,
      phoneVerificationQueue: phoneVerificationCount,
      bankVerificationPending: bankPendingCount,
      completedVerifications: bankCompletedCount,
      fundedApplications: fundedCount,
      declinedApplications: declinedCount,
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: totalApplications,
      totalPages: Math.ceil(totalApplications / Number(limit)),
    },
    applications: formattedApplications,
  };
};

export const getAdminApplicationDetailService = async (applicationId) => {
  if (!applicationId) {
    throw new Error("Application ID is required");
  }

  const application = await prisma.application.findUnique({
    where: {
      applicationId,
    },
    include: {
      employmentDetail: true,
      bankDetail: true,
      reference: true,
      legalConsent: true,
      bankVerification: true,
      agreement: true,
      documentRequests: {
        orderBy: {
          createdAt: "asc",
        },
      },
      statusLogs: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  return {
    id: application.id,
    applicationId: application.applicationId,
    applicantName: `${application.firstName} ${application.lastName}`,
    firstName: application.firstName,
    lastName: application.lastName,
    amountRequested: application.amountRequested,
    email: application.email,
    phone: application.phone,
    mailingAddress: application.mailingAddress,
    maskedSsn: maskSsn(application.ssnEncrypted),
    dateOfBirth: application.dateOfBirth,
    currentStatus: application.currentStatus,
    submittedAt: application.createdAt,
    updatedAt: application.updatedAt,
    employmentStatus: application.employmentDetail?.employmentStatus ?? "UNKNOWN",
    monthlyGrossIncome: application.employmentDetail?.monthlyGrossIncome ?? null,
    employerName: application.employmentDetail?.employerName ?? null,
    employerPhone: application.employmentDetail?.employerPhone ?? null,
    creditTier: application.bankDetail?.creditTier ?? "UNKNOWN",
    accountType: application.bankDetail?.accountType ?? null,
    bankAccountAge: application.bankDetail?.bankAccountAge ?? null,
    routingNumber: application.bankDetail?.routingNumber ?? null,
    maskedAccountNumber: maskAccountNumber(
      application.bankDetail?.accountNumberEncrypted,
    ),
    bankVerificationStatus: application.bankVerification?.status ?? "PENDING",
    verifiedAt: application.bankVerification?.verifiedAt ?? null,
    agreementStatus: getAgreementStatus(application.agreement),
    agreementGeneratedAt: application.agreement?.generatedAt ?? null,
    agreementSignedAt: application.agreement?.signedAt ?? null,
    agreementUrl: application.agreement
      ? buildAgreementUrl(application)
      : null,
    referenceName: application.reference?.name ?? null,
    referencePhone: application.reference?.phone ?? null,
    referenceRelationship: application.reference?.relationship ?? null,
    creditAssessmentConsent:
      application.legalConsent?.creditAssessment ?? false,
    tcpaConsent: application.legalConsent?.tcpaConsent ?? false,
    consentIpAddress: application.legalConsent?.consentIpAddress ?? null,
    consentDate: application.legalConsent?.createdAt ?? null,
    statusHistory: application.statusLogs.map((log) => ({
      status: log.status,
      note: log.note,
      createdAt: log.createdAt,
    })),
    timeline: buildTimeline(application),
    internalNotes: application.statusLogs
      .filter((log) => Boolean(log.note))
      .map((log) => ({
        type: "Internal note",
        detail: log.note,
        createdAt: log.createdAt,
      })),
    auditActivity: buildAuditActivity(application),
  };
};

export const updateAdminApplicationStatusService = async (
  applicationId,
  body,
  admin,
) => {
  const { status, note } = body;

  if (!applicationId || !status) {
    throw new Error("Application ID and status are required");
  }

  if (!MANAGEABLE_STATUSES.includes(status)) {
    throw new Error("Invalid application status");
  }

  const application = await prisma.application.findUnique({
    where: {
      applicationId,
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  await prisma.$transaction([
    prisma.application.update({
      where: {
        applicationId,
      },
      data: {
        currentStatus: status,
      },
    }),
    prisma.statusLog.create({
      data: {
        applicationIdRef: application.id,
        status,
        note:
          note?.trim() ||
          `Status updated to ${status} by ${admin?.email || "manager"}`,
      },
    }),
  ]);

  return getAdminApplicationDetailService(applicationId);
};

export const decideAdminApplicationService = async (
  applicationId,
  body,
  admin,
) => {
  const { decision } = body;

  if (!decision || !["APPROVE", "DECLINE"].includes(decision)) {
    throw new Error("Decision must be APPROVE or DECLINE");
  }

  return updateAdminApplicationStatusService(
    applicationId,
    {
      status: decision === "APPROVE" ? "FUNDED" : "DECLINED",
      note:
        decision === "APPROVE"
          ? `Approved by manager ${admin?.email || ""}`.trim()
          : `Declined by manager ${admin?.email || ""}`.trim(),
    },
    admin,
  );
};

export const generateApplicationAgreementService = async (applicationId) => {
  if (!applicationId) {
    throw new Error("Application ID is required");
  }

  const application = await prisma.application.findUnique({
    where: {
      applicationId,
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  await prisma.applicationAgreement.upsert({
    where: {
      applicationIdRef: application.id,
    },
    update: {
      generatedAt: new Date(),
    },
    create: {
      applicationIdRef: application.id,
      generatedAt: new Date(),
    },
  });

  return getAdminApplicationDetailService(applicationId);
};
