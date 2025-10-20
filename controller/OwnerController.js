import { hashPassword } from "../utils/Password.js";
import { storage } from "../utils/storage.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import pkg from "pdfkit-table";
const { table } = pkg;

export const scoreKpi = async (req, res) => {
    try {
        const kpis = await storage.getScoreKpi();

        res.status(200).json({ success: true, kpis });
    } catch (error) {
        console.error("Error fetching KPIs:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const getKPIs = async (req, res) => {
    try {
        const kpis = await storage.getKPIs();
        console.log(kpis);

        res.status(200).json({ success: true, kpis });
    } catch (error) {
        console.error("Error fetching KPIs:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const addKpi = async (req, res) => {
    try {
        const value = req.body;

        const newKpi = await storage.addKpi(value);
        res.status(201).json({ success: true, newKpi });
    } catch (error) {
        console.error("Error adding KPI:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const addUser = async (req, res) => {
    try {
        const value = req.body;

        const find = await storage.getUser(value.mobile);

        if (find) {
            return res.status(400).json({
                success: false,
                message: "Mobile number already exists",
            });
        }

        value.pin_hash = "";
        const floor = await storage.addFloors(value.floor);
        value.floor = { connect: { id: floor[0].id } };

        const idFind = await storage.findId(value.uniqueId);
        if (idFind) {
            res.status(409).json({
                success: false,
                error: "ID already exist",
            });
        }

        const newUser = await storage.addUser(value);
        console.log(newUser, "sfsd;jf");

        const users = await storage.getFullUsers();
        const total = users.length;
        const activeUsers = await storage.getActiveUsersCount();
        const inactiveUsers = await storage.getInactiveUserCount();
        const deletedUsers = await storage.getDeletedUsersCount();

        res.status(201).json({
            success: true,
            message: "User added successfully",
            users: newUser,
            totalUsers: total,
            activeUsers: activeUsers,
            inactiveUsers: inactiveUsers,
            deletedUsers: deletedUsers,
        });
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const dltKpi = async (req, res) => {
    try {
        const id = req.params.id;
        const dltKpi = await storage.dltKpi(id);
        res.status(200).json({ success: true, dltKpi });
    } catch (error) {
        console.error("Error deleting KPI:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const dltUsers = async (req, res) => {
    try {
        const id = req.params.id;
        await storage.dltUser(id);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getUsers = async (req, res) => {
    try {
        const users = await storage.getFullUsers();
        const total = users.length;
        const activeUsers = await storage.getActiveUsersCount();
        const inactiveUsers = await storage.getInactiveUserCount();
        const deletedUsers = await storage.getDeletedUsersCount();

        res.status(200).json({
            success: true,
            totalUsers: total,
            activeUsers,
            inactiveUsers,
            deletedUsers,
            users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;

        data.id = id;
        const floor = await storage.addFloors(data.floor);
        data.floor = { connect: { id: floor[0].id } };
        const user = await storage.updateUser(data);

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user,
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const updateKpi = async (req, res) => {
    try {
        const data = req.body;
        data.id = req.params.id;
        console.log(data, "sdfdsfjdsklfksdj");

        const kpi = await storage.updateKpi(data);
        res.status(200).json({ success: true, kpi });
    } catch (error) {
        console.error("Error updating KPI:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("sdfklsdjfkldsfjklsjflkdsf");

        const user = await storage.getUserById(userId);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        console.log(user);

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const getDetails = async (req, res) => {
    try {
        const details = await storage.getDetails();
        const recentKPIs = details.recentKPIs;
        const recentUsers = details.recentUsers;
        const pendingRequests = details.pendingRequests;
        const totalUsers = details.totalUsers;
        const leavesThisMonth = details.leavesThisMonth;
        const totalKPIs = details.totalKPIs;
        const totalFloors = details.totalFloors;

        res.status(200).json({
            success: true,
            recentKPIs,
            recentUsers,
            pendingRequests,
            totalUsers,
            leavesThisMonth,
            totalKPIs,
            totalFloors,
        });
    } catch (error) {
        console.error("Error fetching details:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const updateStatus = async (req, res) => {
    const { id, active_flag } = req.body;
    try {
        const statusChnage = await storage.changeStatus(id, active_flag);
        console.log(statusChnage, "statusChnage");

        res.status(200).json({ success: true, statusChnage });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(501).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const updateMe = async (req, res) => {
    try {
        const floor = await storage.addFloors(req.body.floor);
        let value = { connect: { id: floor[0].id } };
        req.body.floor = value;
        const updateMe = await storage.updataMe(req.user.id, req.body);

        res.status(200).json({ success: true, updateMe });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(501).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const toggleKpi = async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    try {
        const toggleKpi = await storage.toggleKpi(id, status);
        res.status(200).json({ success: true, toggleKpi });
    } catch (error) {
        console.error("Error toggling KPI:", error);
        res.status(501).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const updatePin = async (req, res) => {
    try {
        const pin = await hashPassword(req.body.pin);
        await storage.updatePin(req.user.id, pin);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error toggling KPI:", error);
        res.status(501).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const logout = async (req, res) => {
    try {
        await storage.logoutSupervisor(req.user.id);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error toggling KPI:", error);
        res.status(501).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getScoreEmployee = async (req, res) => {
    try {
        const staffs = await storage.getEmployee(req.user.id);
        console.log(staffs, "sfskldfjksdlfj");

        res.status(200).json({ success: true, usersRes: staffs });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const addEmployeeScore = async (req, res) => {
    try {
        const { scores, staffId } = req.body;
        const id = req.user.id;
        console.log("1  body", req.body);

        const s = await storage.addScore(scores, staffId, id);
        console.log("2  storage returned", s); // ← add this

        console.log("3  about to send 200");
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("4  FINAL catch", error.message, error.stack);
        return res
            .status(500)
            .json({ success: false, error: "Internal Server Error" });
    }
};

export const getEditScore = async (req, res) => {
    try {
        const staffId = req.params.id;
        const kpis = await storage.getEmployeeScore(staffId);
        console.log(kpis, "sdfkksdfjkljn");

        return res.status(200).json({ success: true, kpis });
    } catch (error) {
        console.error("4  FINAL catch", error.message, error.stack);
        return res
            .status(500)
            .json({ success: false, error: "Internal Server Error" });
    }
};
export const updateScore = async (req, res) => {
    try {
        const staffId = req.params.id;
        const kpis = await storage.updateScoreEmployee(staffId, req.body);
        console.log(kpis, "sdfkksdfjkljn");

        return res.status(200).json({ success: true, kpis });
    } catch (error) {
        console.error("4  FINAL catch", error.message, error.stack);
        return res
            .status(500)
            .json({ success: false, error: "Internal Server Error" });
    }
};

export const staffReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        console.log("Staff Report Request - Start:", start, "End:", end);

        // Validate date parameters if provided
        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: "Invalid date format. Please provide dates in YYYY-MM-DD format",
                });
            }

            if (startDate > endDate) {
                return res.status(400).json({
                    success: false,
                    error: "Start date cannot be greater than end date",
                });
            }
        }

        // Get staff report data
        console.log("Calling storage.getStaffReport...");
        const staffReportData = await storage.getStaffReport(start, end);
        console.log("Staff Report Data:", staffReportData);

        // Calculate summary statistics
        const totalStaff = staffReportData.length;
        const avgScore =
            totalStaff > 0
                ? Math.round(
                      staffReportData.reduce(
                          (sum, staff) => sum + staff.avgScore,
                          0
                      ) / totalStaff
                  )
                : 0;

        console.log("Summary:", { totalStaff, avgScore });

        return res.status(200).json({
            success: true,
            staffReport: staffReportData,
            summary: {
                totalStaff,
                avgScore,
            },
        });
    } catch (error) {
        console.error("Staff report error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate staff report. Please try again later.",
        });
    }
};



export const exportStaffReport = async (req, res) => {
    try {
        const { start, end, format } = req.query;
        const staffReport = await storage.getStaffReport(start, end);

        // 1. NEVER return 404 JSON – always send a file
        if (!staffReport || staffReport.length === 0) {
            if (format === "excel") {
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet("Staff Report");
                sheet.columns = [
                    { header: "ID", key: "staffId", width: 15 },
                    { header: "Name", key: "name", width: 25 },
                    { header: "Mobile", key: "mobile", width: 15 },
                    { header: "Role", key: "role", width: 20 },
                    { header: "Section", key: "section", width: 15 },
                    { header: "Floor", key: "floor", width: 10 },
                    { header: "Avg Score", key: "avgScore", width: 10 },
                ];
                res.setHeader(
                    "Content-Disposition",
                    'attachment; filename="Staff-Report.xlsx"'
                );
                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                await workbook.xlsx.write(res);
                return res.end();
            }
            if (format === "pdf") {
                const doc = new PDFDocument({ margin: 30, size: "A4" });
                res.setHeader(
                    "Content-Disposition",
                    'attachment; filename="Staff-Report.pdf"'
                );
                res.setHeader("Content-Type", "application/pdf");
                doc.pipe(res);
                doc.fontSize(20).text("Staff Report", { align: "center" });
                doc.fontSize(12).text("No data for the selected period.");
                doc.end();
                return;
            }
        }

        // 2. Normal case – data exists
        if (format === "excel") {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Staff Report");
            sheet.columns = [
                { header: "ID", key: "staffId", width: 15 },
                { header: "Name", key: "name", width: 25 },
                { header: "Mobile", key: "mobile", width: 15 },
                { header: "Role", key: "role", width: 20 },
                { header: "Section", key: "section", width: 15 },
                { header: "Floor", key: "floor", width: 10 },
                { header: "Avg Score", key: "avgScore", width: 10 },
            ];
            staffReport.forEach((s) => sheet.addRow(s));
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="Staff-Report.xlsx"'
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            await workbook.xlsx.write(res);
            return res.end();
        }
        if (format === "pdf") {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader(
        "Content-Disposition",
        'attachment; filename="Staff-Report.pdf"'
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Main heading
    doc.fontSize(24)
       .font("Helvetica-Bold")
       .text("Staff Report", { align: "center" })
       .moveDown(0.5);

    // Date range
    doc.fontSize(12)
       .text(`From ${start || "N/A"} to ${end || "N/A"}`, { align: "center" })
       .moveDown(1);

    // If no data
    if (!staffReport || staffReport.length === 0) {
        doc.fontSize(12).text("No data for the selected period.", { align: "center" });
        doc.end();
        return;
    }

    /* ---------- Table Setup ---------- */
    const headers = ["No", "Name", "ID", "Mobile", "Role", "Section", "Floor", "Avg Score"];
    const colW = [30, 100, 60, 80, 80, 60, 50, 70];
    const startX = 30;
    let y = doc.y + 20;

    const drawRow = (data, bold = false, isHeader = false) => {
    const h = 18;
    let x = startX;

    /* ----- grey background for header ----- */
    if (isHeader) {
        doc.rect(startX, y, colW.reduce((a, b) => a + b, 0), h)
           .fill('#d9d9d9');          // grey bg
    }

    data.forEach((txt, i) => {
        /* cell border */
        doc.lineWidth(0.5).strokeColor('#aaaaaa').rect(x, y, colW[i], h).stroke();

        /* text: always black */
        doc.fillColor('black')
           .font(bold ? 'Helvetica-Bold' : 'Helvetica')
           .fontSize(9)
           .text(txt, x + 2, y + 4, { width: colW[i] - 4, align: 'center' });

        x += colW[i];
    });

    y += h;
};

    // Draw table header with red text
    drawRow(headers, true, true);

    // Draw table body
    staffReport.forEach((s, idx) => {
        drawRow([
            idx + 1,
            s.name,
            s.staffId,
            s.mobile,
            s.role,
            s.section || "-",
            s.floor || "-",
            s.avgScore ?? "-",
        ]);

        // Add new page if needed
        if (y > 700) {
            doc.addPage();
            y = 50;
        }
    });

    doc.end();
    return;
}

        return res
            .status(400)
            .json({ success: false, error: "Invalid format" });
    } catch (err) {
        console.log("Export request received:", req.query);

        console.error("Export error:", err);
        res.status(500).json({
            success: false,
            error: "Failed to export report",
        });
    }
};
