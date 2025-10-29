import { hashPassword } from "../utils/Password.js";
import { storage } from "../utils/storage.js";
import ExcelJS from "exceljs";
import PDFDocument from 'pdfkit-table';




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
        const kpis = await storage.updateScoreEmployee(req.user.id,staffId, req.body);
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
        const { start, end, month, year } = req.query;
        console.log("Staff Report Request - Start:", start, "End:", end, "Month:", month, "Year:", year);

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
        const staffReportData = await storage.getStaffReport(start, end, month, year);
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

// New function to get staff report grouped by month
export const staffReportByMonth = async (req, res) => {
    try {
        const { start, end, month, year } = req.query;
        console.log("Staff Report By Month Request - Start:", start, "End:", end, "Month:", month, "Year:", year);

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

        // Get staff report data grouped by month
        console.log("Calling storage.getStaffReportByMonth...");
        const staffReportByMonthData = await storage.getStaffReportByMonth(start, end, month, year);
        console.log("Staff Report By Month Data:", staffReportByMonthData);

        // Calculate summary statistics for each month
        const monthSummaries = {};
        Object.keys(staffReportByMonthData).forEach(monthName => {
            const monthStaff = staffReportByMonthData[monthName];
            const totalStaff = monthStaff.length;
            const avgScore = totalStaff > 0 
                ? Math.round(monthStaff.reduce((sum, staff) => sum + staff.avgScore, 0) / totalStaff)
                : 0;
            
            monthSummaries[monthName] = {
                totalStaff,
                avgScore
            };
        });

        console.log("Month Summaries:", monthSummaries);

        return res.status(200).json({
            success: true,
            staffReportByMonth: staffReportByMonthData,
            monthSummaries,
        });
    } catch (error) {
        console.error("Staff report by month error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate staff report by month. Please try again later.",
        });
    }
};

export const exportStaffReport = async (req, res) => {
    try {
        const { start, end, format, month, year } = req.query;
        const staffReport = await storage.getStaffReport(start, end, month, year);

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
    console.log();
    
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
        console.log("🔍 getFloorAttendanceData called");
        const data = await storage.getFloorAttendanceData();
        console.log("📊 Returning attendance data:", data);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Error fetching floor attendance data:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching floor attendance data" 
        });
    }
};

export const getFloors = async (req, res) => {
    try {
        console.log("🔍 getFloors called");
        const floors = await storage.getFloors();
        console.log("📊 Returning floors:", floors);
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

export const exportStaffKPIDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { format, period, start, end, month, year } = req.query;
        
        // Export request - no logging needed

        // Get comprehensive data for all months if month is "all" or undefined (default to all months)
        let allMonthsData = null;
        let staffInfo = null;
        let attendanceData = null;
        let salesData = null;

        if (month === "all" || month === undefined) {
            // Fetch all months data
            allMonthsData = await storage.getAllMonthsStaffKPIDetailsById(id, year);
            attendanceData = await storage.getAllMonthsStaffAttendanceReportById(id, year);
            salesData = await storage.getAllMonthsStaffSalesReportById(id, year);
            
            // Debug sales data
            console.log("🔍 EXPORT DEBUG - salesData type:", typeof salesData);
            console.log("🔍 EXPORT DEBUG - salesData keys:", salesData ? Object.keys(salesData) : "null");
            
            // Log sales data being sent to PDF/Excel
            console.log("📊 SALES DATA SENT TO PDF/EXCEL:");
            console.log("Year Code | Total Quantity Sold | Total Sales Amount | Total Production Value | Total Profit | Total Percentage (%) | Total Points");
            
            // Aggregate sales data from all months
            const aggregatedSalesData = {};
            if (salesData) {
              Object.keys(salesData).forEach(monthName => {
                const monthData = salesData[monthName];
                if (monthData && monthData.salesByYearCode && Array.isArray(monthData.salesByYearCode)) {
                  monthData.salesByYearCode.forEach(item => {
                    const yearCode = item.yearCode || "N/A";
                    if (!aggregatedSalesData[yearCode]) {
                      aggregatedSalesData[yearCode] = {
                        qtySold: 0,
                        salesAmount: 0,
                        prodValue: 0,
                        profit: 0,
                        percentage: 0,
                        points: 0,
                        count: 0
                      };
                    }
                    
                    aggregatedSalesData[yearCode].qtySold += parseFloat(item.totals?.qtySold || 0);
                    aggregatedSalesData[yearCode].salesAmount += parseFloat(item.totals?.salesAmount || 0);
                    aggregatedSalesData[yearCode].prodValue += parseFloat(item.totals?.prodValue || 0);
                    aggregatedSalesData[yearCode].profit += parseFloat(item.totals?.profit || 0);
                    aggregatedSalesData[yearCode].percentage += parseFloat(item.totals?.per || 0);
                    aggregatedSalesData[yearCode].points += parseFloat(item.totals?.points || 0);
                    aggregatedSalesData[yearCode].count += 1;
                  });
                }
              });
              
              // Display aggregated totals
              Object.keys(aggregatedSalesData).forEach(yearCode => {
                const totals = aggregatedSalesData[yearCode];
                const avgPercentage = totals.count > 0 ? (totals.percentage / totals.count) : 0;
                console.log(`${yearCode} | ${totals.qtySold} | ₹${totals.salesAmount.toFixed(2)} | ₹${totals.prodValue.toFixed(2)} | ₹${totals.profit.toFixed(2)} | ${avgPercentage.toFixed(2)}% | ${totals.points.toFixed(2)}`);
              });
              
              if (Object.keys(aggregatedSalesData).length === 0) {
                console.log("No sales data available");
              }
            } else {
              console.log("No sales data available");
            }
            
            // Get staff info from any available month
            if (allMonthsData && Object.keys(allMonthsData).length > 0) {
                const firstMonth = Object.keys(allMonthsData)[0];
                staffInfo = allMonthsData[firstMonth]?.staff;
            }
        } else {
            // Fetch single month data
            const monthlyData = await storage.getStaffKPIDetailsById(id, start, end, month, year);
            const weeklyData = await storage.getStaffWeeklyKPIDetailsById(id, start, end, month, year);
            const dailyData = await storage.getStaffDailyKPIDetailsById(id, start, end, month, year);
            attendanceData = await storage.getStaffAttendanceReportById(id, start, end, month, year);
            salesData = await storage.getStaffSalesReportById(id, start, end, month, year);
            
            // Debug sales data
            console.log("🔍 EXPORT DEBUG - salesData type:", typeof salesData);
            console.log("🔍 EXPORT DEBUG - salesData keys:", salesData ? Object.keys(salesData) : "null");
            console.log("🔍 EXPORT DEBUG - salesData:", JSON.stringify(salesData, null, 2));
            
            // Log sales data being sent to PDF/Excel
            console.log("📊 SALES DATA SENT TO PDF/EXCEL:");
            console.log("Year Code | Total Quantity Sold | Total Sales Amount | Total Production Value | Total Profit | Total Percentage (%) | Total Points");
            
            if (salesData && salesData.salesByYearCode && Array.isArray(salesData.salesByYearCode)) {
              salesData.salesByYearCode.forEach(item => {
                console.log(`${item.yearCode || "N/A"} | ${item.totals?.qtySold || 0} | ₹${parseFloat(item.totals?.salesAmount || 0).toFixed(2)} | ₹${parseFloat(item.totals?.prodValue || 0).toFixed(2)} | ₹${parseFloat(item.totals?.profit || 0).toFixed(2)} | ${parseFloat(item.totals?.per || 0).toFixed(2)}% | ${parseFloat(item.totals?.points || 0).toFixed(2)}`);
              });
            } else if (salesData && Array.isArray(salesData)) {
              salesData.forEach(item => {
                console.log(`${item.yearCode || item.itemName || "N/A"} | ${item.quantitySold || item.qtySold || 0} | ₹${parseFloat(item.salesAmount || item.sales || 0).toFixed(2)} | ₹${parseFloat(item.productionValue || item.prodValue || 0).toFixed(2)} | ₹${parseFloat(item.profit || 0).toFixed(2)} | ${parseFloat(item.percentage || 0).toFixed(2)}% | ${parseFloat(item.points || 0).toFixed(2)}`);
              });
            } else {
              console.log("No sales data available");
            }
            
            staffInfo = monthlyData?.staff;
            allMonthsData = {
                monthly: monthlyData,
                weekly: weeklyData,
                daily: dailyData
            };
        }

        if (!staffInfo) {
            return res.status(404).json({ 
                success: false, 
                error: "Staff not found" 
            });
        }

        // Determine if this is an "all months" export
        const isAllMonths = month === "all" || month === undefined;
        const monthParam = isAllMonths ? "all" : month;
        
        // Export request - no logging needed

        if (format === "excel") {
            return await exportStaffKPIDetailsExcel(res, staffInfo, allMonthsData, attendanceData, salesData, monthParam, req);
        } else if (format === "pdf") {
            return await exportStaffKPIDetailsPDF(res, staffInfo, allMonthsData, attendanceData, salesData, monthParam, req);
        } else {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid format. Use 'pdf' or 'excel'" 
            });
        }
    } catch (error) {
        console.error("Error exporting staff KPI details:", error);
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false, 
                error: "Failed to export staff KPI details" 
            });
        }
    }
};

