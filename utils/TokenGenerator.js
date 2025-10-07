import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export const generateAccessToken = (user) => {    
    const accessUniqueId = uuidv4();
    return jwt.sign(
        {
            id: user.id,
            mobile: user.mobile,
            uniqueId: accessUniqueId,
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
};

export const generateRefreshToken = (user) => {
    const refreshUniqueId = uuidv4();
    return jwt.sign(
        {
            id: user.id,
            mobile: user.mobile,
            uniqueId: refreshUniqueId,
        },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
    );
};

export default function generateUnique6DigitPin() {
    const numericUuid = uuidv4().replace(/\D/g, "");
    return numericUuid.slice(0, 6);
}
