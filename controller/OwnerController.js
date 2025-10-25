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

        // Hash the PIN provided by owner
        if (value.pin) {
            value.pin_hash = await hashPassword(value.pin);
        } else {
            return res.status(400).json({
                success: false,
                message: "PIN is required",
            });
        }
        
        const floor = await storage.addFloors(value.floor);
        value.floor = { connect: { id: floor[0].id } };

        const idFind = await storage.findId(value.uniqueId);
        if (idFind) {
            res.status(409).json({
                success: false,
                error: "ID already exist",
            });
        }

        // Remove pin from value before creating user
        delete value.pin;
        
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
        
        // Handle PIN change - only update if new PIN is provided
        if (data.pin && data.pin.trim() !== "") {
            data.pin_hash = await hashPassword(data.pin);
        }
        // Remove pin from data to avoid storing plain text
        delete data.pin;
        
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
     console.log("sdfklsdjfkldsfjklsjflkdsf");
    try {
        const userId = req.user.id;
       

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
        
        const totalUsers = details.totalUsers;
        const totalKPIs = details.totalKPIs;
        const totalFloors = details.totalFloors;

        res.status(200).json({
            success: true,
            totalUsers,
            totalKPIs,
            totalFloors,
            totalWalkouts: details.totalWalkouts,
        });
    } catch (error) {
        console.error("Error fetching details:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getWalkouts = async (req, res) => {
    console.log("fsdfjsdkfjsklj");
    
    try {

        const walkouts = await storage.getWalkoutsOwner();
        console.log(walkouts, "statusChnage");

        res.status(200).json({ success: true, walkouts });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(501).json({
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
        console.log("Logging out user:", req.user.id);
        await storage.logoutSupervisor(req.user.id);
        res.cookie("accesstoken", "", {
            maxAge: 0,
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        res.cookie("refreshtoken", "", {
            maxAge: 0,
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Error:", error);
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
                .text(`From ${start || "N/A"} to ${end || "N/A"}`, {
                    align: "center",
                })
                .moveDown(1);

            // If no data
            if (!staffReport || staffReport.length === 0) {
                doc.fontSize(12).text("No data for the selected period.", {
                    align: "center",
                });
                doc.end();
                return;
            }

            /* ---------- Table Setup ---------- */
            const headers = [
                "No",
                "Name",
                "ID",
                "Mobile",
                "Role",
                "Section",
                "Floor",
                "Avg Score",
            ];
            const colW = [30, 100, 60, 80, 80, 60, 50, 70];
            const startX = 30;
            let y = doc.y + 20;

            const drawRow = (data, bold = false, isHeader = false) => {
                const h = 18;
                let x = startX;

                /* ----- grey background for header ----- */
                if (isHeader) {
                    doc.rect(
                        startX,
                        y,
                        colW.reduce((a, b) => a + b, 0),
                        h
                    ).fill("#d9d9d9");
                }

                data.forEach((txt, i) => {
                    /* cell border */
                    doc.lineWidth(0.5)
                        .strokeColor("#aaaaaa")
                        .rect(x, y, colW[i], h)
                        .stroke();

                    /* text: always black */
                    doc.fillColor("black")
                        .font(bold ? "Helvetica-Bold" : "Helvetica")
                        .fontSize(9)
                        .text(txt, x + 2, y + 4, {
                            width: colW[i] - 4,
                            align: "center",
                        });

                    x += colW[i];
                });

                y += h;
            };

            // Draw table header
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
    } catch (error) {
        console.error("Export staff report error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to export staff report",
        });
    }
};

export const salesReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const { list, summary } = await storage.getSalesReport(month, year);
        return res.status(200).json({ success: true, sales: list, summary });
    } catch (error) {
        console.error("Sales report error:", error);
        return res
            .status(500)
            .json({ success: false, error: "Failed to generate sales report" });
    }
};
export const exportSalesReport = async (req, res) => {
    try {
        const { month, year, format } = req.query;
        const { list, summary } = await storage.getSalesReport(month, year);

        if (format === "excel") {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Sales Report");
            sheet.columns = [
                { header: "Staff ID", key: "staffId", width: 15 },
                { header: "Name", key: "staffName", width: 25 },
                { header: "Qty Sold", key: "qtySold", width: 10 },
                { header: "Sales Amount", key: "salesAmount", width: 15 },
                { header: "Prod Value", key: "prodValue", width: 15 },
                { header: "Profit", key: "profit", width: 12 },
                { header: "Points", key: "points", width: 10 },
            ];
            list.forEach((row) => sheet.addRow(row));
            sheet.addRow({});
            sheet.addRow({
                staffName: "Totals",
                qtySold: summary.totalQty,
                salesAmount: summary.totalSales,
                profit: summary.totalProfit,
                points: summary.totalPoints,
            });

            res.setHeader(
                "Content-Disposition",
                'attachment; filename="Sales-Report.xlsx"'
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            await workbook.xlsx.write(res);
            return res.end();
        }

        if (format === "pdf") {
            const doc = new PDFDocument({ margin: 40, size: "A4" });
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="Sales-Report.pdf"'
            );
            res.setHeader("Content-Type", "application/pdf");
            doc.pipe(res);

            doc.fontSize(20)
                .text("Sales Report", { align: "center" })
                .moveDown(0.5);
            const title = [];
            if (year) title.push(year);
            if (month) title.push(`M${month}`);
            if (title.length)
                doc.fontSize(12)
                    .text(title.join(" - "), { align: "center" })
                    .moveDown(1);

            const headers = [
                "No",
                "Staff ID",
                "Name",
                "Qty",
                "Sales",
                "Profit",
                "Points",
            ];
            const colW = [30, 70, 120, 50, 80, 60, 60];
            const startX = 40;
            let y = doc.y + 10;

            const drawRow = (data, bold = false, isHeader = false) => {
                const h = 18;
                let x = startX;
                if (isHeader) {
                    doc.rect(
                        startX,
                        y,
                        colW.reduce((a, b) => a + b, 0),
                        h
                    ).fill("#d9d9d9");
                }
                data.forEach((txt, i) => {
                    doc.lineWidth(0.5)
                        .strokeColor("#aaaaaa")
                        .rect(x, y, colW[i], h)
                        .stroke();
                    doc.fillColor("black")
                        .font(bold ? "Helvetica-Bold" : "Helvetica")
                        .fontSize(9)
                        .text(String(txt ?? ""), x + 2, y + 4, {
                            width: colW[i] - 4,
                            align: "center",
                        });
                    x += colW[i];
                });
                y += h;
            };

            drawRow(headers, true, true);
            list.forEach((row, idx) => {
                drawRow([
                    idx + 1,
                    row.staffId,
                    row.staffName,
                    row.qtySold,
                    row.salesAmount,
                    row.profit,
                    row.points,
                ]);
                if (y > 720) {
                    doc.addPage();
                    y = 50;
                }
            });

            // totals
            drawRow(
                [
                    "",
                    "",
                    "Totals",
                    summary.totalQty,
                    summary.totalSales,
                    summary.totalProfit,
                    summary.totalPoints,
                ],
                true
            );

            doc.end();
            return;
        }

        return res
            .status(400)
            .json({ success: false, error: "Invalid format" });
    } catch (error) {
        console.error("Export sales error:", error);
        return res
            .status(500)
            .json({ success: false, error: "Failed to export sales report" });
    }
};

export const attendanceReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const { attendance, summary } = await storage.getAttendanceReport(
            month,
            year
        );
        return res.status(200).json({ success: true, attendance, summary });
    } catch (error) {
        console.error("Attendance report error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate attendance report",
        });
    }
};

export const walkoutReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const { walkouts, summary } = await storage.getWalkoutReport(
            month,
            year
        );
        return res.status(200).json({ success: true, walkouts, summary });
    } catch (error) {
        console.error("Walkout report error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate walkout report",
        });
    }
};

