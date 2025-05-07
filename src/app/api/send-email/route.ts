import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { processEmailHtml } from "@/lib/email-utils";

const VALID_PASS_KEY = process.env.VALID_PASS_KEY;

// Define the expected request body type
interface EmailRequestBody {
  emails: string[];
  subject: string;
  htmlContent: string;
  passKey: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<EmailRequestBody>;
    const { emails, subject, htmlContent, passKey } = body;

    // Validate required fields
    if (!emails || !Array.isArray(emails) || !subject || !htmlContent) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    // Validate pass key
    if (!passKey || passKey !== VALID_PASS_KEY) {
      return NextResponse.json(
        { success: false, message: "Invalid pass key. Email sending is restricted." },
        { status: 403 }
      );
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Process HTML to ensure email client compatibility
    const processedHtml = processEmailHtml(htmlContent);

    // Set up mail options
    const mailOptions = {
      from: `"Your Company Name" <${process.env.EMAIL_USER}>`,
      subject: subject,
      html: processedHtml,
      headers: {
        "Content-Type": "text/html; charset=UTF-8",
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
      },
      text: "Please view this email in an HTML-compatible email client.",
    };

    // Send emails to all recipients
    const emailPromises = emails.map((email) => {
      return transporter.sendMail({
        ...mailOptions,
        to: email,
      });
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Emails sent successfully to ${emails.length} recipients.`,
    });
  } catch (error: unknown) {
    let errorMsg = "Failed to send emails.";
    if (error instanceof Error) {
      errorMsg = error.message;
      console.error("Error sending emails:", error);
    } else {
      console.error("Unknown error sending emails:", error);
    }
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}
