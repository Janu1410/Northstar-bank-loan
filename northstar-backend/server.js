import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import applicationRoutes from "./src/routes/application.routes.js";
import bankVerificationRoutes from "./src/routes/bankVerification.routes.js";
import adminAuthRoutes from "./src/routes/adminAuth.routes.js";
import adminProfileRoutes from "./src/routes/adminProfile.routes.js";
import adminApplicationRoutes from "./src/routes/adminApplication.routes.js";
import adminDocumentRequestRoutes from "./src/routes/adminDocumentRequest.routes.js";
import adminNotificationRoutes from "./src/routes/adminNotification.routes.js";
import adminUserRoutes from "./src/routes/adminUser.routes.js";
import documentRequestRoutes from "./src/routes/documentRequest.routes.js";
dotenv.config();

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
}));
app.use(express.json());
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Northstar Lending API is running",
  });
});

app.use("/api/applications",applicationRoutes);
app.use("/api/bank-verification",bankVerificationRoutes);
app.use("/api/document-requests", documentRequestRoutes);

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/profile",adminProfileRoutes);
app.use("/api/admin/applications", adminApplicationRoutes);
app.use("/api/admin/document-requests", adminDocumentRequestRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/admin/users", adminUserRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});
