"use server";

import { redirect } from "next/navigation";

import { loginInputSchema, registerInputSchema } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string) {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry : "";
}

export async function login(formData: FormData) {
  const parsed = loginInputSchema.safeParse({
    email: value(formData, "email"),
    password: value(formData, "password"),
  });

  if (!parsed.success) {
    redirect("/login?error=INVALID_INPUT");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect("/login?error=AUTH_INVALID");
  }

  redirect("/dashboard");
}

export async function register(formData: FormData) {
  const parsed = registerInputSchema.safeParse({
    displayName: `${value(formData, "firstName")} ${value(formData, "lastName")}`.trim(),
    email: value(formData, "email"),
    password: value(formData, "password"),
    passwordConfirmation: value(formData, "passwordConfirmation"),
  });

  if (!parsed.success) {
    redirect("/register?error=INVALID_INPUT");
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${appUrl}/auth/confirm`,
    },
  });

  if (error) {
    redirect("/register?error=REGISTRATION_FAILED");
  }

  redirect(`/confirm-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
