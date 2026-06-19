import nodemailer from "nodemailer";

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL;
const ADMIN_FRONTEND_BASE_URL = process.env.ADMIN_FRONTEND_BASE_URL;

const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER;

let transporter;

const createTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      "SMTP configuration missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and MAIL_FROM.",
    );
  }

  if (!MAIL_FROM) {
    throw new Error("MAIL_FROM is missing.");
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
};

const formatDocumentTypeLabel = (value) =>
  value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const getStatusPageLink = (applicationId, lastName) => {
  if (!FRONTEND_BASE_URL) {
    throw new Error("FRONTEND_BASE_URL is missing.");
  }

  const params = new URLSearchParams({
    applicationId,
    lastName,
  });

  return `${FRONTEND_BASE_URL}/loan-status?${params.toString()}`;
};

const getDocumentUploadLink = (token) => {
  if (!FRONTEND_BASE_URL) {
    throw new Error("FRONTEND_BASE_URL is missing.");
  }

  return `${FRONTEND_BASE_URL}/document-upload?token=${token}`;
};

export const getAdminPasswordSetupLink = (token) => {
  if (!ADMIN_FRONTEND_BASE_URL) {
    throw new Error("ADMIN_FRONTEND_BASE_URL is missing.");
  }

  return `${ADMIN_FRONTEND_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
};

const sendEmail = async ({ to, subject, text }) => {
  const mailer = createTransporter();

  return mailer.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    text,
  });
};

export const sendApplicationSubmittedEmail = async ({
  applicationId,
  email,
  firstName,
  lastName,
}) => {
  const statusLink = getStatusPageLink(applicationId, lastName);

  return sendEmail({
    to: email,
    subject: `Application received: ${applicationId}`,
    text: [
      `Hello ${firstName},`,
      "",
      "Your application has been received successfully.",
      `Application ID: ${applicationId}`,
      `Track your status here: ${statusLink}`,
      "",
      "Northstar Lending",
    ].join("\n"),
  });
};

export const sendDocumentRequestEmail = async ({
  applicationId,
  applicantFirstName,
  email,
  documentType,
  message,
  token,
}) => {
  const uploadLink = getDocumentUploadLink(token);
  const requestedDocument = formatDocumentTypeLabel(documentType);

  return sendEmail({
    to: email,
    subject: `Document request for ${applicationId}`,
    text: [
      `Hello ${applicantFirstName},`,
      "",
      message?.trim() ||
        `Please upload your requested ${requestedDocument}.`,
      `Secure upload link: ${uploadLink}`,
      "",
      "Northstar Lending",
    ].join("\n"),
  });
};

export const sendNotificationEmailSafely = async (sendFn, payload) => {
  try {
    await sendFn(payload);
    return {
      delivered: true,
      error: null,
    };
  } catch (error) {
    console.error("Notification email send error:", error);

    return {
      delivered: false,
      error: error.message || "Email delivery failed",
    };
  }
};

export const sendAdminPortalAccessEmail = async ({
  email,
  fullName,
  role,
  temporaryPassword,
  token,
}) => {
  const setupLink = getAdminPasswordSetupLink(token);

  return sendEmail({
    to: email,
    subject: "Your Northstar Admin portal access is ready",
    text: [
      `Hello ${fullName},`,
      "",
      "A manager has created your Northstar Admin account.",
      `Role: ${role}`,
      `Temporary password: ${temporaryPassword}`,
      "",
      "Before using the admin portal, set your own password with this secure link:",
      setupLink,
      "",
      "After resetting your password, sign in with your admin email address.",
      "",
      "Northstar Lending",
    ].join("\n"),
  });
};

export const sendAdminPasswordResetEmail = async ({
  email,
  fullName,
  token,
}) => {
  const resetLink = getAdminPasswordSetupLink(token);

  return sendEmail({
    to: email,
    subject: "Reset your Northstar Admin password",
    text: [
      `Hello ${fullName},`,
      "",
      "We received a request to reset your Northstar Admin password.",
      "Use the secure link below to choose a new password:",
      resetLink,
      "",
      "If you did not request this, you can ignore this email.",
      "",
      "Northstar Lending",
    ].join("\n"),
  });
};
