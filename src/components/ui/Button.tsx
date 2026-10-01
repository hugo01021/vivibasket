import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "~/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover shadow-glow",
  secondary: "bg-surface-2 text-fg hover:bg-surface-3 border border-border",
  outline: "border border-border-strong text-fg hover:border-accent hover:text-accent",
  ghost: "text-fg-muted hover:text-fg hover:bg-surface-2",
  danger: "border border-loss/40 text-loss hover:bg-loss/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-6 text-base gap-2.5",
};

type Common = {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type ButtonAsLink = Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function buttonClasses({ variant = "primary", size = "md", full = false, className }: Partial<Common>): string {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold tracking-tight transition-colors select-none",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
    VARIANTS[variant],
    SIZES[size],
    full && "w-full",
    className,
  );
}

export function Button(props: ButtonAsButton | ButtonAsLink) {
  if (props.href !== undefined) {
    const { variant, size, full, className, children, href, ...rest } = props;
    return (
      <Link href={href} className={buttonClasses({ variant, size, full, className })} {...rest}>
        {children}
      </Link>
    );
  }
  const { variant, size, full, className, children, type = "button", ...rest } = props;
  return (
    <button type={type} className={buttonClasses({ variant, size, full, className })} {...rest}>
      {children}
    </button>
  );
}
