"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { HOME_COMPETITIONS, HOME_TEAMS, type HomeTeam } from "@/data/matches";
import { cn, normalizeForSearch } from "@/lib/utils";

const MAX_SUGGESTIONS = 7;
const competitionLabel = new Map(HOME_COMPETITIONS.map((c) => [c.id, c.label]));

function suggest(query: string): HomeTeam[] {
  const q = normalizeForSearch(query.trim());
  if (q.length === 0) return [];
  const starts: HomeTeam[] = [];
  const contains: HomeTeam[] = [];
  for (const team of HOME_TEAMS) {
    const name = normalizeForSearch(team.name);
    if (name === q) continue;
    if (name.startsWith(q) || name.split(/[\s-]+/).some((word) => word.startsWith(q))) starts.push(team);
    else if (name.includes(q) || normalizeForSearch(team.short) === q) contains.push(team);
  }
  return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
}

interface TeamInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  invalid?: boolean;
}

/** Champ équipe avec autocomplétion (combobox ARIA : flèches, Entrée, Échap). */
export function TeamInput({ label, value, onChange, placeholder, invalid = false }: TeamInputProps) {
  const id = useId();
  const listId = `${id}-liste`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const suggestions = useMemo(() => suggest(value), [value]);
  const expanded = open && suggestions.length > 0;

  const choose = (team: HomeTeam) => {
    onChange(team.name);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (suggestions.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (expanded ? (i + step + suggestions.length) % suggestions.length : 0));
    } else if (event.key === "Enter" && expanded) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-dim">
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={cn(
          "h-12 w-full rounded-md border bg-white/[0.03] px-3.5 text-[15px] text-fg placeholder:text-dim/70 transition-colors focus:bg-white/[0.05] focus:outline-none",
          invalid ? "border-accent/70" : "border-line hover:border-white/15 focus:border-white/25",
        )}
      />
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-line bg-surface-2 py-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.9)]"
        >
          {suggestions.map((team, index) => (
            <li
              key={team.name}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown plutôt que click : le choix passe avant le blur du champ
              onMouseDown={(e) => {
                e.preventDefault();
                choose(team);
              }}
              onMouseEnter={() => setActive(index)}
              className={cn(
                "flex cursor-pointer items-baseline justify-between gap-3 px-3.5 py-2 text-sm",
                index === active ? "bg-white/[0.06] text-fg" : "text-fg/85",
              )}
            >
              <span className="truncate">{team.name}</span>
              <span className="shrink-0 text-[11px] text-dim">
                {team.competitions.map((c) => competitionLabel.get(c)).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
