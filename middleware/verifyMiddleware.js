import jwt from "jsonwebtoken";
import { setCookie } from "../utils/setCookie.js";
import { generateAccessToken } from "../utils/TokenGenerator.js";
import { prisma } from "../index.js";

const verifyTokens = async (req, res, next) => {
  console.log("🔍 Middleware called for:", req.path);
  try {
    const accessToken = req.cookies.accesstoken;
    const refreshToken = req.cookies.refreshtoken;


    // 1️⃣ No refresh token → block immediately
    if (!refreshToken) {
      // Clear all cookies
      res.cookie("accesstoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      res.cookie("refreshtoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      
      return res.status(401).json({
        success: false,
        message: "Refresh token missing. Please login.",
      });
    }


    const tokenDoc = await prisma.token.findUnique({ 
      where: { 
        token: refreshToken,
        is_active: true 
      } 
    });
    
    if (!tokenDoc) {
      // Clear all cookies
      res.cookie("accesstoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      res.cookie("refreshtoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token. Please login.",
      });
    }

    // 2.1️⃣ Check if token has expired in database
    if (tokenDoc.expiry && new Date() > tokenDoc.expiry) {
      // Mark token as inactive and clear all cookies
      await prisma.token.update({
        where: { id: tokenDoc.id },
        data: { is_active: false }
      });
      
      res.cookie("accesstoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      res.cookie("refreshtoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    // 3️⃣ Verify refresh token
    let refreshUser;
    try {
      refreshUser = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch (err) {
      // Mark token as inactive instead of deleting
      await prisma.token.updateMany({ 
        where: { token: refreshToken },
        data: { is_active: false }
      });
      
      // Clear all cookies
      res.cookie("accesstoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      res.cookie("refreshtoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      return res.status(401).json({
        success: false,
        message: "Refresh token expired or invalid. Please login.",
      });
    }

    // 4️⃣ If no access token → issue a new one
    if (!accessToken) {

      const newAccessToken = generateAccessToken({
        id: refreshUser.id,
        mobile: refreshUser.mobile,
      });

      const user = await prisma.user.findUnique({
        where: { id: refreshUser.id },
        select: { id: true, name: true, role: true, mobile: true },
      });


      setCookie(res, newAccessToken, refreshToken);
      req.user = user;
      return next();
    }

    // 5️⃣ Access token exists → verify it
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, role: true, mobile: true },
      });


      req.user = user;
      return next();
    } catch (err2) {

      if (err2.name === "TokenExpiredError") {

        const newAccessToken = generateAccessToken({
          id: refreshUser.id,
          mobile: refreshUser.mobile,
        });

        const userFromDb = await prisma.user.findUnique({
          where: { id: refreshUser.id },
          select: { id: true, name: true, role: true, mobile: true },
        });


        setCookie(res, newAccessToken, refreshToken);
        req.user = userFromDb;
        return next();
      }

      // Clear all cookies for invalid access token
      res.cookie("accesstoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      res.cookie("refreshtoken", "", { maxAge: 0, httpOnly: true, secure: true, sameSite: 'none' });
      return res.status(401).json({
        success: false,
        message: "Invalid access token. Please login.",
      });
    }
  } catch (err) {
    console.error("🚨 Middleware error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default verifyTokens;
