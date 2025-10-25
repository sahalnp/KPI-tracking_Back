import { hashPassword } from "../utils/Password.js";
import { storage } from "../utils/storage.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const getDashboardData = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const dashboardData = await storage.getSupervisorDashboardData(
            req.user.id,
            timeframe
        );
        console.log(dashboardData, "747777");

        // Get different graph data for the three charts
        const salesGraph = await storage.getSalesGraphData(req.user.id, timeframe);
        const walkoutGraph = await storage.getWalkoutGraphData(req.user.id, timeframe);
        const staffGraph = await storage.getStaffGraphData(req.user.id, timeframe);

        res.status(200).json({
            success: true,
            status: dashboardData,
            salesGraph,
            walkoutGraph,
            staffGraph,
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
// // Get staff for scoring (supervisor's floor only)
// export const getStaffScoring = async (req, res) => {
//     try {
//         const supervisorId = req.user.id;
//         const staff = await storage.getSupervisorStaffForScoring(supervisorId);
        
//         res.json({
//             success: true,
//             usersRes: staff
//         });
//     } catch (error) {
//         console.error("Get staff scoring error:", error);
//         res.status(500).json({
//             success: false,
//             error: "Failed to fetch staff for scoring"
//         });
//     }
// };

// // Get KPIs for scoring
// export const getScoreKPI = async (req, res) => {
//     try {
//         const kpis = await storage.getKPIs();
        
//         res.json({
//             success: true,
//             kpis
//         });
//     } catch (error) {
//         console.error("Get score KPI error:", error);
//         res.status(500).json({
//             success: false,
//             error: "Failed to fetch KPIs"
//         });
//     }
// };

// // Get user scores
// export const getUserScore = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const scores = await storage.getUserScores(id);
        
//         res.json({
//             success: true,
//             kpis: scores
//         });
//     } catch (error) {
//         console.error("Get user score error:", error);
//         res.status(500).json({
//             success: false,
//             error: "Failed to fetch user scores"
//         });
//     }
// };

export const getScoreStaff = async (req, res) => {
    try {
        const staffs = await storage.getStaff(req.user.id); 
        res.status(200).json({ success: true, usersRes: staffs });
    } catch (error) {
        console.log(error);
        
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getKpis = async (req, res) => {
    try {
        const result = await storage.getKPIs();
        console.log(result, "KPIs result");
        
        res.status(200).json({ success: true, kpis: result.kpis });
    } catch (error) {
        console.error("Error fetching KPIs:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const addScore = async (req, res) => {
    try {
        const { scores, staffId } = req.body;
        const id = req.user.id;
        await storage.addScore(scores, staffId, id);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error adding score:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getWalkouts = async (req, res) => {
    try {
        const walkouts = await storage.getWalkouts(req.user.id);

        res.status(200).json({ success: true, walkouts });
    } catch (error) {
        console.error("Error fetching walkouts:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
// Example using Express + Prisma
export const walkOutById = async (req, res) => {
    const { id } = req.params;
    try {
        const walkout = await storage.getWalkoutsByID(id);
        res.json({ success: true, walkout });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch walkout",
        });
    }
};

export const addWalkout = async (req, res) => {
    try {
        const walkout = await storage.addWalkout(req.body, req.user.id);
        console.log(walkout, "5647879");

        res.status(200).json({ success: true, walkout });
    } catch (error) {
        console.error("Error adding walkout:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const editWalkout = async (req, res) => {
    try {
        const id = req.params.id;
        const edited = await storage.editWalkout(req.body, id, req.user.id);
        console.log(edited, "dsfdskfjkljslkfjdsklfjdsl");

        res.status(200).json({ success: true, edited });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const deleteWalkout = async (req, res) => {
    try {
        const id = req.params.id;
        await storage.deleteWalkout(Number(id));
        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getUsers = async (req, res) => {
    try {
        const users = await storage.getUserByFloor(req.user.id);

        res.status(200).json({ success: true, users });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const addUser = async (req, res) => {
    try {
        const findId = await storage.findId(req.body.uniqueId);
        if (findId) {
            return res
                .status(400)
                .json({ success: false, message: "ID already exist" });
        }
        const addUser = await storage.supervisorAddUser(req.user.id, req.body);
        res.status(200).json({ success: true, addUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const editUser = async (req, res) => {
    try {
        const id = req.params.id;
        const editUser = await storage.superVisorEditUser(id, req.body);
        console.log(editUser, "sdfkldsfjlksdf");

        res.status(200).json({ success: true, editUser });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const dltUser = async (req, res) => {
    try {
        const id = req.params.id;
        await storage.deleteUser(id);
        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getMe = async (req, res) => {
    try {
        const me = await storage.getSupervisor(req.user.id);

        res.status(200).json({ success: true, me });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const editMe = async (req, res) => {
    console.log("sdfdslkfdslkj");
    
    try {
        await storage.updateMeSupervisor(req.user.id, req.body);
        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const toggleStaff = async (req, res) => {
    try {
        await storage.toggleStaff(req.params.id, req.body.active_flag);
        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const updatePin = async (req, res) => {
    try {
        let { newPin } = req.body;
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
export const logoutSupervisor = async (req, res) => {
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
export const walkOutExport = async (req, res) => {
    const { type } = req.query;
    try {
        const walkoutData = await storage.walkoutExport(type);
        console.log(walkoutData, "sdfklsdfjklds");

        res.status(200).json({ success: true, walkoutData });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const fetchItem = async (req, res) => {
    const { query } = req.query;

    try {
        const items = await storage.fetchItem(query);

        res.status(200).json({ success: true, items });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const fetchType = async (req, res) => {
    const { query } = req.query;

    try {
        const types = await storage.fetchType(query);
        res.status(200).json({ success: true, types });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

// New endpoints for supervisor scoring
export const getStaffScoring = async (req, res) => {
    try {
        const usersRes = await storage.getStaffForScoring(req.user.id);
        res.status(200).json({ success: true, usersRes });
    } catch (error) {
        console.error("Error fetching staff for scoring:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const getScoreKPI = async (req, res) => {
    try {
        const kpis = await storage.getKPIs();
        res.status(200).json({ success: true, kpis });
    } catch (error) {
        console.error("Error fetching KPIs:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const getUserScore = async (req, res) => {
    try {
        const { id } = req.params;
        const kpis = await storage.getUserScores(id);
        res.status(200).json({ success: true, kpis });
    } catch (error) {
        console.error("Error fetching user scores:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const submitScore = async (req, res) => {
    try {
        const { staffId, scores } = req.body;
        const supervisorId = req.user.id;
        const result = await storage.submitScore(scores, staffId, supervisorId);
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error("Error submitting score:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const updateScore = async (req, res) => {
    try {
        const { staffId, scores } = req.body;
        const supervisorId = req.user.id;
        const result = await storage.updateScore(scores, staffId, supervisorId);
        res.status(200).json({ success: true, result });
    } catch (error) {
        console.error("Error updating score:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

// New endpoints for supervisor settings/staff management
export const getStaff = async (req, res) => {
    try {
        const staff = await storage.getStaff(req.user.id);
        res.status(200).json({ success: true, staff });
    } catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const checkIdExists = async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const exists = await storage.checkIdExists(uniqueId);
        res.status(200).json({ success: true, exists });
    } catch (error) {
        console.error("Error checking ID existence:", error);
        res.status(500).json({ success: false, error: "Failed to check ID" });
    }
};

export const addStaff = async (req, res) => {
    try {
        const staff = await storage.supervisorAddUser(req.user.id, req.body);
        res.status(200).json({ success: true, staff });
    } catch (error) {
        console.error("Error adding staff:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await storage.superVisorEditUser(id, req.body);
        res.status(200).json({ success: true, staff });
    } catch (error) {
        console.error("Error updating staff:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        await storage.deleteUser(id);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error deleting staff:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

export const getReports = async (req, res) => {
    try {
        const { range = "month" } = req.query;
        const supervisorId = req.user.id;
        
        // Get supervisor's floor information
        const supervisor = await storage.getSupervisorFloor(supervisorId);
        if (!supervisor) {
            return res.status(404).json({
                success: false,
                message: "Supervisor floor not found"
            });
        }

        // Get reports data for the supervisor's floor
        const reportsData = await storage.getSupervisorReports(supervisorId, range);
        
        res.status(200).json({
            success: true,
            ...reportsData
        });
    } catch (error) {
        console.error("Error fetching supervisor reports:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};

// Individual report endpoints for supervisor
export const staffReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        const supervisorId = req.user.id;
        
        console.log("Supervisor Staff Report Request - Start:", start, "End:", end);

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

        // Get supervisor's floor-specific staff report data
        const staffReportData = await storage.getSupervisorStaffReport(supervisorId, start, end);
        console.log("Supervisor Staff Report Data:", staffReportData);

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
        console.error("Supervisor staff report error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate staff report. Please try again later.",
        });
    }
};

export const salesReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        const supervisorId = req.user.id;
        
        console.log("Supervisor Sales Report Request - Start:", start, "End:", end);

        // Get supervisor's floor-specific sales report data
        const salesReportData = await storage.getSupervisorSalesReport(supervisorId, start, end);
        
        return res.status(200).json({
            success: true,
            sales: salesReportData.list,
            summary: salesReportData.summary
        });
    } catch (error) {
        console.error("Supervisor sales report error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate sales report",
        });
    }
};

export const attendanceReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        const supervisorId = req.user.id;
        
        console.log("Supervisor Attendance Report Request - Start:", start, "End:", end);

        // Get supervisor's floor-specific attendance report data
        const attendanceReportData = await storage.getSupervisorAttendanceReport(supervisorId, start, end);
        
        return res.status(200).json({
            success: true,
            attendance: attendanceReportData.list,
            summary: attendanceReportData.summary
        });
    } catch (error) {
        console.error("Supervisor attendance report error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate attendance report",
        });
    }
};

export const walkoutReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        const supervisorId = req.user.id;
        
        console.log("Supervisor Walkout Report Request - Start:", start, "End:", end);

        // Get supervisor's floor-specific walkout report data
        const walkoutReportData = await storage.getSupervisorWalkoutReport(supervisorId, start, end);
        
        return res.status(200).json({
            success: true,
            walkouts: walkoutReportData.list,
            summary: walkoutReportData.summary
        });
    } catch (error) {
        console.error("Supervisor walkout report error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate walkout report",
        });
    }
};

// Export functions for supervisor reports
export const exportStaffReport = async (req, res) => {
    try {
        const { start, end, format } = req.query;
        const supervisorId = req.user.id;
        
        console.log("Supervisor Staff Report Export Request - Start:", start, "End:", end, "Format:", format);

        // Get supervisor's floor-specific staff report data
        const staffReportData = await storage.getSupervisorStaffReport(supervisorId, start, end);

        if (format === "excel") {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Staff Report");
            sheet.columns = [
                { header: "Staff ID", key: "staffId", width: 15 },
                { header: "Name", key: "name", width: 25 },
                { header: "Mobile", key: "mobile", width: 15 },
                { header: "Role", key: "role", width: 20 },
                { header: "Section", key: "section", width: 15 },
                { header: "Floor", key: "floor", width: 10 },
                { header: "Avg Score", key: "avgScore", width: 10 },
            ];
            
            // Add data rows
            staffReportData.forEach(staff => {
                sheet.addRow({
                    staffId: staff.staffId,
                    name: staff.name,
                    mobile: staff.mobile,
                    role: staff.role,
                    section: staff.section || "N/A",
                    floor: staff.floor || "N/A",
                    avgScore: staff.avgScore || 0
                });
            });
            
            res.setHeader("Content-Disposition", 'attachment; filename="Supervisor-Staff-Report.xlsx"');
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            await workbook.xlsx.write(res);
            return res.end();
        }

        if (format === "pdf") {
            const doc = new PDFDocument({ margin: 40, size: "A4" });
            res.setHeader("Content-Disposition", 'attachment; filename="Supervisor-Staff-Report.pdf"');
            res.setHeader("Content-Type", "application/pdf");
            doc.pipe(res);

            doc.fontSize(20)
                .text("Supervisor Staff Report", { align: "center" })
                .moveDown(0.5);
            const title = [];
            if (start) title.push(`From: ${start}`);
            if (end) title.push(`To: ${end}`);
            if (title.length)
                doc.fontSize(12)
                    .text(title.join(" - "), { align: "center" })
                    .moveDown(1);

            const headers = [
                "No",
                "Staff ID",
                "Name",
                "Mobile",
                "Role",
                "Section",
                "Floor",
                "Avg Score",
            ];
            const colW = [30, 70, 120, 80, 60, 60, 50, 60];
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
            staffReportData.forEach((staff, idx) => {
                drawRow([
                    idx + 1,
                    staff.staffId || "N/A",
                    staff.name || "N/A",
                    staff.mobile || "N/A",
                    staff.role || "N/A",
                    staff.section || "N/A",
                    staff.floor || "N/A",
                    staff.avgScore || 0,
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
        console.error("Supervisor staff report export error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to export staff report",
        });
    }
};

export const exportSalesReport = async (req, res) => {
    try {
        const { start, end, format } = req.query;
        const supervisorId = req.user.id;
        
        console.log("Supervisor Sales Report Export Request - Start:", start, "End:", end, "Format:", format);

        // Get supervisor's floor-specific sales report data
        const salesReportData = await storage.getSupervisorSalesReport(supervisorId, start, end);

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
            salesReportData.list.forEach((row) => sheet.addRow(row));
            sheet.addRow({});
            sheet.addRow({
                staffName: "Totals",
                qtySold: salesReportData.summary.totalQty,
                salesAmount: salesReportData.summary.totalSales,
                profit: salesReportData.summary.totalProfit,
                points: salesReportData.summary.totalPoints,
            });

            res.setHeader(
                "Content-Disposition",
                'attachment; filename="Supervisor-Sales-Report.xlsx"'
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
                'attachment; filename="Supervisor-Sales-Report.pdf"'
            );
            res.setHeader("Content-Type", "application/pdf");
            doc.pipe(res);

            doc.fontSize(20)
                .text("Supervisor Sales Report", { align: "center" })
                .moveDown(0.5);
            const title = [];
            if (start) title.push(`From: ${start}`);
            if (end) title.push(`To: ${end}`);
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
            salesReportData.list.forEach((row, idx) => {
                drawRow([
                    idx + 1,
                    row.staffId || row.uniqueId,
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
                    salesReportData.summary.totalQty,
                    salesReportData.summary.totalSales,
                    salesReportData.summary.totalProfit,
                    salesReportData.summary.totalPoints,
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

export const exportAttendanceReport = async (req, res) => {
    try {
        const { start, end, format } = req.query;
        const supervisorId = req.user.id;
        
        console.log("Supervisor Attendance Report Export Request - Start:", start, "End:", end, "Format:", format);

        // Get supervisor's floor-specific attendance report data
        const attendanceReportData = await storage.getSupervisorAttendanceReport(supervisorId, start, end);

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
            attendanceReportData.list.forEach((row) =>
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
                'attachment; filename="Supervisor-Attendance-Report.xlsx"'
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
                'attachment; filename="Supervisor-Attendance-Report.pdf"'
            );
            res.setHeader("Content-Type", "application/pdf");
            doc.pipe(res);

            doc.fontSize(20)
                .text("Supervisor Attendance Report", { align: "center" })
                .moveDown(0.5);
            const title = [];
            if (start) title.push(`From: ${start}`);
            if (end) title.push(`To: ${end}`);
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
            attendanceReportData.list.forEach((row, idx) => {
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
        const { start, end, format } = req.query;
        const supervisorId = req.user.id;
        
        console.log("Supervisor Walkout Report Export Request - Start:", start, "End:", end, "Format:", format);

        // Get supervisor's floor-specific walkout report data
        const walkoutReportData = await storage.getSupervisorWalkoutReport(supervisorId, start, end);

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
            walkoutReportData.list.forEach((row) =>
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
                'attachment; filename="Supervisor-Walkout-Report.xlsx"'
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
                'attachment; filename="Supervisor-Walkout-Report.pdf"'
            );
            res.setHeader("Content-Type", "application/pdf");
            doc.pipe(res);

            doc.fontSize(20)
                .text("Supervisor Walkout Report", { align: "center" })
                .moveDown(0.5);
            const title = [];
            if (start) title.push(`From: ${start}`);
            if (end) title.push(`To: ${end}`);
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
            walkoutReportData.list.forEach((row, idx) => {
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

// Search staff by name
export const searchStaff = async (req, res) => {
    try {
        const { query } = req.query;
        const supervisorId = req.user.id;
        
        if (!query || query.trim().length < 1) {
            return res.status(200).json({
                success: true,
                staffs: []
            });
        }

        const staffs = await storage.searchStaffByName(supervisorId, query.trim());
        
        res.status(200).json({
            success: true,
            staffs: staffs
        });
    } catch (error) {
        console.error("Search staff error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to search staff"
        });
    }
};
