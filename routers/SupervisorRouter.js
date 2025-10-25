import express from "express";
import {
    addScore,
    addUser,
    addWalkout,
    deleteWalkout,
    dltUser,
    editMe,
    editUser,
    editWalkout,
    fetchItem,
    fetchType,
    getDashboardData,
    getKpis,
    getMe,
    getScoreStaff,
    getUsers,
    getUserScore,
    getWalkouts,
    logoutSupervisor,
    toggleStaff,
    updatePin,
    walkOutExport,
    // New endpoints
    submitScore,
    updateScore,
    getStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    checkIdExists,
    getReports,
    staffReport,
    salesReport,
    attendanceReport,
    walkoutReport,
    exportStaffReport,
    exportSalesReport,
    exportAttendanceReport,
    exportWalkoutReport,
    searchStaff,
} from "../controller/SupervisorController.js";
import verifyTokens from "../middleware/verifyMiddleware.js";
const supervisorRouter = express.Router();

supervisorRouter.get("/getDashboardData", verifyTokens, getDashboardData);

// Supervisor scoring endpoints
supervisorRouter.get("/staff-scoring", verifyTokens, getScoreStaff);
supervisorRouter.get("/scoreKPI", verifyTokens, getKpis);
supervisorRouter.get("/userscore/:id", verifyTokens, getUserScore);
supervisorRouter.post("/submit-score", verifyTokens, addScore);
supervisorRouter.put("/updateScore/:id", verifyTokens, updateScore);

// Walkout management endpoints
supervisorRouter.get("/getWalkouts", verifyTokens, getWalkouts);
supervisorRouter.post("/addWalkout", verifyTokens, addWalkout);
supervisorRouter.put("/editWalkout/:id", verifyTokens, editWalkout);
supervisorRouter.delete("/dltWalkt/:id", verifyTokens, deleteWalkout);

// User management endpoints
supervisorRouter.get("/getUsers", verifyTokens, getUsers);
supervisorRouter.post("/addUser", verifyTokens, addUser);
supervisorRouter.put("/editUser/:id", verifyTokens, editUser);
supervisorRouter.delete("/deleteUser/:id", verifyTokens, dltUser);
supervisorRouter.patch("/toggleStaff/:id", verifyTokens, toggleStaff);

// Profile endpoints
supervisorRouter.get("/getme", verifyTokens, getMe);
supervisorRouter.put("/editMe", verifyTokens, editMe);
supervisorRouter.put("/updatePin", verifyTokens, updatePin);
supervisorRouter.post("/logout", verifyTokens, logoutSupervisor);

// Export and utility endpoints
supervisorRouter.get("/export-excel", verifyTokens, walkOutExport);
supervisorRouter.get("/getItemName", verifyTokens, fetchItem);
supervisorRouter.get("/getItemType", verifyTokens, fetchType);
supervisorRouter.get("/searchStaff", verifyTokens, searchStaff);

// New supervisor settings/staff management endpoints
supervisorRouter.get("/getStaff", verifyTokens, getStaff);
supervisorRouter.post("/addStaff", verifyTokens, addStaff);
supervisorRouter.put("/updateStaff/:id", verifyTokens, updateStaff);
supervisorRouter.delete("/deleteStaff/:id", verifyTokens, deleteStaff);
supervisorRouter.get("/check-id-exists/:uniqueId", verifyTokens, checkIdExists);
supervisorRouter.get("/reports", verifyTokens, getReports);

// Individual report endpoints
supervisorRouter.get("/staffReport", verifyTokens, staffReport);
supervisorRouter.get("/salesReport", verifyTokens, salesReport);
supervisorRouter.get("/attendanceReport", verifyTokens, attendanceReport);
supervisorRouter.get("/walkoutReport", verifyTokens, walkoutReport);

// Export endpoints
supervisorRouter.get("/staffReport/export", verifyTokens, exportStaffReport);
supervisorRouter.get("/salesReport/export", verifyTokens, exportSalesReport);
supervisorRouter.get("/attendanceReport/export", verifyTokens, exportAttendanceReport);
supervisorRouter.get("/walkoutReport/export", verifyTokens, exportWalkoutReport);

export { supervisorRouter };
