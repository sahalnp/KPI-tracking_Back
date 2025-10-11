import { comparePassword, hashPassword } from "../utils/Password.js";
import { storage } from "../utils/storage.js";
import fs from "fs";
import csv from "csv-parser";
import XLSX from "xlsx";

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

            // Staff row
            if (
                typeof nameCell === "string" &&
                nameCell.match(/\d+\s+.+\[\d+\]/)
            ) {
                const match = nameCell.match(/(.+)\[(\d+)\]/);
                const staffId = await storage.findUser(match[2], 10);

                currentStaff = {
                    staffName: match[1].trim(),
                    staffCode: parseInt(match[2], 10),
                    sales: [],
                    staffId,
                    upload,
                    uploadId: upload.id,
                };
                formatted.push(currentStaff);
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
        await storage.logoutSupervisor(req.user.id);
        res.status(200).json({ success: true });
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
        const {month,year}=req.query
        const value=await storage.AccountantDetails(req.user.id,month,year)
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