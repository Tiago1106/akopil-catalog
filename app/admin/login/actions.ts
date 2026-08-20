"use server";

import { redirect } from "next/navigation";
import ptBR from "@/locales/pt-BR.json";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string } | undefined;

export async function signIn(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return { error: ptBR.admin.login.invalidCredentials };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: ptBR.admin.login.invalidCredentials };
  }

  redirect("/admin");
}
