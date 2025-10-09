import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
import { ownerRouter } from "./routers/ownerRouter.js";
import limiter from "./middleware/limiter.js";
import loginRouter from "./routers/LoginRouter.js";
import { staffRouter } from "./routers/StaffRouter.js";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { supervisorRouter } from "./routers/SupervisorRouter.js";
import accountRouter from "./routers/AccountantRouter.js";
import fs from "fs";
console.log(fs.readdirSync("./routers")); // See what files exist


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const app = express();
export const prisma = new PrismaClient();

app.use(cors({
  origin: "http://10.63.194.166:5173",
  methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  credentials: true
}));
app.use(limiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));
app.use(cookieParser());

// Routes
app.use("/api/owner", ownerRouter);
app.use("/api",loginRouter)
app.use("/api/staff",staffRouter)
app.use("/api/supervisor",supervisorRouter)
app.use("/api/accountant",accountRouter)

// When running on Vercel, we must export the app instead of listening
// so Vercel can handle the serverless request lifecycle.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;


