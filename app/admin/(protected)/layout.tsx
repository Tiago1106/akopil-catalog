import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        style={
          {
            "--border-radius": "6px",
            "--normal-bg": "#ffffff",
            "--normal-border": "#e5e5e5",
            "--normal-text": "#111111",
            "--success-bg": "#ffffff",
            "--success-border": "#111111",
            "--success-text": "#111111",
            "--error-bg": "#111111",
            "--error-border": "#111111",
            "--error-text": "#ffffff",
          } as React.CSSProperties
        }
      />
    </>
  );
}
