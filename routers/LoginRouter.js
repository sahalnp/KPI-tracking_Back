import express from "express";
import { loginUser, sendMail } from "../controller/loginController.js";
const loginRouter = express.Router();

loginRouter.post('/auth/forgot-pin',sendMail)
loginRouter.post('/auth/login',loginUser)

export default loginRouter