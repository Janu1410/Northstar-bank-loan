import crypto from "crypto";
import path from "path";

import prisma from "../config/prisma.js";
import {
  sendDocumentRequestEmail,
  sendNotificationEmailSafely,
} from "./notificationEmail.service.js";

const buildSecureLink = (token) => {
  const frontendBaseUrl =
    process.env.FRONTEND_BASE_URL;

  return `${frontendBaseUrl}/document-upload?token=${token}`;
};

const buildUploadedDocumentUrl = (filePath) => {
  if (!filePath) {
    return null;
  }

  const backendBaseUrl =
    process.env.BACKEND_PUBLIC_URL;

  return `${backendBaseUrl}/uploads/${path.basename(filePath)}`;
};

const formatDocumentTypeLabel = (value) =>
  value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const deriveUploadStatus = (request) => {
  if (request.status === "APPROVED") {
    return "APPROVED";
  }

  if (request.status === "REJECTED") {
    return "REJECTED";
  }

  if (request.status === "EXPIRED") {
    return "EXPIRED";
  }

  if (request.document) {
    return "UPLOADED";
  }

  return "NOT_UPLOADED";
};

const mapDocumentRequestForAdmin = (request) => ({
  id: request.id,
  applicationId: request.application.applicationId,
  applicantName: `${request.application.firstName} ${request.application.lastName}`,
  requestedDocument: formatDocumentTypeLabel(request.documentType),
  requestStatus: request.status,
  uploadStatus: deriveUploadStatus(request),
  requestedDate: request.createdAt,
  expiryDate: request.expiresAt,
  uploadedDocumentUrl: buildUploadedDocumentUrl(request.document?.filePath),
  secureLink: buildSecureLink(request.token),
  documentType: request.documentType,
  message: request.message,
});

const syncExpiredDocumentRequests = async () => {
  const now = new Date();

  await prisma.documentRequest.updateMany({
    where: {
      expiresAt: {
        lt: now,
      },
      status: {
        in: ["REQUESTED", "UPLOADED"],
      },
    },
    data: {
      status: "EXPIRED",
    },
  });
};

