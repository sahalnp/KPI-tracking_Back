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
import morgan from "morgan";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const app = express();
export const prisma = new PrismaClient();
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "https://kpi-tracking-front.onrender.com", 
      "http://localhost:3000",                   
      "http://127.0.0.1:3000",
      "http://0.0.0.0:3000",
      "http://10.63.194.166:3000"
    ];
    
    // Check if origin is in allowed list or matches localhost pattern
    if (allowedOrigins.indexOf(origin) !== -1 || 
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
        /^http:\/\/0\.0\.0\.0:\d+$/.test(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));




app.use(limiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, "public")));
app.use(cookieParser());
app.use(morgan("dev"))

// Routes
app.use("/api",loginRouter)
app.use("/api/staff",staffRouter)
app.use("/api/supervisor",supervisorRouter)
app.use("/api/accountant",accountRouter)
app.use("/api/owner",ownerRouter)
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});


  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });


export default app;


