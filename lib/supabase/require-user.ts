import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "./server";
import type { User } from "@supabase/supabase-js";

export async function requireUser(): Promise<
  { user: User; unauthorized: null } | { user: null; unauthorized: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, unauthorized: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  return { user, unauthorized: null };
}
