import { comparePassword, hashPassword } from "../utils/Password.js";
import { storage } from "../utils/storage.js";
import fs from "fs";
import csv from "csv-parser";
import XLSX from "xlsx";


export const getFloorData = async (req, res) => {
    try {
        const { month, year } = req.query;
        const accountantId = req.user.id;
        
        const floorPerformance = await storage.getAccountantFloorPerformance(accountantId, month, year);
        const floorAttendance = await storage.getAccountantFloorAttendance(month, year);
        
        res.status(200).json({
            success: true,
            floorPerformance,
            floorAttendance
        });
    } catch (error) {
        console.error("Error fetching floor data:", error);
        res.status(500).json({ success: false, error: "Failed to fetch floor data" });
    }
};

export const getSalesGraph = async (req, res) => {
    try {
        const { month, year } = req.query;
        const accountantId = req.user.id;

        // Get sales data for last 4 months
        const salesGraph = await storage.getAccountantSalesGraph(accountantId, month, year);
        
        res.status(200).json({
            success: true,
            salesGraph
        });
    } catch (error) {
        console.error("Error fetching sales graph:", error);
        res.status(500).json({ success: false, error: "Failed to fetch sales graph" });
    }
};

export const getStaffGraph = async (req, res) => {
    console.log("sfkljsdkfdsiorweuoriwurioweuroirweurioiwerio777777777777777");
    
    try {
        const { month, year } = req.query;
        const accountantId = req.user.id;
        console.log("sdjfklsflksfjklsflkkskfdsjkf",month,year);
        

        // Get staff data for last 4 months
        const staffGraph = await storage.getAccountantStaffGraph(accountantId, month, year);
        
        res.status(200).json({
            success: true,
            staffGraph
        });
    } catch (error) {
        console.error("Error fetching staff graph:", error);
        res.status(500).json({ success: false, error: "Failed to fetch staff graph" });
    }
};

export const getFloorAttendance = async (req, res) => {
    try {
        const { month, year } = req.query;
        const accountantId = req.user.id;

        // Get floor attendance data
        const floorAttendance = await storage.getAccountantFloorAttendance(month, year);
        
        res.status(200).json({
            success: true,
            floorAttendance
        });
    } catch (error) {
        console.error("Error fetching floor attendance:", error);
        res.status(500).json({ success: false, error: "Failed to fetch floor attendance" });
    }
};

export const getFloors = async (req, res) => {
    try {
        const floors = await storage.getFloors();
        console.log("Controller - Floors:", floors);
        
        res.status(200).json({
            success: true,
            floors
        });
    } catch (error) {
        console.error("Error fetching floors:", error);
        res.status(500).json({ success: false, error: "Failed to fetch floors" });
    }
};

export const downloadFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const accountantId = req.user.id;

        // Get the file info from database
        const file = await storage.getUploadById(fileId);
        
        if (!file) {
            return res.status(404).json({ success: false, error: "File not found" });
        }

        // Check if file belongs to this accountant
        if (file.uploadedBy_id !== accountantId) {
            return res.status(403).json({ success: false, error: "Access denied" });
        }

        // Construct file path
        const filePath = path.join(process.cwd(), "public", "uploads", file.path);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: "File not found on disk" });
        }

        // Set appropriate headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('Error streaming file:', error);
            res.status(500).json({ success: false, error: "Error downloading file" });
        });

    } catch (error) {
        console.error("Download error:", error);
        res.status(500).json({ success: false, error: "Failed to download file" });
    }
};

