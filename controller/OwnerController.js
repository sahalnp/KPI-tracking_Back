
import { hashPassword } from "../utils/Password.js";
import { storage } from "../utils/storage.js";

export const getKPIs = async (req, res) => {
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

        const idFind=await storage.findId(value.uniqueId)
        if(idFind){
            res.status(409).json({
            success: false,
            error: "ID already exist",
        });
        }

        const newUser = await storage.addUser(value);
        console.log(newUser,"sfsd;jf");
        
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
        console.log(users,"sdfjldksfjdlskf");
        

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
export const updateMe=async(req,res)=> {
    try {
  
        const floor = await storage.addFloors(req.body.floor);
        let value= { connect: { id: floor[0].id } };
        req.body.floor=value
        const updateMe=await storage.updataMe(req.user.id,req.body)
        
        res.status(200).json({ success: true, updateMe });
    } catch (error) {
         console.error("Error updating status:", error);
        res.status(501).json({
            success: false,
            error: "Internal Server Error",
        });
    }
}
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
export const updatePin=async (req, res) => {
    try {
        const pin=await hashPassword(req.body.pin)
        await storage.updatePin(req.user.id, pin);
        res.status(200).json({ success: true});
    } catch (error) {
        console.error("Error toggling KPI:", error);
        res.status(501).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const logout=async (req, res) => {
    try {
        await storage.logoutSupervisor(req.user.id);
        res.status(200).json({ success: true});
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
        res.status(200).json({ success: true, staffs });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
};
export const addEmployeeScore = async (req, res) => {
    try {
        console.log(req.body,"0000000");
        
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