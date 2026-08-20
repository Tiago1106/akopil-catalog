"use client";

import { useActionState } from "react";
import ptBR from "@/locales/pt-BR.json";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = undefined;

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <form
        action={action}
        className="w-full max-w-sm space-y-5 rounded-akopil border border-gray-2 p-8"
      >
        <h1 className="text-lg font-bold text-black">{ptBR.admin.login.title}</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-gray-4">
            {ptBR.admin.login.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-akopil border border-gray-2 px-3 py-2 text-sm text-black outline-none focus:border-black"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-gray-4">
            {ptBR.admin.login.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-akopil border border-gray-2 px-3 py-2 text-sm text-black outline-none focus:border-black"
          />
        </div>

        {state?.error && <p className="text-sm text-black">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-akopil bg-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {pending ? ptBR.admin.login.submitting : ptBR.admin.login.submit}
        </button>
      </form>
    </main>
  );
}
