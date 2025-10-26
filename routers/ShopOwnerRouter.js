import express from "express";
const ownerRouter = express.Router();
import {
    addEmployeeScore,
    addKpi,
    addUser,
    dltKpi,
    dltUsers,
    exportStaffReport,
    getDetails,
    getEditScore,
    getKPIs,
    getMe,
    getScoreEmployee,
    getUsers,
    logout,
    scoreKpi,
    staffReport,
    staffReportByMonth,
    toggleKpi,
    updateKpi,
    updateMe,
    updatePin,
    updateScore,
    updateStatus,
    updateUser,
    salesReport,
    exportSalesReport,
    attendanceReport,
    walkoutReport,
    exportAttendanceReport,
    exportWalkoutReport,
    getDashboardGraphData,
    getFloorPerformanceData,
    getFloorAttendanceData,
    getFloors,
    checkIdExists,
    // Owner Walkout Management
    addWalkout,
    editWalkout,
    deleteWalkout,
    exportWalkouts,
    getItemName,
    getItemType,
    searchStaff,
    getWalkoutsOwner,
    getStaffKPIDetails,
    getStaffDailyKPIDetails,
    getStaffWeeklyKPIDetails,
    getStaffAttendanceReport,
    getStaffSalesReport,
    getAllMonthsStaffKPIDetails,
    getAllMonthsStaffDailyKPIDetails,
    getAllMonthsStaffWeeklyKPIDetails,
    getAllMonthsStaffAttendanceReport,
    getAllMonthsStaffSalesReport,
    getAllMonthsAttendanceReport,
    getWeeklyKPIByMonth,
} from "../controller/OwnerController.js";
import verifyTokens from "../middleware/verifyMiddleware.js";

//GET routers
ownerRouter.get("/getKpis",verifyTokens,getKPIs);
ownerRouter.get("/scoreKPI",verifyTokens,scoreKpi)
ownerRouter.get("/getUsers", verifyTokens,getUsers);
ownerRouter.get("/me",verifyTokens,getMe)
ownerRouter.get("/details",verifyTokens,getDetails)
ownerRouter.get("/staff-scoring",verifyTokens,getScoreEmployee)
ownerRouter.get("/userscore/:id",verifyTokens,getEditScore)
ownerRouter.get("/staffReport",verifyTokens,staffReport)
ownerRouter.get("/staffReportByMonth",verifyTokens,staffReportByMonth)
ownerRouter.get("/staffReport/export",verifyTokens,exportStaffReport)
ownerRouter.get("/salesReport",verifyTokens,salesReport)
ownerRouter.get("/salesReport/export",verifyTokens,exportSalesReport)
ownerRouter.get("/attendanceReport",verifyTokens,attendanceReport)
ownerRouter.get("/attendanceReport/export",verifyTokens,exportAttendanceReport)
ownerRouter.get("/walkoutReport",verifyTokens,walkoutReport)
ownerRouter.get("/walkoutReport/export",verifyTokens,exportWalkoutReport)
ownerRouter.get("/dashboard/graph",verifyTokens,getDashboardGraphData)
ownerRouter.get("/dashboard/floor-performance",verifyTokens,getFloorPerformanceData)
ownerRouter.get("/dashboard/floor-attendance",verifyTokens,getFloorAttendanceData)
ownerRouter.get("/getFloors",verifyTokens,getFloors)
ownerRouter.get("/check-id",verifyTokens,checkIdExists)

// Owner Walkout Management Routes
ownerRouter.get("/getWalkouts", verifyTokens, getWalkoutsOwner)
ownerRouter.get("/getItemName", verifyTokens, getItemName)
ownerRouter.get("/getItemType", verifyTokens, getItemType)
ownerRouter.get("/searchStaff", verifyTokens, searchStaff)
ownerRouter.get("/staff/:id/kpi-details", verifyTokens, getStaffKPIDetails)
ownerRouter.get("/staff/:id/kpi-details/export", verifyTokens, getStaffKPIDetails)
ownerRouter.get("/staff/:id/weekly-kpi-details", verifyTokens, getStaffWeeklyKPIDetails)
ownerRouter.get("/staff/:id/daily-kpi-details", verifyTokens, getStaffDailyKPIDetails)
ownerRouter.get("/staff/:id/attendance-report", verifyTokens, getStaffAttendanceReport)
ownerRouter.get("/staff/:id/sales-report", verifyTokens, getStaffSalesReport)

// All Months Data Routes
ownerRouter.get("/staff/:id/all-months-kpi-details", verifyTokens, getAllMonthsStaffKPIDetails)
ownerRouter.get("/staff/:id/all-months-daily-kpi-details", verifyTokens, getAllMonthsStaffDailyKPIDetails)
ownerRouter.get("/staff/:id/all-months-weekly-kpi-details", verifyTokens, getAllMonthsStaffWeeklyKPIDetails)
ownerRouter.get("/staff/:id/all-weekly-kpi-inMonth", verifyTokens, getWeeklyKPIByMonth)
ownerRouter.get("/staff/:id/all-months-attendance-report", verifyTokens, getAllMonthsStaffAttendanceReport)
ownerRouter.get("/staff/:id/all-months-sales-report", verifyTokens, getAllMonthsStaffSalesReport)
ownerRouter.get("/all-months-attendanceReport", verifyTokens, getAllMonthsAttendanceReport)
//POST routers
ownerRouter.post("/addKpi", verifyTokens,addKpi);
ownerRouter.post("/addUser",verifyTokens,addUser);
ownerRouter.post("/logout",verifyTokens,logout)
ownerRouter.post("/submit-score",verifyTokens,addEmployeeScore)
ownerRouter.post("/addWalkout", verifyTokens, addWalkout)


//PUT routers
ownerRouter.put("/editKpi/:id", verifyTokens,updateKpi);
ownerRouter.put("/updateUser/:id", verifyTokens,updateUser);
ownerRouter.put("/editOwner/:id",verifyTokens,updateMe)
ownerRouter.put("/updateScore/:id",verifyTokens,updateScore)
ownerRouter.put("/editWalkout/:id", verifyTokens, editWalkout)


//DELETE routers
ownerRouter.delete("/dltKpi", verifyTokens,dltKpi);
ownerRouter.delete("/deleteUser/:id", verifyTokens,dltUsers);
ownerRouter.delete("/dltWalkt/:id", verifyTokens, deleteWalkout)

//PATCH routers
ownerRouter.patch("/updateStatus", verifyTokens,updateStatus)
ownerRouter.patch("/kpi/:id/toggle", verifyTokens,toggleKpi)
ownerRouter.patch("/changePin",verifyTokens,updatePin)
export { ownerRouter };
