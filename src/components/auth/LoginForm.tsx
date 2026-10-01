"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field } from "~/components/ui/Field";
import { SubmitButton } from "~/components/ui/SubmitButton";
import { continueWithEmail, type AuthState } from "~/server/actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<AuthState, FormData>(continueWithEmail, {});
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error ? (
        <p role="alert" className="rounded-xl border border-loss/40 bg-loss/10 p-3 text-sm text-fg">
          {state.error}
        </p>
      ) : null}
      <Field
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.email ?? ""}
        placeholder="vous@exemple.fr"
        error={state.fieldErrors?.email}
      />
      <div>
        <Field
          label="Mot de passe"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="8 caractères minimum"
          error={state.fieldErrors?.password}
          hint="Nouveau sur Rebond ? Ce mot de passe créera votre compte."
        />
        <button type="button" onClick={() => setShowPassword((v) => !v)} className="mt-1.5 text-xs font-semibold text-fg-muted hover:text-fg">
          {showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        </button>
      </div>
      <div>
        <label className="flex items-start gap-3 text-sm text-fg-muted">
          <input type="checkbox" name="terms" required className="mt-0.5 h-5 w-5 shrink-0 rounded border-border-strong bg-surface-2 accent-[var(--color-accent)]" />
          <span>
            J&apos;ai lu et j&apos;accepte les{" "}
            <Link href="/cgu" className="font-semibold text-fg underline-offset-2 hover:underline" target="_blank">
              conditions générales d&apos;utilisation
            </Link>{" "}
            et la{" "}
            <Link href="/confidentialite" className="font-semibold text-fg underline-offset-2 hover:underline" target="_blank">
              politique de confidentialité
            </Link>
            , et je confirme avoir 18 ans ou plus.
          </span>
        </label>
        {state.fieldErrors?.terms ? <p className="mt-1.5 text-sm text-loss">{state.fieldErrors.terms}</p> : null}
      </div>
      <SubmitButton full size="lg" pendingLabel="Connexion…">
        Continuer
      </SubmitButton>
    </form>
  );
}