// Excel export function for staff KPI details
export const exportStaffKPIDetailsExcel = async (res, staffInfo, allMonthsData, attendanceData, salesData, month, req) => {
    try {
        // Excel export - no debug logging needed
        
        const workbook = new ExcelJS.Workbook();
        
        // ===== Staff Information Sheet =====
        const staffSheet = workbook.addWorksheet('Staff Information');
        
        // Add main heading
        staffSheet.mergeCells('A1:H1');
        staffSheet.getCell('A1').value = "Staff Report";
        staffSheet.getCell('A1').font = { size: 16, bold: true };
        staffSheet.getCell('A1').alignment = { horizontal: 'center' };
        
        // Add date range
        const { start, end } = req.query || {};
        let dateRange = "Current Period";
        
        // Date range calculation - no debug logging needed
        
        if (start && end) {
            const startDate = new Date(start).toLocaleDateString('en-GB');
            const endDate = new Date(end).toLocaleDateString('en-GB');
            dateRange = `${startDate} - ${endDate}`;
        } else if (month === "all") {
            // For all months, show the actual data range based on year
            const year = req.query.year || new Date().getFullYear();
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            
            if (parseInt(year) === currentYear) {
                // Current year - show from January 1st to current month end
                const startOfYear = new Date(year, 0, 1).toLocaleDateString('en-GB');
                const endOfCurrentMonth = new Date(year, currentMonth + 1, 0).toLocaleDateString('en-GB');
                dateRange = `${startOfYear} - ${endOfCurrentMonth}`;
            } else {
                // Past years - show full year range
                const startOfYear = new Date(year, 0, 1).toLocaleDateString('en-GB');
                const endOfYear = new Date(year, 11, 31).toLocaleDateString('en-GB');
                dateRange = `${startOfYear} - ${endOfYear}`;
            }
        } else if (month) {
            const monthNames = ["January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December"];
            const monthName = monthNames[parseInt(month)] || "Unknown";
            const year = req.query.year || new Date().getFullYear();
            const monthIndex = parseInt(month);
            const startOfMonth = new Date(year, monthIndex, 1).toLocaleDateString('en-GB');
            const endOfMonth = new Date(year, monthIndex + 1, 0).toLocaleDateString('en-GB');
            dateRange = `${startOfMonth} - ${endOfMonth}`;
        }
        
        // Fallback: If we still have "Current Period", try to calculate a proper range
        if (dateRange === "Current Period") {
            const year = req.query.year || new Date().getFullYear();
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth();
            
            if (parseInt(year) === currentYear) {
                // Current year - show from January 1st to current month end
                const startOfYear = new Date(year, 0, 1).toLocaleDateString('en-GB');
                const endOfCurrentMonth = new Date(year, currentMonth + 1, 0).toLocaleDateString('en-GB');
                dateRange = `${startOfYear} - ${endOfCurrentMonth}`;
            } else {
                // Past years - show full year range
                const startOfYear = new Date(year, 0, 1).toLocaleDateString('en-GB');
                const endOfYear = new Date(year, 11, 31).toLocaleDateString('en-GB');
                dateRange = `${startOfYear} - ${endOfYear}`;
            }
        }
        
        staffSheet.mergeCells('A2:H2');
        staffSheet.getCell('A2').value = dateRange;
        staffSheet.getCell('A2').font = { size: 12 };
        staffSheet.getCell('A2').alignment = { horizontal: 'center' };
        
        // Add staff information table headers
        const staffHeaders = ["No", "Staff ID", "Name", "Mobile", "Role", "Section", "Floor", "Avg Score"];
        staffSheet.getRow(4).values = staffHeaders;
        staffSheet.getRow(4).font = { bold: true };
        staffSheet.getRow(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }
        };
        
        // Calculate real avg score for Excel
        let avgScore = 0;
        if (month === "all") {
          // For all months, try to get the overall average
          if (allMonthsData._averages?.monthlySummary?.avgScore) {
            avgScore = allMonthsData._averages.monthlySummary.avgScore;
          } else if (allMonthsData._averages?.monthlySummary?.totalScore) {
            avgScore = allMonthsData._averages.monthlySummary.totalScore;
          } else {
            // Calculate from individual months
            const monthOrder = ["January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December"];
            let totalScore = 0;
            let monthCount = 0;
            
            monthOrder.forEach(monthName => {
              if (allMonthsData[monthName]?.monthlySummary?.avgScore) {
                totalScore += allMonthsData[monthName].monthlySummary.avgScore;
                monthCount++;
              }
            });
            
            if (monthCount > 0) {
              avgScore = totalScore / monthCount;
            }
          }
        } else {
          // For single month
          if (allMonthsData.monthly?.monthlySummary?.avgScore) {
            avgScore = allMonthsData.monthly.monthlySummary.avgScore;
          } else if (allMonthsData.monthly?.monthlySummary?.totalScore) {
            avgScore = allMonthsData.monthly.monthlySummary.totalScore;
          }
        }

        // Calculate attendance and sales data for Excel using the passed parameters
        let attendanceSummary = {
          totalDays: 0,
          totalDaysInMonth: 0,
          totalFullDays: 0,
          totalHalfDays: 0,
          totalLeaves: 0,
          percentage: 0
        };

        let salesSummary = {
          profit: 0,
          points: 0,
          percentage: 0
        };

        // Use the attendanceData parameter that's passed to the function
        if (attendanceData) {
          if (month === "all") {
            // For all months, aggregate attendance data
            let totalDays = 0;
            let totalDaysInMonth = 0;
            let totalFullDays = 0;
            let totalHalfDays = 0;
            let totalLeaves = 0;

            // Check for overallSummary first (this is the structure from your first log)
            if (attendanceData.overallSummary) {
              const summary = attendanceData.overallSummary;
              totalDays = summary.totalPresentDays || 0;
              totalFullDays = summary.totalFullDays || 0;
              totalHalfDays = summary.totalHalfDays || 0;
              totalLeaves = summary.totalLeaves || 0;
              totalDaysInMonth = summary.totalDaysInAllMonths || 0;
            } else if (Array.isArray(attendanceData)) {
              attendanceData.forEach(entry => {
                totalDays += entry.totalDays || 0;
                totalFullDays += entry.fullDays || 0;
                totalHalfDays += entry.halfDays || 0;
                totalLeaves += entry.leaveCount || entry.leaves || 0;
                
                // Calculate days in month for each entry
                if (entry.date) {
                  const date = new Date(entry.date);
                  const year = date.getFullYear();
                  const monthIndex = date.getMonth();
                  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                  totalDaysInMonth += daysInMonth;
                }
              });
            } else if (attendanceData.summary) {
              // If attendanceData has a summary object
              const summary = attendanceData.summary;
              totalDays = summary.totalDays || 0;
              totalFullDays = summary.totalFullDays || 0;
              totalHalfDays = summary.totalHalfDays || 0;
              totalLeaves = summary.totalLeaves || 0;
              totalDaysInMonth = summary.totalDaysInMonth || 0;
            } else if (attendanceData.totalFullDays !== undefined) {
              // Direct object format - use the values directly
              totalDays = parseFloat(attendanceData.presentDays) || 0;
              totalFullDays = attendanceData.totalFullDays || 0;
              totalHalfDays = attendanceData.totalHalfDays || 0;
              totalLeaves = attendanceData.totalLeaves || 0;
              totalDaysInMonth = attendanceData.totalDaysInMonth || 0;
            }

            const calculatedPercentage = totalDaysInMonth > 0 ? ((totalFullDays + 0.5 * totalHalfDays) / totalDaysInMonth * 100) : 0;

            attendanceSummary = {
              totalDays,
              totalDaysInMonth: totalDaysInMonth || 365, // Fallback to 365 if not calculated
              totalFullDays,
              totalHalfDays,
              totalLeaves,
              percentage: calculatedPercentage
            };
            
            // Attendance calculation - no logging needed
          } else {
            // For single month, use the attendance data directly
            if (Array.isArray(attendanceData) && attendanceData.length > 0) {
              const entry = attendanceData[0]; // Take first entry for single month
              const year = req.query.year || new Date().getFullYear();
              const monthIndex = parseInt(month);
              const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
              
              attendanceSummary = {
                totalDays: entry.totalDays || 0,
                totalDaysInMonth: daysInMonth,
                totalFullDays: entry.fullDays || 0,
                totalHalfDays: entry.halfDays || 0,
                totalLeaves: entry.leaveCount || entry.leaves || 0,
                percentage: daysInMonth > 0 ? (((entry.fullDays || 0) + 0.5 * (entry.halfDays || 0)) / daysInMonth * 100) : 0
              };
            } else if (attendanceData.summary) {
              const summary = attendanceData.summary;
              const year = req.query.year || new Date().getFullYear();
              const monthIndex = parseInt(month);
              const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
              
              attendanceSummary = {
                totalDays: summary.totalDays || 0,
                totalDaysInMonth: daysInMonth,
                totalFullDays: summary.totalFullDays || 0,
                totalHalfDays: summary.totalHalfDays || 0,
                totalLeaves: summary.totalLeaves || 0,
                percentage: daysInMonth > 0 ? (((summary.totalFullDays || 0) + 0.5 * (summary.totalHalfDays || 0)) / daysInMonth * 100) : 0
              };
            }
          }
        }

        // Use the salesData parameter for sales summary
        if (salesData) {
          if (month === "all") {
            // For all months, aggregate sales data by year code
            let totalProfit = 0;
            let totalPoints = 0;
            let totalPercentage = 0;
            let itemCount = 0;

            if (Array.isArray(salesData)) {
              salesData.forEach(item => {
                totalProfit += item.profit || 0;
                totalPoints += item.points || 0;
                if (item.percentage !== undefined) {
                  totalPercentage += item.percentage;
                  itemCount++;
                }
              });
            } else if (salesData.salesByYearCode && Array.isArray(salesData.salesByYearCode)) {
              salesData.salesByYearCode.forEach(yearCodeData => {
                if (yearCodeData.totals) {
                  totalProfit += parseFloat(yearCodeData.totals.profit) || 0;
                  totalPoints += parseFloat(yearCodeData.totals.points) || 0;
                  if (yearCodeData.totals.per !== undefined) {
                    totalPercentage += parseFloat(yearCodeData.totals.per) || 0;
                    itemCount++;
                  }
                }
              });
            }

            salesSummary = {
              profit: totalProfit,
              points: totalPoints,
              percentage: itemCount > 0 ? (totalPercentage / itemCount) : 0
            };
            
           
            // Calculate totals by year code from all months data
            const yearCodeTotals = {};
            
            if (salesData && salesData.salesByYearCode && Array.isArray(salesData.salesByYearCode)) {
              // Process salesByYearCode format
              salesData.salesByYearCode.forEach(item => {
                const yearCode = item.yearCode || "N/A";
                if (!yearCodeTotals[yearCode]) {
                  yearCodeTotals[yearCode] = {
                    qtySold: 0,
                    salesAmount: 0,
                    prodValue: 0,
                    profit: 0,
                    percentage: 0,
                    points: 0,
                    count: 0
                  };
                }
                
                yearCodeTotals[yearCode].qtySold += parseFloat(item.totals?.qtySold || 0);
                yearCodeTotals[yearCode].salesAmount += parseFloat(item.totals?.salesAmount || 0);
                yearCodeTotals[yearCode].prodValue += parseFloat(item.totals?.prodValue || 0);
                yearCodeTotals[yearCode].profit += parseFloat(item.totals?.profit || 0);
                yearCodeTotals[yearCode].percentage += parseFloat(item.totals?.per || 0);
                yearCodeTotals[yearCode].points += parseFloat(item.totals?.points || 0);
                yearCodeTotals[yearCode].count += 1;
              });
            } else if (salesData && Array.isArray(salesData)) {
              // Process array format
              salesData.forEach(item => {
                const yearCode = item.yearCode || item.itemName || "N/A";
                if (!yearCodeTotals[yearCode]) {
                  yearCodeTotals[yearCode] = {
                    qtySold: 0,
                    salesAmount: 0,
                    prodValue: 0,
                    profit: 0,
                    percentage: 0,
                    points: 0,
                    count: 0
                  };
                }
                
                yearCodeTotals[yearCode].qtySold += parseFloat(item.quantitySold || item.qtySold || 0);
                yearCodeTotals[yearCode].salesAmount += parseFloat(item.salesAmount || item.sales || 0);
                yearCodeTotals[yearCode].prodValue += parseFloat(item.productionValue || item.prodValue || 0);
                yearCodeTotals[yearCode].profit += parseFloat(item.profit || 0);
                yearCodeTotals[yearCode].percentage += parseFloat(item.percentage || 0);
                yearCodeTotals[yearCode].points += parseFloat(item.points || 0);
                yearCodeTotals[yearCode].count += 1;
              });
            }
            
            // Display calculated totals
            Object.keys(yearCodeTotals).forEach(yearCode => {
              const totals = yearCodeTotals[yearCode];
              const avgPercentage = totals.count > 0 ? (totals.percentage / totals.count) : 0;
              console.log(`  ${yearCode} | ${totals.qtySold} | ₹${totals.salesAmount.toFixed(2)} | ₹${totals.prodValue.toFixed(2)} | ₹${totals.profit.toFixed(2)} | ${avgPercentage.toFixed(2)}% | ${totals.points.toFixed(2)}`);
            });
          } else {
            // For single month, use the sales data directly
            if (Array.isArray(salesData) && salesData.length > 0) {
              let totalProfit = 0;
              let totalPoints = 0;
              let totalPercentage = 0;
              let itemCount = 0;

              salesData.forEach(item => {
                totalProfit += item.profit || 0;
                totalPoints += item.points || 0;
                if (item.percentage !== undefined) {
                  totalPercentage += item.percentage;
                  itemCount++;
                }
              });

              salesSummary = {
                profit: totalProfit,
                points: totalPoints,
                percentage: itemCount > 0 ? (totalPercentage / itemCount) : 0
              };
            }
          }
        }

        // Add staff data
        const staffData = [
            1,
            staffInfo.staffId || "N/A",
            staffInfo.name || "N/A", 
            staffInfo.mobile || "N/A",
            staffInfo.role || "N/A",
            staffInfo.section || "N/A",
            typeof staffInfo?.floor === "string" ? staffInfo.floor : staffInfo?.floor?.name || "N/A",
            avgScore.toFixed(1)
        ];
        staffSheet.getRow(5).values = staffData;
        
        // Style the table
        staffSheet.getRow(4).eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        staffSheet.getRow(5).eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // ===== Monthly KPI Sheet =====
        const monthlySheet = workbook.addWorksheet("Monthly KPI");
        monthlySheet.getCell('A1').value = "Monthly KPI";
        monthlySheet.getCell('A1').font = { size: 16, bold: true };
        monthlySheet.getCell('A1').alignment = { horizontal: 'center' };
        
        // Add date range
        monthlySheet.mergeCells('A1:Z1'); // Use more columns for dynamic KPI headers
        monthlySheet.getCell('A2').value = dateRange;
        monthlySheet.getCell('A2').font = { size: 12 };
        monthlySheet.getCell('A2').alignment = { horizontal: 'center' };
        monthlySheet.mergeCells('A2:Z2');
        
        // Monthly KPI sheet - no debug logging needed
        
        let hasData = false;
        let allKPIs = new Set();
        let monthlyData = {};
        
        if (month === "all") {
            
            // Collect all KPIs and aggregate data across all months
            const monthOrder = ["January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December"];
            
            let aggregatedKPIData = {};
            
            monthOrder.forEach(monthName => {
                if (allMonthsData[monthName]?.monthlyKPIScores) {
                    Object.keys(allMonthsData[monthName].monthlyKPIScores).forEach(kpiName => {
                        allKPIs.add(kpiName);
                        
                        if (!aggregatedKPIData[kpiName]) {
                            aggregatedKPIData[kpiName] = {
                                weights: [],
                                avgPoints: [],
                                avgScores: []
                            };
                        }
                        
                        const kpiData = allMonthsData[monthName].monthlyKPIScores[kpiName];
                        aggregatedKPIData[kpiName].weights.push(kpiData.weight || 0);
                        aggregatedKPIData[kpiName].avgPoints.push(kpiData.avgPoints || 0);
                        aggregatedKPIData[kpiName].avgScores.push(kpiData.avgScore || 0);
                    });
                    hasData = true;
                }
            });
            
            // KPI data processed - no debug logging needed
            
            if (hasData) {
                // Calculate averages for each KPI
                const finalKPIData = {};
                Object.keys(aggregatedKPIData).forEach(kpiName => {
                    const kpiData = aggregatedKPIData[kpiName];
                    finalKPIData[kpiName] = {
                        weight: kpiData.weights.reduce((a, b) => a + b, 0) / kpiData.weights.length,
                        avgPoints: kpiData.avgPoints.reduce((a, b) => a + b, 0) / kpiData.avgPoints.length,
                        avgScore: kpiData.avgScores.reduce((a, b) => a + b, 0) / kpiData.avgScores.length
                    };
                });
                
                // Create headers: KPI Name | Weight | avg point | avg score
                const headers = ["KPI Name", "Weight", "avg point", "avg score"];
                
                monthlySheet.getRow(3).values = headers;
                monthlySheet.getRow(3).font = { bold: true };
                monthlySheet.getRow(3).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE5E7EB' }
                };
                
                // Add data rows
                let row = 4;
                        Array.from(allKPIs).forEach(kpiName => {
                    const kpiData = finalKPIData[kpiName];
                    monthlySheet.getRow(row).values = [
                        kpiName,
                        kpiData.weight.toFixed(2),
                        kpiData.avgPoints.toFixed(2),
                        kpiData.avgScore.toFixed(2)
                    ];
                        row++;
                });
            }
        } else {
            
            if (allMonthsData.monthly?.monthlyKPIScores && Object.keys(allMonthsData.monthly.monthlyKPIScores).length > 0) {
                // For single month, show KPIs as rows
                const headers = ["KPI Name", "Weight", "avg point", "avg score"];
                monthlySheet.getRow(3).values = headers;
                monthlySheet.getRow(3).font = { bold: true };
                monthlySheet.getRow(3).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE5E7EB' }
                };
                
                let row = 4;
                Object.entries(allMonthsData.monthly.monthlyKPIScores).forEach(([kpiName, kpiData]) => {
                    monthlySheet.getRow(row).values = [
                        kpiName,
                        kpiData.weight || 0,
                        kpiData.avgPoints || 0,
                        kpiData.avgScore || 0
                    ];
                    row++;
                    hasData = true;
                });
            }
        }
        
        // If no data, show "No data available"
        if (!hasData) {
            monthlySheet.getRow(4).values = ["No data available", "", "", ""];
        }
        
        // ===== Weekly KPI Sheet =====
        const weeklySheet = workbook.addWorksheet("Weekly KPI");
        weeklySheet.getCell('A1').value = "Weekly KPI";
        weeklySheet.getCell('A1').font = { size: 16, bold: true };
        weeklySheet.getCell('A1').alignment = { horizontal: 'center' };
        
        // Add date range
        weeklySheet.mergeCells('A1:Z1'); // Use more columns for dynamic KPI headers
        weeklySheet.getCell('A2').value = dateRange;
        weeklySheet.getCell('A2').font = { size: 12 };
        weeklySheet.getCell('A2').alignment = { horizontal: 'center' };
        weeklySheet.mergeCells('A2:Z2');
        
        // Weekly KPI sheet - no debug logging needed
        
        let hasWeeklyData = false;
        let allWeeklyKPIs = new Set();
        let weeklyData = {};
        
        if (month === "all") {
            
            // Collect all unique KPIs and weekly data by week number across all months
            const monthOrder = ["January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December"];
            
            monthOrder.forEach(monthName => {
                if (allMonthsData[monthName]?.weeklyKPIScores) {
                    Object.entries(allMonthsData[monthName].weeklyKPIScores).forEach(([date, dayKPIs]) => {
                        // Group by week number (1-4)
                        const dateObj = new Date(date);
                        const weekNum = Math.ceil(dateObj.getDate() / 7);
                        const weekKey = `Week ${weekNum}`;
                        
                        if (!weeklyData[weekKey]) {
                            weeklyData[weekKey] = {};
                        }
                        
                        Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
                            allWeeklyKPIs.add(kpiName);
                            if (!weeklyData[weekKey][kpiName]) {
                                weeklyData[weekKey][kpiName] = {
                                    weights: [],
                                    points: [],
                                    scores: []
                                };
                            }
                            weeklyData[weekKey][kpiName].weights.push(kpiData.weight || 0);
                            weeklyData[weekKey][kpiName].points.push(kpiData.avgPoints || 0);
                            weeklyData[weekKey][kpiName].scores.push(kpiData.avgScore || 0);
                        });
                    });
                    hasWeeklyData = true;
                }
            });
            
            // Calculate averages for each week across all months
            Object.keys(weeklyData).forEach(weekKey => {
                Object.keys(weeklyData[weekKey]).forEach(kpiName => {
                    const kpiData = weeklyData[weekKey][kpiName];
                    weeklyData[weekKey][kpiName] = {
                        weight: kpiData.weights.reduce((a, b) => a + b, 0) / kpiData.weights.length,
                        avgPoints: kpiData.points.reduce((a, b) => a + b, 0) / kpiData.points.length,
                        avgScore: kpiData.scores.reduce((a, b) => a + b, 0) / kpiData.scores.length
                    };
                });
            });
            
            // Weekly KPI data processed - no debug logging needed
            
            if (hasWeeklyData) {
                // Create headers: Week | KPI1(weight) | avg point | avg score | KPI2(weight) | ...
                const headers = ["Week"];
                Array.from(allWeeklyKPIs).forEach(kpiName => {
                    headers.push(`${kpiName}(weight)`);
                    headers.push("avg point");
                    headers.push("avg score");
                });
                
                weeklySheet.getRow(3).values = headers;
                weeklySheet.getRow(3).font = { bold: true };
                weeklySheet.getRow(3).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE5E7EB' }
                };
                
                // Add data rows - sort weeks by number
                let row = 4;
                Object.keys(weeklyData).sort((a, b) => {
                    const weekA = parseInt(a.split(' ')[1]);
                    const weekB = parseInt(b.split(' ')[1]);
                    return weekA - weekB;
                }).forEach(weekKey => {
                    const rowData = [weekKey];
                    Array.from(allWeeklyKPIs).forEach(kpiName => {
                        const kpiData = weeklyData[weekKey][kpiName];
                        if (kpiData) {
                            rowData.push(kpiData.weight.toFixed(2));
                            rowData.push(kpiData.avgPoints.toFixed(2));
                            rowData.push(kpiData.avgScore.toFixed(2));
                        } else {
                            rowData.push("", "", "");
                        }
                    });
                    weeklySheet.getRow(row).values = rowData;
                    row++;
                });
            }
        } else {
            
            if (allMonthsData.weekly?.weeklyKPIScores && Object.keys(allMonthsData.weekly.weeklyKPIScores).length > 0) {
                // For single month, show weeks as rows
                const headers = ["Week", "KPI Name", "Weight", "avg point", "avg score"];
                weeklySheet.getRow(3).values = headers;
                weeklySheet.getRow(3).font = { bold: true };
                weeklySheet.getRow(3).fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE5E7EB' }
                };
                
                let row = 4;
                Object.entries(allMonthsData.weekly.weeklyKPIScores).forEach(([date, dayKPIs]) => {
                    // Calculate week number from date
                    const dateObj = new Date(date);
                    const weekNum = Math.ceil(dateObj.getDate() / 7);
                    const weekLabel = `Week ${weekNum}`;
                    
                    Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
                        weeklySheet.getRow(row).values = [
                            weekLabel,
                            kpiName,
                            kpiData.weight || 0,
                            kpiData.avgPoints || 0,
                            kpiData.avgScore || 0
                        ];
                        row++;
                        hasWeeklyData = true;
                    });
                });
            }
        }
        
        // If no data, show "No data available"
        if (!hasWeeklyData) {
            weeklySheet.getRow(4).values = ["No data available", "", "", "", ""];
        }
        
        // ===== Daily KPI Sheet =====
        const dailySheet = workbook.addWorksheet("Daily KPI");
        dailySheet.getCell('A1').value = "Daily KPI";
        dailySheet.getCell('A1').font = { size: 16, bold: true };
        dailySheet.getCell('A1').alignment = { horizontal: 'center' };
        
        // Add date range
        const dailyHeaders = month === "all" ? ["Month", "Date", "KPI Name", "Weight", "Points", "Score"] : ["Date", "KPI Name", "Weight", "Points", "Score"];
        dailySheet.mergeCells(`A1:${String.fromCharCode(64 + dailyHeaders.length)}1`);
        dailySheet.getCell('A2').value = dateRange;
        dailySheet.getCell('A2').font = { size: 12 };
        dailySheet.getCell('A2').alignment = { horizontal: 'center' };
        dailySheet.mergeCells(`A2:${String.fromCharCode(64 + dailyHeaders.length)}2`);
        
        // Daily KPI sheet - no debug logging needed
        
        // Update headers to show "avg point" and "avg score"
        const updatedDailyHeaders = month === "all" ? ["Month", "Date", "KPI Name", "Weight", "avg point", "avg score"] : ["Date", "KPI Name", "Weight", "avg point", "avg score"];
        dailySheet.getRow(3).values = updatedDailyHeaders;
        dailySheet.getRow(3).font = { bold: true };
        dailySheet.getRow(3).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }
        };
        
        let hasDailyData = false;
        let dailyRow = 4;
        
        if (month === "all") {
            
            if (allMonthsData.dailyMonthlyAggregatedData) {
                Object.entries(allMonthsData.dailyMonthlyAggregatedData).forEach(([monthName, monthData]) => {
                    if (monthData && Object.keys(monthData).length > 0) {
                        Object.entries(monthData).forEach(([date, dayKPIs]) => {
                            Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
                                dailySheet.getRow(dailyRow).values = [
                                    monthName,
                                    date,
                                    kpiName,
                                    kpiData.weight || 0,
                                    kpiData.avgPoints || 0,
                                    kpiData.avgScore || 0
                                ];
                                dailyRow++;
                                hasDailyData = true;
                            });
                        });
                    }
                });
            } else if (allMonthsData.daily?.dailyKPIScores && Object.keys(allMonthsData.daily.dailyKPIScores).length > 0) {
                Object.entries(allMonthsData.daily.dailyKPIScores).forEach(([date, dayKPIs]) => {
                    Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
                        dailySheet.getRow(dailyRow).values = [
                            date,
                            kpiName,
                            kpiData.weight || 0,
                            kpiData.avgPoints || 0,
                            kpiData.avgScore || 0
                        ];
                        dailyRow++;
                        hasDailyData = true;
                    });
                });
            } else {
                // Try to find data in any month
                Object.keys(allMonthsData).forEach(monthName => {
                    if (allMonthsData[monthName]?.dailyKPIScores && Object.keys(allMonthsData[monthName].dailyKPIScores).length > 0) {
                        Object.entries(allMonthsData[monthName].dailyKPIScores).forEach(([date, dayKPIs]) => {
                            Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
                                dailySheet.getRow(dailyRow).values = [
                                    monthName,
                                    date,
                                    kpiName,
                                    kpiData.weight || 0,
                                    kpiData.avgPoints || 0,
                                    kpiData.avgScore || 0
                                ];
                                dailyRow++;
                                hasDailyData = true;
                            });
                        });
                    }
                });
            }
        } else {
            
            if (allMonthsData.daily?.dailyKPIScores && Object.keys(allMonthsData.daily.dailyKPIScores).length > 0) {
                Object.entries(allMonthsData.daily.dailyKPIScores).forEach(([date, dayKPIs]) => {
                    Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
                        dailySheet.getRow(dailyRow).values = [
                            date,
                            kpiName,
                            kpiData.weight || 0,
                            kpiData.avgPoints || 0,
                            kpiData.avgScore || 0
                        ];
                        dailyRow++;
                        hasDailyData = true;
                    });
                });
            }
        }
        
        // If no data, show "No data available"
        if (!hasDailyData) {
            if (month === "all") {
                dailySheet.getRow(dailyRow).values = ["No data available", "", "", "", "", ""];
            } else {
                dailySheet.getRow(dailyRow).values = ["No data available", "", "", "", ""];
            }
        }

        // ===== Attendance Overview Sheet =====
        const attendanceSheet = workbook.addWorksheet('Attendance Overview');
        
        // Add main heading
        attendanceSheet.mergeCells('A1:F1');
        attendanceSheet.getCell('A1').value = "Attendance Overview";
        attendanceSheet.getCell('A1').font = { size: 16, bold: true };
        attendanceSheet.getCell('A1').alignment = { horizontal: 'center' };
        
        // Add date range
        attendanceSheet.mergeCells('A2:F2');
        attendanceSheet.getCell('A2').value = dateRange;
        attendanceSheet.getCell('A2').font = { size: 12 };
        attendanceSheet.getCell('A2').alignment = { horizontal: 'center' };
        
        // Add headers
        const attendanceHeaders = ["Total Working Days", "Total Days in all Month", "Total Full Day", "Total Half Day", "Total Leaves", "Total Percentage"];
        attendanceSheet.getRow(4).values = attendanceHeaders;
        attendanceSheet.getRow(4).font = { bold: true };
        attendanceSheet.getRow(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }
        };
        
        // Add data
        attendanceSheet.getRow(5).values = [
            attendanceSummary.totalDays,
            attendanceSummary.totalDaysInMonth,
            attendanceSummary.totalFullDays,
            attendanceSummary.totalHalfDays,
            attendanceSummary.totalLeaves,
            `${attendanceSummary.percentage.toFixed(2)}%`
        ];
        
        // Style the table
        attendanceSheet.getRow(4).eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        attendanceSheet.getRow(5).eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // ===== Sales Sheet =====
        const salesSheet = workbook.addWorksheet('Sales');
        
        // Add main heading
        salesSheet.mergeCells('A1:D1');
        salesSheet.getCell('A1').value = "Sales";
        salesSheet.getCell('A1').font = { size: 16, bold: true };
        salesSheet.getCell('A1').alignment = { horizontal: 'center' };
        
        // Add date range
        salesSheet.mergeCells('A2:D2');
        salesSheet.getCell('A2').value = dateRange;
        salesSheet.getCell('A2').font = { size: 12 };
        salesSheet.getCell('A2').alignment = { horizontal: 'center' };
        
        // Add headers
        const salesHeaders = ["Total Profit", "Total Points", "Total Percentage"];
        salesSheet.getRow(4).values = salesHeaders;
        salesSheet.getRow(4).font = { bold: true };
        salesSheet.getRow(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }
        };
        
        // Add data
        salesSheet.getRow(5).values = [
            `₹${salesSummary.profit.toFixed(2)}`,
            salesSummary.points,
            `${salesSummary.percentage.toFixed(2)}%`
        ];
        
        // Style the table
        salesSheet.getRow(4).eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        salesSheet.getRow(5).eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // ===== Sales Data Sheet =====
        const salesDataSheet = workbook.addWorksheet('Sales Data');
        
        // Add main heading
        salesDataSheet.mergeCells('A1:G1');
        salesDataSheet.getCell('A1').value = "Sales Data";
        salesDataSheet.getCell('A1').font = { size: 16, bold: true };
        salesDataSheet.getCell('A1').alignment = { horizontal: 'center' };
        
        // Add date range
        salesDataSheet.mergeCells('A2:G2');
        salesDataSheet.getCell('A2').value = dateRange;
        salesDataSheet.getCell('A2').font = { size: 12 };
        salesDataSheet.getCell('A2').alignment = { horizontal: 'center' };
        
        // Add headers
        const salesDataHeaders = ["Year Code", "Total Quantity Sold", "Total Sales Amount", "Total Production Value", "Total Profit", "Total Percentage (%)", "Total Points"];
        salesDataSheet.getRow(4).values = salesDataHeaders;
        salesDataSheet.getRow(4).font = { bold: true };
        salesDataSheet.getRow(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }
        };
        
        // Add data rows with calculated totals
        if (salesData) {
            // Calculate totals by year code from all months data
            const yearCodeTotals = {};
            
            if (month === "all") {
                // For all months, aggregate data from each month
                Object.keys(salesData).forEach(monthName => {
                    const monthData = salesData[monthName];
                    if (monthData && monthData.salesByYearCode && Array.isArray(monthData.salesByYearCode)) {
                        monthData.salesByYearCode.forEach(item => {
                            const yearCode = item.yearCode || "N/A";
                            if (!yearCodeTotals[yearCode]) {
                                yearCodeTotals[yearCode] = {
                                    qtySold: 0,
                                    salesAmount: 0,
                                    prodValue: 0,
                                    profit: 0,
                                    percentage: 0,
                                    points: 0,
                                    count: 0
                                };
                            }
                            
                            yearCodeTotals[yearCode].qtySold += parseFloat(item.totals?.qtySold || 0);
                            yearCodeTotals[yearCode].salesAmount += parseFloat(item.totals?.salesAmount || 0);
                            yearCodeTotals[yearCode].prodValue += parseFloat(item.totals?.prodValue || 0);
                            yearCodeTotals[yearCode].profit += parseFloat(item.totals?.profit || 0);
                            yearCodeTotals[yearCode].percentage += parseFloat(item.totals?.per || 0);
                            yearCodeTotals[yearCode].points += parseFloat(item.totals?.points || 0);
                            yearCodeTotals[yearCode].count += 1;
                        });
                    }
                });
            } else if (salesData.salesByYearCode && Array.isArray(salesData.salesByYearCode)) {
                // Process salesByYearCode format for single month
                salesData.salesByYearCode.forEach(item => {
                    const yearCode = item.yearCode || "N/A";
                    if (!yearCodeTotals[yearCode]) {
                        yearCodeTotals[yearCode] = {
                            qtySold: 0,
                            salesAmount: 0,
                            prodValue: 0,
                            profit: 0,
                            percentage: 0,
                            points: 0,
                            count: 0
                        };
                    }
                    
                    yearCodeTotals[yearCode].qtySold += parseFloat(item.totals?.qtySold || 0);
                    yearCodeTotals[yearCode].salesAmount += parseFloat(item.totals?.salesAmount || 0);
                    yearCodeTotals[yearCode].prodValue += parseFloat(item.totals?.prodValue || 0);
                    yearCodeTotals[yearCode].profit += parseFloat(item.totals?.profit || 0);
                    yearCodeTotals[yearCode].percentage += parseFloat(item.totals?.per || 0);
                    yearCodeTotals[yearCode].points += parseFloat(item.totals?.points || 0);
                    yearCodeTotals[yearCode].count += 1;
                });
            } else if (Array.isArray(salesData)) {
                // Process array format
            salesData.forEach(item => {
                    const yearCode = item.yearCode || item.itemName || "N/A";
                    if (!yearCodeTotals[yearCode]) {
                        yearCodeTotals[yearCode] = {
                            qtySold: 0,
                            salesAmount: 0,
                            prodValue: 0,
                            profit: 0,
                            percentage: 0,
                            points: 0,
                            count: 0
                        };
                    }
                    
                    yearCodeTotals[yearCode].qtySold += parseFloat(item.quantitySold || item.qtySold || 0);
                    yearCodeTotals[yearCode].salesAmount += parseFloat(item.salesAmount || item.sales || 0);
                    yearCodeTotals[yearCode].prodValue += parseFloat(item.productionValue || item.prodValue || 0);
                    yearCodeTotals[yearCode].profit += parseFloat(item.profit || 0);
                    yearCodeTotals[yearCode].percentage += parseFloat(item.percentage || 0);
                    yearCodeTotals[yearCode].points += parseFloat(item.points || 0);
                    yearCodeTotals[yearCode].count += 1;
                });
            }

            if (Object.keys(yearCodeTotals).length > 0) {
                let row = 5;
                Object.keys(yearCodeTotals).forEach(yearCode => {
                    const totals = yearCodeTotals[yearCode];
                    const avgPercentage = totals.count > 0 ? (totals.percentage / totals.count) : 0;
                    salesDataSheet.getRow(row).values = [
                        yearCode,
                        totals.qtySold,
                        `₹${totals.salesAmount.toFixed(2)}`,
                        `₹${totals.prodValue.toFixed(2)}`,
                        `₹${totals.profit.toFixed(2)}`,
                        `${avgPercentage.toFixed(2)}%`,
                        totals.points.toFixed(2)
                    ];
                    
                    // Apply borders to data row cells
                    salesDataSheet.getRow(row).eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                    
                row++;
            });
        } else {
                salesDataSheet.getRow(5).values = ["No sales data available"];
                salesDataSheet.mergeCells('A5:G5');
                salesDataSheet.getCell('A5').alignment = { horizontal: 'center' };
            }
        } else {
            salesDataSheet.getRow(5).values = ["No sales data available"];
            salesDataSheet.mergeCells('A5:G5');
            salesDataSheet.getCell('A5').alignment = { horizontal: 'center' };
        }
        
        // Style the table - header row
        salesDataSheet.getRow(4).eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
        
        // Set column widths
        salesDataSheet.columns = [
            { header: "Year Code", key: "yearCode", width: 15 },
            { header: "Total Quantity Sold", key: "totalQuantitySold", width: 18 },
            { header: "Total Sales Amount", key: "totalSalesAmount", width: 18 },
            { header: "Total Production Value", key: "totalProductionValue", width: 20 },
            { header: "Total Profit", key: "totalProfit", width: 15 },
            { header: "Total Percentage (%)", key: "totalPercentage", width: 18 },
            { header: "Total Points", key: "totalPoints", width: 12 }
        ];

        // ===== End of Report =====
        // No timestamp added to keep sheets clean

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Staff-KPI-${staffInfo.name}-${month === "all" ? "All-Months" : "Month-" + month}.xlsx"`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error creating Excel export:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to create Excel export" });
        }
    }
};

