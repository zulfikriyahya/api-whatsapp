import nodemailer from "nodemailer";
import { logger } from "./logger.service";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM || '"WhatsApp Dashboard" <noreply@example.com>',
        ...options,
      });

      logger.info(`Email sent: ${info.messageId}`, { to: options.to });
      return true;
    } catch (error) {
      logger.error("Failed to send email", { error, to: options.to });
      return false;
    }
  }

  static async sendLoginNotification(
    email: string,
    ip: string,
    userAgent: string,
  ) {
    return this.sendEmail({
      to: email,
      subject: "New Login Detected",
      html: `
        <h3>New Login Detected</h3>
        <p>A new login was detected for your account.</p>
        <ul>
          <li><strong>IP Address:</strong> ${ip}</li>
          <li><strong>Device:</strong> ${userAgent}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If this wasn't you, please contact support immediately.</p>
      `,
    });
  }
}
