import { sendEmail } from "../services/mailer.service.js"; 
import crypto from "crypto";

export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendOtpEmail(toEmail, otp) {
  console.log(`[TESTING/DEBUGGING] OTP for ${toEmail} is: ${otp}`);
  await sendEmail({
    to: toEmail,
    subject: "Your Login OTP - Luomi",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
        <h2>Login Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 8px; color: #4F46E5;">${otp}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: gray; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
    text: `Your Luomi login OTP is: ${otp}. Valid for 10 minutes.`,
  });
}