export const uploadData = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const upload = await storage.upload(req.file, req.user.id);
    const ext = req.file.originalname.split(".").pop()?.toLowerCase();
    let rows = [];

    try {
        // --- Parse file ---
        if (ext === "csv") {
            const data = [];
            await new Promise((resolve, reject) => {
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on("data", (row) => data.push(row))
                    .on("end", () => resolve())
                    .on("error", reject);
            });
            rows = data;
        } else if (ext === "xlsx" || ext === "xls") {
            const workbook = XLSX.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
            return res.status(400).json({ message: "Unsupported file type" });
        }

        if (rows.length === 0)
            return res.status(400).json({ message: "File is empty" });

        // --- Format sales by staff ---
        const formatted = [];
        let currentStaff = null;

        for (const row of rows) {
            const nameCell = row["CENTURY FASHION CITY"];

            // Staff row - matches format like "0 [ANY NAME] [ID]"
            if (
                typeof nameCell === "string" &&
                nameCell.match(/\d+\s+.+\[\d+\]/)
            ) {
                // Extract name and ID from format "0 [ANY NAME] [ID]"
                const match = nameCell.match(/\d+\s+(.+)\[(\d+)\]/);
                if (match) {
                    const staffName = match[1].trim(); // Any staff name
                    const staffId = match[2]; // Any staff ID
                    
                    console.log(`Processing staff: "${staffName}" with ID: ${staffId}`);
                    
                    let staffUser = await storage.findUser(staffId);

                    // Only process existing staff, skip if staff doesn't exist
                    if (!staffUser) {
                        console.log(`Staff with ID ${staffId} not found, skipping...`);
                        continue;
                    } else {
                        console.log(`Found existing staff: "${staffName}" with ID: ${staffId}`);
                    }

                    currentStaff = {
                        staffName: staffName,
                        staffCode: parseInt(staffId, 10),
                        sales: [],
                        staffId: staffUser,
                        upload,
                        uploadId: upload.id,
                    };
                    formatted.push(currentStaff);
                }
            }
            // Sales row
            else if (currentStaff && nameCell && /^[A-Z]+$/.test(nameCell)) {
                currentStaff.sales.push({
                    category: nameCell,
                    stotal: row.__EMPTY || 0,
                    rettot: row.__EMPTY_1 || 0,
                    total: row.__EMPTY_2 || 0,
                    qty: row.__EMPTY_3 || 0,
                    pvalue: row.__EMPTY_4 || 0,
                    profit: row.__EMPTY_5 || 0,
                    per: row.__EMPTY_6 || 0,
                });
            }
        }

        const allCategories = formatted.flatMap((f) =>
            f.sales.map((s) => s.category)
        );
        const uniqueCategories = [...new Set(allCategories)];

        const weights = {};
        uniqueCategories.forEach((cat, index) => {
            weights[cat] = index + 1;
        });

        // --- Add weight + points ---
        for (const staff of formatted) {
            for (const sale of staff.sales) {
                const weight = weights[sale.category] || 1;
                const points = (sale.per / 100) * weight;

                sale.weight = weight;
                sale.points = points;
            }
        }

        await storage.addSales(formatted, weights);

        res.json({ success: true, count: formatted.length, data: formatted });
    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ message: "Failed to process file" });
    } finally {
        if (req.file?.path && fs.existsSync(req.file.path))
            fs.unlinkSync(req.file.path);
    }
};

export const getMe = async (req, res) => {
    try {
        const me = await storage.getAccountantMe(req.user.id);
        console.log(me, "sfsdfhsdlfjl");

        res.status(200).json({
            success: true,
            me,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const editProfile = async (req, res) => {
    console.log(req.body, "sdfjdlkfjlk");

    try {
        const editedData = await storage.superVisorEditUser(
            req.user.id,
            req.body
        );
        res.status(200).json({
            success: true,
            editedData,
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const updatePin = async (req, res) => {
    try {
        let {  newPin } = req.body;
        newPin = await hashPassword(newPin);
        await storage.staffChangePin(req.user.id, newPin);
        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const logoutAccountant = async (req, res) => {
    try {
        // Clear all sessions for this user
        await storage.logoutSupervisor(req.user.id);
        
        // Clear cookies
        res.cookie("accesstoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
        res.cookie("refreshtoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
        
        res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getData = async (req, res) => {
    try {
        const { selectedType } = req.query;
        const files = await storage.getMonthlyData(selectedType);
        res.status(200).json({ success: true, files });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const loadMoreData = async (req, res) => {
    try {
        const { selectedType } = req.query;
        const files = await storage.getMonthlyData(selectedType);
        res.status(200).json({ success: true, files });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const staffList = async (req, res) => {
    const name = req.query.search;
    try {
        const staff = await storage.getStafByName(name);
        res.status(200).json({ success: true, staff });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const addAttendence = async (req, res) => {
    try {
        const { month, attendanceList } = req.body;
        await storage.addAttendance(month,attendanceList,req.user.id)
         res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getDetails=async(req,res)=>{
    try {
        const {month,year}=req.query;

        const value=await storage.getAccountantDetails(req.user.id,month,year)
        console.log(value,"sdfjdslkfjlk");
        
        res.status(200).json({ success: true,value });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
}
export const getScore=async(req,res)=>{
   try{ 
        const {month,year}=req.query
        const value=await storage.getScore(req.user.id,month,year)
        console.log(value,"sdfdsf4dsfdsfs");
        
        res.status(200).json({ success: true,value });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
}