import Link from "next/link";

/** Fil d'Ariane commun à la fiche et au configurateur : un seul séparateur. Le dernier élément est la page courante. */
export function FilAriane({ liens, courant }: { liens: { href: string; label: string }[]; courant: string }) {
  return (
    <nav aria-label="Fil d'Ariane">
      <ol className="type-mono flex flex-wrap items-center gap-2 text-fg-soft">
        {liens.map((lien) => (
          <li key={lien.href} className="contents">
            <Link
              href={lien.href}
              className="link-underline relative after:absolute after:inset-x-0 after:-inset-y-[13px] after:content-[''] hover:text-accent-ink"
            >
              {lien.label}
            </Link>
            <span aria-hidden="true">›</span>
          </li>
        ))}
        <li className="text-fg" aria-current="page">
          {courant}
        </li>
      </ol>
    </nav>
  );
}
