// backend/src/lib/mailer.ts
// Servicio mínimo de correo con Nodemailer (Gmail + App Password).
import nodemailer from "nodemailer";
import { env } from "../env.ts";
import fs from "node:fs";
import path from "node:path";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE, // true para 465
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendWelcomeEmail(to: string, name?: string | null) {
  const html = loadTemplate("welcome.html")
    .replace(/{{NAME}}/g, name?.trim() || "¡Bienvenido(a)!");
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Bienvenido(a) a NutriHuella",
    html,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const html = loadTemplate("reset-password.html")
    .replace(/{{RESET_URL}}/g, resetUrl);
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Restablecer contraseña - NutriHuella",
    html,
  });
}

function loadTemplate(file: "welcome.html" | "reset-password.html"): string {
  const p = path.join(process.cwd(), "src", "templates", "emails", file);
  return fs.readFileSync(p, "utf8");
}

// ...
export async function sendVerifyEmail(to: string, verifyUrl: string) {
  const html = loadTemplate("verify-email.html").replace(/{{VERIFY_URL}}/g, verifyUrl);
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Confirma tu correo - NutriHuella",
    html,
  });
}
// ...
