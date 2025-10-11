import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";

import limiter from "./middleware/limiter.js";
import loginRouter from "./routers/LoginRouter.js";
import { staffRouter } from "./routers/StaffRouter.js";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supervisorRouter } from "./routers/SupervisorRouter.js";
import accountRouter from "./routers/AccountantRouter.js";
import { ownerRouter } from "./routers/ShopOwnerRouter.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const app = express();
export const prisma = new PrismaClient();
app.use(cors({
  origin: [
    "https://kpi-tracking-front.onrender.com", // Render frontend
    "https://kpi-trackingfrontent.vercel.app", // Vercel frontend
    "https://*.vercel.app",                     // All Vercel frontends
    "http://localhost:3001",                    // local development
    "http://localhost:3000",                    // local development
    "http://10.63.194.166:3001",               // LAN dev frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"]
}));




app.use(limiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));
app.use(cookieParser());

// Routes
app.use("/api",loginRouter)
app.use("/api/staff",staffRouter)
app.use("/api/supervisor",supervisorRouter)
app.use("/api/accountant",accountRouter)
app.use("/api/owner",ownerRouter)
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});


  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });


export default app;


