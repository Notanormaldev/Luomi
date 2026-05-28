import SibApiV3Sdk from "sib-api-v3-sdk";
import config from "../config/config.js";



//Setup
const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications["api-key"].apiKey = config.BREVO_API_KEY;

const client = new SibApiV3Sdk.TransactionalEmailsApi();

//Verify
client.sendTransacEmail({ 
  sender: { 
  email: config.GOOGLE_EMAIL,
  name: "Luomi"  
}, 
  to: [{ email: config.GOOGLE_EMAIL }], 
  subject: "test", 
  textContent: "test" 
})
  .then(() => console.log("Email server is ready to send messages"))
  .catch((e) => console.error("Error connecting to email server:", e.message));

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