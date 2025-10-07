import { comparePassword, hashPassword } from "../utils/Password.js";
import { storage } from "../utils/storage.js";

export const getDashboardData = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const dashboardData = await storage.getSupervisorDashboardData(
            req.user.id,
            timeframe
        );
        console.log(dashboardData, "747777");

        const graph = await storage.getGraphData(req.user.id);
        // const pie = await storage.getWalkoutsThisMonth(req.user.id);

        res.status(200).json({
            success: true,
            status: dashboardData,
            graph,
            // pie,
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getScoreStaff = async (req, res) => {
    try {
        const staffs = await storage.getStaff(req.user.id);
        res.status(200).json({ success: true, staffs });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const getKpis = async (req, res) => {
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
export const addWalkout = async (req, res) => {
    try {
        const walkout = await storage.addWalkout(req.body, req.user.id);
        console.log(walkout,"5647879");
        
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
        console.log(me, "fdfsdkjflfdjlk");

        res.status(200).json({ success: true, me });
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
export const walkOutExport = async (req, res) => {
    const { type } = req.query;
    try {
        const walkoutData = await storage.walkoutExport(type);
        console.log(walkoutData,"sdfklsdfjklds");
        
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
        console.log(items);

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
