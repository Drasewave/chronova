import Link from "next/link";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/commandes/etapes";
import { LIBELLE_DEMANDE, TON_DEMANDE } from "@/lib/atelier/demandes";
import type { InquiryStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Demandes" };
export const dynamic = "force-dynamic";

const FILTRES: { cle: string; label: string; statuts?: InquiryStatus[] }[] = [
  { cle: "ouvertes", label: "À traiter", statuts: ["NOUVEAU", "LU", "EN_COURS", "DEVIS_ENVOYE"] },
  { cle: "toutes", label: "Toutes" },
  { cle: "closes", label: "Classées", statuts: ["CONVERTI", "CLOS"] },
];

/**
 * Boîte de réception.
 *
 * Ouverte sur « à traiter » plutôt que sur tout : ce qui est clos n'a plus
 * besoin d'être vu chaque matin. Les nouvelles demandes remontent en premier,
 * indépendamment de leur date.
 */
export default async function Demandes(props: PageProps<"/atelier/demandes">) {
  const { filtre } = await props.searchParams;
  const actif = FILTRES.find((f) => f.cle === filtre) ?? FILTRES[0]!;

  const demandes = await prisma.inquiry.findMany({
    where: actif.statuts ? { status: { in: actif.statuts } } : {},
    orderBy: { createdAt: "desc" },
    include: { quotes: { select: { id: true, status: true } } },
  });

  const nouvelles = demandes.filter((demande) => demande.status === "NOUVEAU");
  const triees = [...nouvelles, ...demandes.filter((demande) => demande.status !== "NOUVEAU")];

  return (
    <div>
      <header className="mb-8">
        <h1 className="type-display-2">Demandes</h1>
        <p className="type-body mt-2 text-fg-soft">
          {nouvelles.length === 0
            ? "Rien de nouveau."
            : `${nouvelles.length} message(s) jamais ouvert(s).`}{" "}
          Contact et pièces uniques arrivent au même endroit.
        </p>
      </header>

      <BandeauExemple
        nombre={demandes.filter((demande) => demande.isSample).length}
        quoi="demandes"
      />

      <nav aria-label="Filtrer les demandes" className="mb-6 flex flex-wrap gap-2">
        {FILTRES.map((item) => (
          <Link
            key={item.cle}
            href={item.cle === "ouvertes" ? "/atelier/demandes" : `?filtre=${item.cle}`}
            aria-current={item.cle === actif.cle ? "page" : undefined}
            className={
              item.cle === actif.cle
                ? "type-ui flex min-h-11 items-center rounded-field border border-accent bg-accent px-4 text-on-accent"
                : "type-ui flex min-h-11 items-center rounded-field border border-rule px-4 text-fg hover:border-accent-decor hover:text-accent"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {triees.length === 0 ? (
        <p className="type-body text-fg-soft">Aucune demande dans ce filtre.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {triees.map((demande) => (
            <li key={demande.id}>
              <Link
                href={`/atelier/demandes/${demande.id}`}
                className="block border border-rule bg-bg p-5 transition-colors duration-200 hover:border-accent-decor"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <span className="type-ui text-fg">
                    {demande.name}
                    <span className="type-caption ml-3 text-fg-soft">{demande.email}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    {demande.type === "SUR_MESURE" && <Pill ton="accent">Pièce unique</Pill>}
                    <Pill ton={TON_DEMANDE[demande.status]}>
                      {LIBELLE_DEMANDE[demande.status]}
                    </Pill>
                    <span className="type-mono text-fg-soft">
                      {formatDate(demande.createdAt)}
                    </span>
                  </span>
                </div>

                <p className="type-body mt-3 line-clamp-2 text-fg-soft">{demande.message}</p>

                {demande.quotes.length > 0 && (
                  <p className="type-caption mt-3 text-fg-soft">
                    {demande.quotes.length} devis · dernier {demande.quotes[0]?.status.toLowerCase()}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
