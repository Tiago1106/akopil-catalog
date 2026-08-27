"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = undefined;

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>{ptBR.admin.login.title}</CardTitle>
            <CardDescription>{ptBR.admin.login.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">{ptBR.admin.login.emailLabel}</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">{ptBR.admin.login.passwordLabel}</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </Field>
                {state?.error && <FieldError>{state.error}</FieldError>}
                <Field>
                  <Button type="submit" disabled={pending}>
                    {pending && <Loader2 className="animate-spin" />}
                    {pending ? ptBR.admin.login.submitting : ptBR.admin.login.submit}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
