import Link from "next/link";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/commandes/etapes";
import { LIBELLE_DEMANDE, TON_DEMANDE } from "@/lib/atelier/demandes";
import type { InquiryStatus } from "@/generated/prisma/enums";
import { EtatVide, Filtre, Filtres, SURFACE, TitrePage } from "@/components/atelier/gabarit";
import { cn } from "@/lib/utils";

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
      <header className="mb-6">
        <TitrePage>Demandes</TitrePage>
        <p className="type-ui mt-2 max-w-[72ch] font-normal text-fg-soft">
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

      <Filtres label="Filtrer les demandes">
        {FILTRES.map((item) => (
          <Filtre key={item.cle} href={item.cle === "ouvertes" ? "/atelier/demandes" : `?filtre=${item.cle}`} actif={item.cle === actif.cle}>
            {item.label}
          </Filtre>
        ))}
      </Filtres>

      {triees.length === 0 ? (
        <EtatVide>Aucune demande dans ce filtre.</EtatVide>
      ) : (
        <ul className="flex flex-col gap-2">
          {triees.map((demande) => (
            <li key={demande.id}>
              <Link
                href={`/atelier/demandes/${demande.id}`}
                className={cn(SURFACE, "block px-5 py-4 transition-colors duration-200 hover:border-fg-soft hover:bg-bg-alt")}
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
                    <span className="type-caption text-fg-soft" data-numeric>
                      {formatDate(demande.createdAt)}
                    </span>
                  </span>
                </div>

                <p className="type-ui mt-2 line-clamp-2 max-w-[90ch] font-normal text-fg-soft">{demande.message}</p>

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
