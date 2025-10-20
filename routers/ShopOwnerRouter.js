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
    toggleKpi,
    updateKpi,
    updateMe,
    updatePin,
    updateScore,
    updateStatus,
    updateUser,
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
ownerRouter.get("/staffReport/export",verifyTokens,exportStaffReport)
//POST routers
ownerRouter.post("/addKpi", verifyTokens,addKpi);
ownerRouter.post("/addUser",verifyTokens,addUser);
ownerRouter.post("/logout",verifyTokens,logout)
ownerRouter.post("/submit-score",verifyTokens,addEmployeeScore)


//PUT routers
ownerRouter.put("/editKpi/:id", verifyTokens,updateKpi);
ownerRouter.put("/updateUser/:id", verifyTokens,updateUser);
ownerRouter.put("/editOwner/:id",verifyTokens,updateMe)
ownerRouter.put("/updateScore/:id",verifyTokens,updateScore)


//DELETE routers
ownerRouter.delete("/dltKpi", verifyTokens,dltKpi);
ownerRouter.delete("/deleteUser/:id", verifyTokens,dltUsers);

//PATCH routers
ownerRouter.patch("/updateStatus", verifyTokens,updateStatus)
ownerRouter.patch("/kpi/:id/toggle", verifyTokens,toggleKpi)
ownerRouter.patch("/changePin",verifyTokens,updatePin)
export { ownerRouter };
