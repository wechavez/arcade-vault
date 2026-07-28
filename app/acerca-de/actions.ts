"use server";

import { Resend } from "resend";

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export type ContactResult = { ok: true } | { ok: false; error: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "No pudimos enviar tu mensaje. Intenta de nuevo.";

export async function sendContactMessage(
  payload: ContactPayload
): Promise<ContactResult> {
  if (!EMAIL_REGEX.test(payload.email)) {
    return { ok: false, error: "El correo ingresado no es válido." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "wechavez14@gmail.com",
      subject: "Nuevo mensaje de contacto — Arcade Vault",
      text: `Nombre: ${payload.name}\nCorreo: ${payload.email}\n\n${payload.message}`,
    });

    if (error) {
      return { ok: false, error: GENERIC_ERROR };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}
