import SibApiV3Sdk from "@sendinblue/client";
import dotenv from "dotenv";

dotenv.config();

// ===================== Sendinblue Setup =====================
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

export default tranEmailApi;
