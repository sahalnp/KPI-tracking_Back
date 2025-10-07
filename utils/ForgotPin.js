import { transporter } from "../config/sendMail.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

export async function forgetPin(email, pin) {
  const mailOptions = {
    from: process.env.APP_EMAIL,
    to: email,
    subject: "Password Reset PIN - Century Fashion City",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset PIN</title>
  <style>
    /* Main card with border */
    .main-card {
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e0e0e0;     /* light border like Upwork */
      box-shadow: 0 4px 12px rgba(0,0,0,0.05); /* subtle shadow */
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
  </style>
</head>
<body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#ffffff; min-height:100vh;">
  <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;">
    
    <!-- Main Card Container -->
    <div class="main-card">
      
      <!-- Logo Section -->
      <div style="padding:40px 30px 20px;">
        <img src="cid:logo" alt="Century Fashion City" style="width:80px; height:auto; margin-bottom:10px;" />
        <h1 style="margin:0; font-size:22px; font-weight:700; color:red;">Century Fashion City</h1>
      </div>
      
      <!-- PIN Header -->
      <div style="padding:10px 30px;">
        <h2 style="margin:0; font-size:18px; font-weight:600; color:#333;">🔐 Password Reset PIN</h2>
      </div>
      
      <!-- PIN Display Section -->
      <div style="padding:20px 30px;">
        <p style="font-size:15px; color:#555; margin-bottom:15px;">
          Use the PIN code below to reset your password:
        </p>
        <div style="background:#f8f9fa; border-radius:12px; padding:25px; margin:15px auto; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          <div style="font-size:40px; font-weight:700; color:#000; letter-spacing:6px;">
            ${pin}
          </div>
        </div>

        <!-- Important Security Notice -->
        <div style="background-color:#ffe5e5; padding:15px; border-radius:8px; margin:20px 0; text-align:left;">
          <div style="display:flex; align-items:center;">
          <span style="font-size:18px; margin-right:8px;">⚠️</span>

            <div>
              <div style="font-size:14px; font-weight:600; color:#d8000c; margin-bottom:3px;">Important Security Notice</div>
              <div style="font-size:13px; color:#d8000c; line-height:1.4;">
                This PIN is valid for 15 minutes. Please change your password immediately after logging in.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color:#2c3e50; color:#ecf0f1; text-align:center; padding:20px 30px; border-radius:0 0 16px 16px;">
        <div style="font-size:13px; margin-bottom:8px;">
          Need help? Contact us at <a href="mailto:support@centuryfashioncity.com" style="color:#74b9ff; text-decoration:none;">support@centuryfashioncity.com</a>
        </div>
        <div style="font-size:11px; color:#bdc3c7; border-top:1px solid #34495e; padding-top:12px; margin-top:12px;">
          © 2025 Century Fashion City. All rights reserved.
        </div>
      </div>
      
    </div>
  </div>
</body>
</html>`,
    attachments: [
      {
        filename: "century.png",
        path: join(__dirname, "../public/images/century.png"),
        cid: "logo"
      }
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("PIN email sent successfully:", info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending PIN email:", error);
    return { success: false, error: error.message };
  }
}