const exportStaffKPIDetailsPDF = async (
  res,
  staffInfo,
  allMonthsData,
  attendanceData,
  salesData,
  month,
  req
) => {
  try {
    // PDF export start - no logging needed
    
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Staff-KPI-${staffInfo.name}-${
        month === "all" ? "All-Months" : "Month-" + month
      }.pdf"`
    );

    doc.pipe(res);

    // Handle PDF generation errors gracefully
    doc.on("error", (err) => {
      console.error("PDF generation failed:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create PDF export" });
      }
    });

    // ===== Main Heading =====
    doc.fontSize(24).text("Staff Report", {
      align: "center",
    });
    doc.moveDown(0.5);

    // ===== Date Range =====
    const { start, end } = req.query || {};
    let dateRange = "Current Period";
    
    if (start && end) {
      const startDate = new Date(start).toLocaleDateString('en-GB');
      const endDate = new Date(end).toLocaleDateString('en-GB');
      dateRange = `${startDate} - ${endDate}`;
    } else if (month === "all") {
      // For all months, show the actual data range based on year
      const year = req.query.year || new Date().getFullYear();
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      if (parseInt(year) === currentYear) {
        // Current year - show from January 1st to current month end
        const startOfYear = new Date(year, 0, 1).toLocaleDateString('en-GB');
        const endOfCurrentMonth = new Date(year, currentMonth + 1, 0).toLocaleDateString('en-GB');
        dateRange = `${startOfYear} - ${endOfCurrentMonth}`;
      } else {
        // Past years - show full year range
        const startOfYear = new Date(year, 0, 1).toLocaleDateString('en-GB');
        const endOfYear = new Date(year, 11, 31).toLocaleDateString('en-GB');
        dateRange = `${startOfYear} - ${endOfYear}`;
      }
    } else if (month) {
      const monthNames = ["January", "February", "March", "April", "May", "June", 
                         "July", "August", "September", "October", "November", "December"];
      const monthName = monthNames[parseInt(month)] || "Unknown";
      const year = req.query.year || new Date().getFullYear();
      const monthIndex = parseInt(month);
      const startOfMonth = new Date(year, monthIndex, 1).toLocaleDateString('en-GB');
      const endOfMonth = new Date(year, monthIndex + 1, 0).toLocaleDateString('en-GB');
      dateRange = `${startOfMonth} - ${endOfMonth}`;
    }
    
    doc.fontSize(12).text(dateRange, {
      align: "center",
    });
    doc.moveDown(1);

    // ===== Staff Information Table =====
    doc.fontSize(16).text("Staff Information", { underline: true });
    doc.moveDown(0.5);

    // Calculate real avg score - try multiple sources
    let avgScore = 0;
    if (month === "all") {
      // For all months, try to get the overall average
      if (allMonthsData._averages?.monthlySummary?.avgScore) {
      avgScore = allMonthsData._averages.monthlySummary.avgScore;
      } else if (allMonthsData._averages?.monthlySummary?.totalScore) {
        avgScore = allMonthsData._averages.monthlySummary.totalScore;
      } else {
        // Calculate from individual months
        const monthOrder = ["January", "February", "March", "April", "May", "June",
                           "July", "August", "September", "October", "November", "December"];
        let totalScore = 0;
        let monthCount = 0;
        
        monthOrder.forEach(monthName => {
          if (allMonthsData[monthName]?.monthlySummary?.avgScore) {
            totalScore += allMonthsData[monthName].monthlySummary.avgScore;
            monthCount++;
          }
        });
        
        if (monthCount > 0) {
          avgScore = totalScore / monthCount;
        }
      }
    } else {
      // For single month
      if (allMonthsData.monthly?.monthlySummary?.avgScore) {
      avgScore = allMonthsData.monthly.monthlySummary.avgScore;
    } else if (allMonthsData.monthly?.monthlySummary?.totalScore) {
      avgScore = allMonthsData.monthly.monthlySummary.totalScore;
      }
    }

    // Calculate attendance and sales data using the passed parameters
    let attendanceSummary = {
      totalDays: 0,
      totalDaysInMonth: 0,
      totalFullDays: 0,
      totalHalfDays: 0,
      totalLeaves: 0,
      percentage: 0
    };

   

    // Use the attendanceData parameter that's passed to the function
    if (attendanceData) {
      if (month === "all") {
        // For all months, aggregate attendance data
        let totalDays = 0;
        let totalDaysInMonth = 0;
        let totalFullDays = 0;
        let totalHalfDays = 0;
        let totalLeaves = 0;

        // Check for overallSummary first (this is the structure from your first log)
        if (attendanceData.overallSummary) {
          
          const summary = attendanceData.overallSummary;
          totalDays = summary.totalPresentDays || 0;
          totalFullDays = summary.totalFullDays || 0
          totalHalfDays = summary.totalHalfDays || 0;
          totalLeaves = summary.totalLeaves || 0;
          totalDaysInMonth = summary.totalDaysInAllMonths || 0;
         
        } else if (Array.isArray(attendanceData)) {
          
          attendanceData.forEach((entry, index) => {
            totalDays += entry.totalDays || 0;
            totalFullDays += entry.fullDays || 0;
            totalHalfDays += entry.halfDays || 0;
            totalLeaves += entry.leaveCount || entry.leaves || 0;
            
            // Calculate days in month for each entry
            if (entry.date) {
              const date = new Date(entry.date);
              const year = date.getFullYear();
              const monthIndex = date.getMonth();
              const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
              totalDaysInMonth += daysInMonth;
            }
          });
        } else if (attendanceData.summary) {
          console.log("  - Processing summary format");
          // If attendanceData has a summary object
          const summary = attendanceData.summary;
          totalDays = summary.totalDays || 0;
          totalFullDays = summary.totalFullDays || 0;
          totalHalfDays = summary.totalHalfDays || 0;
          totalLeaves = summary.totalLeaves || 0;
          totalDaysInMonth = summary.totalDaysInMonth || 0;
        } else if (attendanceData.totalFullDays !== undefined) {
          console.log("  - Processing direct object format");
          // Direct object format - use the values directly
          totalDays = parseFloat(attendanceData.presentDays) || 0;
          totalFullDays = attendanceData.totalFullDays || 0;
          totalHalfDays = attendanceData.totalHalfDays || 0;
          totalLeaves = attendanceData.totalLeaves || 0;
          totalDaysInMonth = attendanceData.totalDaysInMonth || 0;
        } else {
          console.log("  - No valid data format found in attendanceData");
        }

        const calculatedPercentage = totalDaysInMonth > 0 ? ((totalFullDays + 0.5 * totalHalfDays) / totalDaysInMonth * 100) : 0;
        
        attendanceSummary = {
          totalDays,
          totalDaysInMonth: totalDaysInMonth || 365, // Fallback to 365 if not calculated
          totalFullDays,
          totalHalfDays,
          totalLeaves,
          percentage: calculatedPercentage
        };
        
        // Attendance calculation - no logging needed
      } else {
        // For single month, use the attendance data directly
        if (Array.isArray(attendanceData) && attendanceData.length > 0) {
          const entry = attendanceData[0]; // Take first entry for single month
          const year = req.query.year || new Date().getFullYear();
          const monthIndex = parseInt(month);
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
          
          attendanceSummary = {
            totalDays: entry.totalDays || 0,
            totalDaysInMonth: daysInMonth,
            totalFullDays: entry.fullDays || 0,
            totalHalfDays: entry.halfDays || 0,
            totalLeaves: entry.leaveCount || entry.leaves || 0,
            percentage: daysInMonth > 0 ? (((entry.fullDays || 0) + 0.5 * (entry.halfDays || 0)) / daysInMonth * 100) : 0
          };
        } else if (attendanceData.summary) {
          const summary = attendanceData.summary;
          const year = req.query.year || new Date().getFullYear();
          const monthIndex = parseInt(month);
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
          
          attendanceSummary = {
            totalDays: summary.totalDays || 0,
            totalDaysInMonth: daysInMonth,
            totalFullDays: summary.totalFullDays || 0,
            totalHalfDays: summary.totalHalfDays || 0,
            totalLeaves: summary.totalLeaves || 0,
            percentage: daysInMonth > 0 ? (((summary.totalFullDays || 0) + 0.5 * (summary.totalHalfDays || 0)) / daysInMonth * 100) : 0
          };
        }
      }
    }

    // Use the salesData parameter for sales summary
    if (salesData) {
      if (month === "all") {
        // For all months, aggregate sales data by year code
        let totalProfit = 0;
        let totalPoints = 0;
        let totalPercentage = 0;
        let itemCount = 0;
        
        if (Array.isArray(salesData)) {
          salesData.forEach((item, index) => {
            totalProfit += item.profit || 0;
            totalPoints += item.points || 0;
            if (item.percentage !== undefined) {
              totalPercentage += item.percentage;
              itemCount++;
            }
          });
        } else if (salesData.salesByYearCode && Array.isArray(salesData.salesByYearCode)) {
          salesData.salesByYearCode.forEach((yearCodeData, index) => {
            if (yearCodeData.totals) {
              totalProfit += parseFloat(yearCodeData.totals.profit) || 0;
              totalPoints += parseFloat(yearCodeData.totals.points) || 0;
              if (yearCodeData.totals.per !== undefined) {
                totalPercentage += parseFloat(yearCodeData.totals.per) || 0;
                itemCount++;
              }
            }
          });
        }

        const calculatedSalesPercentage = itemCount > 0 ? (totalPercentage / itemCount) : 0;
        
     
       
        // Calculate totals by year code from all months data
        const yearCodeTotals = {};
        
        if (salesData && salesData.salesByYearCode && Array.isArray(salesData.salesByYearCode)) {
          // Process salesByYearCode format
          salesData.salesByYearCode.forEach(item => {
            const yearCode = item.yearCode || "N/A";
            if (!yearCodeTotals[yearCode]) {
              yearCodeTotals[yearCode] = {
                qtySold: 0,
                salesAmount: 0,
                prodValue: 0,
                profit: 0,
                percentage: 0,
                points: 0,
                count: 0
              };
            }
            
            yearCodeTotals[yearCode].qtySold += parseFloat(item.totals?.qtySold || 0);
            yearCodeTotals[yearCode].salesAmount += parseFloat(item.totals?.salesAmount || 0);
            yearCodeTotals[yearCode].prodValue += parseFloat(item.totals?.prodValue || 0);
            yearCodeTotals[yearCode].profit += parseFloat(item.totals?.profit || 0);
            yearCodeTotals[yearCode].percentage += parseFloat(item.totals?.per || 0);
            yearCodeTotals[yearCode].points += parseFloat(item.totals?.points || 0);
            yearCodeTotals[yearCode].count += 1;
          });
        } else if (salesData && Array.isArray(salesData)) {
          // Process array format
          salesData.forEach(item => {
            const yearCode = item.yearCode || item.itemName || "N/A";
            if (!yearCodeTotals[yearCode]) {
              yearCodeTotals[yearCode] = {
                qtySold: 0,
                salesAmount: 0,
                prodValue: 0,
                profit: 0,
                percentage: 0,
                points: 0,
                count: 0
              };
            }
            
            yearCodeTotals[yearCode].qtySold += parseFloat(item.quantitySold || item.qtySold || 0);
            yearCodeTotals[yearCode].salesAmount += parseFloat(item.salesAmount || item.sales || 0);
            yearCodeTotals[yearCode].prodValue += parseFloat(item.productionValue || item.prodValue || 0);
            yearCodeTotals[yearCode].profit += parseFloat(item.profit || 0);
            yearCodeTotals[yearCode].percentage += parseFloat(item.percentage || 0);
            yearCodeTotals[yearCode].points += parseFloat(item.points || 0);
            yearCodeTotals[yearCode].count += 1;
          });
        }
        
        // Display calculated totals
        Object.keys(yearCodeTotals).forEach(yearCode => {
          const totals = yearCodeTotals[yearCode];
          const avgPercentage = totals.count > 0 ? (totals.percentage / totals.count) : 0;
          console.log(`  ${yearCode} | ${totals.qtySold} | ₹${totals.salesAmount.toFixed(2)} | ₹${totals.prodValue.toFixed(2)} | ₹${totals.profit.toFixed(2)} | ${avgPercentage.toFixed(2)}% | ${totals.points.toFixed(2)}`);
        });
      } else {
        // For single month, use the sales data directly
        if (Array.isArray(salesData) && salesData.length > 0) {
          let totalProfit = 0;
          let totalPoints = 0;
          let totalPercentage = 0;
          let itemCount = 0;

          salesData.forEach(item => {
            totalProfit += item.profit || 0;
            totalPoints += item.points || 0;
            if (item.percentage !== undefined) {
              totalPercentage += item.percentage;
              itemCount++;
            }
          });

          salesSummary = {
            profit: totalProfit,
            points: totalPoints,
            percentage: itemCount > 0 ? (totalPercentage / itemCount) : 0
          };
        }
      }
    }

    // Create staff information table (matching the image structure)
    const staffTableData = [
      ["No", "Name", "ID", "Mobile", "Role", "Section", "Floor", "Avg Score"],
      ["1", staffInfo.name || "N/A", staffInfo.staffId || "N/A", staffInfo.mobile || "N/A", 
       staffInfo.role || "N/A", staffInfo.section || "-", staffInfo.floor || "N/A", avgScore.toFixed(1)]
    ];

    await doc.table(
      {
      headers: staffTableData[0],
      rows: [staffTableData[1]],
      },
      {
        prepareHeader: () => doc.fontSize(10).font("Helvetica-Bold"),
        prepareRow: () => doc.fontSize(9).font("Helvetica"),
      columnSpacing: 8,
      rowSpacing: 4,
        borderWidth: 0.5,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        divider: {
          header: { width: 1, opacity: 1, color: "#000000" }, // line below header
          horizontal: { width: 1, opacity: 1, color: "#000000" }, // between rows
          vertical: { width: 1, opacity: 1, color: "#000000" }, // between columns
        },
        padding: 5,
      }
    );
    doc.moveDown(1);

    // ===== Monthly KPI Section =====
    doc.fontSize(16).text("Monthly KPI", { underline: true });
    doc.moveDown(0.5);

    if (month === "all") {
      // All months KPI - show aggregated data (average across all months)
      let allKPIs = new Set();
      let aggregatedKPIData = {};
      
      const monthOrder = ["January", "February", "March", "April", "May", "June",
                         "July", "August", "September", "October", "November", "December"];
      
      // Collect all KPIs and aggregate data
      monthOrder.forEach(monthName => {
        if (allMonthsData[monthName]?.monthlyKPIScores) {
          Object.keys(allMonthsData[monthName].monthlyKPIScores).forEach(kpiName => {
            allKPIs.add(kpiName);
            
            if (!aggregatedKPIData[kpiName]) {
              aggregatedKPIData[kpiName] = {
                weights: [],
                avgPoints: [],
                avgScores: []
              };
            }
            
            const kpiData = allMonthsData[monthName].monthlyKPIScores[kpiName];
            aggregatedKPIData[kpiName].weights.push(kpiData.weight || 0);
            aggregatedKPIData[kpiName].avgPoints.push(kpiData.avgPoints || 0);
            aggregatedKPIData[kpiName].avgScores.push(kpiData.avgScore || 0);
          });
        }
      });
      
      if (Object.keys(aggregatedKPIData).length > 0) {
        // Calculate averages for each KPI
        const finalKPIData = {};
        Object.keys(aggregatedKPIData).forEach(kpiName => {
          const kpiData = aggregatedKPIData[kpiName];
          finalKPIData[kpiName] = {
            weight: kpiData.weights.reduce((a, b) => a + b, 0) / kpiData.weights.length,
            avgPoints: kpiData.avgPoints.reduce((a, b) => a + b, 0) / kpiData.avgPoints.length,
            avgScore: kpiData.avgScores.reduce((a, b) => a + b, 0) / kpiData.avgScores.length
          };
        });
        
        // Create headers: KPI Name | Weight | avg point | avg score
        const headers = ["KPI Name", "Weight", "avg point", "avg score"];
        
        // Create data rows
        const tableData = [];
            Array.from(allKPIs).forEach(kpiName => {
          const kpiData = finalKPIData[kpiName];
          tableData.push([
            kpiName,
            kpiData.weight.toFixed(2),
            kpiData.avgPoints.toFixed(2),
            kpiData.avgScore.toFixed(2)
          ]);
        });
        
        await doc.table({
          headers: headers,
          rows: tableData,
          startY: doc.y,
          columnSpacing: 8,
          rowSpacing: 4,
          cellBorder: true,
          headerBorder: true,
          divider: {
            header: { disabled: false, width: 1, opacity: 1 },
            horizontal: { disabled: false, width: 1, opacity: 1 },
            vertical: { disabled: false, width: 1, opacity: 1 }
          }
        });
      } else {
        doc.fontSize(12).text("Monthly KPI - No data available", { align: "center" });
      }
    } else {
      // Single month KPI details
      if (allMonthsData.monthly?.monthlyKPIScores && Object.keys(allMonthsData.monthly.monthlyKPIScores).length > 0) {
        const kpiData = Object.entries(
          allMonthsData.monthly.monthlyKPIScores
        ).map(([kpiName, kpiData]) => [
          kpiName,
          kpiData.weight || 0,
          kpiData.avgPoints || 0,
          kpiData.avgScore || 0,
        ]);

        await doc.table({
          headers: ["KPI Name", "Weight", "avg point", "avg score"],
          rows: kpiData,
          startY: doc.y,
          columnSpacing: 8,
          rowSpacing: 4,
          cellBorder: true,
          headerBorder: true,
          divider: {
            header: { disabled: false, width: 1, opacity: 1 },
            horizontal: { disabled: false, width: 1, opacity: 1 },
            vertical: { disabled: false, width: 1, opacity: 1 }
          }
        });
      } else {
        doc.fontSize(12).text("Monthly KPI - No data available", { align: "center" });
      }
    }
    doc.moveDown(1);

    // ===== Weekly KPI Section =====
    doc.fontSize(16).text("Weekly KPI", { underline: true });
    doc.moveDown(0.5);

    if (month === "all") {
      // All months weekly data - aggregate by week number across all months
      let allWeeklyKPIs = new Set();
      let weeklyData = {};
      
      const monthOrder = ["January", "February", "March", "April", "May", "June",
                         "July", "August", "September", "October", "November", "December"];
      
      monthOrder.forEach(monthName => {
        if (allMonthsData[monthName]?.weeklyKPIScores) {
          Object.entries(allMonthsData[monthName].weeklyKPIScores).forEach(([date, dayKPIs]) => {
            // Group by week number (1-4)
            const dateObj = new Date(date);
            const weekNum = Math.ceil(dateObj.getDate() / 7);
            const weekKey = `Week ${weekNum}`;
            
            if (!weeklyData[weekKey]) {
              weeklyData[weekKey] = {};
            }
            
            Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
              allWeeklyKPIs.add(kpiName);
              if (!weeklyData[weekKey][kpiName]) {
                weeklyData[weekKey][kpiName] = {
                  weights: [],
                  points: [],
                  scores: []
                };
              }
              weeklyData[weekKey][kpiName].weights.push(kpiData.weight || 0);
              weeklyData[weekKey][kpiName].points.push(kpiData.avgPoints || 0);
              weeklyData[weekKey][kpiName].scores.push(kpiData.avgScore || 0);
            });
          });
        }
      });
      
      // Calculate averages for each week across all months
      Object.keys(weeklyData).forEach(weekKey => {
        Object.keys(weeklyData[weekKey]).forEach(kpiName => {
          const kpiData = weeklyData[weekKey][kpiName];
          weeklyData[weekKey][kpiName] = {
            weight: kpiData.weights.reduce((a, b) => a + b, 0) / kpiData.weights.length,
            avgPoints: kpiData.points.reduce((a, b) => a + b, 0) / kpiData.points.length,
            avgScore: kpiData.scores.reduce((a, b) => a + b, 0) / kpiData.scores.length
          };
        });
      });
      
      if (Object.keys(weeklyData).length > 0) {
        // Create headers: Week | KPI1(weight) | avg point | avg score | KPI2(weight) | ...
        const headers = ["Week"];
        Array.from(allWeeklyKPIs).forEach(kpiName => {
          headers.push(`${kpiName}(weight)`);
          headers.push("avg point");
          headers.push("avg score");
        });
        
        // Create data rows - sort weeks by number
        const tableData = [];
        Object.keys(weeklyData).sort((a, b) => {
          const weekA = parseInt(a.split(' ')[1]);
          const weekB = parseInt(b.split(' ')[1]);
          return weekA - weekB;
        }).forEach(weekKey => {
          const rowData = [weekKey];
          Array.from(allWeeklyKPIs).forEach(kpiName => {
            const kpiData = weeklyData[weekKey][kpiName];
            if (kpiData) {
              rowData.push(kpiData.weight.toFixed(2));
              rowData.push(kpiData.avgPoints.toFixed(2));
              rowData.push(kpiData.avgScore.toFixed(2));
            } else {
              rowData.push("", "", "");
            }
          });
          tableData.push(rowData);
        });
        
        await doc.table({
          headers: headers,
          rows: tableData,
          startY: doc.y,
          columnSpacing: 6,
          rowSpacing: 3,
          cellBorder: true,
          headerBorder: true,
          divider: {
            header: { disabled: false, width: 1, opacity: 1 },
            horizontal: { disabled: false, width: 1, opacity: 1 },
            vertical: { disabled: false, width: 1, opacity: 1 }
          }
        });
      } else {
        doc.fontSize(12).text("Weekly KPI - No data available", { align: "center" });
      }
    } else {
      // Single month weekly data
      if (allMonthsData.weekly?.weeklyKPIScores && Object.keys(allMonthsData.weekly.weeklyKPIScores).length > 0) {
        const weeklyData = [];
        Object.entries(allMonthsData.weekly.weeklyKPIScores).forEach(([date, dayKPIs]) => {
          // Calculate week number from date
          const dateObj = new Date(date);
          const weekNum = Math.ceil(dateObj.getDate() / 7);
          const weekLabel = `Week ${weekNum}`;
          
          Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
            weeklyData.push([
              weekLabel,
              kpiName,
              kpiData.weight || 0,
              kpiData.avgPoints || 0,
              kpiData.avgScore || 0,
            ]);
          });
        });

        if (weeklyData.length > 0) {
          await doc.table({
            headers: ["Week", "KPI Name", "Weight", "avg point", "avg score"],
            rows: weeklyData,
            startY: doc.y,
            columnSpacing: 8,
            rowSpacing: 4,
            cellBorder: true,
            headerBorder: true,
            divider: {
              header: { disabled: false, width: 1, opacity: 1 },
              horizontal: { disabled: false, width: 1, opacity: 1 },
              vertical: { disabled: false, width: 1, opacity: 1 }
            }
          });
        } else {
          doc.fontSize(12).text("Weekly KPI - No data available", { align: "center" });
        }
      } else {
        doc.fontSize(12).text("Weekly KPI - No data available", { align: "center" });
      }
    }
    doc.moveDown(1);

    // ===== Daily KPI Section =====
    doc.fontSize(16).text("Daily KPI", { underline: true });
    doc.moveDown(0.5);

    if (month === "all") {
      // All months daily data
      if (allMonthsData.dailyMonthlyAggregatedData) {
        const dailyData = [];
        Object.entries(allMonthsData.dailyMonthlyAggregatedData).forEach(([monthName, monthData]) => {
          if (monthData && Object.keys(monthData).length > 0) {
            Object.entries(monthData).forEach(([date, dayKPIs]) => {
              Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
                dailyData.push([
                  monthName,
                  date,
                  kpiName,
                  kpiData.weight || 0,
                  kpiData.avgPoints || 0,
                  kpiData.avgScore || 0,
                ]);
              });
            });
          }
        });

        if (dailyData.length > 0) {
          await doc.table({
            headers: ["Month", "Date", "KPI Name", "Weight", "avg point", "avg score"],
            rows: dailyData,
            startY: doc.y,
            columnSpacing: 8,
            rowSpacing: 4,
            cellBorder: true,
            headerBorder: true,
            divider: {
              header: { disabled: false, width: 1, opacity: 1 },
              horizontal: { disabled: false, width: 1, opacity: 1 },
              vertical: { disabled: false, width: 1, opacity: 1 }
            }
          });
        } else {
          doc.fontSize(12).text("Daily KPI - No data available", { align: "center" });
        }
      } else {
        doc.fontSize(12).text("Daily KPI - No data available", { align: "center" });
      }
    } else {
      // Single month daily data
      if (allMonthsData.daily?.dailyKPIScores && Object.keys(allMonthsData.daily.dailyKPIScores).length > 0) {
        const dailyData = [];
        Object.entries(allMonthsData.daily.dailyKPIScores).forEach(([date, dayKPIs]) => {
          Object.entries(dayKPIs).forEach(([kpiName, kpiData]) => {
            dailyData.push([
              date,
              kpiName,
              kpiData.weight || 0,
              kpiData.avgPoints || 0,
              kpiData.avgScore || 0,
            ]);
          });
        });

        if (dailyData.length > 0) {
          await doc.table({
            headers: ["Date", "KPI Name", "Weight", "avg point", "avg score"],
            rows: dailyData,
            startY: doc.y,
            columnSpacing: 8,
            rowSpacing: 4,
            cellBorder: true,
            headerBorder: true,
            divider: {
              header: { disabled: false, width: 1, opacity: 1 },
              horizontal: { disabled: false, width: 1, opacity: 1 },
              vertical: { disabled: false, width: 1, opacity: 1 }
            }
          });
        } else {
          doc.fontSize(12).text("Daily KPI - No data available", { align: "center" });
        }
      } else {
        doc.fontSize(12).text("Daily KPI - No data available", { align: "center" });
      }
    }
    doc.moveDown(1);

    // ===== Attendance Overview Section =====
    doc.fontSize(16).text("Attendance Overview", { underline: true });
    doc.moveDown(0.5);

    const attendanceTableData = [
      ["Total Working Days", "Total Days in all Month", "Total Full Day", "Total Half Day", "Total Leaves", "Total Percentage"],
      [
        attendanceSummary.totalDays.toString(),
        attendanceSummary.totalDaysInMonth.toString(),
        attendanceSummary.totalFullDays.toString(),
        attendanceSummary.totalHalfDays.toString(),
        attendanceSummary.totalLeaves.toString(),
        `${attendanceSummary.percentage.toFixed(2)}%`
      ]
    ];

    await doc.table(
      {
      headers: attendanceTableData[0],
      rows: [attendanceTableData[1]],
      },
      {
        prepareHeader: () => doc.fontSize(10).font("Helvetica-Bold"),
        prepareRow: () => doc.fontSize(9).font("Helvetica"),
      columnSpacing: 8,
      rowSpacing: 4,
        borderWidth: 0.5,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        divider: {
          header: { width: 1, opacity: 1, color: "#000000" }, // line below header
          horizontal: { width: 1, opacity: 1, color: "#000000" }, // between rows
          vertical: { width: 1, opacity: 1, color: "#000000" }, // between columns
        },
        padding: 5,
      }
    );
    doc.moveDown(1);

    // ===== Sales Section =====
    doc.fontSize(16).text("Sales", { underline: true });
    doc.moveDown(0.5);

    // Show sales data by year code with calculated totals
    if (salesData) {
      // Calculate totals by year code from all months data
      const yearCodeTotals = {};
      
      if (month === "all") {
        // For all months, aggregate data from each month
        Object.keys(salesData).forEach(monthName => {
          const monthData = salesData[monthName];
          if (monthData && monthData.salesByYearCode && Array.isArray(monthData.salesByYearCode)) {
            monthData.salesByYearCode.forEach(item => {
              const yearCode = item.yearCode || "N/A";
              if (!yearCodeTotals[yearCode]) {
                yearCodeTotals[yearCode] = {
                  qtySold: 0,
                  salesAmount: 0,
                  prodValue: 0,
                  profit: 0,
                  percentage: 0,
                  points: 0,
                  count: 0
                };
              }
              
              yearCodeTotals[yearCode].qtySold += parseFloat(item.totals?.qtySold || 0);
              yearCodeTotals[yearCode].salesAmount += parseFloat(item.totals?.salesAmount || 0);
              yearCodeTotals[yearCode].prodValue += parseFloat(item.totals?.prodValue || 0);
              yearCodeTotals[yearCode].profit += parseFloat(item.totals?.profit || 0);
              yearCodeTotals[yearCode].percentage += parseFloat(item.totals?.per || 0);
              yearCodeTotals[yearCode].points += parseFloat(item.totals?.points || 0);
              yearCodeTotals[yearCode].count += 1;
            });
          }
        });
      } else if (salesData.salesByYearCode && Array.isArray(salesData.salesByYearCode)) {
        // Process salesByYearCode format for single month
        salesData.salesByYearCode.forEach(item => {
          const yearCode = item.yearCode || "N/A";
          if (!yearCodeTotals[yearCode]) {
            yearCodeTotals[yearCode] = {
              qtySold: 0,
              salesAmount: 0,
              prodValue: 0,
              profit: 0,
              percentage: 0,
              points: 0,
              count: 0
            };
          }
          
          yearCodeTotals[yearCode].qtySold += parseFloat(item.totals?.qtySold || 0);
          yearCodeTotals[yearCode].salesAmount += parseFloat(item.totals?.salesAmount || 0);
          yearCodeTotals[yearCode].prodValue += parseFloat(item.totals?.prodValue || 0);
          yearCodeTotals[yearCode].profit += parseFloat(item.totals?.profit || 0);
          yearCodeTotals[yearCode].percentage += parseFloat(item.totals?.per || 0);
          yearCodeTotals[yearCode].points += parseFloat(item.totals?.points || 0);
          yearCodeTotals[yearCode].count += 1;
        });
      } else if (Array.isArray(salesData)) {
        // Process array format
        salesData.forEach(item => {
          const yearCode = item.yearCode || item.itemName || "N/A";
          if (!yearCodeTotals[yearCode]) {
            yearCodeTotals[yearCode] = {
              qtySold: 0,
              salesAmount: 0,
              prodValue: 0,
              profit: 0,
              percentage: 0,
              points: 0,
              count: 0
            };
          }
          
          yearCodeTotals[yearCode].qtySold += parseFloat(item.quantitySold || item.qtySold || 0);
          yearCodeTotals[yearCode].salesAmount += parseFloat(item.salesAmount || item.sales || 0);
          yearCodeTotals[yearCode].prodValue += parseFloat(item.productionValue || item.prodValue || 0);
          yearCodeTotals[yearCode].profit += parseFloat(item.profit || 0);
          yearCodeTotals[yearCode].percentage += parseFloat(item.percentage || 0);
          yearCodeTotals[yearCode].points += parseFloat(item.points || 0);
          yearCodeTotals[yearCode].count += 1;
        });
      }

      if (Object.keys(yearCodeTotals).length > 0) {
        const salesTableData = [
          ["Year Code", "Total Quantity Sold", "Total Sales Amount", "Total Production Value", "Total Profit", "Total Percentage (%)", "Total Points"]
        ];

        // Add data rows for each year code with calculated totals
        Object.keys(yearCodeTotals).forEach(yearCode => {
          const totals = yearCodeTotals[yearCode];
          const avgPercentage = totals.count > 0 ? (totals.percentage / totals.count) : 0;
          salesTableData.push([
            yearCode,
            totals.qtySold,
            `₹${totals.salesAmount.toFixed(2)}`,
            `₹${totals.prodValue.toFixed(2)}`,
            `₹${totals.profit.toFixed(2)}`,
            `${avgPercentage.toFixed(2)}%`,
            totals.points.toFixed(2)
        ]);
      });

      await doc.table(
    {
      headers: salesTableData[0],
      rows: salesTableData.slice(1),
    },
    {
      prepareHeader: () => doc.fontSize(10).font("Helvetica-Bold"),
      prepareRow: () => doc.fontSize(9).font("Helvetica"),
      columnSpacing: 8,
      rowSpacing: 4,
      borderWidth: 1,
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
      divider: {
        header: { width: 1, opacity: 1, color: "#000000" },
        horizontal: { width: 1, opacity: 1, color: "#000000" },
        vertical: { width: 1, opacity: 1, color: "#000000" },
      },
      cellBorder: {
        width: 1,
        color: "#000000"
      },
      padding: 5,
    }
  );

      doc.moveDown(1);
    } else {
        doc.fontSize(12).text("No sales data available", { align: "center" });
        doc.moveDown(1);
      }
    } else {
      doc.fontSize(12).text("No sales data available", { align: "center" });
      doc.moveDown(1);
    }

    // ===== End of Report =====
    doc.moveDown(2);
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });

    // ===== Finalize PDF =====
    doc.end();
  } catch (error) {
    console.error("Error creating PDF export:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create PDF export" });
    }
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

        
        const staffs = await storage.searchStaffByName( query);

        
        res.status(200).json({ staffs });
    } catch (error) {
        console.error("Error searching staff:", error);
        res.status(500).json({ message: "Error searching staff" });
    }
};

