export type AdminRole = "STANDARD_AGENT" | "MANAGER";

export type AdminProfile = {
  adminId: string;
  email: string;
  role: AdminRole;
};

export type LoggedInAdmin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
};

export type AdminLoginResponse = {
  token: string;
  admin: LoggedInAdmin;
};

export type DashboardOverview = {
  totalApplications: number;
  pendingPhoneConfirmation: number;
  fundedApplications: number;
  completedBankVerifications: number;
};

export type DashboardApplication = {
  applicationId: string;
  applicantName: string;
  amountRequested: number;
  currentStatus: string;
  bankVerificationStatus: string;
  submittedAt: string;
  verifiedAt: string | null;
};

export type AdminDashboardResponse = {
  overview: DashboardOverview;
  recentApplications: DashboardApplication[];
};

export type AdminApplicationsKpis = {
  totalApplications: number;
  newApplicationsToday: number;
  awaitingReview: number;
  phoneVerificationQueue: number;
  bankVerificationPending: number;
  completedVerifications: number;
  fundedApplications: number;
  declinedApplications: number;
};

export type AdminApplicationsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminApplicationListItem = {
  id: string;
  applicationId: string;
  applicantName: string;
  amountRequested: number;
  email: string;
  phone: string;
  employmentStatus: string;
  creditTier: string;
  currentStatus: string;
  bankVerificationStatus: string;
  submittedAt: string;
  updatedAt: string;
};

export type AdminApplicationsResponse = {
  kpis: AdminApplicationsKpis;
  pagination: AdminApplicationsPagination;
  applications: AdminApplicationListItem[];
};

export type AdminApplicationStatusHistoryItem = {
  status: string;
  note: string | null;
  createdAt: string;
};

export type AdminApplicationTimelineItem = {
  label: string;
  status: string;
  completed: boolean;
  createdAt: string | null;
  note: string;
};

export type AdminApplicationActivityItem = {
  type: string;
  detail: string | null;
  createdAt: string;
};

export type AdminApplicationDetail = {
  id: string;
  applicationId: string;
  applicantName: string;
  firstName: string;
  lastName: string;
  amountRequested: number;
  email: string;
  phone: string;
  mailingAddress: string;
  maskedSsn: string;
  dateOfBirth: string;
  currentStatus: string;
  submittedAt: string;
  updatedAt: string;
  employmentStatus: string;
  monthlyGrossIncome: number | null;
  employerName: string | null;
  employerPhone: string | null;
  creditTier: string;
  accountType: string | null;
  bankAccountAge: string | null;
  routingNumber: string | null;
  maskedAccountNumber: string;
  bankVerificationStatus: string;
  verifiedAt: string | null;
  agreementStatus: string;
  agreementGeneratedAt: string | null;
  agreementSignedAt: string | null;
  agreementUrl: string | null;
  referenceName: string | null;
  referencePhone: string | null;
  referenceRelationship: string | null;
  creditAssessmentConsent: boolean;
  tcpaConsent: boolean;
  consentIpAddress: string | null;
  consentDate: string | null;
  statusHistory: AdminApplicationStatusHistoryItem[];
  timeline: AdminApplicationTimelineItem[];
  internalNotes: AdminApplicationActivityItem[];
  auditActivity: AdminApplicationActivityItem[];
};

export type AdminDocumentRequestKpis = {
  pendingDocumentRequests: number;
  uploadedDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  expiredUploadLinks: number;
};

export type AdminDocumentRequestPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminDocumentRequestListItem = {
  id: string;
  applicationId: string;
  applicantName: string;
  requestedDocument: string;
  requestStatus: string;
  uploadStatus: string;
  requestedDate: string;
  expiryDate: string;
  uploadedDocumentUrl: string | null;
  secureLink: string;
  documentType: string;
  message?: string | null;
};

export type AdminDocumentRequestsResponse = {
  kpis: AdminDocumentRequestKpis;
  pagination: AdminDocumentRequestPagination;
  documentRequests: AdminDocumentRequestListItem[];
};

export type AdminNotificationsKpis = {
  totalNotifications: number;
  emailsSent: number;
  smsSent: number;
  failedNotifications: number;
};

export type AdminNotificationsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminNotificationListItem = {
  id: string;
  applicationId: string;
  applicantName: string;
  type: string;
  channel: string;
  status: string;
  sentDate: string;
};

export type AdminNotificationDetail = {
  id: string;
  applicationId: string;
  applicantName: string;
  channel: string;
  type: string;
  recipient: string;
  subject: string | null;
  message: string;
  status: string;
  sentDate: string;
};

export type AdminNotificationsResponse = {
  kpis: AdminNotificationsKpis;
  pagination: AdminNotificationsPagination;
  notifications: AdminNotificationListItem[];
};

export type AdminUserStatus = "ACTIVE" | "INACTIVE";

export type AdminUsersKpis = {
  totalAdmins: number;
  managers: number;
  standardAgents: number;
  inactiveUsers: number;
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  isActive: boolean;
  lastLoginAt: string | null;
  inviteSentAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdByName: string | null;
};

export type AdminUsersResponse = {
  kpis: AdminUsersKpis;
  admins: AdminUserListItem[];
};
