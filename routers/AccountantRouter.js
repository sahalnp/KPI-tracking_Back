import express from "express";
import verifyTokens from "../middleware/verifyMiddleware.js";
import {
    addAttendence,
    editProfile,
    getData,
    getDetails,
    getMe,
    getScore,
    loadMoreData,
    logoutAccountant,
    staffList,
    updatePin,
    uploadData,
    getSalesGraph,
    getStaffGraph,
    getFloorData,
    getFloorAttendance,
    getFloors,
    downloadFile,

} from "../controller/AccountantController.js";
import { upload } from "../middleware/upload.js";

const accountRouter = express.Router();

accountRouter.get("/getMe", verifyTokens, getMe);
accountRouter.put("/update-profile", verifyTokens, editProfile);
accountRouter.patch("/change-pin", verifyTokens, updatePin);
accountRouter.post(
    "/upload-data",
    verifyTokens,
    upload.single("file"),
    uploadData
);
accountRouter.post("/logout", verifyTokens, logoutAccountant);
accountRouter.get("/getData", verifyTokens, getData);
accountRouter.get("/getmoreData", verifyTokens, loadMoreData);
accountRouter.post("/attendance", verifyTokens, addAttendence);
accountRouter.get("/getstaff", verifyTokens, staffList);
accountRouter.get("/getDetails", verifyTokens, getDetails);
accountRouter.get("/sales-reports", verifyTokens, getScore);
accountRouter.get("/getSalesGraph", verifyTokens, getSalesGraph);
accountRouter.get("/getStaffGraph", verifyTokens, getStaffGraph);
accountRouter.get("/getFloorData", verifyTokens, getFloorData);
accountRouter.get("/getFloorAttendance", verifyTokens, getFloorAttendance);
accountRouter.get("/getFloors", verifyTokens, getFloors);

// Download file route
accountRouter.get("/download-file/:fileId", verifyTokens, downloadFile);

// Check staff route
// accountRouter.get("/check-staff", verifyTokens, checkStaff);

// // List uploaded files route
// accountRouter.get("/list-files", verifyTokens, listUploadedFiles);

export default accountRouter;
