import prisma from "../config/prisma.js";

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const formatDateForMessage = (value) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));

const getApplicantName = (application) =>
  `${application.firstName} ${application.lastName}`;

const getStatusPageLink = (applicationId, lastName) => {
  if (!FRONTEND_BASE_URL) {
    return null;
  }

  const params = new URLSearchParams({
    applicationId,
    lastName,
  });

  return `${FRONTEND_BASE_URL}/loan-status?${params.toString()}`;
};

const getDocumentUploadLink = (token) =>
  FRONTEND_BASE_URL
    ? `${FRONTEND_BASE_URL}/document-upload?token=${token}`
    : null;

const buildNotificationId = (segments) => segments.join("__");

const buildNotificationRecord = ({
  id,
  application,
  type,
  channel,
  status,
  subject,
  message,
  sentAt,
  recipient,
  createdAt,
}) => ({
  id,
  applicationId: application.applicationId,
  applicantName: getApplicantName(application),
  type,
  channel,
  recipient,
  subject,
  message,
  status,
  sentAt,
  createdAt,
});

const buildSubmissionNotifications = (application) => {
  const statusLink = getStatusPageLink(
    application.applicationId,
    application.lastName,
  );
  const baseMessage = [
    "Your application has been received.",
    `Application ID: ${application.applicationId}`,
    statusLink ? `Track status: ${statusLink}` : "Track status link unavailable",
  ].join("\n");

  return [
    buildNotificationRecord({
      id: buildNotificationId([
        "application-submitted",
        application.id,
        "email",
      ]),
      application,
      type: "APPLICATION_SUBMITTED",
      channel: "EMAIL",
      recipient: application.email,
      subject: `Application received: ${application.applicationId}`,
      message: baseMessage,
      status: "SENT",
      sentAt: application.createdAt,
      createdAt: application.createdAt,
    }),
  ];
};

const buildDocumentRequestNotifications = (application) =>
  application.documentRequests.flatMap((request) => {
    const uploadLink = getDocumentUploadLink(request.token);
    const requestMessage =
      request.message?.trim() ||
      `Please upload your requested ${request.documentType.toLowerCase().replaceAll("_", " ")}.`;
    const status = request.status === "EXPIRED" ? "FAILED" : "SENT";

    return [
      buildNotificationRecord({
        id: buildNotificationId(["document-request", request.id, "email"]),
        application,
        type: "DOCUMENT_REQUEST",
        channel: "EMAIL",
        recipient: application.email,
        subject: `Document request for ${application.applicationId}`,
        message: `${requestMessage}\nSecure upload link: ${uploadLink || "Upload link unavailable"}`,
        status,
        sentAt: request.createdAt,
        createdAt: request.createdAt,
      }),
    ];
  });

const buildStatusUpdateNotifications = (application) =>
  application.statusLogs
    .filter((log) => log.status !== "APPLICATION_SUBMITTED")
    .flatMap((log) => {
      const normalizedStatus = log.status.replaceAll("_", " ");
      const baseMessage = [
        `Application ${application.applicationId} status updated.`,
        `Current status: ${normalizedStatus}`,
        log.note || "Please review the latest update in your status page.",
      ].join("\n");

      return [
        buildNotificationRecord({
          id: buildNotificationId(["status-update", log.id, "email"]),
          application,
          type: "STATUS_UPDATE",
          channel: "EMAIL",
          recipient: application.email,
          subject: `Status update: ${application.applicationId}`,
          message: baseMessage,
          status: "SENT",
          sentAt: log.createdAt,
          createdAt: log.createdAt,
        }),
      ];
    });

const buildApprovalNotifications = (application) => {
  if (application.currentStatus !== "FUNDED") {
    return [];
  }

  const sentAt = application.updatedAt;
  const fundingMessage = [
    `Congratulations. Application ${application.applicationId} has been approved.`,
    "Funding information has been prepared for the next step.",
    `Updated: ${formatDateForMessage(sentAt)}`,
  ].join("\n");

  return [
    buildNotificationRecord({
      id: buildNotificationId(["approval", application.id, "email"]),
      application,
      type: "APPROVAL",
      channel: "EMAIL",
      recipient: application.email,
      subject: `Approval notice: ${application.applicationId}`,
      message: fundingMessage,
      status: "SENT",
      sentAt,
      createdAt: sentAt,
    }),
  ];
};

