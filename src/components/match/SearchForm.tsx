"use client";

import { useActionState, useState } from "react";
import { IconArrowRight, IconSearch } from "~/components/ui/icons";
import { SubmitButton } from "~/components/ui/SubmitButton";
import { analyzeFromSearch, type SearchState } from "~/server/actions/analyses";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const [state, action] = useActionState<SearchState, FormData>(analyzeFromSearch, {});
  const [value, setValue] = useState(initialQuery);
  return (
    <form action={action} className="space-y-3" role="search">
      <label htmlFor="recherche-match" className="block text-sm font-semibold text-fg">
        Quel match voulez-vous analyser ?
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            id="recherche-match"
            name="q"
            type="search"
            required
            minLength={3}
            autoComplete="off"
            enterKeyHint="go"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex. : Lakers vs Celtics"
            aria-describedby={state.error ? "recherche-erreur" : "recherche-aide"}
            className="h-13 w-full rounded-full border border-border bg-surface-2 pl-11 pr-4 text-base text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        </div>
        <SubmitButton size="lg" pendingLabel="Analyse…" className="sm:px-7">
          Analyser
          <IconArrowRight size={18} />
        </SubmitButton>
      </div>
      {state.error ? (
        <div id="recherche-erreur" role="alert" className="rounded-xl border border-loss/40 bg-loss/10 p-3 text-sm text-fg">
          <p>{state.error}</p>
          {state.suggestions && state.suggestions.length > 0 ? (
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-fg-muted">Vouliez-vous dire :</span>
              {state.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue((v) => (v.trim() ? `${v.trim()} vs ${s}` : s))}
                  className="rounded-full border border-border-strong px-3 py-1 text-xs font-semibold text-fg hover:border-accent hover:text-accent"
                >
                  {s}
                </button>
              ))}
            </p>
          ) : null}
        </div>
      ) : (
        <p id="recherche-aide" className="text-xs text-fg-subtle">
          Deux équipes séparées par « vs », « contre » ou un tiret. NBA, EuroLeague et Betclic Élite.
        </p>
      )}
    </form>
  );
}
