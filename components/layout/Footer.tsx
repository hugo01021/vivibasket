import { SITE } from "@/lib/site";

/** Une seule ligne, sobre. */
export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-5 text-xs text-fg-muted sm:px-6">
        <span>
          © {new Date().getFullYear()} {SITE.name}
        </span>
        <a href="#" className="hover:text-fg">
          Mentions légales
        </a>
        <a href={`mailto:${SITE.contactEmail}`} className="hover:text-fg">
          Contact
        </a>
        <span className="w-full sm:ml-auto sm:w-auto">Les analyses sont indicatives, pariez de façon responsable.</span>
      </div>
    </footer>
  );
}
