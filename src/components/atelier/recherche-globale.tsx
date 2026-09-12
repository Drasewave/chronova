"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { rechercheGlobale, type ResultatRecherche } from "@/app/actions/recherche";
import { cn } from "@/lib/utils";

/**
 * Palette de recherche, ouverte par Cmd/Ctrl + K.
 *
 * Bâtie sur `<dialog>` : piégeage du focus, fermeture par Échap et retour du
 * focus sont assurés par le navigateur. La saisie est temporisée de 180 ms pour
 * ne pas lancer une requête par frappe.
 */
export function RechercheGlobale() {
  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState("");
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [actif, setActif] = useState(0);
  const dialogue = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const surTouche = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOuvert((v) => !v);
      }
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, []);

  useEffect(() => {
    const noeud = dialogue.current;
    if (!noeud) return;
    if (ouvert && !noeud.open) noeud.showModal();
    if (!ouvert && noeud.open) noeud.close();
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    const minuteur = window.setTimeout(async () => {
      setResultats(await rechercheGlobale(requete));
      setActif(0);
    }, 180);
    return () => window.clearTimeout(minuteur);
  }, [requete, ouvert]);

  const aller = useCallback(
    (href: string) => {
      setOuvert(false);
      setRequete("");
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="type-ui flex min-h-11 flex-1 items-center justify-between gap-4 rounded-field border border-rule bg-panel px-4 text-fg-soft hover:border-accent-decor sm:max-w-md"
      >
        <span>Rechercher une commande, un client, une pièce…</span>
        <kbd className="type-mono hidden shrink-0 text-fg-soft sm:block">⌘K</kbd>
      </button>

      <dialog
        ref={dialogue}
        onClose={() => setOuvert(false)}
        onClick={(event) => {
          if (event.target === dialogue.current) setOuvert(false);
        }}
        aria-label="Recherche"
        className="mx-auto mt-[10vh] w-[min(94vw,40rem)] rounded-card border border-rule bg-bg p-0 text-fg shadow-lift backdrop:bg-[color-mix(in_srgb,var(--color-ink)_55%,transparent)]"
      >
        <div className="border-b border-rule p-4">
          <input
            autoFocus
            type="search"
            value={requete}
            onChange={(event) => setRequete(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActif((i) => Math.min(i + 1, resultats.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActif((i) => Math.max(i - 1, 0));
              }
              if (event.key === "Enter") {
                const choix = resultats[actif];
                if (choix) {
                  event.preventDefault();
                  aller(choix.href);
                }
              }
            }}
            placeholder="Numéro de commande, nom, référence de pièce…"
            aria-label="Rechercher dans l'atelier"
            className="type-body w-full bg-transparent text-fg outline-none placeholder:text-fg-soft"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {requete.trim().length < 2 ? (
            <p className="type-caption p-4 text-fg-soft">
              Tapez au moins deux caractères. Flèches pour naviguer, Entrée pour ouvrir.
            </p>
          ) : resultats.length === 0 ? (
            <p className="type-caption p-4 text-fg-soft">Aucun résultat.</p>
          ) : (
            <ul>
              {resultats.map((resultat, index) => (
                <li key={`${resultat.href}-${index}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActif(index)}
                    onClick={() => aller(resultat.href)}
                    className={cn(
                      "flex w-full items-baseline justify-between gap-4 rounded-field px-4 py-3 text-left",
                      index === actif ? "bg-panel" : "hover:bg-panel",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="type-ui block truncate text-fg">{resultat.titre}</span>
                      <span className="type-caption block truncate text-fg-soft">
                        {resultat.detail}
                      </span>
                    </span>
                    <span className="type-mono shrink-0 text-fg-soft">{resultat.groupe}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
