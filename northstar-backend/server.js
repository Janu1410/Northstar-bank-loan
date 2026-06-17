import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import applicationRoutes from "./src/routes/application.routes.js";
import bankVerificationRoutes from "./src/routes/bankVerification.routes.js";
dotenv.config();

const app = express();

app.use(cors({
    origin : "http://localhost:3000",
}));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Northstar Lending API is running",
  });
});

app.use("/api/applications",applicationRoutes);
app.use("/api/bank-verification",bankVerificationRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});