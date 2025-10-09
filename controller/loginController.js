import { forgetPin } from "../utils/ForgotPin.js";
import { hashPassword, comparePassword } from "../utils/Password.js";
import { setCookie } from "../utils/setCookie.js";
import {
    generateAccessToken,
    generateRefreshToken,
} from "../utils/TokenGenerator.js";
import generateUnique6DigitPin from "../utils/TokenGenerator.js";
import { storage } from "../utils/storage.js";

export const sendMail = async (req, res) => {
    const { email, mobile } = req.body;
    
    try {
        const find = await storage.getUser(mobile);
        console.log(find,"sdjfkldslfk");
        
        if (!find) {
            return res.status(404).json({ message: "User not found" });
        }
        const pin = generateUnique6DigitPin();
        await forgetPin(email, pin);
        const hashedPin = await hashPassword(pin);
        await storage.changePin(mobile, hashedPin);
        return res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
    }
};
export const loginUser = async (req, res) => {
    const { mobile, pin } = req.body;
    try {
        const user = await storage.getUser(mobile);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        if (user.pin_expires_at && new Date() > user.pin_expires_at) {
            return res.status(401).json({
                success: false,
                message: "PIN has expired",
            });
        }


        const pinMatch = await comparePassword(pin, user.pin_hash);
        if (!pinMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid PIN",
            });
        }
        await storage.active(user.id)

        const findToken = await storage.getToken(mobile);

        const accessToken = generateAccessToken(user);

        const refreshToken = generateRefreshToken(user);

        setCookie(res, accessToken, refreshToken);

        if (findToken) {
            await storage.replaceToken(mobile, refreshToken);
        } else {
            await storage.createToken(mobile, refreshToken);
        }

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user,
            role: user.role,
        });
    } catch (error) {
        console.error("Error logging in:", error);
        return res.status(500).json({
            success: false,
            message: "Error logging in. Please try again later.",
        });
    }
};
