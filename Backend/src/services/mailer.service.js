import SibApiV3Sdk from "sib-api-v3-sdk";
import config from "../config/config.js";



//Setup
const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = config.BREVO_API_KEY;

const client = new SibApiV3Sdk.TransactionalEmailsApi();

//function
export async function sendEmail({ to, html, subject, text }) {
  const mailOptions = {
    sender: { email: config.GOOGLE_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  };

  const dts = await client.sendTransacEmail(mailOptions);
  return dts;
}