import { prisma } from "../index.js";
import {
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfWeek,
    endOfWeek,
    subWeeks,
    startOfYear,
    endOfYear,
    isSameDay,
    addDays,
    addMonths,
    startOfDay,
    endOfDay,
} from "date-fns";
import { hashPassword } from "./Password.js";
class DatabaseStorage {
    async getKPIs() {
        const kpis = await prisma.KPI.findMany({
            where: { isDlt: false },
            orderBy: {
                created_at: "desc",
            },
        });

        const frequencies = kpis.map((kpi) => kpi.frequency);

        return { kpis, frequencies };
    }

    async getUser(mobile) {
        return (
            (await prisma.user.findUnique({
                where: { mobile },
            })) || null
        );
    }
    async getFullUsers() {
        return await prisma.user.findMany({
            where: {
                isDlt: false,
                role: { not: "Owner" },
            },
            include: {
                floor: true,
                scores: {
                    include: {
                        kpi: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
        });
    }

    async addKpi(value) {
        return (await prisma.KPI.create({ data: value })) || null;
    }
    async addUser(value) {
        return (
            (await prisma.user.create({
                data: value,
                include: {
                    floor: true,
                },
            })) || null
        );
    }
    async dltKpi(id) {
        return (
            (await prisma.KPI.update({
                where: { id: Number(id) },
                data: { isDlt: true, status: false },
            })) || null
        );
    }

    async getDeletedUsersCount() {
        return await prisma.user.count({
            where: {
                isDlt: true,
                role: { not: "Owner" },
            },
        });
    }
    async getActiveUsersCount() {
        return await prisma.user.count({
            where: {
                active_flag: true,
                isDlt: false,
                role: { not: "Owner" },
            },
        });
    }
    async getInactiveUserCount() {
        return await prisma.user.count({
            where: {
                active_flag: false,
                isDlt: false,
                role: { not: "Owner" },
            },
        });
    }
    async dltUser(id) {
        return await prisma.user.update({
            where: { id },
            data: { isDlt: true, active_flag: false },
        });
    }
    async updateUser(user) {
        const { id, isActive, isDeleted, ...rest } = user;
        return await prisma.user.update({
            where: { id },
            data: { active_flag: isActive, ...rest, isDlt: isDeleted },
            include: {
                floor: true,
            },
        });
    }

    async addFloors(floorNames) {
        const names = Array.isArray(floorNames) ? floorNames : [floorNames];
        const floors = [];

        for (let name of names) {
            name = String(name);

            let floor = await prisma.floor.findFirst({
                where: { name },
            });

            if (!floor) {
                floor = await prisma.floor.create({
                    data: { name },
                });
            }

            floors.push(floor);
        }

        return floors;
    }

    async updateKpi(kpi) {
        return await prisma.KPI.update({
            where: { id: kpi.id },
            data: { ...kpi, id: undefined },
        });
    }
    async getUserById(id) {
        return (
            (await prisma.user.findUnique({
                where: { id },
            })) || null
        );
    }

    async getStaffKpis(staffId) {
        const scores = await prisma.score.findMany({
            where: { user_id: staffId, isDlt: false },
            include: { kpi: true },
        });

        if (!scores.length) {
            return {
                scores: [],
                last4Months: [],
                last4Weeks: [],
            };
        }

        const now = new Date();

        // --- Last 4 months with KPI breakdown ---
        const last4Months = [];
        for (let i = 3; i >= 0; i--) {
            const monthDate = new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );
            const monthLabel = monthDate.toLocaleString("default", {
                month: "short",
            });

            const monthScores = scores.filter(
                (s) =>
                    new Date(s.created_at).getMonth() ===
                        monthDate.getMonth() &&
                    new Date(s.created_at).getFullYear() ===
                        monthDate.getFullYear()
            );

            const kpiMap = {};
            monthScores.forEach((s) => {
                if (!kpiMap[s.kpi?.name]) kpiMap[s.kpi?.name] = [];
                kpiMap[s.kpi?.name].push(s.points);
            });

            const monthObj = { month: monthLabel };
            for (const kpiName in kpiMap) {
                const avg = Math.round(
                    kpiMap[kpiName].reduce((a, b) => a + b, 0) /
                        kpiMap[kpiName].length
                );
                monthObj[kpiName.toLowerCase().replace(/\s+/g, "_")] = avg;
            }

            last4Months.push(monthObj);
        }

        // --- Last 4 weeks aggregation ---
        const last4Weeks = [];
        for (let i = 3; i >= 0; i--) {
            const weekLabel = `W${4 - i}`;
            const weekScores = scores.filter((s) => {
                const diffDays = Math.floor(
                    (now.getTime() - new Date(s.created_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                );
                return diffDays >= i * 7 && diffDays < (i + 1) * 7;
            });

            const totalValue = weekScores.reduce((sum, s) => sum + s.points, 0);
            const totalTarget = weekScores.reduce(
                (sum, s) => sum + (s.kpi?.weight || 0),
                0
            );

            last4Weeks.push({
                week: weekLabel,
                score: totalValue,
                percentage: totalTarget
                    ? Math.round((totalValue / totalTarget) * 100)
                    : 0,
            });
        }

        return {
            scores,
            last4Months,
            last4Weeks,
        };
    }

    async getDetails() {
        try {
            const userCount = await prisma.user.count({
                where: {
                    isDlt: false,
                    role: { not: "Owner" },
                },
            });
            const kpiCount = await prisma.KPI.count({
                where: { isDlt: false },
            });
            const floorCount = await prisma.floor.count({
                where: { isDlt: false },
            });
            const walkoutCount = await prisma.walkOut.count({
                where: { isDlt: false },
            });

            return {
                totalUsers: userCount,
                totalKPIs: kpiCount,
                totalFloors: floorCount,
                totalWalkouts: walkoutCount,
            };
        } catch (error) {
            console.error("Error in getDetails:", error);
            // Return default values if database connection fails
            return {
                totalUsers: 0,
                totalKPIs: 0,
                totalFloors: 0,
                totalWalkouts: 0,
            };
        }
    }
    async changePin(mobile, newPin) {
        const now = new Date();
        const pinExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);

        return await prisma.user.update({
            where: { mobile },
            data: {
                pin_hash: newPin,
                pin_expires_at: pinExpiresAt,
            },
        });
    }
    async staffChangePin(staffId, newPin) {
        const now = new Date();
        return await prisma.user.update({
            where: { id: staffId },
            data: {
                pin_hash: newPin,
                pin_expires_at: null,
            },
        });
    }

    async createToken(
        mobile,
        refreshToken,
        deviceInfo = null,
        ipAddress = null,
        userAgent = null
    ) {
        const user = await this.getUser(mobile);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        if (!user) throw new Error("User not found");

        // First, deactivate all existing tokens for this user (single session)
        await prisma.token.updateMany({
            where: {
                user_id: user.id,
                is_active: true,
            },
            data: { is_active: false },
        });

        // Create new token
        await prisma.token.create({
            data: {
                user_id: user.id,
                token: refreshToken,
                expiry: expiryDate,
                device_info: deviceInfo,
                ip_address: ipAddress,
                user_agent: userAgent,
                is_active: true,
            },
        });
    }
    async replaceToken(
        mobile,
        newRefreshToken,
        deviceInfo = null,
        ipAddress = null,
        userAgent = null
    ) {
        const user = await this.getUser(mobile);
        if (!user) throw new Error("User not found");

        // Deactivate all existing tokens for this user
        await prisma.token.updateMany({
            where: {
                user_id: user.id,
                is_active: true,
            },
            data: { is_active: false },
        });

        // Create new token
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        await prisma.token.create({
            data: {
                user_id: user.id,
                token: newRefreshToken,
                expiry: expiryDate,
                device_info: deviceInfo,
                ip_address: ipAddress,
                user_agent: userAgent,
                is_active: true,
            },
        });
    }
    async getToken(mobile) {
        const user = await this.getUser(mobile);
        if (!user) throw new Error("User not found");
        return (
            (await prisma.token.findFirst({
                where: {
                    user_id: user.id,
                    is_active: true,
                },
                orderBy: { created_at: "desc" },
            })) || null
        );
    }

    // Logout user from all sessions
    async logoutAllSessions(userId) {
        await prisma.token.updateMany({
            where: {
                user_id: userId,
                is_active: true,
            },
            data: { is_active: false },
        });
    }

    // Logout specific session by token
    async logoutSession(token) {
        await prisma.token.updateMany({
            where: {
                token: token,
                is_active: true,
            },
            data: { is_active: false },
        });
    }
    async getStaffDetails(staffId) {
        const avgScore = await prisma.score.aggregate({
            where: { user_id: staffId, isDlt: false },
            _avg: { points: true },
        });
        const overallAvg = avgScore._avg.points ?? 0;

        // 2️⃣ Attendance calculation
        const attendances = await prisma.attendance.findMany({
            where: {
                staffId,
                date: {
                    gte: startOfMonth(new Date()),
                    lte: endOfMonth(new Date()),
                },
            },
            select: {
                halfDays: true,
                fullDays: true,
                leaveCount: true,
                totalDays: true,
            },
        });

        let totalFull = 0;
        let totalHalf = 0;
        let totalLeave = 0;
        let totalDays = 0;

        for (const a of attendances) {
            totalFull += Number(a.fullDays) || 0;
            totalHalf += Number(a.halfDays) || 0;
            totalLeave += Number(a.leaveCount) || 0;
            totalDays += Number(a.totalDays) || 0;
        }

        const totalPresent = totalFull + totalHalf * 0.5;
        const attendancePercentage =
            totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;

        // 3️⃣ Ranking based on average score
        const avgScores = await prisma.score.groupBy({
            by: ["user_id"],
            where: { isDlt: false },
            _avg: { points: true },
        });

        const rankedUsers = avgScores
            .map((u) => ({
                userId: u.user_id,
                avgPoints: u._avg.points ?? 0,
            }))
            .sort((a, b) => b.avgPoints - a.avgPoints);

        const currentUserRank =
            rankedUsers.findIndex((u) => u.userId === staffId) + 1;

        // 4️⃣ Current vs previous month trend
        const now = new Date();
        const startCurrentMonth = startOfMonth(now);
        const startPrevMonth = startOfMonth(subMonths(now, 1));
        const endPrevMonth = startCurrentMonth;

        const currentMonth = await prisma.score.aggregate({
            where: {
                user_id: staffId,
                isDlt: false,
                created_at: { gte: startCurrentMonth },
            },
            _avg: { points: true },
        });

        const prevMonth = await prisma.score.aggregate({
            where: {
                user_id: staffId,
                isDlt: false,
                created_at: { gte: startPrevMonth, lt: endPrevMonth },
            },
            _avg: { points: true },
        });

        const currentAvg = currentMonth._avg.points ?? 0;
        const prevAvg = prevMonth._avg.points ?? 0;

        let trend = "same";
        let percentageChange = 0;

        if (currentAvg > prevAvg) trend = "increased";
        else if (currentAvg < prevAvg) trend = "decreased";

        if (prevAvg > 0)
            percentageChange = ((currentAvg - prevAvg) / prevAvg) * 100;
        else if (currentAvg > 0) percentageChange = 100;

        // 5️⃣ Return structured data
        return {
            currentAvg,
            prevAvg,
            trend,
            attendance: Number(attendancePercentage.toFixed(2)),
            overallAvg,
            currentUserRank,
            percentageChange: Number(percentageChange.toFixed(2)),
        };
    }
    async getMyKpi(staffId) {
        return await prisma.score.findMany({
            where: {
                user_id: staffId,
                isDlt: false,
            },
            include: {
                kpi: true,
            },
        });
    }
    async getAttendance(staffId) {
        const now = new Date();

        // Define current & previous month ranges
        const startCurrentMonth = startOfMonth(now);
        const endCurrentMonth = endOfMonth(now);
        const startPrevMonth = startOfMonth(subMonths(now, 1));
        const endPrevMonth = endOfMonth(subMonths(now, 1));

        // Fetch attendance for current month
        const currentMonthAttendance = await prisma.attendance.findMany({
            where: {
                staffId,
                date: {
                    gte: startCurrentMonth,
                    lte: endCurrentMonth,
                },
            },
        });

        // Fetch attendance for previous month
        const prevMonthAttendance = await prisma.attendance.findMany({
            where: {
                staffId,
                date: {
                    gte: startPrevMonth,
                    lte: endPrevMonth,
                },
            },
        });

        function calculatePercentage(attendances) {
            let totalFull = 0;
            let totalHalf = 0;
            let totalLeave = 0;

            for (const a of attendances) {
                totalFull += parseFloat(a.fullDays || 0);
                totalHalf += parseFloat(a.halfDays || 0);
                totalLeave += parseFloat(a.leaveCount || 0);
            }

            // Calculate present equivalent (full + half/2)
            const presentCount = totalFull + totalHalf * 0.5;

            // Get the current month's total days
            const now = new Date();
            const totalDaysInMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0
            ).getDate();

            // Use correct formula: (Total Days by user / Total days in month) × 100
            const percentage =
                totalDaysInMonth > 0
                    ? (presentCount / totalDaysInMonth) * 100
                    : 0;

            return {
                present: +presentCount.toFixed(1),
                leave: +totalLeave.toFixed(1),
                totalDays: +totalDaysInMonth.toFixed(1),
                percentage: +percentage.toFixed(1),
            };
        }

        const thisMonth = calculatePercentage(currentMonthAttendance);
        const lastMonth = calculatePercentage(prevMonthAttendance);

        // Calculate trend
        const diff = +(thisMonth.percentage - lastMonth.percentage).toFixed(1);
        let trend = "same";
        if (diff > 0) trend = "increased";
        else if (diff < 0) trend = "decreased";

        return {
            thisMonth,
            lastMonth,
            trend,
            diff,
        };
    }
    async getAccountData(staffId) {
        const user = await prisma.user.findFirst({
            where: { id: staffId, isDlt: false },
            include: {
                floor: true,
            },
        });
        const walkOuts = await prisma.walkOut.findMany({
            where: { staffId },
        });

        return { walkOuts, user };
    }
    async userEdit(staffId, data) {
        return await prisma.user.update({
            where: { id: staffId },
            data: { ...data },
        });
    }
    async changeStatus(id, status) {
        return await prisma.user.update({
            where: { id },
            data: { active_flag: status },
        });
    }

    // Supervisor
    async getSupervisorDashboardData(id, timeframe) {
        const supervisor = await prisma.user.findUnique({
            where: { id },
            include: { floor: true },
        });

        if (!supervisor) throw new Error("Supervisor not found");

        let startDate, endDate;
        if (timeframe === "week") {
            startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
            endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
        } else if (timeframe === "month") {
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
        }

        const dateFilter =
            startDate && endDate ? { gte: startDate, lte: endDate } : undefined;

        const staffsCount = await prisma.user.count({
            where: {
                floor_id: supervisor.floor_id,
                isDlt: false,
                role: "Staff",
            },
        });

        const pendingScoreCount = await prisma.score.count({
            where: {
                evalutedby_user_id: supervisor.id,
                status: "pending",
                isDlt: false,
                ...(dateFilter && { created_at: dateFilter }),
            },
        });

        const usersInFloor = await prisma.user.findMany({
            where: {
                floor_id: supervisor.floor_id,
                isDlt: false,
                role: "Staff",
            },
            select: { id: true },
        });

        const userIds = usersInFloor.map((u) => u.id);

        const avgScoreResult = await prisma.score.aggregate({
            where: {
                user_id: { in: userIds },
                isDlt: false,
                status: "approved",
                ...(dateFilter && { created_at: dateFilter }),
            },
            _avg: { points: true },
        });
        const walkOutCount = await prisma.walkOut.count({
            where: {
                staffId: { in: userIds },
                isDlt: false,
                ...(dateFilter && { created_at: dateFilter }),
            },
        });

        return {
            staffs: staffsCount,
            pendingScoreCount,
            avgScore: avgScoreResult._avg.points ?? 0,
            walkOutCount,
        };
    }

    async getGraphData(supervisorId) {
        const supervisor = await prisma.user.findUnique({
            where: { id: supervisorId },
            include: { floor: true },
        });

        if (!supervisor) throw new Error("Supervisor not found");

        const usersInFloor = await prisma.user.findMany({
            where: { floor_id: supervisor.floor_id, active_flag: true },
            select: { id: true },
        });
        const userIds = usersInFloor.map((u) => u.id);

        const weeks = [];

        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
            const weekStart = startOfWeek(subWeeks(new Date(), i), {
                weekStartsOn: 1,
            });
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

            const avgScoreResult = await prisma.score.aggregate({
                where: {
                    user_id: { in: userIds },
                    isDlt: false,
                    created_at: { gte: weekStart, lte: weekEnd },
                },
                _avg: { points: true },
            });

            weeks.push({
                name: `Week ${4 - i}`,
                avgScore: avgScoreResult._avg.points ?? 0,
            });
        }

        return weeks;
    }

    async getWalkoutsThisMonth(supervisorId) {
        const supervisor = await prisma.user.findUnique({
            where: { id: supervisorId },
            include: { floor: true },
        });

        if (!supervisor) throw new Error("Supervisor not found");

        const startDate = startOfMonth(new Date());

        const usersInFloor = await prisma.user.findMany({
            where: { floor_id: supervisor.floor_id, active_flag: true },
            select: { id: true },
        });
        const userIds = usersInFloor.map((u) => u.id);

        // const walkOuts = await prisma.walkOut.findMany({
        //     where: {
        //         staffId: { in: userIds },
        //         submittedBy_id: supervisorId,
        //         isDlt: false,
        //         created_at: { gte: startDate },
        //     },
        //     include: {
        //         type: true,
        //         itemName: true,
        //     },
        //     orderBy: { created_at: "desc" },
        // });

        const pieData = Object.entries(nameCounts).map(([name, value]) => ({
            name,
            value,
        }));

        return pieData;
    }
    async getStaff(id) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return [];
            }