export const getAdminDocumentRequestsService = async (query) => {
  const {
    search,
    requestStatus,
    uploadStatus,
    page = 1,
    limit = 10,
  } = query;

  await syncExpiredDocumentRequests();

  const where = {};

  if (requestStatus && requestStatus !== "ALL") {
    where.status = requestStatus;
  }

  if (search) {
    where.OR = [
      {
        application: {
          is: {
            applicationId: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        application: {
          is: {
            firstName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        application: {
          is: {
            lastName: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      },
      {
        documentType: {
          equals: search.trim().toUpperCase(),
        },
      },
    ];
  }

  const rawRequests = await prisma.documentRequest.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      application: {
        select: {
          applicationId: true,
          firstName: true,
          lastName: true,
        },
      },
      document: true,
    },
  });

  const filteredRequests = rawRequests
    .map(mapDocumentRequestForAdmin)
    .filter((request) =>
      uploadStatus && uploadStatus !== "ALL"
        ? request.uploadStatus === uploadStatus
        : true,
    );

  const paginatedRequests = filteredRequests.slice(
    (Number(page) - 1) * Number(limit),
    Number(page) * Number(limit),
  );

  const pending = rawRequests.filter((request) => request.status === "REQUESTED").length;
  const uploaded = rawRequests.filter((request) => deriveUploadStatus(request) === "UPLOADED").length;
  const approved = rawRequests.filter((request) => request.status === "APPROVED").length;
  const rejected = rawRequests.filter((request) => request.status === "REJECTED").length;
  const expired = rawRequests.filter((request) => request.status === "EXPIRED").length;

  return {
    kpis: {
      pendingDocumentRequests: pending,
      uploadedDocuments: uploaded,
      approvedDocuments: approved,
      rejectedDocuments: rejected,
      expiredUploadLinks: expired,
    },
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredRequests.length,
      totalPages: Math.max(
        1,
        Math.ceil(filteredRequests.length / Number(limit)),
      ),
    },
    documentRequests: paginatedRequests,
  };
};

export const sendDocumentRequestService = async (body, admin) => {
  const {
    applicationId,
    documentType,
    documentTypes,
    message,
    expiresInDays = 7,
  } = body;

  const normalizedDocumentTypes = Array.isArray(documentTypes)
    ? documentTypes.filter(Boolean)
    : documentType
      ? [documentType]
      : [];

  if (!applicationId || normalizedDocumentTypes.length === 0) {
    throw new Error("Application ID and document type are required");
  }

  const application = await prisma.application.findUnique({
    where: {
      applicationId,
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));

  const requests = await Promise.all(
    normalizedDocumentTypes.map((type) =>
      prisma.documentRequest.create({
        data: {
          applicationIdRef: application.id,
          documentType: type,
          message:
            message?.trim() ||
            `Secure upload link prepared for ${type.toLowerCase()}`,
          token: crypto.randomBytes(32).toString("hex"),
          status: "REQUESTED",
          expiresAt,
        },
        include: {
          application: {
            select: {
              applicationId: true,
              firstName: true,
              lastName: true,
            },
          },
          document: true,
        },
      }),
    ),
  );

  const requestsWithDelivery = await Promise.all(
    requests.map(async (request) => {
      const emailDelivery = await sendNotificationEmailSafely(
        sendDocumentRequestEmail,
        {
          applicationId: application.applicationId,
          applicantFirstName: application.firstName,
          email: application.email,
          documentType: request.documentType,
          message: request.message,
          token: request.token,
        },
      );

      return {
        request,
        emailDelivery,
      };
    }),
  );

  const mappedRequests = requestsWithDelivery.map(({ request, emailDelivery }) => ({
    ...mapDocumentRequestForAdmin(request),
    requestedByAdminId: admin?.adminId ?? admin?.id ?? null,
    notificationDelivery: {
      email: emailDelivery.delivered ? "SENT" : "FAILED",
    },
  }));

  return normalizedDocumentTypes.length === 1 ? mappedRequests[0] : mappedRequests;
};

export const getUploadRequestByTokenService = async (token) => {
  if (!token) {
    throw new Error("Upload token is required");
  }

  const request = await prisma.documentRequest.findUnique({
    where: {
      token,
    },
    include: {
      application: {
        select: {
          applicationId: true,
          firstName: true,
          lastName: true,
        },
      },
      document: true,
    },
  });

  if (!request) {
    throw new Error("Invalid upload link");
  }

  if (new Date() > request.expiresAt && request.status !== "EXPIRED") {
    await prisma.documentRequest.update({
      where: { token },
      data: { status: "EXPIRED" },
    });

    throw new Error("Upload link expired");
  }

  if (request.status === "EXPIRED") {
    throw new Error("Upload link expired");
  }

  return {
    id: request.id,
    applicationId: request.application.applicationId,
    applicantName: `${request.application.firstName} ${request.application.lastName}`,
    documentType: request.documentType,
    requestedDocument: formatDocumentTypeLabel(request.documentType),
    message: request.message,
    requestStatus: request.status,
    uploadStatus: deriveUploadStatus(request),
    expiryDate: request.expiresAt,
    uploadedDocumentUrl: buildUploadedDocumentUrl(request.document?.filePath),
  };
};

export const uploadDocumentService = async (token, file) => {
  if (!file) {
    throw new Error("File is required");
  }

  const request = await prisma.documentRequest.findUnique({
    where: {
      token,
    },
    include: {
      application: {
        select: {
          applicationId: true,
          firstName: true,
          lastName: true,
        },
      },
      document: true,
    },
  });

  if (!request) {
    throw new Error("Invalid upload link");
  }

  if (new Date() > request.expiresAt) {
    await prisma.documentRequest.update({
      where: {
        token,
      },
      data: {
        status: "EXPIRED",
      },
    });

    throw new Error("Upload link expired");
  }

  const document = request.document
    ? await prisma.document.update({
        where: {
          documentRequestId: request.id,
        },
        data: {
          fileName: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
          uploadedAt: new Date(),
        },
      })
    : await prisma.document.create({
        data: {
          documentRequestId: request.id,
          fileName: file.originalname,
          filePath: file.path,
          mimeType: file.mimetype,
        },
      });

  await prisma.documentRequest.update({
    where: {
      token,
    },
    data: {
      status: "UPLOADED",
    },
  });

  return {
    documentRequestId: request.id,
    applicationId: request.application.applicationId,
    applicantName: `${request.application.firstName} ${request.application.lastName}`,
    requestedDocument: formatDocumentTypeLabel(request.documentType),
    fileName: document.fileName,
    filePath: buildUploadedDocumentUrl(document.filePath),
    mimeType: document.mimeType,
    uploadedAt: document.uploadedAt,
  };
};

export const updateDocumentRequestService = async (documentRequestId, body) => {
  const { action } = body;

  if (!action) {
    throw new Error("Action is required");
  }

  const existing = await prisma.documentRequest.findUnique({
    where: {
      id: documentRequestId,
    },
    include: {
      application: {
        select: {
          applicationId: true,
          firstName: true,
          lastName: true,
        },
      },
      document: true,
    },
  });

  if (!existing) {
    throw new Error("Document request not found");
  }

  if (action === "REREQUEST") {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.document.deleteMany({
      where: {
        documentRequestId: existing.id,
      },
    });

    const rerequested = await prisma.documentRequest.update({
      where: {
        id: documentRequestId,
      },
      data: {
        token: crypto.randomBytes(32).toString("hex"),
        status: "REQUESTED",
        expiresAt,
      },
      include: {
        application: {
          select: {
            applicationId: true,
            firstName: true,
            lastName: true,
          },
        },
        document: true,
      },
    });

    return mapDocumentRequestForAdmin(rerequested);
  }

  const nextStatus =
    action === "APPROVE"
      ? "APPROVED"
      : action === "REJECT"
        ? "REJECTED"
        : null;

  if (!nextStatus) {
    throw new Error("Unsupported document request action");
  }

  if (action === "APPROVE" && !existing.document) {
    throw new Error("An uploaded document is required before approval");
  }

  const updated = await prisma.documentRequest.update({
    where: {
      id: documentRequestId,
    },
    data: {
      status: nextStatus,
    },
    include: {
      application: {
        select: {
          applicationId: true,
          firstName: true,
          lastName: true,
        },
      },
      document: true,
    },
  });

  return mapDocumentRequestForAdmin(updated);
};
