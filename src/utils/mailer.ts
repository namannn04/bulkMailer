import nodemailer from "nodemailer";

export async function sendMail(to: string, htmlContent: string) {
  try {
    console.log("Setting up transporter...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    console.log("Sending email to", to);
    const info = await transporter.sendMail({
      from: `"Tensor Boy" <${process.env.MAIL_USER}>`,
      to,
      subject: "Welcome to TERMINAL PROTOCOL",
      html: htmlContent,
    });

    console.log("Email sent: ", info.messageId);
    return info;
  } catch (err) {
    console.error("Error in sendMail:", err);
    throw err;
  }
}
