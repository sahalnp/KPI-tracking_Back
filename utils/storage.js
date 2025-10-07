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
} from "date-fns";
class DatabaseStorage {
    async getKPIs() {
        const kpis = await prisma.kPI.findMany({
            where: { isDlt: false },
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
            },
        });
    }
    async addKpi(value) {
        return (await prisma.kPI.create({ data: value })) || null;
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
            (await prisma.kPI.update({
                where: { id: Number(id) },
                data: { isDlt: true, status: false },
            })) || null
        );
    }
    async toggleKpi(id, status) {
        return (
            (await prisma.kPI.update({
                where: { id },
                data: { status },
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
        return await prisma.kPI.update({
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
                target: totalTarget,
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
        const userCount = await prisma.user.count({
            where: {
                isDlt: false,
                role: { not: "Owner" },
            },
        });
        const kpiCount = await prisma.kPI.count({
            where: { isDlt: false },
        });
        const floorCount = await prisma.floor.count({
            where: { isDlt: false },
        });
        const recentKPIs = await prisma.kPI.findMany({
            where: { isDlt: false },
            orderBy: { created_at: "desc" },
            take: 5,
        });
        const recentUsers = await prisma.user.findMany({
            where: { isDlt: false, role: { not: "Owner" } },
            orderBy: { created_at: "desc" },
            take: 5,
        });

        return {
            totalUsers: userCount,
            totalKPIs: kpiCount,
            totalFloors: floorCount,
            recentKPIs,
            recentUsers,
        };
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
        const pinExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);
        return await prisma.user.update({
            where: { id: staffId },
            data: {
                pin_hash: newPin,
                pin_expires_at: pinExpiresAt,
            },
        });
    }

    async createToken(mobile, refreshToken) {
        const user = await this.getUser(mobile);
        if (!user) throw new Error("User not found");
        await prisma.token.create({
            data: {
                user_id: user.id,
                token: refreshToken,
            },
        });
    }
    async replaceToken(mobile, newRefreshToken) {
        const user = await this.getUser(mobile);
        if (!user) throw new Error("User not found");
        await prisma.token.updateMany({
            where: { user_id: user.id },
            data: { token: newRefreshToken },
        });
    }
    async getToken(mobile) {
        const user = await this.getUser(mobile);
        if (!user) throw new Error("User not found");
        return (
            (await prisma.token.findUnique({
                where: { user_id: user.id },
            })) || null
        );
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
            let totalDays = 0;

            for (const a of attendances) {
                totalFull += parseFloat(a.fullDays || 0);
                totalHalf += parseFloat(a.halfDays || 0);
                totalLeave += parseFloat(a.leaveCount || 0);
                totalDays += parseFloat(a.totalDays || 0);
            }

            // Calculate present equivalent (full + half/2)
            const presentCount = totalFull + totalHalf * 0.5;
            const percentage =
                totalDays > 0 ? (presentCount / totalDays) * 100 : 0;

            return {
                present: +presentCount.toFixed(1),
                leave: +totalLeave.toFixed(1),
                totalDays: +totalDays.toFixed(1),
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
        console.log(staffId, "sfsdklflkfj");

        const user = await prisma.user.findFirst({
            where: { id: staffId, isDlt: false },
            include: {
                floor: true,
            },
        });
        const walkOuts = await prisma.walkOut.findMany({
            where: { staffId },
        });
        console.log(walkOuts, user, "sfjsdlkfjkls");

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
            where: { floor_id: supervisor.floor_id, active_flag: true },
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

        const walkOuts = await prisma.walkOut.findMany({
            where: {
                staffId: { in: userIds },
                submittedBy_id: supervisorId,
                isDlt: false,
                created_at: { gte: startDate },
            },
            include: {
                type: true,
                itemName: true,
            },
            orderBy: { created_at: "desc" },
        });

        const pieData = Object.entries(nameCounts).map(([name, value]) => ({
            name,
            value,
        }));

        return pieData;
    }
    async getStaff(id) {
        const supervisor = await prisma.user.findUnique({ where: { id } });
        console.log(supervisor);

        return await prisma.user.findMany({
            where: {
                role: "Staff",
                floor_id: supervisor?.floor_id,
                isDlt: false,
            },
        });
    }
    async addScore(scores, staffId, supervisorId) {
        for (const score of scores) {
            const find = await prisma.score.findFirst({
                where: { kpi_id: score.kpi_id, user_id: staffId },
                orderBy: { created_at: "desc" },
            });

            let trend = "same";
            if (find) {
                if (find.points > score.points) trend = "decreased";
                else if (find.points < score.points) trend = "increased";
            }

            await prisma.score.create({
                data: {
                    kpi_id: score.kpi_id,
                    user_id: staffId,
                    points: score.points,
                    trend,
                    evalutedby_user_id: supervisorId,
                    status: "pending",
                    comment: score.comment,
                    evalutedDate: null,
                },
            });
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

        return prisma.walkOut.create({
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
        });
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
                reason: data.reason,
                priority: data.priority,

                staff: data.staffId
                    ? { connect: { id: data.staffId } }
                    : undefined,
            },
            include: {
                itemNameId: true,
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
            },
        });
    }
    async findId(uniqueId) {
        const existingUser = await prisma.user.findUnique({
            where: { uniqueId },
        });
    }

    async superVisorEditUser(id, data) {
        return await prisma.user.update({
            where: { id },
            data: {
                ...data,
            },
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
        return await prisma.user.update({
            where: { id },
            data: {
                active_flag: false,
            },
        });
    }
    async checkPin(id) {
        return await prisma.user.findFirst({
            where: {
                id,
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
        console.log(data, "sdfsdjfk;");

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
                        qtySold: sale.qty,
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
                        qtySold: sale.qty,
                        netQty: sale.qty,
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
                    staffId: item.staffId,
                    fullDays: item.fullDays,
                    halfDays: item.halfDays,
                    leaveCount: item.leaveCount,
                    totalDays: item.totalDays,
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
}

export const storage = new DatabaseStorage();