export const getStaffKPIDetails = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { start, end, month, year, format, period } = req.query;
        
        console.log("Staff KPI Details Request - ID:", id, "Start:", start, "End:", end, "Month:", month, "Year:", year, "Format:", format, "Period:", period);

        // If it's an export request, handle it differently
        if (format && (format === "pdf" || format === "excel")) {
            return await exportStaffKPIDetails(req, res);
        }

        const staffKPIDetails = await storage.getStaffKPIDetailsById(id, start, end, month, year);
        
        return res.status(200).json({
            success: true,
            data: staffKPIDetails,
        });
    } catch (error) {
        console.error("Staff KPI details error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch staff KPI details. Please try again later.",
        });
    }
};

export const getStaffDailyKPIDetails = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { start, end, month, year } = req.query;
        
        console.log("Staff Daily KPI Details Request - ID:", id, "Start:", start, "End:", end, "Month:", month, "Year:", year);

        const staffDailyKPIDetails = await storage.getStaffDailyKPIDetailsById(id, start, end, month, year);
        
        return res.status(200).json({
            success: true,
            data: staffDailyKPIDetails,
        });
    } catch (error) {
        console.error("Staff Daily KPI details error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch staff daily KPI details. Please try again later.",
        });
    }
};

export const getStaffWeeklyKPIDetails = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { start, end, month, year } = req.query;
        
        console.log("Staff Weekly KPI Details Request - ID:", id, "Start:", start, "End:", end, "Month:", month, "Year:", year);

        const staffWeeklyKPIDetails = await storage.getStaffWeeklyKPIDetailsById(id, start, end, month, year);
        
        return res.status(200).json({
            success: true,
            data: staffWeeklyKPIDetails,
        });
    } catch (error) {
        console.error("Staff Weekly KPI details error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch staff weekly KPI details. Please try again later.",
        });
    }
};

