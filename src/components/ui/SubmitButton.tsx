"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClasses } from "./Button";
import { Spinner } from "./icons";

type Props = {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  className?: string;
  disabled?: boolean;
};

/** Bouton de formulaire avec état d'envoi (fonctionne avec les Server Actions). */
export function SubmitButton({ children, pendingLabel, variant, size, full, className, disabled }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} aria-busy={pending} className={buttonClasses({ variant, size, full, className })}>
      {pending ? (
        <>
          <Spinner className="h-4 w-4 animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
