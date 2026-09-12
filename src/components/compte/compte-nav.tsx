"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { seDeconnecter } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const LIENS = [
  { href: "/compte", label: "Vue d'ensemble" },
  { href: "/compte/commandes", label: "Mes commandes" },
  { href: "/compte/adresses", label: "Adresses" },
  { href: "/compte/profil", label: "Profil & données" },
];

export function CompteNav({ prenom }: { prenom: string }) {
  const chemin = usePathname();

  return (
    <nav aria-label="Mon compte" className="lg:sticky lg:top-28 lg:self-start">
      <p className="type-mono text-fg-soft">Connecté</p>
      <p className="type-title-2 mt-2 break-words">{prenom}</p>

      <ul className="mt-8 flex flex-col border-t border-rule">
        {LIENS.map((lien) => {
          const actif = lien.href === "/compte" ? chemin === lien.href : chemin.startsWith(lien.href);
          return (
            <li key={lien.href} className="border-b border-rule">
              <Link
                href={lien.href}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "type-ui flex min-h-12 items-center transition-colors duration-200",
                  actif ? "text-accent" : "text-fg hover:text-accent",
                )}
              >
                {lien.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={seDeconnecter} className="mt-8">
        <button
          type="submit"
          className="type-ui link-underline inline-flex min-h-11 items-center text-fg-soft hover:text-alert"
        >
          Se déconnecter
        </button>
      </form>
    </nav>
  );
}
