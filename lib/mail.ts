import nodemailer from "nodemailer";

export interface MailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export interface OutgoingMail {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
}

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM);
}

export async function sendMail(mail: OutgoingMail): Promise<void> {
  if (!mailConfigured()) {
    throw new Error("SMTP is not configured. Fill SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM.");
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    replyTo: process.env.MAIL_REPLY_TO || undefined,
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments: mail.attachments,
  });
}
