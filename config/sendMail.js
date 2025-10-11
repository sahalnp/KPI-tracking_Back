// server/config/sendMail.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Simple Brevo API client using axios
class BrevoClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = "https://api.brevo.com/v3";
  }

  async sendTransacEmail(emailData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/smtp/email`,
        emailData,
        {
          headers: {
            "api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Brevo API Error:", error.response?.data || error.message);
      throw error;
    }
  }
}

const brevoClient = new BrevoClient(process.env.SENDINBLUE_API_KEY);
export default brevoClient;