export const getStaffAttendanceReport = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { start, end, month, year } = req.query;
        
        console.log("Staff Attendance Report Request - ID:", id, "Start:", start, "End:", end, "Month:", month, "Year:", year);

        const attendanceReport = await storage.getStaffAttendanceReportById(id, start, end, month, year);
        
        return res.status(200).json({
            success: true,
            data: attendanceReport,
        });
    } catch (error) {
        console.error("Staff attendance report error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch staff attendance report. Please try again later.",
        });
    }
};

export const getStaffSalesReport = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { start, end, month, year } = req.query;
        
        console.log("Staff Sales Report Request - ID:", id, "Start:", start, "End:", end, "Month:", month, "Year:", year);

        const salesReport = await storage.getStaffSalesReportById(id, start, end, month, year);
        
        return res.status(200).json({
            success: true,
            data: salesReport,
        });
    } catch (error) {
        console.error("Staff sales report error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch staff sales report. Please try again later.",
        });
    }
};

// All Months API Endpoints
export const getAllMonthsStaffKPIDetails = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { year } = req.query;
        
        console.log("All Months Staff KPI Details Request - ID:", id, "Year:", year);

        const allMonthsData = await storage.getAllMonthsStaffKPIDetailsById(id, year);
        
        return res.status(200).json({
            success: true,
            data: allMonthsData,
        });
    } catch (error) {
        console.error("All Months Staff KPI details error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch all months staff KPI details. Please try again later.",
        });
    }
};

