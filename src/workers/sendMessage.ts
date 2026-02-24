import nodemailer from "nodemailer";
import { handelAsyc } from "../helper/validation/handelAsync";
import { config } from "dotenv";

config();
const APP_PASSWORD = process.env.EMAIL_APP_PASSWORD!;
const SENDER_EMAIL = process.env.SENDER_EMAIL!;
export const sendMessage = async (
  message: string,
  subject: string,
  notifer_email: string,
) => {
  console.log({ APP_PASSWORD, SENDER_EMAIL });

  const response = await handelAsyc(async () => {
    const transporter = nodemailer.createTransport({
      port: 587,
      secure: true,
      service: "gmail",
      auth: {
        user: SENDER_EMAIL,
        pass: APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `<${notifer_email}>`,
      to: notifer_email,
      subject,
      html: message,
    });
    return { message: "Email send successfully" };
  }, "Error in sending message");

  if (!response.success) {
    return { success: false, message: response.message };
  }

  return { success: true, message: response.message };
};