export const exportAttendanceReport = async (req, res) => {
    try {
        const { month, year, format } = req.query;
        const { attendance, summary } = await storage.getAttendanceReport(
            month,
            year
        );

        if (format === "excel") {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Attendance Report");
            sheet.columns = [
                { header: "Staff ID", key: "staffId", width: 15 },
                { header: "Name", key: "staffName", width: 25 },
                { header: "Date", key: "date", width: 15 },
                { header: "Full Days", key: "fullDays", width: 12 },
                { header: "Half Days", key: "halfDays", width: 12 },
                { header: "Leave Count", key: "leaveCount", width: 12 },
                { header: "Total Days", key: "totalDays", width: 12 },
            ];
            attendance.forEach((row) =>
                sheet.addRow({
                    staffId: row.staff?.uniqueId || "",
                    staffName: row.staff?.name || "",
                    date: new Date(row.date).toLocaleDateString(),
                    fullDays: row.fullDays,
                    halfDays: row.halfDays,
                    leaveCount: row.leaveCount,
                    totalDays: row.totalDays,
                })
            );

            res.setHeader(
                "Content-Disposition",
                'attachment; filename="Attendance-Report.xlsx"'
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            await workbook.xlsx.write(res);
            return res.end();
        }

        if (format === "pdf") {
            const doc = new PDFDocument({ margin: 40, size: "A4" });
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="Attendance-Report.pdf"'
            );
            res.setHeader("Content-Type", "application/pdf");
            doc.pipe(res);

            doc.fontSize(20)
                .text("Attendance Report", { align: "center" })
                .moveDown(0.5);
            const title = [];
            if (year) title.push(year);
            if (month) title.push(`M${month}`);
            if (title.length)
                doc.fontSize(12)
                    .text(title.join(" - "), { align: "center" })
                    .moveDown(1);

            const headers = [
                "No",
                "Staff ID",
                "Name",
                "Date",
                "Full Days",
                "Half Days",
                "Leaves",
                "Total",
            ];
            const colW = [30, 70, 100, 80, 60, 60, 60, 60];
            const startX = 40;
            let y = doc.y + 10;

            const drawRow = (data, bold = false, isHeader = false) => {
                const h = 18;
                let x = startX;
                if (isHeader) {
                    doc.rect(
                        startX,
                        y,
                        colW.reduce((a, b) => a + b, 0),
                        h
                    ).fill("#d9d9d9");
                }
                data.forEach((txt, i) => {
                    doc.lineWidth(0.5)
                        .strokeColor("#aaaaaa")
                        .rect(x, y, colW[i], h)
                        .stroke();
                    doc.fillColor("black")
                        .font(bold ? "Helvetica-Bold" : "Helvetica")
                        .fontSize(9)
                        .text(String(txt ?? ""), x + 2, y + 4, {
                            width: colW[i] - 4,
                            align: "center",
                        });
                    x += colW[i];
                });
                y += h;
            };

            drawRow(headers, true, true);
            attendance.forEach((row, idx) => {
                drawRow([
                    idx + 1,
                    row.staff?.uniqueId || "",
                    row.staff?.name || "",
                    new Date(row.date).toLocaleDateString(),
                    row.fullDays,
                    row.halfDays,
                    row.leaveCount,
                    row.totalDays,
                ]);
                if (y > 720) {
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
    } catch (error) {
        console.error("Export attendance error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to export attendance report",
        });
    }
};

export const exportWalkoutReport = async (req, res) => {
    try {
        const { month, year, format } = req.query;
        const { walkouts, summary } = await storage.getWalkoutReport(
            month,
            year
        );

        if (format === "excel") {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Walkout Report");
            sheet.columns = [
                { header: "Staff ID", key: "staffId", width: 15 },
                { header: "Staff Name", key: "staffName", width: 25 },
                { header: "Item", key: "itemName", width: 20 },
                { header: "Type", key: "type", width: 15 },
                { header: "Priority", key: "priority", width: 12 },
                { header: "Description", key: "description", width: 30 },
                { header: "Date", key: "date", width: 15 },
                { header: "Submitted By", key: "submittedBy", width: 20 },
            ];
            walkouts.forEach((row) =>
                sheet.addRow({
                    staffId: row.staff?.uniqueId || "",
                    staffName: row.staff?.name || "",
                    itemName: row.itemName?.name || "",
                    type: row.type?.name || "",
                    priority: row.priority,
                    description: row.description,
                    date: new Date(row.created_at).toLocaleDateString(),
                    submittedBy: row.submittedBy?.name || "",
                })
            );

            res.setHeader(
                "Content-Disposition",
                'attachment; filename="Walkout-Report.xlsx"'
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            await workbook.xlsx.write(res);
            return res.end();
        }

        if (format === "pdf") {
            const doc = new PDFDocument({ margin: 40, size: "A4" });
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="Walkout-Report.pdf"'
            );
            res.setHeader("Content-Type", "application/pdf");
            doc.pipe(res);

            doc.fontSize(20)
                .text("Walkout Report", { align: "center" })
                .moveDown(0.5);
            const title = [];
            if (year) title.push(year);
            if (month) title.push(`M${month}`);
            if (title.length)
                doc.fontSize(12)
                    .text(title.join(" - "), { align: "center" })
                    .moveDown(1);

            const headers = [
                "No",
                "Staff",
                "Item",
                "Type",
                "Priority",
                "Date",
                "Submitted By",
            ];
            const colW = [30, 100, 80, 60, 60, 80, 100];
            const startX = 40;
            let y = doc.y + 10;

            const drawRow = (data, bold = false, isHeader = false) => {
                const h = 18;
                let x = startX;
                if (isHeader) {
                    doc.rect(
                        startX,
                        y,
                        colW.reduce((a, b) => a + b, 0),
                        h
                    ).fill("#d9d9d9");
                }
                data.forEach((txt, i) => {
                    doc.lineWidth(0.5)
                        .strokeColor("#aaaaaa")
                        .rect(x, y, colW[i], h)
                        .stroke();
                    doc.fillColor("black")
                        .font(bold ? "Helvetica-Bold" : "Helvetica")
                        .fontSize(9)
                        .text(String(txt ?? ""), x + 2, y + 4, {
                            width: colW[i] - 4,
                            align: "center",
                        });
                    x += colW[i];
                });
                y += h;
            };

            drawRow(headers, true, true);
            walkouts.forEach((row, idx) => {
                drawRow([
                    idx + 1,
                    row.staff?.name || "",
                    row.itemName?.name || "",
                    row.type?.name || "",
                    row.priority,
                    new Date(row.created_at).toLocaleDateString(),
                    row.submittedBy?.name || "",
                ]);
                if (y > 720) {
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
    } catch (error) {
        console.error("Export walkout error:", error);
        return res
            .status(500)
            .json({ success: false, error: "Failed to export walkout report" });
    }
};

// Dashboard Graph Data Controllers
export const getDashboardGraphData = async (req, res) => {
    try {
        const { type, months } = req.query;
        const graphData = await storage.getDashboardGraphData(
            type,
            months ? parseInt(months) : 4
        );
        return res.status(200).json({ success: true, data: graphData });
    } catch (error) {
        console.error("Dashboard graph data error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch dashboard graph data",
        });
    }
};

export const getFloorPerformanceData = async (req, res) => {
    try {
        const floorData = await storage.getFloorPerformanceData();
        return res.status(200).json({ success: true, data: floorData });
    } catch (error) {
        console.error("Floor performance data error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch floor performance data",
        });
    }
};

export const checkIdExists = async (req, res) => {
    try {
        const { uniqueId } = req.query;
        
        if (!uniqueId) {
            return res.status(400).json({
                success: false,
                message: "Unique ID is required",
            });
        }

        const existingUser = await storage.findId(uniqueId);
        
        return res.status(200).json({
            success: true,
            exists: !!existingUser,
            message: existingUser ? "ID already exists" : "ID is available"
        });
    } catch (error) {
        console.error("Check ID exists error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to check ID",
        });
    }
};

export const getFloorAttendanceData = async (req, res) => {
    try {
        const data = await storage.getFloorAttendanceData();
        res.status(200).json({ data });
    } catch (error) {
        console.error("Error fetching floor attendance data:", error);
        res.status(500).json({ message: "Error fetching floor attendance data" });
    }
};

export const getFloors = async (req, res) => {
    try {
        const floors = await storage.getFloors();
        res.status(200).json({ floors });
    } catch (error) {
        console.error("Error fetching floors:", error);
        res.status(500).json({ message: "Error fetching floors" });
    }
};

// Owner Walkout Management
export const getWalkoutsOwner = async (req, res) => {
    try {
        const walkouts = await storage.getWalkoutsOwner();
        res.status(200).json({ walkouts });
    } catch (error) {
        console.error("Error fetching walkouts:", error);
        res.status(500).json({ message: "Error fetching walkouts" });
    }
};

export const addWalkout = async (req, res) => {
    try {
        const walkout = await storage.addWalkout(req.body, req.user.id);
        res.status(201).json({ success: true, walkout });
    } catch (error) {
        console.error("Error adding walkout:", error);
        res.status(500).json({ message: "Error adding walkout" });
    }
};

export const editWalkout = async (req, res) => {
    try {
        const { id } = req.params;
        const walkout = await storage.editWalkout(req.body, id, req.user.id);
        res.status(200).json({ success: true, edited: walkout });
    } catch (error) {
        console.error("Error editing walkout:", error);
        res.status(500).json({ message: "Error editing walkout" });
    }
};

export const deleteWalkout = async (req, res) => {
    try {
        const { id } = req.params;
        await storage.deleteWalkout(parseInt(id));
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error deleting walkout:", error);
        res.status(500).json({ message: "Error deleting walkout" });
    }
};

export const exportWalkouts = async (req, res) => {
    try {
        const { type } = req.query;
        const walkoutData = await storage.walkoutExport(type);
        res.status(200).json({ walkoutData });
    } catch (error) {
        console.error("Error exporting walkouts:", error);
        res.status(500).json({ message: "Error exporting walkouts" });
    }
};

export const getItemName = async (req, res) => {
    try {
        const { query } = req.query;
        const items = await storage.fetchItem(query);
        res.status(200).json({ items });
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Error fetching items" });
    }
};

export const getItemType = async (req, res) => {
    try {
        const { query } = req.query;
        const types = await storage.fetchType(query);
        res.status(200).json({ types });
    } catch (error) {
        console.error("Error fetching types:", error);
        res.status(500).json({ message: "Error fetching types" });
    }
};

export const searchStaff = async (req, res) => {
    try {
        const { query } = req.query;
        console.log(query,"sdkflsdjkfjdsfjdkslfjsk");
        
        const staffs = await storage.searchStaffByName( query);
        console.log(staffs,"dsjfklsjslkf");
        
        res.status(200).json({ staffs });
    } catch (error) {
        console.error("Error searching staff:", error);
        res.status(500).json({ message: "Error searching staff" });
    }
};
