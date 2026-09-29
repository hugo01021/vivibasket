import { cn } from "@/lib/utils";

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full rounded-full bg-live animate-live-pulse" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
    </span>
  );
}
