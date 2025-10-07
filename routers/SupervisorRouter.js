import express from "express";
import {
    addScore,
    addUser,
    addWalkout,
    deleteWalkout,
    dltUser,
    editUser,
    editWalkout,
    fetchItem,
    fetchType,
    getDashboardData,
    getKpis,
    getMe,
    getScoreStaff,
    getUsers,
    getWalkouts,
    logoutSupervisor,
    toggleStaff,
    updatePin,
    walkOutExport,
} from "../controller/SupervisorController.js";
import verifyTokens from "../middleware/verifyMiddleware.js";
const supervisorRouter = express.Router();

supervisorRouter.get("/getDashboardData", verifyTokens, getDashboardData);
supervisorRouter.get("/staff-scoring", verifyTokens, getScoreStaff);
supervisorRouter.get("/getKpis", verifyTokens, getKpis);
supervisorRouter.post("/submit-score", verifyTokens, addScore);
supervisorRouter.get("/getWalkouts", verifyTokens, getWalkouts);
supervisorRouter.post("/addWalkout", verifyTokens, addWalkout);
supervisorRouter.put("/editWalkout/:id", verifyTokens, editWalkout);
supervisorRouter.delete("/dltWalkt/:id", verifyTokens, deleteWalkout);
supervisorRouter.get("/getUsers", verifyTokens, getUsers);
supervisorRouter.post("/addUser", verifyTokens, addUser);
supervisorRouter.put("/editUser/:id", verifyTokens, editUser);
supervisorRouter.delete("/deleteUser/:id", verifyTokens, dltUser);
supervisorRouter.patch("/toggleStaff/:id", verifyTokens, toggleStaff);
supervisorRouter.get("/getme", verifyTokens, getMe);
supervisorRouter.put("/updatePin", verifyTokens, updatePin);
supervisorRouter.post("/logout", verifyTokens, logoutSupervisor);
supervisorRouter.get("/export-excel", verifyTokens, walkOutExport);
supervisorRouter.get("/getItemName", verifyTokens, fetchItem);
supervisorRouter.get("/getItemType", verifyTokens, fetchType);

export { supervisorRouter };