export const getAllMonthsStaffDailyKPIDetails = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { year } = req.query;
        
        console.log("All Months Staff Daily KPI Details Request - ID:", id, "Year:", year);

        const allMonthsData = await storage.getAllMonthsStaffDailyKPIDetailsById(id, year);
        
        return res.status(200).json({
            success: true,
            data: allMonthsData,
        });
    } catch (error) {
        console.error("All Months Staff Daily KPI details error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch all months staff daily KPI details. Please try again later.",
        });
    }
};

export const getAllMonthsStaffWeeklyKPIDetails = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { year } = req.query;
        
        console.log("All Months Staff Weekly KPI Details Request - ID:", id, "Year:", year);

        const allMonthsData = await storage.getAllMonthsStaffWeeklyKPIDetailsById(id, year);
        
        return res.status(200).json({
            success: true,
            data: allMonthsData,
        });
    } catch (error) {
        console.error("All Months Staff Weekly KPI details error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch all months staff weekly KPI details. Please try again later.",
        });
    }
};

export const getWeeklyKPIByMonth = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { year } = req.query;
        
        console.log("=== GET WEEKLY KPI BY MONTH REQUEST ===");
        console.log("Staff ID:", id);
        console.log("Year:", year);
        console.log("=======================================");

        const allMonthsData = await storage.getAllMonthsStaffWeeklyKPIDetailsById(id, year);
        
        // Extract only the aggregated monthly data
        const monthlyAggregatedData = allMonthsData.monthlyAggregatedData || {};
        
        console.log("=== WEEKLY KPI BY MONTH RESPONSE ===");
        console.log("Available months:", Object.keys(monthlyAggregatedData));
        console.log("Sample data:", Object.keys(monthlyAggregatedData).length > 0 ? monthlyAggregatedData[Object.keys(monthlyAggregatedData)[0]] : 'No data');
        console.log("====================================");
        
        return res.status(200).json({
            success: true,
            data: {
                monthlyAggregatedData,
                staff: allMonthsData.January?.staff || allMonthsData.February?.staff || allMonthsData.March?.staff || null,
            },
        });
    } catch (error) {
        console.error("Get Weekly KPI by Month error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch weekly KPI by month. Please try again later.",
        });
    }
};

