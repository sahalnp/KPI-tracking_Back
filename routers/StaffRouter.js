import express from "express";
import { storage } from "../utils/storage.js";
import verifyTokens from "../middleware/verifyMiddleware.js";
import { dmmfToRuntimeDataModel } from "@prisma/client/runtime/library";
const staffRouter = express.Router();

staffRouter.get("/MyKpis", verifyTokens, async (req, res) => {
    
    const staffId = req.user.id;
    const kpis = await storage.getStaffKpis(staffId);
    res.status(200).json({ success: true, kpis });
});
staffRouter.get("/details", verifyTokens, async (req, res) => {
    try {
        const staffId = req.user.id;
        const details = await storage.getStaffDetails(staffId);
        
        const personalKPIs = await storage.getMyKpi(staffId);
        
        const attendanceData = await storage.getAttendance(staffId);
        res.status(200).json({
            success: true,
            details,
            personalKPIs,
            attendanceData,
        });
    } catch (error) {
        console.log(error,"error");
        
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
staffRouter.get("/accountData", verifyTokens, async (req, res) => {
    try {
        const staffId = req.user.id;
        const details = await storage.getAccountData(staffId);

        res.status(200).json({ success: true, details });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Internal server error" });
    }
});
staffRouter.post("/changepin", verifyTokens, async (req, res) => {
    try {
        const staffId = req.user.id;
        const { newPin } = req.body;
        const pin = await storage.staffChangePin(staffId, newPin);
        res.status(200).json({ success: true, pin });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
staffRouter.post("/useredit", verifyTokens, async (req, res) => {
    try {
        const staffId = req.user.id;
        const { data } = req.body;
        const updatedStaff = await storage.userEdit(staffId, data);
        res.status(200).json({ success: true, updatedStaff });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});
staffRouter.post("/logout", verifyTokens, async (req, res) => {
    try {
        await storage.logoutSupervisor(req.user.id);
        res.status(200).json({ success: dmmfToRuntimeDataModel });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
});

export { staffRouter };