            const staff = await prisma.user.findMany({
                where: {
                    role: "Staff",
                    floor_id: supervisor.floor.id,
                    isDlt: false,
                },
                include: {
                    floor: true,
                    scores: {
                        where: {
                            created_at: {
                                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            },
                        },
                        orderBy: {
                            created_at: "desc",
                        },
                        take: 1,
                    },
                },
            });

            // Transform data to match expected format
            return staff.map((user) => ({
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                role: user.role,
                section: user.section,
                floor: user.floor,
                isScored: user.scores.length > 0,
                score: user.scores.length > 0 ? user.scores[0].score : 0,
                lastScoreDate:
                    user.scores.length > 0 ? user.scores[0].created_at : null,
            }));
        } catch (error) {
            console.error("Error fetching staff:", error);
            throw error;
        }
    }

    async checkIdExists(uniqueId) {
        try {
            const user = await prisma.user.findUnique({
                where: { uniqueId },
                select: { id: true },
            });
            return !!user;
        } catch (error) {
            console.error("Error checking ID existence:", error);
            return false;
        }
    }

    async getAccountantDetails(month, year) {
        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);

            // Get basic statistics
            const activeStaff = await prisma.user.count({
                where: { role: "Staff", active_flag: true, isDlt: false },
            });

            const attendanceRecords = await prisma.attendance.findMany({
                where: { createdAt: { gte: startDate, lt: endDate } },
                include: { staff: true },
            });
            // Calculate total days in the month
            const totalDaysInMonth = new Date(year, month, 0).getDate();

            const staffAttendanceMap = {};
            attendanceRecords.forEach((record) => {
                const userId = record.staffId;
                if (!staffAttendanceMap[userId])
                    staffAttendanceMap[userId] = {
                        present: 0,
                        name: record.staff.name,
                    };

                // Parse attendance data from the record fields
                const fullDays = parseInt(record.fullDays) || 0;
                const halfDays = parseInt(record.halfDays) || 0;

                // Calculate total days present (full days + half days)
                staffAttendanceMap[userId].present += fullDays + halfDays * 0.5;
            });

            // 4️⃣ Determine top attendance staff
            let topAttendanceStaff = { name: "N/A", attendance: 0 };
            Object.values(staffAttendanceMap).forEach((staff) => {
                // Use the correct formula: (Total Days by user / Total days in month) × 100
                const percent =
                    totalDaysInMonth > 0
                        ? (staff.present / totalDaysInMonth) * 100
                        : 0;
                if (percent > topAttendanceStaff.attendance) {
                    topAttendanceStaff = {
                        name: staff.name,
                        attendance: Math.round(percent),
                    };
                }
            });
            const salesRecords = await prisma.sales.findMany({
                where: { date: { gte: startDate, lt: endDate } },
                include: { staff: { include: { floor: true } } },
            });

            console.log(
                `Found ${salesRecords.length} sales records for ${month}/${year}`
            );

            const floorSalesMap = {};
            salesRecords.forEach((record) => {
                const floorName = record.staff?.floor?.name || "Unknown";
                // Use salesAmount as the primary field, but also log prodValue for debugging
                const salesAmount = parseFloat(record.salesAmount) || 0;
                const prodValue = parseFloat(record.prodValue) || 0;

                if (!floorSalesMap[floorName]) {
                    floorSalesMap[floorName] = 0;
                }
                floorSalesMap[floorName] += salesAmount;

                console.log(
                    `Staff: ${
                        record.staff?.name || "Unknown"
                    }, Floor: ${floorName}, SalesAmount: ${salesAmount}, ProdValue: ${prodValue}`
                );
            });

            console.log("Floor sales map:", floorSalesMap);

            let topFloor = { floor: "N/A", sales: 0 };
            Object.entries(floorSalesMap).forEach(([floor, sales]) => {
                if (sales > topFloor.sales) {
                    topFloor = { floor, sales };
                }
            });

            console.log("Top floor:", topFloor);

            // 6️⃣ Get top selling staff
            const topStaff = await prisma.sales.findFirst({
                where: { date: { gte: startDate, lt: endDate } },
                include: { staff: true },
                orderBy: { salesAmount: "desc" },
            });

            return {
                activeStaff,
                attendanceCount: attendanceRecords.length,
                topAttendanceStaff,
                topSaleFloor: topFloor,
                topStaffName: topStaff?.staff?.name || "N/A",
            };
        } catch (error) {
            console.error("Error fetching accountant details:", error);
            return {
                activeStaff: 0,
                attendanceCount: 0,
                topAttendanceStaff: { name: "N/A", attendance: 0 },
                topSaleFloor: { name: "N/A", sales: 0 },
                topStaffName: "N/A",
            };
        }
    }

    async getAccountantFloorPerformance(accountantId, month, year) {
        try {
            const currentMonth = parseInt(month);
            const currentYear = parseInt(year);

            const floors = await prisma.floor.findMany({
                where: { isDlt: false },
                include: {
                    users: {
                        include: {
                            sales: {
                                where: {
                                    date: {
                                        gte: new Date(
                                            currentYear,
                                            currentMonth - 1,
                                            1
                                        ),
                                        lt: new Date(
                                            currentYear,
                                            currentMonth,
                                            1
                                        ),
                                    },
                                },
                            },
                        },
                    },
                },
            });

            return floors.map((floor) => {
                const totalSales = floor.users.reduce((sum, user) => {
                    return (
                        sum +
                        user.sales.reduce(
                            (userSum, sale) =>
                                userSum + parseFloat(sale.salesAmount || 0),
                            0
                        )
                    );
                }, 0);

                // Show only 10% of actual sales for graph display
                const displaySales = totalSales * 0.1;

                return {
                    floor: floor.name,
                    sales: displaySales,
                };
            });
        } catch (error) {
            console.error("Error fetching floor performance:", error);
            // Return empty array, frontend will handle getting floors
            return [];
        }
    }

    async getAccountantFloorAttendance(month, year) {
        try {
            const currentMonth = parseInt(month);
            const currentYear = parseInt(year);
            const daysInMonth = new Date(
                currentYear,
                currentMonth,
                0
            ).getDate();

            const floors = await prisma.floor.findMany({
                where: { isDlt: false },
            });

            const floorAttendanceData = [];

            for (const floor of floors) {
                const staffInFloor = await prisma.user.findMany({
                    where: {
                        floor_id: floor.id,
                        role: "Staff",
                        isDlt: false,
                        active_flag: true, // ✅ Only active staff
                    },
                    select: { id: true },
                });

                if (staffInFloor.length === 0) {
                    floorAttendanceData.push({
                        floor: floor.name,
                        attendance: 0,
                    });
                    continue;
                }

                let totalFloorAttendancePercentage = 0;

                for (const staffMember of staffInFloor) {
                    // Get attendance record for this month
                    const attendanceRecord = await prisma.attendance.findFirst({
                        where: {
                            staffId: staffMember.id,
                            date: {
                                gte: new Date(currentYear, currentMonth - 1, 1),
                                lt: new Date(currentYear, currentMonth, 1),
                            },
                        },
                    });

                    if (!attendanceRecord) {
                        // No attendance record = 0% for this staff
                        continue;
                    }

                    // ✅ CORRECT: Parse the string fields
                    const fullDays = parseFloat(attendanceRecord.fullDays) || 0;
                    const halfDays = parseFloat(attendanceRecord.halfDays) || 0;

                    // Calculate actual attendance days
                    const actualAttendanceDays = fullDays + halfDays * 0.5;

                    // Calculate percentage for this staff member
                    const individualStaffPercentage =
                        daysInMonth > 0
                            ? (actualAttendanceDays / daysInMonth) * 100
                            : 0;

                    totalFloorAttendancePercentage += individualStaffPercentage;
                }

                // Calculate average attendance percentage for the floor
                const averageFloorAttendancePercentage = Math.round(
                    totalFloorAttendancePercentage / staffInFloor.length
                );

                floorAttendanceData.push({
                    floor: floor.name,
                    attendance: averageFloorAttendancePercentage,
                });
            }

            return floorAttendanceData;
        } catch (error) {
            console.error("Error fetching floor attendance:", error);
            throw error;
        }
    }

    async getAccountantFloorAttendance(month, year) {
        try {
            const currentMonth = parseInt(month);
            const currentYear = parseInt(year);

            // Get the number of days in the current month
            const daysInMonth = new Date(
                currentYear,
                currentMonth,
                0
            ).getDate();

            // Get all floors
            const floors = await prisma.floor.findMany({
                where: { isDlt: false },
            });

            const floorAttendanceData = [];

            for (const floor of floors) {
                // Get all active staff belonging to this floor
                const staffInFloor = await prisma.user.findMany({
                    where: {
                        floor_id: floor.id,
                        role: "Staff",
                        isDlt: false,
                    },
                    select: { id: true },
                });

                if (staffInFloor.length === 0) {
                    // If no staff in the floor, attendance is 0%
                    floorAttendanceData.push({
                        floor: floor.name,
                        attendance: 0,
                    });
                    continue;
                }

                let totalFloorAttendancePercentage = 0;

                for (const staffMember of staffInFloor) {
                    // Get attendance records for this specific staff member for the specified month
                    const attendanceRecords = await prisma.attendance.findMany({
                        where: {
                            staffId: staffMember.id.toString(),
                            createdAt: {
                                gte: new Date(currentYear, currentMonth - 1, 1),
                                lt: new Date(currentYear, currentMonth, 1),
                            },
                        },
                    });

                    // Calculate actual attendance days for this staff member
                    const actualAttendanceDays = attendanceRecords.reduce(
                        (sum, record) => {
                            const fullDays = parseInt(record.fullDays) || 0;
                            const halfDays = parseInt(record.halfDays) || 0;
                            return sum + fullDays + halfDays * 0.5;
                        },
                        0
                    );

                    // Calculate individual staff attendance percentage for the month
                    const individualStaffPercentage =
                        daysInMonth > 0
                            ? (actualAttendanceDays / daysInMonth) * 100
                            : 0;

                    totalFloorAttendancePercentage += individualStaffPercentage;
                }

                // Calculate average attendance percentage for the entire floor
                const averageFloorAttendancePercentage = Math.round(
                    totalFloorAttendancePercentage / staffInFloor.length
                );

                floorAttendanceData.push({
                    floor: floor.name,
                    attendance: averageFloorAttendancePercentage,
                });
            }

            return floorAttendanceData;
        } catch (error) {
            console.error("Error fetching floor attendance:", error);
            return [];
        }
    }
    async getEmployee() {
        const users = await prisma.user.findMany({
            where: {
                role: { not: "Owner" },

                isDlt: false,
            },
            include: {
                scores: true,

                floor: true,
            },
            orderBy: {
                created_at: "desc",
            },
        });

        const today = new Date().toDateString();

        const usersWithFlag = users.map((user) => {
            const latestScore = user.scores
                .filter((s) => !s.isDlt)
                .sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                )[0];

            const isScored =
                latestScore &&
                new Date(latestScore.created_at).toDateString() === today;

            return {
                ...user,
                isScored: !!isScored,
            };
        });

        return usersWithFlag;
    }

    // async addScore(scores, staffId, submittedId) {
    //     for (const score of scores) {
    //         const latestScore = await prisma.score.findFirst({
    //             where: {
    //                 user_id: staffId,
    //                 kpi_id: score.kpId,
    //                 isDlt: false,
    //             },
    //             orderBy: {
    //                 created_at: "desc", // get the most recent
    //             },
    //         });

    //         let trend = "same";

    //         if (latestScore) {
    //             if (score.points > latestScore.points) trend = "up";
    //             else if (score.points < latestScore.points) trend = "down";
    //         }

    //         return await prisma.score.create({
    //             data: {
    //                 kpi_id: score.kpiId,
    //                 user_id: staffId,
    //                 points: (score.score / 5) * score.weight,
    //                 score:score.score,
    //                 trend,
    //                 evalutedby_user_id: submittedId,
    //                 status: "approved",
    //                 comment: score.comment,
    //                 evalutedDate: null,
    //             },
    //         });

    //     }
    // }

    async addScore(scores, staffId, submittedId) {
        const results = [];
        for (const score of scores) {
            const latestScore = await prisma.score.findFirst({
                where: { user_id: staffId, kpi_id: score.kpiId, isDlt: false },
                orderBy: { created_at: "desc" },
            });

            let trend = "same";
            if (latestScore) {
                if (score.score > latestScore.score) trend = "up";
                else if (score.score < latestScore.score) trend = "down";
            }

            const res = await prisma.score.create({
                data: {
                    kpi_id: score.kpiId,
                    user_id: staffId,
                    points: (score.score / 5) * score.weight,
                    score: score.score,
                    trend,
                    evalutedby_user_id: submittedId,
                    status: "approved",
                    comment: score.comment,
                    evalutedDate: null,
                },
            });
            results.push(res);
        }

        return results;
    }
    async getWalkoutsOwner() {
        try {
            const walkouts = await prisma.walkOut.findMany({
                where: { isDlt: false },
                include: {
                    staff: true,
                    type: true,
                    itemName: true,
                    submittedBy: true,
                },
                orderBy: { created_at: "desc" },
            });

            const priorityCount = await prisma.walkOut.count({
                where: {
                    isDlt: false,
                    priority: "High",
                },
            });

            const now = new Date();

            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const weekWalkoutCount = await prisma.walkOut.count({
                where: {
                    isDlt: false,
                    created_at: {
                        gte: startOfWeek,
                        lte: endOfWeek,
                    },
                },
            });

            // === Today Count ===
            const startOfToday = new Date(now);
            startOfToday.setHours(0, 0, 0, 0);

            const endOfToday = new Date(now);
            endOfToday.setHours(23, 59, 59, 999);

            const todayCount = await prisma.walkOut.count({
                where: {
                    isDlt: false,
                    created_at: {
                        gte: startOfToday,
                        lte: endOfToday,
                    },
                },
            });

            return {
                walkouts,
                priorityCount,
                weekWalkoutCount,
                todayCount,
            };
        } catch (error) {
            console.error("Error in getWalkoutsOwner:", error);
            return {
                walkouts: [],
                priorityCount: 0,
                weekWalkoutCount: 0,
                todayCount: 0,
                staffs: [],
            };
        }
    }
    async getWalkouts(supervisorId) {
        const supervisor = await prisma.user.findUnique({
            where: { id: supervisorId },
        });
        const walkouts = await prisma.walkOut.findMany({
            where: { submittedBy_id: supervisorId, isDlt: false },
            include: {
                staff: true,
                type: true,
                itemName: true,
            },
            orderBy: { created_at: "desc" },
        });
        const staffs = await prisma.user.findMany({
            where: {
                floor_id: supervisor?.floor_id,
                isDlt: false,
                role: "Staff",
            },
        });

        const priorityCount = await prisma.walkOut.count({
            where: {
                submittedBy_id: supervisorId,
                isDlt: false,
                priority: "High",
            },
        });

        const now = new Date();

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weekWalkoutCount = await prisma.walkOut.count({
            where: {
                submittedBy_id: supervisorId,
                isDlt: false,
                created_at: {
                    gte: startOfWeek,
                    lte: endOfWeek,
                },
            },
        });

        // === Today Count ===
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);

        const todayCount = await prisma.walkOut.count({
            where: {
                submittedBy_id: supervisorId,
                isDlt: false,
                created_at: {
                    gte: startOfToday,
                    lte: endOfToday,
                },
            },
        });

        return {
            walkouts,
            priorityCount,
            weekWalkoutCount,
            todayCount,
            staffs,
        };
    }
    async addWalkout(data, supervisorId) {
        data = {
            submittedBy_id: supervisorId,
            ...data,
        };

        const walkout = await prisma.walkOut.create({
            data: {
                description: data.description,
                priority: data.priority,
                staff: { connect: { id: data.staffId } },
                submittedBy: { connect: { id: data.submittedBy_id } },
                itemName: {
                    connectOrCreate: {
                        where: { name: data.itemName },
                        create: { name: data.itemName },
                    },
                },
                type: {
                    connectOrCreate: {
                        where: { name: data.itemTypeName },
                        create: { name: data.itemTypeName },
                    },
                },
            },
            include: {
                staff: true,
                submittedBy: true,
                itemName: true,
                type: true,
            },
        });

        return walkout; // now the frontend receives staff, itemName, type objects
    }

    async editWalkout(data, id, supervisorId) {
        const numericId = Number(id);

        if (isNaN(numericId)) {
            throw new Error("Invalid walkOut ID");
        }

        const walkout = await prisma.walkOut.findUnique({
            where: { id: numericId },
        });

        if (!walkout || walkout.submittedBy_id !== supervisorId) {
            throw new Error("Not authorized or walkOut not found");
        }

        return await prisma.walkOut.update({
            where: { id: numericId },
            data: {
                description: data.description,
                priority: data.priority,

                staff: data.staffId
                    ? { connect: { id: data.staffId } }
                    : undefined,
            },
            include: {
                itemName: true,
                type: true,
                staff: true,
            },
        });
    }
    async deleteWalkout(id) {
        await prisma.walkOut.update({
            where: { id },
            data: { isDlt: true },
        });
    }
    async getUserByFloor(id) {
        const supervisor = await prisma.user.findUnique({
            where: { id },
        });

        if (!supervisor) return null;

        const users = await prisma.user.findMany({
            where: {
                floor_id: supervisor.floor_id,
                isDlt: false,
                role: "Staff",
            },
            select: {
                id: true,
                name: true,
                mobile: true,
                section: true,
                created_at: true,
                active_flag: true,
                uniqueId: true,
                scores: {
                    include: {
                        kpi: true,
                    },
                },
            },
        });

        const totalUser = users.length;

        const activeUser = users.filter((u) => u.active_flag === true).length;

        const inactiveUser = await prisma.user.count({
            where: { floor_id: supervisor.floor_id, active_flag: false },
        });
        const sections = [...new Set(users.map((u) => u.section))];

        return {
            users,
            totalUser,
            activeUser,
            inactiveUser,
            sections,
        };
    }
    async supervisorAddUser(id, data) {
        const supervisor = await prisma.user.findUnique({
            where: { id },
        });

        return await prisma.user.create({
            data: {
                floor_id: supervisor.floor_id,
                name: data.name,
                section: data.section,
                mobile: data.mobile,
                role: "Staff",
                uniqueId: data.uniqueId,
                pin_hash: data.pin ? await hashPassword(data.pin) : null,
            },
        });
    }
    async findId(uniqueId) {
        const existingUser = await prisma.user.findUnique({
            where: { uniqueId },
        });
    }

    async superVisorEditUser(id, data) {
        const updateData = { ...data };

        // Handle PIN update if provided
        if (data.pin && data.pin.trim() !== "") {
            updateData.pin_hash = await bcrypt.hash(data.pin, 10);
        }

        // Remove pin from updateData as we don't store it directly
        delete updateData.pin;

        return await prisma.user.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteUser(id) {
        return await prisma.user.update({
            where: { id },
            data: {
                isDlt: true,
                active_flag: false,
            },
        });
    }

    async getSupervisor(id) {
        return await prisma.user.findUnique({
            where: { id },
            include: { floor: true },
        });
    }

    async logoutSupervisor(id) {
        // Clear all active sessions for this user
        await this.logoutAllSessions(id);

        // Set user as inactive
        return await prisma.user.update({
            where: { id },
            data: {
                active_flag: false,
            },
        });
    }

    async active(id) {
        return await prisma.user.update({
            where: { id },
            data: {
                active_flag: true,
            },
        });
    }
    async toggleStaff(id, status) {
        return await prisma.user.update({
            where: { id },
            data: { active_flag: status },
        });
    }
    async getAccountantMe(id) {
        return await prisma.user.findUnique({
            where: { id },
            include: {
                floor: true,
            },
        });
    }
    async findId(id) {
        return await prisma.user.findFirst({
            where: { uniqueId: id },
        });
    }
    async updataMe(id, data) {
        return await prisma.user.update({
            where: { id },
            data: {
                ...data,
            },
        });
    }
    async updatePin(id, pin) {
        return await prisma.user.update({
            where: { id },
            data: { pin_hash: pin, pin_expires_at: null },
        });
    }
    async addSales(staffSalesData, weights) {
        for (const staff of staffSalesData) {
            for (const sale of staff.sales) {
                const weight = weights[sale.category] || 1;
                const points = (sale.per / 100) * weight;

                await prisma.sales.upsert({
                    where: {
                        staffId_year_code: {
                            staffId: staff.staffId.id,
                            year_code: sale.category,
                        },
                    },
                    update: {
                        qtySold: Math.round(sale.qty),
                        salesAmount: sale.total,
                        profit: sale.profit,
                        per: sale.per,
                        weight,
                        points,
                        updatedAt: new Date(),
                    },
                    create: {
                        staffId: staff.staffId.id,
                        year_code: sale.category,
                        qtySold: Math.round(sale.qty),
                        salesAmount: sale.total,
                        prodValue: sale.pvalue,
                        profit: sale.profit,
                        per: sale.per,
                        weight,
                        points,
                        uploadId: staff.uploadId,
                        date: new Date(),
                    },
                });
            }
        }
    }

    async findUser(uniqueId) {
        return (
            (await prisma.user.findUnique({
                where: { uniqueId },
                select: { id: true },
            })) || null
        );
    }

    async createStaffFromUpload(staffData) {
        return await prisma.user.create({
            data: {
                uniqueId: staffData.uniqueId,
                name: staffData.name,
                role: staffData.role || "Staff",
                floor_id: null, // Will be assigned later if needed
                section: null,
                mobile: null,
                pin_hash: null,
            },
            select: { id: true },
        });
    }
    async upload(file, userId) {
        return await prisma.upload.create({
            data: {
                originalname: file.originalname,
                mimetype: file.mimetype,
                path: file.path,
                size: file.size,
                uploadedBy_id: userId,
            },
        });
    }

    async getUploadById(id) {
        return await prisma.upload.findUnique({
            where: { id: parseInt(id) },
        });
    }
    async getMonthlyData(type) {
        const now = new Date();

        const startPreviousMonth = startOfMonth(subMonths(now, 1));
        return await prisma.upload.findMany({
            where: {
                uploadedAt: {
                    gte: startPreviousMonth,
                },
            },
            include: {
                sales: true,
            },
        });
    }
    async getStafByName(name) {
        return await prisma.user.findMany({
            where: {
                name: {
                    startsWith: name,
                    mode: "insensitive",
                },
                isDlt: false,
                role: "Staff",
            },
            select: {
                id: true,
                name: true,
                uniqueId: true,
                section: true,
            },
        });
    }
    async addAttendance(month, list, id) {
        for (const item of list) {
            await prisma.attendance.create({
                data: {
                    staffId: item.staffId,
                    date: new Date(month),
                    staffId: String(item.staffId),
                    fullDays: String(item.fullDays),
                    halfDays: String(item.halfDays),
                    leaveCount: String(item.leaveCount),
                    totalDays: String(item.totalDays),

                    submittedBy_id: id,
                },
            });
        }
    }
    async AccountantDetails(id, month, year) {
        const now = new Date();
        let dateFilter = {};

        // If both month and year are provided, filter by them
        if (month && year) {
            const startDate = new Date(year, month - 1, 1); // month is 0-indexed
            const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of month
            dateFilter = { gte: startDate, lte: endDate };
        } else {
            // fallback: use period
            const period =
                month === "month" || month === "year" ? month : "month";
            if (period === "month") {
                dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
            } else if (period === "year") {
                dateFilter = { gte: startOfYear(now), lte: endOfYear(now) };
            }
        }

        // 1️⃣ Active Staff (total, not filtered by period)
        const activeStaff = await prisma.user.count({
            where: { isDlt: false, active_flag: true, role: "Staff" },
        });

        // 2️⃣ Upload count for the selected period
        const uploadCount = await prisma.upload.count({
            where: { uploadedBy_id: id, uploadedAt: { ...dateFilter } },
        });

        // 3️⃣ Attendance count for the selected period
        const attendanceCount = await prisma.attendance.count({
            where: { submittedBy_id: id, date: { ...dateFilter } },
        });

        // 4️⃣ Top staff based on total points
        const topStaffAggregate = await prisma.sales.groupBy({
            by: ["staffId"],
            where: { createdAt: { ...dateFilter } },
            _sum: { points: true },
            orderBy: { _sum: { points: "desc" } },
            take: 1,
        });

        let topStaffName = "N/A";
        let topStaffPoints = 0;

        if (topStaffAggregate.length > 0) {
            const staffId = topStaffAggregate[0].staffId;
            const staff = await prisma.user.findUnique({
                where: { id: staffId },
                select: { name: true },
            });
            topStaffName = staff?.name || "N/A";
            topStaffPoints = topStaffAggregate[0]._sum.points || 0;
        }

        return {
            activeStaff,
            uploadCount,
            attendanceCount,
            topStaffName,
            topStaffPoints,
        };
    }
    async getScore(staffId, month, year) {
        const now = new Date();
        const startDate = month
            ? startOfMonth(new Date(year, month - 1))
            : startOfYear(new Date(year));
        const endDate = month
            ? endOfMonth(new Date(year, month - 1))
            : endOfYear(new Date(year));

        const totalSales = await prisma.sales.count({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const totalQtySold = await prisma.sales.aggregate({
            _sum: {
                qtySold: true,
            },
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const totalProfit = await prisma.sales.aggregate({
            _sum: {
                profit: true,
            },
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const staffWithPoints = await prisma.sales.groupBy({
            by: ["staffId"],
            _sum: { points: true, qtySold: true, profit: true },
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
            orderBy: {
                _sum: {
                    points: "desc",
                },
            },
        });

        const staffIds = staffWithPoints.map((s) => s.staffId);
        const staffDetails = await prisma.user.findMany({
            where: { id: { in: staffIds } },
            select: {
                id: true,
                name: true,

                role: true,
            },
        });

        const rankedStaff = staffWithPoints.map((s) => ({
            staffId: s.staffId,
            totalPoints: s._sum.points || 0,
            totalQtySold: s._sum.qtySold || 0,
            totalProfit: s._sum.profit || 0,
            staff: staffDetails.find((st) => st.id === s.staffId),
        }));

        return {
            totalSales,
            totalQtySold: totalQtySold._sum.qtySold || 0,
            totalProfit: totalProfit._sum.profit || 0,
            totalStaff: rankedStaff.length,
            staffRanking: rankedStaff,
        };
    }

    async walkoutExport(type) {
        const now = new Date();
        let dateFilter = {};

        if (type === "weekly") {
            dateFilter = {
                gte: startOfWeek(now, { weekStartsOn: 1 }),
                lte: endOfWeek(now, { weekStartsOn: 1 }),
            };
        } else if (type === "monthly") {
            dateFilter = {
                gte: startOfMonth(now),
                lte: endOfMonth(now),
            };
        }

        const whereClause = {
            isDlt: false,
            ...(Object.keys(dateFilter).length > 0 && {
                created_at: dateFilter,
            }),
        };

        const data = await prisma.walkOut.findMany({
            where: whereClause,
            include: {
                itemName: true,
                type: true,
                staff: true,
                submittedBy: true,
            },
        });

        return data;
    }
    async fetchItem(name) {
        return await prisma.itemName.findMany({
            where: {
                name: {
                    startsWith: name,
                    mode: "insensitive",
                },
            },
        });
    }
    async fetchType(name) {
        return await prisma.itemType.findMany({
            where: {
                name: {
                    startsWith: name,
                    mode: "insensitive",
                },
            },
        });
    }
    async addItem(data) {
        return await prisma.itemName.create({
            data: { name: data.name },
        });
    }
    async addItemType(data) {
        return await prisma.itemType.create({
            data: { name: data.name },
        });
    }
    async findType(name) {
        return await prisma.itemType.findFirst({
            where: { name },
        });
    }
    async findItemName(name) {
        return await prisma.itemName.findFirst({
            where: { name },
        });
    }
    async getWalkoutsByID(id) {
        return await prisma.walkOut.findUnique({
            where: { id: Number(id) },
            include: {
                staff: true,
                submittedBy: true,
                itemName: true,
                type: true,
            },
        });
    }
    async updateMeSupervisor(id, data) {
        return await prisma.user.update({
            where: { id },
            data: data,
        });
    }
    async getScoreKpi() {
        const kpis = await prisma.KPI.findMany({
            where: { isDlt: false },
        });

        const today = new Date();

        const filtered = kpis.filter((kpi) => {
            const createdAt = new Date(kpi.created_at);

            if (kpi.frequency === "daily") {
                return true;
            }

            if (kpi.frequency === "weekly") {
                const nextWeekDate = addDays(createdAt, 7);
                return isSameDay(today, nextWeekDate);
            }

            if (kpi.frequency === "monthly") {
                const nextMonthDate = addMonths(createdAt, 1);
                return isSameDay(today, nextMonthDate);
            }

            return false;
        });

        return filtered;
    }
    async getEmployeeScore(id) {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        return await prisma.score.findMany({
            where: {
                user_id: id,
                created_at: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });
    }

    // Get user scores for scoring page
    async getUserScores(id) {
        try {
            const scores = await prisma.score.findMany({
                where: {
                    user_id: id,
                    isDlt: false,
                },
                include: {
                    kpi: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            // Transform to match expected format
            return scores.map((score) => ({
                kpi_id: score.kpi_id,
                score: score.score,
                comment: score.comment,
                kpi: score.kpi,
            }));
        } catch (error) {
            console.error("Error fetching user scores:", error);
            throw error;
        }
    }
    // Submit score for supervisor scoring
    async submitScore(scores, staffId, supervisorId) {
        try {
            const results = [];
            for (const score of scores) {
                const latestScore = await prisma.score.findFirst({
                    where: {
                        user_id: staffId,
                        kpi_id: score.kpiId,
                        isDlt: false,
                    },
                    orderBy: { created_at: "desc" },
                });

                let trend = "same";
                if (latestScore) {
                    if (score.score > latestScore.score) trend = "up";
                    else if (score.score < latestScore.score) trend = "down";
                }

                const res = await prisma.score.create({
                    data: {
                        kpi_id: score.kpiId,
                        user_id: staffId,
                        points: (score.score / 5) * score.weight,
                        score: score.score,
                        trend,
                        evalutedby_user_id: supervisorId,
                        status: "approved",
                        comment: score.comment,
                        evalutedDate: null,
                    },
                });
                results.push(res);
            }

            return results;
        } catch (error) {
            console.error("Error submitting score:", error);
            throw error;
        }
    }

    // Update score for supervisor scoring
    async updateScore(scores, staffId, supervisorId) {
        try {
            const results = [];
            for (const score of scores) {
                const latestScore = await prisma.score.findFirst({
                    where: {
                        user_id: staffId,
                        kpi_id: score.kpiId,
                        isDlt: false,
                    },
                    orderBy: { created_at: "desc" },
                });

                if (latestScore) {
                    let trend = "same";
                    if (score.score > latestScore.score) trend = "up";
                    else if (score.score < latestScore.score) trend = "down";

                    const updated = await prisma.score.update({
                        where: { id: latestScore.id },
                        data: {
                            score: score.score,
                            points: (score.score / 5) * score.weight,
                            comment: score.comment,
                            trend,
                            updated_at: new Date(),
                        },
                    });

                    results.push(updated);
                } else {
                    // if no previous score exists → create a new one
                    const created = await prisma.score.create({
                        data: {
                            kpi_id: score.kpiId,
                            user_id: staffId,
                            points: (score.score / 5) * score.weight,
                            score: score.score,
                            trend: "new",
                            evalutedby_user_id: supervisorId,
                            status: "approved",
                            comment: score.comment,
                            evalutedDate: null,
                        },
                    });

                    results.push(created);
                }
            }

            return results;
        } catch (error) {
            console.error("Error updating score:", error);
            throw error;
        }
    }

    async updateScoreEmployee(id, staffId, body) {
        const results = [];
        for (const score of body.scores) {
            const latestScore = await prisma.score.findFirst({
                where: { user_id: staffId, kpi_id: score.kpiId, isDlt: false },
                orderBy: { created_at: "desc" },
            });

            if (latestScore) {
                let trend = "same";
                if (score.score > latestScore.score) trend = "up";
                else if (score.score < latestScore.score) trend = "down";

                const updated = await prisma.score.update({
                    where: { id: latestScore.id },
                    data: {
                        score: score.score,
                        points: (score.score / 5) * score.weight,
                        comment: score.comment,
                        trend,
                        updated_at: new Date(),
                    },
                });

                results.push(updated);
            } else {
                // if no previous score exists → create a new one
                const created = await prisma.score.create({
                    data: {
                        points: (score.score / 5) * score.weight,
                        score: score.score,
                        trend: "same",
                        comment: score.comment,
                        status: "approved",
                        evalutedDate: null,

                        // ✅ Proper relation connections
                        user: {
                            connect: { id: staffId },
                        },
                        kpi: {
                            connect: { id: score.kpiId },
                        },
                        evalutedby: {
                            connect: { id },
                        },
                    },
                });

                results.push(created);
            }
        }

        return results;
    }
    async getStaffReport(startDate, endDate, month, year) {
        try {
            console.log("getStaffReport called with:", {
                startDate,
                endDate,
                month,
                year,
            });

            // Parse dates if provided
            let whereClause = {
                isDlt: false,
                role: {
                    not: "Owner",
                },
            };

            // Don't filter users by creation date - we want all users
            // Only filter their scores by the date range

            const staffWithScores = await prisma.user.findMany({
                where: whereClause,
                include: {
                    scores: {
                        where: {
                            isDlt: false,
                            ...(startDate && endDate
                                ? {
                                      created_at: {
                                          gte: new Date(startDate),
                                          lte: new Date(endDate),
                                      },
                                  }
                                : {}),
                        },
                        include: {
                            kpi: true,
                        },
                        orderBy: {
                            created_at: 'desc'
                        }
                    },
                    floor: true,
                },
            });

            console.log("Found staff:", staffWithScores.length);
            const staffReport = staffWithScores.map((staff) => {
                const totalScore = staff.scores.reduce(
                    (sum, score) => sum + score.points,
                    0
                );
                const avgScore =
                    staff.scores.length > 0
                        ? Math.round(totalScore / staff.scores.length)
                        : 0;

                // Calculate KPI-specific scores
                const kpiScores = {};
                const kpiAverages = {};

                staff.scores.forEach((score) => {
                    const kpiName = score.kpi?.name || "Unknown";
                    if (!kpiScores[kpiName]) {
                        kpiScores[kpiName] = [];
                    }
                    kpiScores[kpiName].push(score.score);
                });

                // Calculate average for each KPI
                Object.keys(kpiScores).forEach((kpiName) => {
                    const scores = kpiScores[kpiName];
                    if (scores.length > 0) {
                        kpiAverages[kpiName] = Math.round(
                            scores.reduce((sum, score) => sum + score, 0) /
                                scores.length
                        );
                    } else {
                        kpiAverages[kpiName] = 0;
                    }
                });

                console.log(
                    "Staff KPI calculation:",
                    staff.name,
                    "Total scores:",
                    staff.scores.length,
                    "KPI averages:",
                    kpiAverages
                );

                const staffData = {
                    id: staff.id, // Database UUID
                    staffId: staff.uniqueId, // Unique ID for display
                    name: staff.name,
                    mobile: staff.mobile,
                    role: staff.role,
                    section: staff.section,
                    floor: staff.floor?.name || "N/A",
                    avgScore,
                    kpiScores: kpiAverages,
                    totalKPIs: Object.keys(kpiAverages).length,
                    joinDate: staff.created_at, // Add join date for grouping
                };

                console.log(
                    "Staff data:",
                    staff.name,
                    "Scores:",
                    staff.scores.length,
                    "KPIs:",
                    Object.keys(kpiAverages)
                );
                return staffData;
            });

            // Sort by average score (descending)
            staffReport.sort((a, b) => b.avgScore - a.avgScore);

            console.log(
                "getStaffReport returning:",
                staffReport.length,
                "staff members"
            );
            return staffReport;
        } catch (error) {
            console.error("Error in getStaffReport:", error);
            throw error;
        }
    }

    // New function to get staff report grouped by month
    async getStaffReportByMonth(startDate, endDate, month, year) {
        try {
            console.log("getStaffReportByMonth called with:", {
                startDate,
                endDate,
                month,
                year,
            });

            // Get all staff data
            const staffReport = await this.getStaffReport(startDate, endDate, month, year);
            
            // Group staff by month based on join date
            const monthGroups = {};
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            // Initialize empty arrays for each month
            monthNames.forEach(monthName => {
                monthGroups[monthName] = [];
            });

            // Group staff by their join month
            staffReport.forEach(staff => {
                const joinDate = new Date(staff.joinDate);
                const monthName = joinDate.toLocaleDateString('en-US', { month: 'long' });
                
                if (monthGroups[monthName]) {
                    monthGroups[monthName].push(staff);
                }
            });

            // Filter out empty months and return only months with staff
            const filteredMonthGroups = {};
            Object.keys(monthGroups).forEach(monthName => {
                if (monthGroups[monthName].length > 0) {
                    filteredMonthGroups[monthName] = monthGroups[monthName];
                }
            });

            console.log("getStaffReportByMonth returning:", Object.keys(filteredMonthGroups).length, "months with staff");
            return filteredMonthGroups;
        } catch (error) {
            console.error("Error in getStaffReportByMonth:", error);
            throw error;
        }
    }

    async getSalesReport(month, year) {
        // Derive date range from month/year (month is 0/1 indexed on frontend? we expect numeric 0-11 or 1-12; handle both)
        const numericMonth = month != null ? Number(month) : undefined;
        const numericYear = year != null ? Number(year) : undefined;

        let startDate;
        let endDate;
        if (numericYear != null && numericMonth != null) {
            const m = numericMonth > 11 ? numericMonth - 1 : numericMonth; // support 1-12 or 0-11
            startDate = new Date(numericYear, m, 1);
            endDate = endOfMonth(startDate);
        } else if (numericYear != null && numericMonth == null) {
            startDate = startOfYear(new Date(numericYear, 0, 1));
            endDate = endOfYear(new Date(numericYear, 0, 1));
        } else {
            // default current month
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
        }

        // Group sales by staff within the date range
        const grouped = await prisma.sales.groupBy({
            by: ["staffId"],
            where: {
                createdAt: { gte: startDate, lte: endDate },
            },
            _sum: {
                qtySold: true,
                salesAmount: true,
                prodValue: true,
                profit: true,
                points: true,
                weight: true,
            },
        });

        const staffIds = grouped.map((g) => g.staffId);
        const staffMap = new Map(
            (
                await prisma.user.findMany({
                    where: { id: { in: staffIds } },
                    select: {
                        id: true,
                        name: true,
                        uniqueId: true,
                        role: true,
                    },
                })
            ).map((u) => [u.id, u])
        );

        const list = grouped.map((g) => {
            const staff = staffMap.get(g.staffId);
            return {
                staffId: staff?.uniqueId || g.staffId,
                staffName: staff?.name || "Unknown",
                role: staff?.role || "",
                qtySold: g._sum.qtySold || 0,
                salesAmount: g._sum.salesAmount || 0,
                prodValue: g._sum.prodValue || 0,
                profit: g._sum.profit || 0,
                points: g._sum.points || 0,
                weight: g._sum.weight || 0,
            };
        });

        // Totals summary
        const summary = list.reduce(
            (acc, s) => {
                acc.totalQty += s.qtySold;
                acc.totalSales += s.salesAmount;
                acc.totalProfit += s.profit;
                acc.totalPoints += s.points;
                return acc;
            },
            { totalQty: 0, totalSales: 0, totalProfit: 0, totalPoints: 0 }
        );

        return { list, summary };
    }

    async getAttendanceReport(month, year) {
        // Default to current month if no month/year provided
        let startDate, endDate;
        if (month != null && year != null) {
            startDate = new Date(year, month - 1, 1); // ✅ Corrected
            endDate = endOfMonth(startDate);
        } else {
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
        }

        // Get attendance data for the period
        const attendanceData = await prisma.attendance.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
            },
            include: {
                staff: {
                    select: {
                        id: true,
                        name: true,
                        uniqueId: true,
                        role: true,
                        section: true,
                        floor: { select: { name: true } },
                    },
                },
            },
            orderBy: { date: "desc" },
        });

        // Calculate summary
        const totalStaff = await prisma.user.count({
            where: { isDlt: false, role: { not: "Owner" } },
        });

        const totalAttendance = attendanceData.length;
        const totalFullDays = attendanceData.reduce(
            (sum, a) => sum + Number(a.fullDays || 0),
            0
        );
        const totalHalfDays = attendanceData.reduce(
            (sum, a) => sum + Number(a.halfDays || 0),
            0
        );
        const totalLeaves = attendanceData.reduce(
            (sum, a) => sum + Number(a.leaveCount || 0),
            0
        );

        return {
            attendance: attendanceData,
            summary: {
                totalStaff,
                totalAttendance,
                totalFullDays,
                totalHalfDays,
                totalLeaves,
            },
        };
    }

    async getWalkoutReport(month, year) {
        // Default to current month if no month/year provided
        let startDate, endDate;
        if (month != null && year != null) {
            const m = month > 11 ? month - 1 : month; // support 1-12 or 0-11
            startDate = new Date(year, m, 1);
            endDate = endOfMonth(startDate);
        } else {
            // default current month
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
        }

        // Get walkout data for the period
        const walkoutData = await prisma.walkOut.findMany({
            where: {
                created_at: { gte: startDate, lte: endDate },
                isDlt: false,
            },
            include: {
                staff: {
                    select: {
                        id: true,
                        name: true,
                        uniqueId: true,
                        role: true,
                        section: true,
                        floor: { select: { name: true } },
                    },
                },
                itemName: { select: { name: true } },
                type: { select: { name: true } },
                submittedBy: {
                    select: {
                        id: true,
                        name: true,
                        uniqueId: true,
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        // Calculate summary
        const totalWalkouts = walkoutData.length;
        const highPriority = walkoutData.filter(
            (w) => w.priority === "High"
        ).length;
        const mediumPriority = walkoutData.filter(
            (w) => w.priority === "Medium"
        ).length;
        const lowPriority = walkoutData.filter(
            (w) => w.priority === "Low"
        ).length;

        return {
            walkouts: walkoutData,
            summary: {
                totalWalkouts,
                highPriority,
                mediumPriority,
                lowPriority,
            },
        };
    }

    // Dashboard Graph Data Methods
    async getDashboardGraphData(type, months = 4) {
        try {
            const currentDate = new Date();
            const graphData = [];

            for (let i = months - 1; i >= 0; i--) {
                const targetDate = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - i,
                    1
                );
                const startDate = startOfMonth(targetDate);
                const endDate = endOfMonth(targetDate);

                const monthName = targetDate.toLocaleDateString("en-US", {
                    month: "short",
                });
                const year = targetDate.getFullYear();

                let value = 0;

                try {
                    switch (type) {
                        case "sales":
                            const salesData = await prisma.sales.aggregate({
                                where: {
                                    createdAt: { gte: startDate, lte: endDate },
                                },
                                _sum: {
                                    salesAmount: true,
                                },
                            });
                            value = salesData._sum.salesAmount || 0;
                            break;

                        case "walkouts":
                            const walkoutCount = await prisma.walkOut.count({
                                where: {
                                    created_at: {
                                        gte: startDate,
                                        lte: endDate,
                                    },
                                    isDlt: false,
                                },
                            });
                            value = walkoutCount;
                            break;

                        case "staff":
                            const staffCount = await prisma.user.count({
                                where: {
                                    created_at: {
                                        gte: startDate,
                                        lte: endDate,
                                    },
                                    isDlt: false,
                                    role: { not: "Owner" },
                                },
                            });
                            value = staffCount;
                            break;

                        default:
                            value = 0;
                    }
                } catch (dbError) {
                    console.error(
                        `Database error for ${type} in month ${monthName}:`,
                        dbError
                    );
                    value = 0; // Set default value if database query fails
                }

                graphData.push({
                    month: monthName,
                    year: year,
                    value: value,
                    period: `${monthName} ${year}`,
                });
            }

            return graphData;
        } catch (error) {
            console.error("Error in getDashboardGraphData:", error);
            // Return empty array if there's a general error
            return [];
        }
    }

    async getFloorPerformanceData() {
        try {
            const floors = await prisma.floor.findMany({
                where: { isDlt: false },
                include: {
                    users: {
                        where: { isDlt: false, role: { not: "Owner" } },
                        include: {
                            sales: {
                                where: {
                                    date: { gte: startOfMonth(new Date()) },
                                },
                            },
                        },
                    },
                },
            });

            const floorData = floors.map((floor) => {
                const totalSales = floor.users.reduce((sum, user) => {
                    return (
                        sum +
                        user.sales.reduce(
                            (userSum, sale) =>
                                userSum + parseFloat(sale.salesAmount || 0),
                            0
                        )
                    );
                }, 0);

                // Show only 10% of actual sales for graph display (same as AccountantScreen)
                const displaySales = totalSales * 0.1;

                return {
                    floor: floor.name,
                    sales: displaySales,
                    staffCount: floor.users.length,
                };
            });

            return floorData;
        } catch (error) {
            console.error("Error in getFloorPerformanceData:", error);
            // Return empty array if database connection fails
            return [];
        }
    }

    // Graph data methods for supervisor dashboard
    async getSalesGraphData(supervisorId, timeframe) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return [];
            }

            const endDate = new Date();
            const startDate = new Date();

            if (timeframe === "week") {
                startDate.setDate(endDate.getDate() - 28); // Last 4 weeks
            } else {
                startDate.setMonth(endDate.getMonth() - 4); // Last 4 months
            }

            const salesData = await prisma.sales.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                    staff: {
                        floor_id: supervisor.floor.id,
                    },
                },
                include: {
                    staff: true,
                },
            });

            // Group by time period
            const groupedData = {};
            salesData.forEach((sale) => {
                const date = new Date(sale.created_at);
                let period;

                if (timeframe === "week") {
                    const weekNum =
                        Math.floor(
                            (date - startDate) / (7 * 24 * 60 * 60 * 1000)
                        ) + 1;
                    period = `Week ${weekNum}`;
                } else {
                    const monthNum =
                        Math.floor(
                            (date - startDate) / (30 * 24 * 60 * 60 * 1000)
                        ) + 1;
                    period = `Month ${monthNum}`;
                }

                if (!groupedData[period]) {
                    groupedData[period] = 0;
                }
                groupedData[period] += sale.quantity || 0;
            });

            return Object.entries(groupedData).map(([name, value]) => ({
                name,
                value,
            }));
        } catch (error) {
            console.error("Error fetching sales graph data:", error);
            return [];
        }
    }

    async getWalkoutGraphData(supervisorId, timeframe) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return [];
            }

            const endDate = new Date();
            const startDate = new Date();

            if (timeframe === "week") {
                startDate.setDate(endDate.getDate() - 28); // Last 4 weeks
            } else {
                startDate.setMonth(endDate.getMonth() - 4); // Last 4 months
            }

            const walkoutData = await prisma.walkOut.findMany({
                where: {
                    created_at: {
                        gte: startDate,
                        lte: endDate,
                    },
                    staff: {
                        floor_id: supervisor.floor.id,
                    },
                },
            });

            // Group by time period
            const groupedData = {};
            walkoutData.forEach((walkout) => {
                const date = new Date(walkout.created_at);
                let period;

                if (timeframe === "week") {
                    const weekNum =
                        Math.floor(
                            (date - startDate) / (7 * 24 * 60 * 60 * 1000)
                        ) + 1;
                    period = `Week ${weekNum}`;
                } else {
                    const monthNum =
                        Math.floor(
                            (date - startDate) / (30 * 24 * 60 * 60 * 1000)
                        ) + 1;
                    period = `Month ${monthNum}`;
                }

                if (!groupedData[period]) {
                    groupedData[period] = 0;
                }
                groupedData[period]++;
            });

            return Object.entries(groupedData).map(([name, value]) => ({
                name,
                value,
            }));
        } catch (error) {
            console.error("Error fetching walkout graph data:", error);
            return [];
        }
    }

    async getStaffGraphData(supervisorId, timeframe) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return [];
            }

            const endDate = new Date();
            const startDate = new Date();

            if (timeframe === "week") {
                startDate.setDate(endDate.getDate() - 28); // Last 4 weeks
            } else {
                startDate.setMonth(endDate.getMonth() - 4); // Last 4 months
            }

            const staffData = await prisma.score.findMany({
                where: {
                    created_at: {
                        gte: startDate,
                        lte: endDate,
                    },
                    user: {
                        floor_id: supervisor.floor.id,
                    },
                },
                include: {
                    user: true,
                    kpi: true,
                },
            });

            // Group by time period and calculate average scores
            const groupedData = {};
            staffData.forEach((score) => {
                const date = new Date(score.created_at);
                let period;

                if (timeframe === "week") {
                    const weekNum =
                        Math.floor(
                            (date - startDate) / (7 * 24 * 60 * 60 * 1000)
                        ) + 1;
                    period = `Week ${weekNum}`;
                } else {
                    const monthNum =
                        Math.floor(
                            (date - startDate) / (30 * 24 * 60 * 60 * 1000)
                        ) + 1;
                    period = `Month ${monthNum}`;
                }

                if (!groupedData[period]) {
                    groupedData[period] = { total: 0, count: 0 };
                }
                groupedData[period].total += score.score || 0;
                groupedData[period].count++;
            });

            return Object.entries(groupedData).map(([name, data]) => ({
                name,
                value:
                    data.count > 0
                        ? Math.round((data.total / data.count) * 10) / 10
                        : 0,
            }));
        } catch (error) {
            console.error("Error fetching staff graph data:", error);
            return [];
        }
    }

    // Supervisor reports methods
    async getSupervisorFloor(supervisorId) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });
            return supervisor?.floor;
        } catch (error) {
            console.error("Error fetching supervisor floor:", error);
            return null;
        }
    }

    // Get staff for supervisor scoring (floor-specific)
    async getSupervisorStaffForScoring(supervisorId) {
        try {
            // First get supervisor's floor
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return [];
            }

            // Get all staff from supervisor's floor
            const staff = await prisma.user.findMany({
                where: {
                    floorId: supervisor.floor.id,
                    role: "Staff", // Only get staff members, not other supervisors
                    isActive: true,
                },
                include: {
                    floor: true,
                    scores: {
                        where: {
                            created_at: {
                                gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
                            },
                        },
                        orderBy: {
                            created_at: "desc",
                        },
                        take: 1,
                    },
                },
            });

            // Transform data to match expected format
            return staff.map((user) => ({
                id: user.id,
                name: user.name,
                mobile: user.mobile,
                email: user.email,
                role: user.role,
                section: user.section,
                floor: user.floor,
                isScored: user.scores.length > 0,
                score: user.scores.length > 0 ? user.scores[0].score : 0,
                lastScoreDate:
                    user.scores.length > 0 ? user.scores[0].createdAt : null,
            }));
        } catch (error) {
            console.error(
                "Error fetching supervisor staff for scoring:",
                error
            );
            throw error;
        }
    }

    async getSupervisorReports(supervisorId, range) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return {
                    staff: [],
                    walkouts: [],
                    sales: [],
                    floorInfo: null,
                };
            }

            const endDate = new Date();
            const startDate = new Date();

            switch (range) {
                case "week":
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case "month":
                    startDate.setMonth(endDate.getMonth() - 1);
                    break;
                case "quarter":
                    startDate.setMonth(endDate.getMonth() - 3);
                    break;
                default:
                    startDate.setMonth(endDate.getMonth() - 1);
            }

            // Get staff data for the supervisor's floor
            const staff = await prisma.user.findMany({
                where: {
                    floor_id: supervisor.floor.id,
                    isDlt: false,
                    role: { not: "FloorSupervisor" },
                },
                include: {
                    scores: {
                        include: {
                            kpi: true,
                        },
                        where: {
                            created_at: {
                                gte: startDate,
                                lte: endDate,
                            },
                        },
                    },
                },
            });

            // Calculate average scores and KPI counts for staff
            const staffWithStats = staff.map((member) => {
                const scores = member.scores || [];
                const averageScore =
                    scores.length > 0
                        ? scores.reduce(
                              (sum, score) => sum + (score.score || 0),
                              0
                          ) / scores.length
                        : 0;
                const kpiCount = scores.length;
                const lastUpdated =
                    scores.length > 0
                        ? new Date(
                              Math.max(
                                  ...scores.map((s) => new Date(s.created_at))
                              )
                          )
                        : null;

                return {
                    ...member,
                    averageScore: Math.round(averageScore * 10) / 10,
                    kpiCount,
                    lastUpdated: lastUpdated
                        ? lastUpdated.toLocaleDateString()
                        : null,
                };
            });

            // Get walkouts data for the supervisor's floor
            const walkouts = await prisma.walkOut.findMany({
                where: {
                    created_at: {
                        gte: startDate,
                        lte: endDate,
                    },
                    staff: {
                        floor_id: supervisor.floor.id,
                    },
                },
                include: {
                    staff: true,
                    itemName: true,
                    type: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            // Get sales data for the supervisor's floor
            const sales = await prisma.sales.findMany({
                where: {
                    created_at: {
                        gte: startDate,
                        lte: endDate,
                    },
                    user: {
                        floor_id: supervisor.floor.id,
                    },
                },
                include: {
                    user: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            return {
                staff: staffWithStats,
                walkouts,
                sales,
                floorInfo: {
                    name: supervisor.floor.name,
                    floorNumber: supervisor.floor.floorNumber || "N/A",
                    section: supervisor.floor.section || "N/A",
                },
            };
        } catch (error) {
            console.error("Error fetching supervisor reports:", error);
            return {
                staff: [],
                walkouts: [],
                sales: [],
                floorInfo: null,
            };
        }
    }

    // Individual report methods for supervisor
    async getSupervisorStaffReport(supervisorId, start, end) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return [];
            }

            // Build date filter
            const dateFilter = {};
            if (start && end) {
                dateFilter.created_at = {
                    gte: new Date(start),
                    lte: new Date(end),
                };
            }

            // Get staff data for the supervisor's floor
            const staff = await prisma.user.findMany({
                where: {
                    floor_id: supervisor.floor.id,
                    isDlt: false,
                    role: "Staff",
                },
                include: {
                    scores: {
                        include: {
                            kpi: true,
                        },
                        where: dateFilter,
                    },
                },
            });

            // Calculate statistics for each staff member
            const staffWithStats = staff.map((member) => {
                const scores = member.scores || [];
                const avgScore =
                    scores.length > 0
                        ? scores.reduce(
                              (sum, score) => sum + (score.score || 0),
                              0
                          ) / scores.length
                        : 0;
                const totalKPIs = scores.length;
                const completedKPIs = scores.filter((s) => s.score > 0).length;

                return {
                    staffId: member.uniqueId,
                    name: member.name,
                    mobile: member.mobile,
                    email: member.email,
                    role: member.role,
                    section: member.section,
                    floor: member.floor,
                    active_flag: member.active_flag,
                    avgScore: Math.round(avgScore * 10) / 10,
                    totalKPIs,
                    completedKPIs,
                    completionRate:
                        totalKPIs > 0
                            ? Math.round((completedKPIs / totalKPIs) * 100)
                            : 0,
                };
            });

            return staffWithStats;
        } catch (error) {
            console.error("Error fetching supervisor staff report:", error);
            return [];
        }
    }

    async getSupervisorSalesReport(supervisorId, start, end) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return { list: [], summary: {} };
            }

            // Build date filter
            const dateFilter =
                start && end
                    ? {
                          created_at: {
                              gte: new Date(start),
                              lte: new Date(end),
                          },
                      }
                    : {};

            // Get sales data for the supervisor's floor
            const sales = await prisma.sales.findMany({
                where: {
                    user: {
                        floor_id: supervisor.floor.id,
                    },
                    ...dateFilter,
                },
                include: {
                    user: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            // Summary accumulators
            let totalQty = 0;
            let totalRevenue = 0;
            let totalProfit = 0;
            let totalPoints = 0;

            // Group sales by staff
            const staffSales = {};

            for (const sale of sales) {
                const user = sale.user;
                if (!user) continue;

                const staffKey = user.id;

                if (!staffSales[staffKey]) {
                    staffSales[staffKey] = {
                        staffId: user.uniqueId,
                        staffName: user.name,
                        mobile: user.mobile || "N/A",
                        email: user.email || "N/A",
                        qtySold: 0,
                        salesAmount: 0,
                        prodValue: 0,
                        profit: 0,
                        points: 0,
                    };
                }

                const qty = sale.quantity || 0;
                const price = sale.price || 0;
                const prodValue = sale.prodValue || 0;
                const salesAmount = qty * price;
                const profit = salesAmount - prodValue;
                const points = sale.points || 0;

                staffSales[staffKey].qtySold += qty;
                staffSales[staffKey].salesAmount += salesAmount;
                staffSales[staffKey].prodValue += prodValue;
                staffSales[staffKey].profit += profit;
                staffSales[staffKey].points += points;

                totalQty += qty;
                totalRevenue += salesAmount;
                totalProfit += profit;
                totalPoints += points;
            }

            const list = Object.values(staffSales);

            return {
                list,
                summary: {
                    totalQty,
                    totalRevenue,
                    totalProfit,
                    totalPoints,
                    totalStaff: list.length,
                    avgSaleValue: list.length ? totalRevenue / list.length : 0,
                },
            };
        } catch (error) {
            console.error("Error fetching supervisor sales report:", error);
            return { list: [], summary: {} };
        }
    }

    async getSupervisorAttendanceReport(supervisorId, start, end) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return { list: [], summary: {} };
            }

            // Build date filter
            const dateFilter = {};
            if (start && end) {
                dateFilter.created_at = {
                    gte: new Date(start),
                    lte: new Date(end),
                };
            }

            // Get attendance data for the supervisor's floor
            const attendance = await prisma.attendance.findMany({
                where: {
                    staff: {
                        floor_id: supervisor.floor.id,
                    },
                    ...dateFilter,
                },
                include: {
                    staff: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            // Transform attendance data to match export format
            const list = attendance.map((record) => ({
                staff: {
                    uniqueId: record.staff.uniqueId,
                    name: record.staff.name,
                },
                date: record.date,
                fullDays: parseInt(record.fullDays) || 0,
                halfDays: parseInt(record.halfDays) || 0,
                leaveCount: parseInt(record.leaveCount) || 0,
                totalDays: parseInt(record.totalDays) || 1,
            }));

            // Calculate summary
            const totalAttendance = attendance.length;
            const presentCount = attendance.reduce(
                (sum, a) => sum + (parseInt(a.fullDays) || 0),
                0
            );
            const absentCount = attendance.reduce(
                (sum, a) => sum + (parseInt(a.leaveCount) || 0),
                0
            );
            const attendanceRate =
                totalAttendance > 0
                    ? (presentCount / totalAttendance) * 100
                    : 0;

            return {
                list,
                summary: {
                    totalAttendance,
                    presentCount,
                    absentCount,
                    attendanceRate: Math.round(attendanceRate * 100) / 100,
                },
            };
        } catch (error) {
            console.error(
                "Error fetching supervisor attendance report:",
                error
            );
            return { list: [], summary: {} };
        }
    }

    async getSupervisorWalkoutReport(supervisorId, start, end) {
        try {
            const supervisor = await prisma.user.findUnique({
                where: { id: supervisorId },
                include: { floor: true },
            });

            if (!supervisor?.floor) {
                return { list: [], summary: {} };
            }

            // Build date filter
            const dateFilter = {};
            if (start && end) {
                dateFilter.created_at = {
                    gte: new Date(start),
                    lte: new Date(end),
                };
            }

            // Get walkout data for the supervisor's floor
            const walkouts = await prisma.walkOut.findMany({
                where: {
                    staff: {
                        floor_id: supervisor.floor.id,
                    },
                    ...dateFilter,
                },
                include: {
                    staff: true,
                    itemName: true,
                    type: true,
                    submittedBy: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            // Calculate summary
            const totalWalkouts = walkouts.length;
            const highPriorityCount = walkouts.filter(
                (w) => w.priority === "high"
            ).length;
            const mediumPriorityCount = walkouts.filter(
                (w) => w.priority === "medium"
            ).length;
            const lowPriorityCount = walkouts.filter(
                (w) => w.priority === "low"
            ).length;

            return {
                list: walkouts,
                summary: {
                    totalWalkouts,
                    highPriorityCount,
                    mediumPriorityCount,
                    lowPriorityCount,
                },
            };
        } catch (error) {
            console.error("Error fetching supervisor walkout report:", error);
            return { list: [], summary: {} };
        }
    }

    async getAccountantSalesGraph(month, year) {
        try {
            const monthNames = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ];
            const currentMonth = parseInt(month);
            const currentYear = parseInt(year);
            const graphData = [];

            // Get data for last 4 months
            for (let i = 3; i >= 0; i--) {
                const monthIndex = currentMonth - 1 - i;
                const adjustedMonthIndex =
                    monthIndex < 0 ? monthIndex + 12 : monthIndex;
                const adjustedYear =
                    monthIndex < 0 ? currentYear - 1 : currentYear;

                // Get sales data for this month
                const salesData = await prisma.sales.aggregate({
                    where: {
                        date: {
                            gte: new Date(adjustedYear, adjustedMonthIndex, 1),
                            lt: new Date(
                                adjustedYear,
                                adjustedMonthIndex + 1,
                                1
                            ),
                        },
                    },
                    _sum: {
                        salesAmount: true,
                    },
                });

                graphData.push({
                    name: `${monthNames[adjustedMonthIndex]} ${adjustedYear}`,
                    value: salesData._sum.salesAmount || 0,
                });
            }

            return graphData;
        } catch (error) {
            console.error("Error fetching accountant sales graph:", error);
            return [];
        }
    }

    async getAccountantStaffGraph(accountantId, month, year) {
        try {
            const monthNames = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ];
            const currentMonth = parseInt(month);
            const currentYear = parseInt(year);
            const graphData = [];

            // Get data for last 4 months
            for (let i = 3; i >= 0; i--) {
                const monthIndex = currentMonth - 1 - i;
                const adjustedMonthIndex =
                    monthIndex < 0 ? monthIndex + 12 : monthIndex;
                const adjustedYear =
                    monthIndex < 0 ? currentYear - 1 : currentYear;

                // Get staff creation data for this month
                const staffData = await prisma.user.count({
                    where: {
                        created_at: {
                            gte: new Date(adjustedYear, adjustedMonthIndex, 1),
                            lt: new Date(
                                adjustedYear,
                                adjustedMonthIndex + 1,
                                1
                            ),
                        },
                        role: {
                            in: ["Staff", "FloorSupervisor"],
                        },
                    },
                });

                graphData.push({
                    period: `${monthNames[adjustedMonthIndex]} ${adjustedYear}`,
                    value: staffData || 0,
                });
            }

            return graphData;
        } catch (error) {
            console.error("Error fetching accountant staff graph:", error);
            return [];
        }
    }

    async getFloors() {
        try {
            const floors = await prisma.floor.findMany({
                where: { isDlt: false },
                select: {
                    id: true,
                    name: true,
                },
            });

            console.log("Floors from database:", floors);
            return floors;
        } catch (error) {
            console.error("Error fetching floors:", error);
            return [];
        }
    }

    async getFloorAttendanceData() {
        try {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1;
            const currentYear = currentDate.getFullYear();

            // Get the number of days in the current month
            const daysInMonth = new Date(
                currentYear,
                currentMonth,
                0
            ).getDate();

            // Get all floors
            const floors = await prisma.floor.findMany({
                where: { isDlt: false },
            });

            const floorAttendanceData = [];

            for (const floor of floors) {
                // Get all active staff belonging to this floor
                const staffInFloor = await prisma.user.findMany({
                    where: {
                        floor_id: floor.id,
                        role: "Staff",
                        isDlt: false,
                        active_flag: true,
                    },
                    select: { id: true },
                });

                if (staffInFloor.length === 0) {
                    // If no staff in the floor, attendance is 0%
                    floorAttendanceData.push({
                        floor: floor.name,
                        attendance: 0,
                    });
                    continue;
                }

                let totalFloorAttendancePercentage = 0;

                for (const staffMember of staffInFloor) {
                    // Get attendance records for this specific staff member for the current month
                    const attendanceRecord = await prisma.attendance.findFirst({
                        where: {
                            staffId: staffMember.id.toString(),
                            date: {
                                gte: new Date(currentYear, currentMonth - 1, 1),
                                lt: new Date(currentYear, currentMonth, 1),
                            },
                        },
                    });

                    if (!attendanceRecord) {
                        // No attendance record = 0% for this staff
                        continue;
                    }

                    // Parse the string fields
                    const fullDays = parseFloat(attendanceRecord.fullDays) || 0;
                    const halfDays = parseFloat(attendanceRecord.halfDays) || 0;

                    // Calculate actual attendance days
                    const actualAttendanceDays = fullDays + halfDays * 0.5;

                    // Calculate percentage for this staff member
                    const individualStaffPercentage =
                        daysInMonth > 0
                            ? (actualAttendanceDays / daysInMonth) * 100
                            : 0;

                    totalFloorAttendancePercentage += individualStaffPercentage;
                }

                // Calculate average attendance percentage for the floor
                const averageFloorAttendancePercentage = Math.round(
                    totalFloorAttendancePercentage / staffInFloor.length
                );

                floorAttendanceData.push({
                    floor: floor.name,
                    attendance: averageFloorAttendancePercentage,
                });
            }

            return floorAttendanceData;
        } catch (error) {
            console.error("Error fetching floor attendance data:", error);
            return [];
        }
    }

    async searchStaffByName(query) {
        try {
            const staffs = await prisma.user.findMany({
                where: {
                    isDlt: false,
                    role: { not: "Owner" },
                    name: {
                        startsWith: query,
                        mode: "insensitive",
                    },
                },
                select: {
                    id: true,
                    uniqueId: true,
                    name: true,
                    role: true,
                    floor: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            return staffs;
        } catch (error) {
            console.error("Error in searchStaffByName:", error);
            return [];
        }
    }

    async getStaffKPIDetailsById(staffId, startDate, endDate, month, year) {
        try {
            console.log(
                "getStaffKPIDetailsById - Looking for staff with ID:",
                staffId,
                "startDate:", startDate,
                "endDate:", endDate,
                "month:", month,
                "year:", year
            );
            
            // Validate date parameters - prevent future dates
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            
            if (year && parseInt(year) > currentYear) {
                throw new Error("Cannot fetch data for future years");
            }
            
            if (month && year && parseInt(year) === currentYear && parseInt(month) > currentMonth) {
                throw new Error("Cannot fetch data for future months");
            }
            
            const staff = await prisma.user.findUnique({
                where: {
                    id: staffId,
                    isDlt: false,
                },
                include: {
                    floor: true,
                },
            });

            console.log(
                "getStaffKPIDetailsById - Staff found:",
                staff ? "YES" : "NO"
            );
            if (!staff) {
                console.log(
                    "getStaffKPIDetailsById - Staff member not found for ID:",
                    staffId
                );
                throw new Error("Staff member not found");
            }

            // Build date filter
            let dateFilter = {};
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter = {
                    gte: start,
                    lte: end,
                };
            } else if (month && year) {
                // Filter by month and year - be explicit about timezone
                const start = new Date(year, month - 1, 1, 0, 0, 0, 0); // First day of month at 00:00:00
                const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month at 23:59:59
                dateFilter = {
                    gte: start,
                    lte: end,
                };
                console.log("Date filter for month/year:", {
                    month: month,
                    year: year,
                    start: start.toISOString(),
                    end: end.toISOString(),
                    startLocal: start.toLocaleDateString(),
                    endLocal: end.toLocaleDateString()
                });
            }

            // Get all scores for this staff member with KPI details
            // This method is specifically for monthly KPIs only
            const kpiFrequencyFilter = {
                frequency: "monthly",
            };

            const scores = await prisma.score.findMany({
                where: {
                    user_id: staff.id,
                    isDlt: false,
                    ...(Object.keys(dateFilter).length > 0 && {
                        created_at: dateFilter,
                    }),
                    kpi: {
                        ...kpiFrequencyFilter,
                        isDlt: false,
                        status: true,
                    },
                },
                include: {
                    kpi: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            console.log(`Found ${scores.length} MONTHLY scores for staff ${staffId} in month ${month} ${year}`);
            console.log('Monthly KPI frequencies:', scores.map(s => s.kpi?.frequency).filter(Boolean));

            // Group scores by date and KPI for daily summary
            const dailyKPIScores = {};
            const monthlyKPIScores = {};

            scores.forEach((score) => {
                const kpiName = score.kpi?.name || "Unknown";
                const dateKey = score.created_at.toISOString().split("T")[0]; // YYYY-MM-DD format

                // Group by date for daily scores
                if (!dailyKPIScores[dateKey]) {
                    dailyKPIScores[dateKey] = {};
                }
                if (!dailyKPIScores[dateKey][kpiName]) {
                    dailyKPIScores[dateKey][kpiName] = [];
                }
                dailyKPIScores[dateKey][kpiName].push({
                    score: score.score,
                    points: score.points,
                    comment: score.comment,
                    trend: score.trend,
                    createdAt: score.created_at,
                    kpi: score.kpi,
                });

                // Group by KPI for monthly summary
                if (!monthlyKPIScores[kpiName]) {
                    monthlyKPIScores[kpiName] = [];
                }
                monthlyKPIScores[kpiName].push({
                    score: score.score,
                    points: score.points,
                    comment: score.comment,
                    trend: score.trend,
                    createdAt: score.created_at,
                    kpi: score.kpi,
                });
            });

            // Process daily KPI scores
            const processedDailyData = {};
            Object.keys(dailyKPIScores).forEach((date) => {
                const dayKPIs = dailyKPIScores[date];
                processedDailyData[date] = {};

                Object.keys(dayKPIs).forEach((kpiName) => {
                    const kpiScores = dayKPIs[kpiName];
                    const avgScore =
                        kpiScores.reduce((sum, s) => sum + s.score, 0) /
                        kpiScores.length;
                    const avgPoints =
                        kpiScores.reduce((sum, s) => sum + s.points, 0) /
                        kpiScores.length;

                    processedDailyData[date][kpiName] = {
                        avgScore: Math.round(avgScore * 10) / 10,
                        avgPoints: Math.round(avgPoints * 10) / 10,
                        count: kpiScores.length,
                        weight: kpiScores[0].kpi?.weight || 0,
                        latestComment: kpiScores[0].comment,
                        latestTrend: kpiScores[0].trend,
                    };
                });
            });

            // Calculate monthly averages for each KPI
            const processedMonthlyData = {};
            Object.keys(monthlyKPIScores).forEach((kpiName) => {
                const kpiScores = monthlyKPIScores[kpiName];
                const avgScore =
                    kpiScores.reduce((sum, s) => sum + s.score, 0) /
                    kpiScores.length;
                const avgPoints =
                    kpiScores.reduce((sum, s) => sum + s.points, 0) /
                    kpiScores.length;

                processedMonthlyData[kpiName] = {
                    avgScore: Math.round(avgScore * 10) / 10,
                    avgPoints: Math.round(avgPoints * 10) / 10,
                    count: kpiScores.length,
                    weight: kpiScores[0].kpi?.weight || 0,
                    latestComment: kpiScores[0].comment,
                    latestTrend: kpiScores[0].trend,
                };
            });

            // Calculate overall monthly summary
            const allScores = Object.values(processedMonthlyData);
            const totalPoints = allScores.reduce(
                (sum, kpi) => sum + kpi.avgPoints,
                0
            );
            const totalWeight = allScores.reduce(
                (sum, kpi) => sum + kpi.weight,
                0
            );
            const totalScore = allScores.reduce(
                (sum, kpi) => sum + kpi.avgScore,
                0
            );
            const kpiCount = allScores.length;

            // Calculate weekly summary (last 7 days)
            const weeklyDates = Object.keys(processedDailyData).slice(0, 7);
            let weeklyTotalPoints = 0;
            let weeklyTotalWeight = 0;
            let weeklyTotalScore = 0;
            let weeklyCount = 0;

            weeklyDates.forEach((date) => {
                const dayKPIs = processedDailyData[date];
                Object.values(dayKPIs).forEach((kpiData) => {
                    weeklyTotalPoints += kpiData.avgPoints || 0;
                    weeklyTotalWeight += kpiData.weight || 0;
                    weeklyTotalScore += kpiData.avgScore || 0;
                    weeklyCount++;
                });
            });

            return {
                staff: {
                    id: staff.id,
                    staffId: staff.uniqueId,
                    name: staff.name,
                    mobile: staff.mobile,
                    role: staff.role,
                    section: staff.section,
                    floor: staff.floor?.name || "N/A",
                },
                monthlyKPIScores: processedMonthlyData,
                monthlySummary: {
                    avgPoints: kpiCount > 0 ? totalPoints / kpiCount : 0,
                    avgWeight: kpiCount > 0 ? totalWeight / kpiCount : 0,
                    avgScore: kpiCount > 0 ? totalScore / kpiCount : 0,
                    totalPoins: totalPoints, // Total points across all KPIs
                    totalScore: totalScore, // Total score across all KPIs
                    fullScore: kpiCount * 5, // Maximum possible score (5 per KPI)
                },
                totalDays: Object.keys(processedDailyData).length,
                totalKPIs: kpiCount,
            };
        } catch (error) {
            console.error("Error in getStaffKPIDetails:", error);
            throw error;
        }
    }

    async getStaffDailyKPIDetailsById(
        staffId,
        startDate,
        endDate,
        month,
        year
    ) {
        try {
            // staffId is now the real UUID from the database
            const staff = await prisma.user.findUnique({
                where: {
                    id: staffId,
                    isDlt: false,
                },
            });

            if (!staff) {
                throw new Error("Staff member not found");
            }

            // Build date filter
            let dateFilter = {};
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter = {
                    gte: start,
                    lte: end,
                };
            } else if (month && year) {
                // Filter by month and year
                const start = new Date(year, month - 1, 1); // month is 1-based, Date constructor is 0-based
                const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
                dateFilter = {
                    gte: start,
                    lte: end,
                };
                console.log("Daily date filter for month/year:", {
                    month: month,
                    year: year,
                    start: start.toISOString(),
                    end: end.toISOString()
                });
            }

            // Get only daily frequency KPIs for this staff member
            const dailyScores = await prisma.score.findMany({
                where: {
                    user_id: staff.id,
                    isDlt: false,
                    ...(Object.keys(dateFilter).length > 0 && {
                        created_at: dateFilter,
                    }),
                    kpi: {
                        isDlt: false,
                        status: true,
                        frequency: "daily",
                    },
                },
                include: {
                    kpi: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            console.log(`Found ${dailyScores.length} DAILY scores for staff ${staffId} in month ${month} ${year}`);
            console.log('Daily KPI frequencies:', dailyScores.map(s => s.kpi?.frequency).filter(Boolean));

            // Group scores by date and KPI
            const dailyKPIScores = {};

            dailyScores.forEach((score) => {
                const kpiName = score.kpi?.name || "Unknown";
                const dateKey = score.created_at.toISOString().split("T")[0]; // YYYY-MM-DD format

                if (!dailyKPIScores[dateKey]) {
                    dailyKPIScores[dateKey] = {};
                }
                if (!dailyKPIScores[dateKey][kpiName]) {
                    dailyKPIScores[dateKey][kpiName] = [];
                }
                dailyKPIScores[dateKey][kpiName].push({
                    score: score.score,
                    points: score.points,
                    comment: score.comment,
                    trend: score.trend,
                    createdAt: score.created_at,
                    kpi: score.kpi,
                });
            });

            // Process daily KPI scores
            const processedDailyData = {};
            Object.keys(dailyKPIScores).forEach((date) => {
                const dayKPIs = dailyKPIScores[date];
                processedDailyData[date] = {};

                Object.keys(dayKPIs).forEach((kpiName) => {
                    const kpiScores = dayKPIs[kpiName];
                    const avgScore =
                        kpiScores.reduce((sum, s) => sum + s.score, 0) /
                        kpiScores.length;
                    const avgPoints =
                        kpiScores.reduce((sum, s) => sum + s.points, 0) /
                        kpiScores.length;

                    processedDailyData[date][kpiName] = {
                        avgScore: Math.round(avgScore * 10) / 10,
                        avgPoints: Math.round(avgPoints * 10) / 10,
                        count: kpiScores.length,
                        weight: kpiScores[0].kpi?.weight || 0,
                        latestComment: kpiScores[0].comment,
                        latestTrend: kpiScores[0].trend,
                    };
                });
            });

            // Calculate daily summary
            const dailyDates = Object.keys(processedDailyData);
            let dailyTotalPoints = 0;
            let dailyTotalWeight = 0;
            let dailyTotalScore = 0;
            let dailyCount = 0;

            dailyDates.forEach((date) => {
                const dayKPIs = processedDailyData[date];
                Object.values(dayKPIs).forEach((kpiData) => {
                    dailyTotalPoints += kpiData.avgPoints || 0;
                    dailyTotalWeight += kpiData.weight || 0;
                    dailyTotalScore += kpiData.avgScore || 0;
                    dailyCount++;
                });
            });

            return {
                staff: {
                    id: staff.id,
                    staffId: staff.uniqueId,
                    name: staff.name,
                    mobile: staff.mobile,
                    role: staff.role,
                    section: staff.section,
                    floor: staff.floor?.name || "N/A",
                },
                dailyKPIScores: processedDailyData,
                dailySummary: {
                    totalPoints: dailyTotalPoints,
                    totalWeight:
                        dailyCount > 0 ? dailyTotalWeight / dailyCount : 0,
                    totalScore:
                        dailyCount > 0 ? dailyTotalScore / dailyCount : 0,
                    avgScore:
                        dailyCount > 0 ? dailyTotalScore / dailyCount : 0,
                },
                totalDays: Object.keys(processedDailyData).length,
                totalKPIs: dailyCount,
            };
        } catch (error) {
            console.error("Error in getStaffDailyKPIDetails:", error);
            throw error;
        }
    }

    async getStaffWeeklyKPIDetailsById(
        staffId,
        startDate,
        endDate,
        month,
        year
    ) {
        try {
            // staffId is now the real UUID from the database
            const staff = await prisma.user.findUnique({
                where: {
                    id: staffId,
                    isDlt: false,
                },
            });

            if (!staff) {
                throw new Error("Staff member not found");
            }

            // Build date filter
            let dateFilter = {};
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter = {
                    gte: start,
                    lte: end,
                };
            } else if (month && year) {
                // Filter by month and year
                const start = new Date(year, month - 1, 1); // month is 1-based, Date constructor is 0-based
                const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month
                dateFilter = {
                    gte: start,
                    lte: end,
                };
                console.log("Weekly date filter for month/year:", {
                    month: month,
                    year: year,
                    start: start.toISOString(),
                    end: end.toISOString()
                });
            }

            // Get only weekly frequency KPIs for this staff member
            const weeklyScores = await prisma.score.findMany({
                where: {
                    user_id: staff.id,
                    isDlt: false,
                    ...(Object.keys(dateFilter).length > 0 && {
                        created_at: dateFilter,
                    }),
                    kpi: {
                        isDlt: false,
                        status: true,
                        frequency: "weekly",
                    },
                },
                include: {
                    kpi: true,
                },
                orderBy: {
                    created_at: "desc",
                },
            });

            console.log(`Found ${weeklyScores.length} WEEKLY scores for staff ${staffId} in month ${month} ${year}`);
            console.log('Weekly KPI frequencies:', weeklyScores.map(s => s.kpi?.frequency).filter(Boolean));

            // Group scores by date and KPI
            const weeklyKPIScores = {};

            weeklyScores.forEach((score) => {
                const kpiName = score.kpi?.name || "Unknown";
                const dateKey = score.created_at.toISOString().split("T")[0]; // YYYY-MM-DD format

                if (!weeklyKPIScores[dateKey]) {
                    weeklyKPIScores[dateKey] = {};
                }
                if (!weeklyKPIScores[dateKey][kpiName]) {
                    weeklyKPIScores[dateKey][kpiName] = [];
                }
                weeklyKPIScores[dateKey][kpiName].push({
                    score: score.score,
                    points: score.points,
                    comment: score.comment,
                    trend: score.trend,
                    createdAt: score.created_at,
                    kpi: score.kpi,
                });
            });

            // Process weekly KPI scores
            const processedWeeklyData = {};
            Object.keys(weeklyKPIScores).forEach((date) => {
                const dayKPIs = weeklyKPIScores[date];
                processedWeeklyData[date] = {};

                Object.keys(dayKPIs).forEach((kpiName) => {
                    const kpiScores = dayKPIs[kpiName];
                    const avgScore =
                        kpiScores.reduce((sum, s) => sum + s.score, 0) /
                        kpiScores.length;
                    const avgPoints =
                        kpiScores.reduce((sum, s) => sum + s.points, 0) /
                        kpiScores.length;

                    processedWeeklyData[date][kpiName] = {
                        avgScore: Math.round(avgScore * 10) / 10,
                        avgPoints: Math.round(avgPoints * 10) / 10,
                        count: kpiScores.length,
                        weight: kpiScores[0].kpi?.weight || 0,
                        latestComment: kpiScores[0].comment,
                        latestTrend: kpiScores[0].trend,
                    };
                });
            });

            // Calculate weekly summary
            const weeklyDates = Object.keys(processedWeeklyData);
            let weeklyTotalPoints = 0;
            let weeklyTotalWeight = 0;
            let weeklyTotalScore = 0;
            let weeklyCount = 0;

            weeklyDates.forEach((date) => {
                const dayKPIs = processedWeeklyData[date];
                Object.values(dayKPIs).forEach((kpiData) => {
                    weeklyTotalPoints += kpiData.avgPoints || 0;
                    weeklyTotalWeight += kpiData.weight || 0;
                    weeklyTotalScore += kpiData.avgScore || 0;
                    weeklyCount++;
                });
            });

            return {
                staff: {
                    id: staff.id,
                    staffId: staff.uniqueId,
                    name: staff.name,
                    mobile: staff.mobile,
                    role: staff.role,
                    section: staff.section,
                    floor: staff.floor?.name || "N/A",
                },
                weeklyKPIScores: processedWeeklyData,
                weeklySummary: {
                    totalPoints: weeklyTotalPoints,
                    totalWeight:
                        weeklyCount > 0 ? weeklyTotalWeight / weeklyCount : 0,
                    totalScore:
                        weeklyCount > 0 ? weeklyTotalScore / weeklyCount : 0,
                    avgScore:
                        weeklyCount > 0 ? weeklyTotalScore / weeklyCount : 0,
                },
                totalDays: Object.keys(processedWeeklyData).length,
                totalKPIs: weeklyCount,
            };
        } catch (error) {
            console.error("Error in getStaffWeeklyKPIDetails:", error);
            throw error;
        }
    }

    async getStaffAttendanceReportById(
        staffId,
        startDate,
        endDate,
        month,
        year
    ) {
        try {
            let dateFilter = {};
            let daysInMonth = 30;

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);

                // Calculate days in the range
                const diffTime = Math.abs(end - start);
                daysInMonth = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                dateFilter = {
                    gte: start,
                    lte: end,
                };
            } else if (month && year) {
                // Priority 2: If month and year are provided, use those
                const monthNumber = parseInt(month);
                const yearNumber = parseInt(year);
                const start = new Date(yearNumber, monthNumber - 1, 1);
                const end = endOfMonth(start);

                daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

                dateFilter = {
                    gte: start,
                    lte: end,
                };
            } else {
                // Priority 3: Default to current month
                const now = new Date();
                const start = startOfMonth(now);
                const end = endOfMonth(now);
                daysInMonth = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0
                ).getDate();

                dateFilter = {
                    gte: start,
                    lte: end,
                };
            }

            console.log("🔍 Attendance Query Debug:");
            console.log("Staff ID:", staffId);
            console.log("Date Filter:", dateFilter);
            console.log("Days in Month:", daysInMonth);

           const s=await prisma.attendance.findMany({

           })
           console.log(s,"sfskldfsdlkfjsdfkjkl");
           
            const attendanceRecords = await prisma.attendance.findMany({
                where: {
                    staffId: staffId,
                    date: dateFilter,
                },
                orderBy: {
                    date: "desc",
                },
            });

            console.log(
                "📊 Found attendance records:",
                attendanceRecords.length
            );

            // Calculate totals
            let totalFullDays = 0;
            let totalHalfDays = 0;
            let totalLeaves = 0;

            attendanceRecords.forEach((record) => {
                totalFullDays += parseFloat(record.fullDays) || 0;
                totalHalfDays += parseFloat(record.halfDays) || 0;
                totalLeaves += parseFloat(record.leaveCount) || 0;
            });

            // Calculate present days (full days + half days / 2)
            const presentDays = totalFullDays + totalHalfDays * 0.5;

            // Calculate attendance percentage
            const attendancePercentage =
                daysInMonth > 0 ? (presentDays / daysInMonth) * 100 : 0;

            console.log("📊 ATTENDANCE CALCULATION DEBUG:");
            console.log("Total Full Days:", totalFullDays);
            console.log("Total Half Days:", totalHalfDays);
            console.log("Total Leaves:", totalLeaves);
            console.log("Days in Month:", daysInMonth);
            console.log("Present Days (Full + Half*0.5):", presentDays);
            console.log("Attendance %:", attendancePercentage);
            console.log("Formula: (", presentDays, "/", daysInMonth, ") * 100 =", attendancePercentage);

            return {
                totalFullDays: Math.round(totalFullDays),
                totalHalfDays: Math.round(totalHalfDays),
                totalLeaves: Math.round(totalLeaves),
                totalDaysInMonth: daysInMonth,
                presentDays: presentDays.toFixed(1),
                attendancePercentage: attendancePercentage.toFixed(2),
            };
        } catch (error) {
            console.error("Error in getStaffAttendanceReport:", error);
            throw error;
        }
    }

    async getStaffSalesReportById(staffId, startDate, endDate, month, year) {
        try {
            const staff = await prisma.user.findUnique({
                where: {
                    id: staffId,
                    isDlt: false,
                },
            });

            if (!staff) {
                throw new Error("Staff member not found");
            }

            // Build date filter
            let dateFilter = {};
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter = {
                    gte: start,
                    lte: end,
                };
            } else if (month && year) {
                const monthNumber = parseInt(month);
                const yearNumber = parseInt(year);
                const start = new Date(yearNumber, monthNumber - 1, 1);
                const end = endOfMonth(start);
                dateFilter = {
                    gte: start,
                    lte: end,
                };
            } else {
                const now = new Date();
                const start = startOfMonth(now);
                const end = endOfMonth(now);
                dateFilter = {
                    gte: start,
                    lte: end,
                };
            }

            // Get all sales records for this staff member
            const salesRecords = await prisma.sales.findMany({
                where: {
                    staffId: staffId,
                    ...(Object.keys(dateFilter).length > 0 && {
                        createdAt: dateFilter,
                    }),
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
            const salesByYearCode = {};
            const colorPalette = [
                { code: "#10B981", name: "Emerald Green" },      // Green
                { code: "#EAB308", name: "Amber Yellow" },       // Yellow
                { code: "#3B82F6", name: "Bright Blue" },        // Blue
                { code: "#8B5CF6", name: "Vibrant Purple" },     // Purple
                { code: "#F97316", name: "Orange" },             // Orange
                { code: "#EF4444", name: "Coral Red" },          // Red
                { code: "#06B6D4", name: "Cyan" },               // Cyan
                { code: "#F43F5E", name: "Rose" },               // Rose
                { code: "#84CC16", name: "Lime" },               // Lime
                { code: "#A855F7", name: "Violet" },             // Violet
                { code: "#F59E0B", name: "Amber" },              // Amber
                { code: "#14B8A6", name: "Teal" },               // Teal
            ];

            let colorIndex = 0;
            salesRecords.forEach((sale, index) => {
                const yearCode = sale.year_code || "N/A";
                if (!salesByYearCode[yearCode]) {
                    salesByYearCode[yearCode] = {
                        yearCode: yearCode,
                        color: colorPalette[colorIndex % colorPalette.length],
                        records: [],
                        totals: {
                            qtySold: 0,
                            salesAmount: 0,
                            prodValue: 0,
                            profit: 0,
                            points: 0,
                            per: 0,
                        },
                    };
                    colorIndex++; // Increment to get next color for next unique year code
                }
                salesByYearCode[yearCode].records.push(sale);
                salesByYearCode[yearCode].totals.qtySold +=
                    parseInt(sale.qtySold) || 0;
                salesByYearCode[yearCode].totals.salesAmount +=
                    parseFloat(sale.salesAmount) || 0;
                salesByYearCode[yearCode].totals.prodValue +=
                    parseFloat(sale.prodValue) || 0;
                salesByYearCode[yearCode].totals.profit +=
                    parseFloat(sale.profit) || 0;
                salesByYearCode[yearCode].totals.points +=
                    parseFloat(sale.points) || 0;
                salesByYearCode[yearCode].totals.per +=
                    parseFloat(sale.per) || 0;
            });

            const salesArray = Object.values(salesByYearCode);
            const totalSales = salesArray.reduce(
                (sum, item) => sum + item.totals.salesAmount,
                0
            );

            salesArray.forEach((item) => {
                item.percentage =
                    totalSales > 0
                        ? (
                              (item.totals.salesAmount / totalSales) *
                              100
                          ).toFixed(1)
                        : "0.0";
            });

            return {
                staff: {
                    id: staff.id,
                    staffId: staff.uniqueId,
                    name: staff.name,
                    mobile: staff.mobile,
                },
                salesByYearCode: salesArray,
                totalRecords: salesRecords.length,
            };
        } catch (error) {
            console.error("Error in getStaffSalesReportById:", error);
            throw error;
        }
    }

    // All Months Data Functions
    async getAllMonthsStaffKPIDetailsById(staffId, year) {
        try {
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            
            const allMonthsData = {};
            const kpiAverages = {}; // Store averages for each KPI across all months
            
            for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                const monthName = months[monthIndex];
                const monthNumber = monthIndex + 1;
                
                try {
                    console.log(`Fetching data for ${monthName} ${year} (month ${monthNumber})`);
                    const monthData = await this.getStaffKPIDetailsById(staffId, null, null, monthNumber, year);
                    console.log(`Data for ${monthName} ${year}:`, monthData ? 'Found' : 'Not found');
                    if (monthData) {
                        allMonthsData[monthName] = monthData;
                        
                        // Collect KPI data for averaging
                        if (monthData.monthlyKPIScores) {
                            Object.keys(monthData.monthlyKPIScores).forEach(kpiName => {
                                const kpiData = monthData.monthlyKPIScores[kpiName];
                                if (!kpiAverages[kpiName]) {
                                    kpiAverages[kpiName] = {
                                        points: [],
                                        weights: [],
                                        scores: [],
                                        count: 0
                                    };
                                }
                                kpiAverages[kpiName].points.push(kpiData.avgPoints || 0);
                                kpiAverages[kpiName].weights.push(kpiData.weight || 0);
                                kpiAverages[kpiName].scores.push(kpiData.avgScore || 0);
                                kpiAverages[kpiName].count++;
                            });
                        }
                    }
                } catch (error) {
                    console.log(`No data for ${monthName} ${year}:`, error.message);
                    // Continue with next month if no data
                }
            }
            
            // Calculate averages for each KPI
            const averagedKPIs = {};
            Object.keys(kpiAverages).forEach(kpiName => {
                const kpiData = kpiAverages[kpiName];
                const avgPoints = kpiData.points.length > 0 
                    ? kpiData.points.reduce((sum, point) => sum + point, 0) / kpiData.points.length 
                    : 0;
                const avgWeight = kpiData.weights.length > 0 
                    ? kpiData.weights.reduce((sum, weight) => sum + weight, 0) / kpiData.weights.length 
                    : 0;
                const avgScore = kpiData.scores.length > 0 
                    ? kpiData.scores.reduce((sum, score) => sum + score, 0) / kpiData.scores.length 
                    : 0;
                
                averagedKPIs[kpiName] = {
                    avgPoints: Math.round(avgPoints * 10) / 10,
                    avgWeight: Math.round(avgWeight * 10) / 10,
                    avgScore: Math.round(avgScore * 10) / 10,
                    count: kpiData.count
                };
            });
            
            // Add averaged data to the result
            allMonthsData._averages = {
                monthlyKPIScores: averagedKPIs,
                monthlySummary: {
                    avgPoints: Object.values(averagedKPIs).length > 0 
                        ? Object.values(averagedKPIs).reduce((sum, kpi) => sum + kpi.avgPoints, 0) / Object.values(averagedKPIs).length 
                        : 0,
                    avgWeight: Object.values(averagedKPIs).length > 0 
                        ? Object.values(averagedKPIs).reduce((sum, kpi) => sum + kpi.avgWeight, 0) / Object.values(averagedKPIs).length 
                        : 0,
                    avgScore: Object.values(averagedKPIs).length > 0 
                        ? Object.values(averagedKPIs).reduce((sum, kpi) => sum + kpi.avgScore, 0) / Object.values(averagedKPIs).length 
                        : 0,
                    totalMonths: Object.keys(allMonthsData).length
                }
            };
            
            return allMonthsData;
        } catch (error) {
            console.error("Error in getAllMonthsStaffKPIDetailsById:", error);
            throw error;
        }
    }

    async getAllMonthsStaffDailyKPIDetailsById(staffId, year) {
        try {
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            
            const allMonthsData = {};
            const monthlyAggregatedData = {}; // New structure for aggregated monthly data
            const kpiAverages = {}; // Store averages for each KPI across all months
            
            for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                const monthName = months[monthIndex];
                const monthNumber = monthIndex + 1;
                
                try {
                    const monthData = await this.getStaffDailyKPIDetailsById(staffId, null, null, monthNumber, year);
                    if (monthData) {
                        allMonthsData[monthName] = monthData;
                        
                        // Aggregate daily KPI data by month
                        if (monthData.dailyKPIScores && Object.keys(monthData.dailyKPIScores).length > 0) {
                            const monthKPIAggregates = {};
                            
                            // Collect all daily data for this month
                            Object.keys(monthData.dailyKPIScores).forEach(dateKey => {
                                const dayData = monthData.dailyKPIScores[dateKey];
                                Object.keys(dayData).forEach(kpiName => {
                                    const kpiData = dayData[kpiName];
                                    
                                    if (!monthKPIAggregates[kpiName]) {
                                        monthKPIAggregates[kpiName] = {
                                            totalPoints: 0,
                                            totalWeight: 0,
                                            totalScore: 0,
                                            count: 0
                                        };
                                    }
                                    
                                    monthKPIAggregates[kpiName].totalPoints += kpiData.avgPoints || 0;
                                    monthKPIAggregates[kpiName].totalWeight += kpiData.weight || 0;
                                    monthKPIAggregates[kpiName].totalScore += kpiData.avgScore || 0;
                                    monthKPIAggregates[kpiName].count++;
                                });
                            });
                            
                            // Calculate averages for this month
                            const monthKPIData = {};
                            Object.keys(monthKPIAggregates).forEach(kpiName => {
                                const agg = monthKPIAggregates[kpiName];
                                monthKPIData[kpiName] = {
                                    avgPoints: agg.count > 0 ? Math.round((agg.totalPoints / agg.count) * 10) / 10 : 0,
                                    weight: agg.count > 0 ? Math.round((agg.totalWeight / agg.count) * 10) / 10 : 0,
                                    avgScore: agg.count > 0 ? Math.round((agg.totalScore / agg.count) * 10) / 10 : 0,
                                    count: agg.count
                                };
                            });
                            
                            monthlyAggregatedData[monthName] = monthKPIData;
                        }
                        
                        // Collect KPI data for overall averaging from daily scores
                        if (monthData.dailyKPIScores) {
                            Object.keys(monthData.dailyKPIScores).forEach(dateKey => {
                                const dayData = monthData.dailyKPIScores[dateKey];
                                Object.keys(dayData).forEach(kpiName => {
                                    const kpiData = dayData[kpiName];
                                    if (!kpiAverages[kpiName]) {
                                        kpiAverages[kpiName] = {
                                            points: [],
                                            weights: [],
                                            scores: [],
                                            count: 0
                                        };
                                    }
                                    kpiAverages[kpiName].points.push(kpiData.avgPoints || 0);
                                    kpiAverages[kpiName].weights.push(kpiData.weight || 0);
                                    kpiAverages[kpiName].scores.push(kpiData.avgScore || 0);
                                    kpiAverages[kpiName].count++;
                                });
                            });
                        }
                    }
                } catch (error) {
                    console.log(`No data for ${monthName} ${year}:`, error.message);
                    // Continue with next month if no data
                }
            }
            
            // Calculate overall averages for each KPI across all months
            const averagedKPIs = {};
            Object.keys(kpiAverages).forEach(kpiName => {
                const kpiData = kpiAverages[kpiName];
                const avgPoints = kpiData.points.length > 0 
                    ? kpiData.points.reduce((sum, point) => sum + point, 0) / kpiData.points.length 
                    : 0;
                const avgWeight = kpiData.weights.length > 0 
                    ? kpiData.weights.reduce((sum, weight) => sum + weight, 0) / kpiData.weights.length 
                    : 0;
                const avgScore = kpiData.scores.length > 0 
                    ? kpiData.scores.reduce((sum, score) => sum + score, 0) / kpiData.scores.length 
                    : 0;
                
                averagedKPIs[kpiName] = {
                    avgPoints: Math.round(avgPoints * 10) / 10,
                    avgWeight: Math.round(avgWeight * 10) / 10,
                    avgScore: Math.round(avgScore * 10) / 10,
                    count: kpiData.count
                };
            });
            
            // Return both detailed and aggregated data
            return {
                ...allMonthsData,
                monthlyAggregatedData, // New: Aggregated data by month
                _averages: {
                    dailyKPIScores: averagedKPIs,
                    dailySummary: {
                        avgPoints: Object.values(averagedKPIs).length > 0 
                            ? Object.values(averagedKPIs).reduce((sum, kpi) => sum + kpi.avgPoints, 0) / Object.values(averagedKPIs).length 
                            : 0,
                        avgWeight: Object.values(averagedKPIs).length > 0 
                            ? Object.values(averagedKPIs).reduce((sum, kpi) => sum + kpi.avgWeight, 0) / Object.values(averagedKPIs).length 
                            : 0,
                        avgScore: Object.values(averagedKPIs).length > 0 
                            ? Object.values(averagedKPIs).reduce((sum, kpi) => sum + kpi.avgScore, 0) / Object.values(averagedKPIs).length 
                            : 0,
                        totalMonths: Object.keys(allMonthsData).length
                    }
                }
            };
        } catch (error) {
            console.error("Error in getAllMonthsStaffDailyKPIDetailsById:", error);
            throw error;
        }
    }

    async getAllMonthsStaffWeeklyKPIDetailsById(staffId, year) {
        try {
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            
            const allMonthsData = {};
            const monthlyAggregatedData = {}; // New structure for aggregated monthly data
            const kpiAverages = {}; // Store averages for each KPI across all months
            
            for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                const monthName = months[monthIndex];
                const monthNumber = monthIndex + 1;
                
                try {
                    const monthData = await this.getStaffWeeklyKPIDetailsById(staffId, null, null, monthNumber, year);
                    if (monthData) {
                        allMonthsData[monthName] = monthData;
                        
                        // Aggregate weekly KPI data by month
                        if (monthData.weeklyKPIScores && Object.keys(monthData.weeklyKPIScores).length > 0) {
                            const monthKPIAggregates = {};
                            
                            // Collect all weekly data for this month
                            Object.keys(monthData.weeklyKPIScores).forEach(dateKey => {
                                const weekData = monthData.weeklyKPIScores[dateKey];
                                Object.keys(weekData).forEach(kpiName => {
                                    const kpiData = weekData[kpiName];
                                    
                                    if (!monthKPIAggregates[kpiName]) {
                                        monthKPIAggregates[kpiName] = {
                                            totalPoints: 0,
                                            totalWeight: 0,
                                            totalScore: 0,
                                            count: 0
                                        };
                                    }
                                    
                                    monthKPIAggregates[kpiName].totalPoints += kpiData.avgPoints || 0;
                                    monthKPIAggregates[kpiName].totalWeight += kpiData.weight || 0;
                                    monthKPIAggregates[kpiName].totalScore += kpiData.avgScore || 0;
                                    monthKPIAggregates[kpiName].count++;
                                });
                            });
                            
                            // Calculate averages for this month
                            const monthKPIData = {};
                            Object.keys(monthKPIAggregates).forEach(kpiName => {
                                const agg = monthKPIAggregates[kpiName];
                                monthKPIData[kpiName] = {
                                    avgPoints: agg.count > 0 ? Math.round((agg.totalPoints / agg.count) * 10) / 10 : 0,
                                    weight: agg.count > 0 ? Math.round((agg.totalWeight / agg.count) * 10) / 10 : 0,
                                    avgScore: agg.count > 0 ? Math.round((agg.totalScore / agg.count) * 10) / 10 : 0,
                                    count: agg.count
                                };
                            });
                            
                            monthlyAggregatedData[monthName] = monthKPIData;
                        }
                        
                        // Collect KPI data for overall averaging from weekly scores
                        if (monthData.weeklyKPIScores) {
                            Object.keys(monthData.weeklyKPIScores).forEach(dateKey => {
                                const weekData = monthData.weeklyKPIScores[dateKey];
                                Object.keys(weekData).forEach(kpiName => {
                                    const kpiData = weekData[kpiName];
                                    if (!kpiAverages[kpiName]) {
                                        kpiAverages[kpiName] = {
                                            points: [],
                                            weights: [],
                                            scores: [],
                                            count: 0
                                        };
                                    }
                                    kpiAverages[kpiName].points.push(kpiData.avgPoints || 0);
                                    kpiAverages[kpiName].weights.push(kpiData.weight || 0);
                                    kpiAverages[kpiName].scores.push(kpiData.avgScore || 0);
                                    kpiAverages[kpiName].count++;
                                });
                            });
                        }
                    }
                } catch (error) {
                    console.log(`No data for ${monthName} ${year}:`, error.message);
                    // Continue with next month if no data
                }
            }
            
            // Calculate overall averages for each KPI across all months
            const averagedKPIs = {};
            Object.keys(kpiAverages).forEach(kpiName => {
                const kpiData = kpiAverages[kpiName];
                const avgPoints = kpiData.points.length > 0 
                    ? kpiData.points.reduce((sum, point) => sum + point, 0) / kpiData.points.length 
                    : 0;
                const avgWeight = kpiData.weights.length > 0 
                    ? kpiData.weights.reduce((sum, weight) => sum + weight, 0) / kpiData.weights.length 
                    : 0;
                const avgScore = kpiData.scores.length > 0 
                    ? kpiData.scores.reduce((sum, score) => sum + score, 0) / kpiData.scores.length 
                    : 0;
                
                averagedKPIs[kpiName] = {
                    avgPoints: Math.round(avgPoints * 10) / 10,
                    avgWeight: Math.round(avgWeight * 10) / 10,
                    avgScore: Math.round(avgScore * 10) / 10,
                    count: kpiData.count
                };
            });
            
            // Return both detailed and aggregated data
            return {
                ...allMonthsData,
                monthlyAggregatedData, // New: Aggregated data by month
                _averages: {
                    weeklyKPIScores: averagedKPIs,
                    weeklySummary: {
                        avgPoints: Object.values(averagedKPIs).length > 0 
                            ? Object.values(averagedKPIs).reduce((sum, kpi) => sum + kpi.avgPoints, 0) / Object.values(averagedKPIs).length 
                            : 0,
                        avgWeight: Object.values(averagedKPIs).length > 0 
                            ? Object.values(averagedKPIs).reduce((sum, kpi) => sum + kpi.avgWeight, 0) / Object.values(averagedKPIs).length 
                            : 0,
                        avgScore: Object.values(averagedKPIs).length > 0 
                            ? Object.values(averagedKPIs).reduce((sum, kpi) => sum + kpi.avgScore, 0) / Object.values(averagedKPIs).length 
                            : 0,
                        totalMonths: Object.keys(allMonthsData).length
                    }
                }
            };
        } catch (error) {
            console.error("Error in getAllMonthsStaffWeeklyKPIDetailsById:", error);
            throw error;
        }
    }

    async getAllMonthsStaffAttendanceReportById(staffId, year) {
        try {
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            
            const allMonthsData = {};
            
            for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                const monthName = months[monthIndex];
                const monthNumber = monthIndex + 1;
                
                try {
                    const monthData = await this.getStaffAttendanceReportById(staffId, null, null, monthNumber, year);
                    if (monthData) {
                        allMonthsData[monthName] = monthData;
                    }
                } catch (error) {
                    console.log(`No data for ${monthName} ${year}:`, error.message);
                    // Continue with next month if no data
                }
            }
            
            return allMonthsData;
        } catch (error) {
            console.error("Error in getAllMonthsStaffAttendanceReportById:", error);
            throw error;
        }
    }

    async getAllMonthsStaffSalesReportById(staffId, year) {
        try {
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            
            const allMonthsData = {};
            
            for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                const monthName = months[monthIndex];
                const monthNumber = monthIndex + 1;
                
                try {
                    const monthData = await this.getStaffSalesReportById(staffId, null, null, monthNumber, year);
                    if (monthData) {
                        allMonthsData[monthName] = monthData;
                    }
                } catch (error) {
                    console.log(`No data for ${monthName} ${year}:`, error.message);
                    // Continue with next month if no data
                }
            }
            
            return allMonthsData;
        } catch (error) {
            console.error("Error in getAllMonthsStaffSalesReportById:", error);
            throw error;
        }
    }

    async getAllMonthsAttendanceReport(year) {
        try {
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            
            const allMonthsData = {};
            
            for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                const monthName = months[monthIndex];
                const monthNumber = monthIndex + 1;
                
                try {
                    const monthData = await this.getAttendanceReport(monthNumber, year);
                    if (monthData) {
                        allMonthsData[monthName] = monthData;
                    }
                } catch (error) {
                    console.log(`No data for ${monthName} ${year}:`, error.message);
                    // Continue with next month if no data
                }
            }
            
            return allMonthsData;
        } catch (error) {
            console.error("Error in getAllMonthsAttendanceReport:", error);
            throw error;
        }
    }
}

export const storage = new DatabaseStorage();
