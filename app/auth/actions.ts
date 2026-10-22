"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthResult = { ok: true } | { ok: false; error: string };

const USERNAME_REGEX = /^[a-z0-9_]{3,10}$/;
const MIN_PASSWORD_LENGTH = 6;

const INVALID_CREDENTIALS_ERROR = "Correo o contraseña incorrectos.";
const EMAIL_TAKEN_ERROR = "Ese correo ya está registrado.";
const INVALID_USERNAME_ERROR =
  "El usuario debe tener 3–10 caracteres: letras, números o _.";
const INVALID_PASSWORD_ERROR =
  "La contraseña debe tener al menos 6 caracteres.";
const GENERIC_ERROR = "No pudimos completar la operación. Intenta de nuevo.";

export async function signUp(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const username = input.username.trim().toLowerCase();

  if (!USERNAME_REGEX.test(username)) {
    return { ok: false, error: INVALID_USERNAME_ERROR };
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: INVALID_PASSWORD_ERROR };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: { data: { username } },
    });

    if (error) {
      if (
        error.code === "user_already_exists" ||
        error.code === "email_exists"
      ) {
        return { ok: false, error: EMAIL_TAKEN_ERROR };
      }
      if (error.code === "weak_password") {
        return { ok: false, error: INVALID_PASSWORD_ERROR };
      }
      return { ok: false, error: GENERIC_ERROR };
    }
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }

  // redirect() throws, so it must stay outside the try/catch.
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: input.email.trim(),
      password: input.password,
    });

    if (error) {
      if (error.code === "invalid_credentials") {
        return { ok: false, error: INVALID_CREDENTIALS_ERROR };
      }
      return { ok: false, error: GENERIC_ERROR };
    }
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
