import jwt from "jsonwebtoken";
import { setCookie } from "../utils/setCookie.js";
import { generateAccessToken } from "../utils/TokenGenerator.js";
import { prisma } from "../index.js";

const verifyTokens = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accesstoken;
    const refreshToken = req.cookies.refreshtoken;


    // 1️⃣ No refresh token → block immediately
    if (!refreshToken) {
      res.cookie("accesstoken", "", { maxAge: 0 });

      
      return res.status(401).json({
        success: false,
        message: "Refresh token missing. Please login.",
      });
    }

    // 2️⃣ Check if refresh token exists in DB
    const tokenDoc = await prisma.token.findUnique({ where: { token: refreshToken } });
    if (!tokenDoc) {
      res.cookie("accesstoken", "", { maxAge: 0 });
      res.cookie("refreshtoken", "", { maxAge: 0 });
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token. Please login.",
      });
    }

    // 3️⃣ Verify refresh token
    let refreshUser;
    try {
      refreshUser = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    } catch (err) {
      await prisma.token.deleteMany({ where: { token: refreshToken } });
      res.cookie("accesstoken", "", { maxAge: 0 });
      res.cookie("refreshtoken", "", { maxAge: 0 });
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

      return res.status(403).json({
        success: false,
        message: "Invalid access token.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default verifyTokens;