export const getAllMonthsStaffAttendanceReport = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { year } = req.query;
        
        console.log("All Months Staff Attendance Report Request - ID:", id, "Year:", year);

        const allMonthsData = await storage.getAllMonthsStaffAttendanceReportById(id, year);
        
        return res.status(200).json({
            success: true,
            data: allMonthsData,
        });
    } catch (error) {
        console.error("All Months Staff Attendance Report error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch all months staff attendance report. Please try again later.",
        });
    }
};

export const getAllMonthsStaffSalesReport = async (req, res) => {
    try {
        const { id } = req.params; // This is the database UUID
        const { year } = req.query;
        
        console.log("All Months Staff Sales Report Request - ID:", id, "Year:", year);

        const allMonthsData = await storage.getAllMonthsStaffSalesReportById(id, year);
        
        return res.status(200).json({
            success: true,
            data: allMonthsData,
        });
    } catch (error) {
        console.error("All Months Staff Sales Report error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch all months staff sales report. Please try again later.",
        });
    }
};

export const getAllMonthsAttendanceReport = async (req, res) => {
    try {
        const { year } = req.query;
        
        console.log("All Months Attendance Report Request - Year:", year);

        const allMonthsData = await storage.getAllMonthsAttendanceReport(year);
        
        return res.status(200).json({
            success: true,
            data: allMonthsData,
        });
    } catch (error) {
        console.error("All Months Attendance Report error:", error.message, error);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            error: error.message || "Failed to fetch all months attendance report. Please try again later.",
        });
    }
};