const buildDeclineNotifications = (application) => {
  if (application.currentStatus !== "DECLINED") {
    return [];
  }

  const sentAt = application.updatedAt;
  const declineMessage = [
    `Application ${application.applicationId} has been declined.`,
    "Please review the adverse action notice for next-step information.",
    `Updated: ${formatDateForMessage(sentAt)}`,
  ].join("\n");

  return [
    buildNotificationRecord({
      id: buildNotificationId(["decline", application.id, "email"]),
      application,
      type: "DECLINE",
      channel: "EMAIL",
      recipient: application.email,
      subject: `Adverse action notice: ${application.applicationId}`,
      message: declineMessage,
      status: "SENT",
      sentAt,
      createdAt: sentAt,
    }),
  ];
};

const buildBankVerificationReminderNotifications = (application) => {
  const bankStatus = application.bankVerification?.status ?? "PENDING";

  if (bankStatus === "COMPLETED") {
    return [];
  }

  const now = Date.now();
  const createdAtMs = new Date(application.createdAt).getTime();

  return Array.from({ length: 5 }, (_, index) => {
    const reminderDate = new Date(createdAtMs + index * DAY_IN_MS);
    const status =
      bankStatus === "FAILED"
        ? "FAILED"
        : reminderDate.getTime() <= now
          ? "SENT"
          : "PENDING";

    return buildNotificationRecord({
      id: buildNotificationId([
        "bank-reminder",
        application.id,
        String(index + 1),
      ]),
      application,
      type: "BANK_VERIFICATION_REMINDER",
      channel: "EMAIL",
      recipient: application.email,
      subject: `Bank verification reminder: ${application.applicationId}`,
      message:
        `Please complete bank verification for application ${application.applicationId}. ` +
        `Reminder ${index + 1} of 5.`,
      status,
      sentAt: reminderDate,
      createdAt: reminderDate,
    });
  });
};

const sortNotifications = (notifications) =>
  notifications.sort(
    (left, right) => new Date(right.sentAt || right.createdAt) - new Date(left.sentAt || left.createdAt),
  );

const buildNotificationDataset = async () => {
  const applications = await prisma.application.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      bankVerification: true,
      documentRequests: true,
      statusLogs: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  const notifications = applications.flatMap((application) => [
    ...buildSubmissionNotifications(application),
    ...buildDocumentRequestNotifications(application),
    ...buildStatusUpdateNotifications(application),
    ...buildBankVerificationReminderNotifications(application),
    ...buildApprovalNotifications(application),
    ...buildDeclineNotifications(application),
  ]);

  return sortNotifications(notifications);
};

export const getAdminNotificationsService = async (query) => {
  const { page = 1, limit = 10, search, type, channel, status } = query;
  const allNotifications = await buildNotificationDataset();

  const filtered = allNotifications.filter((notification) => {
    if (type && type !== "ALL" && notification.type !== type) {
      return false;
    }

    if (channel && channel !== "ALL" && notification.channel !== channel) {
      return false;
    }

    if (status && status !== "ALL" && notification.status !== status) {
      return false;
    }

    if (!search?.trim()) {
      return true;
    }

    const normalizedSearch = search.trim().toLowerCase();

    return [
      notification.applicationId,
      notification.applicantName,
      notification.type,
      notification.channel,
      notification.status,
      notification.subject || "",
      notification.recipient,
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
  });

  const currentPage = Number(page);
  const pageSize = Number(limit);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return {
    kpis: {
      totalNotifications: allNotifications.length,
      emailsSent: allNotifications.filter(
        (item) => item.channel === "EMAIL" && item.status === "SENT",
      ).length,
      smsSent: allNotifications.filter(
        (item) => item.channel === "SMS" && item.status === "SENT",
      ).length,
      failedNotifications: allNotifications.filter(
        (item) => item.status === "FAILED",
      ).length,
    },
    pagination: {
      page: currentPage,
      limit: pageSize,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    },
    notifications: paginated.map((notification) => ({
      id: notification.id,
      applicationId: notification.applicationId,
      applicantName: notification.applicantName,
      type: notification.type,
      channel: notification.channel,
      status: notification.status,
      sentDate: notification.sentAt || notification.createdAt,
    })),
  };
};

export const getAdminNotificationDetailService = async (notificationId) => {
  if (!notificationId) {
    throw new Error("Notification ID is required");
  }

  const notifications = await buildNotificationDataset();
  const notification = notifications.find((item) => item.id === notificationId);

  if (!notification) {
    throw new Error("Notification not found");
  }

  return {
    id: notification.id,
    applicationId: notification.applicationId,
    applicantName: notification.applicantName,
    channel: notification.channel,
    type: notification.type,
    recipient: notification.recipient,
    subject: notification.subject,
    message: notification.message,
    status: notification.status,
    sentDate: notification.sentAt || notification.createdAt,
  };
};
