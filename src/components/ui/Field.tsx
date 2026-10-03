import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "~/lib/utils";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  leading?: ReactNode;
};

export function Field({ label, hint, error, leading, id, className, ...rest }: Props) {
  const inputId = id ?? rest.name;
  const errorId = error ? `${inputId}-erreur` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-fg">
        {label}
      </label>
      <div className="relative">
        {leading ? <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">{leading}</span> : null}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "h-12 w-full rounded-xl border bg-surface-2 px-4 text-base text-fg placeholder:text-fg-subtle",
            "focus:border-accent focus:outline-none",
            leading ? "pl-11" : undefined,
            error ? "border-loss" : "border-border",
            className,
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-loss">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
