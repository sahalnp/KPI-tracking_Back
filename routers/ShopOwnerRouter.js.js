import express from "express";
const OwnerRouter = express.Router();
import {
    addEmployeeScore,
    addKpi,
    addUser,
    dltKpi,
    dltUsers,
    getDetails,
    getKPIs,
    getMe,
    getScoreEmployee,
    getUsers,
    logout,
    toggleKpi,
    updateKpi,
    updateMe,
    updatePin,
    updateStatus,
    updateUser,
} from "../controller/OwnerController.js";
import verifyTokens from "../middleware/verifyMiddleware.js";

//GET routers
ownerRouter.get("/getKpis",verifyTokens,getKPIs);
ownerRouter.get("/getUsers", verifyTokens,getUsers);
ownerRouter.get("/me",verifyTokens,getMe)
ownerRouter.get("/details",verifyTokens,getDetails)
ownerRouter.get("/staff-scoring",verifyTokens,getScoreEmployee)
//POST routers
ownerRouter.post("/addKpi", verifyTokens,addKpi);
ownerRouter.post("/addUser",verifyTokens,addUser);
ownerRouter.post("/logout",verifyTokens,logout)
ownerRouter.post("/submit-score",verifyTokens,addEmployeeScore)


//PUT routers
ownerRouter.put("/editKpi/:id", verifyTokens,updateKpi);
ownerRouter.put("/updateUser/:id", verifyTokens,updateUser);
ownerRouter.put("/editOwner/:id",verifyTokens,updateMe)

//DELETE routers
ownerRouter.delete("/dltKpi", verifyTokens,dltKpi);
ownerRouter.delete("/deleteUser/:id", verifyTokens,dltUsers);

//PATCH routers
ownerRouter.patch("/updateStatus", verifyTokens,updateStatus)
ownerRouter.patch("/kpi/:id/toggle", verifyTokens,toggleKpi)
ownerRouter.patch("/changePin",verifyTokens,updatePin)
export { OwnerRouter };
