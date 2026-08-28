import nodemailer, { type Transporter } from "nodemailer";
import { env } from "./env.js";

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.ETHEREAL_HOST,
    port: env.ETHEREAL_PORT,
    secure: env.ETHEREAL_PORT === 465,
    auth: {
      user: env.ETHEREAL_USER,
      pass: env.ETHEREAL_PASS,
    },
    pool: true,
    maxConnections: 1,
    maxMessages: Infinity,
  });

  return transporter;
}

export async function verifyTransporter(): Promise<void> {
  const t = getTransporter();
  await t.verify();
}

export async function closeTransporter(): Promise<void> {
  if (transporter) {
    transporter.close();
    transporter = null;
  }
}
