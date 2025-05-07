import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { processEmailHtml } from "@/lib/email-utils"

// This would be set in your environment variables
// For this example, we're using a constant, but in production
// you should use a secure environment variable
const VALID_PASS_KEY = "bulkmailer@432005"

export async function POST(request: NextRequest) {
  try {
    const { emails, subject, htmlContent, passKey } = await request.json()

    // Validate required fields
    if (!emails || !subject || !htmlContent) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 })
    }

    // Validate pass key
    if (!passKey || passKey !== VALID_PASS_KEY) {
      return NextResponse.json(
        { success: false, message: "Invalid pass key. Email sending is restricted." },
        { status: 403 },
      )
    }

    // Create email transporter
    // Note: In production, you should use environment variables for these credentials
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Process HTML to ensure email client compatibility
    const processedHtml = processEmailHtml(htmlContent)

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
    }

    // Send emails to all recipients
    const emailPromises = emails.map((email: string) => {
      return transporter.sendMail({
        ...mailOptions,
        to: email,
      })
    })

    await Promise.all(emailPromises)

    return NextResponse.json({
      success: true,
      message: `Emails sent successfully to ${emails.length} recipients.`,
    })
  } catch (error: any) {
    console.error("Error sending emails:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to send emails." }, { status: 500 })
  }
}
