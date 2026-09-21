import Link from "next/link";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { formatDate, libelleStatut } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";
import { EtatVide, Filtre, Filtres, LIGNE_TABLEAU, Tableau, Td, Th, TitrePage } from "@/components/atelier/gabarit";

export const metadata = { title: "Commandes — liste" };
export const dynamic = "force-dynamic";

const FILTRES: { cle: string; label: string; statuts?: OrderStatus[] }[] = [
  { cle: "toutes", label: "Toutes" },
  {
    cle: "atelier",
    label: "En atelier",
    statuts: ["PAYEE", "PIECES_A_COMMANDER", "PIECES_RECUES", "EN_ASSEMBLAGE", "CONTROLE"],
  },
  { cle: "parties", label: "Parties", statuts: ["EXPEDIEE", "LIVREE"] },
  { cle: "hors", label: "Hors circuit", statuts: ["EN_ATTENTE_PAIEMENT", "ANNULEE", "REMBOURSEE"] },
];

export default async function ListeCommandes(props: PageProps<"/atelier/commandes/liste">) {
  const { filtre } = await props.searchParams;
  const actif = FILTRES.find((f) => f.cle === filtre) ?? FILTRES[0]!;

  const commandes = await prisma.order.findMany({
    where: actif.statuts ? { status: { in: actif.statuts } } : {},
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { name: true, id: true } } },
  });

  const marge = commandes.reduce(
    (somme, commande) =>
      somme +
      commande.items.reduce(
        (sousSomme, ligne) =>
          sousSomme + (ligne.unitPriceCents - ligne.partsCostCents) * ligne.quantity,
        0,
      ),
    0,
  );

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <TitrePage>Commandes</TitrePage>
          <p className="type-ui mt-2 max-w-[72ch] font-normal text-fg-soft">
            {commandes.length} commande(s) · marge cumulée {formatPrice(marge)} (prix de vente moins
            coût des pièces)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <a
            href="/api/atelier/commandes"
            download
            className="type-ui lien-atelier link-underline text-accent-ink"
          >
            Exporter en CSV
          </a>
          <Link href="/atelier/commandes" className="type-ui lien-atelier link-underline text-accent-ink">
            Revenir au kanban
          </Link>
        </div>
      </header>

      <BandeauExemple
        nombre={commandes.filter((commande) => commande.isSample).length}
        quoi="commandes de cette liste"
      />

      <Filtres label="Filtrer les commandes">
        {FILTRES.map((item) => (
          <Filtre key={item.cle} href={item.cle === "toutes" ? "/atelier/commandes/liste" : `?filtre=${item.cle}`} actif={item.cle === actif.cle}>
            {item.label}
          </Filtre>
        ))}
      </Filtres>

      <Tableau largeurMin="min-w-[54rem]" cadre>
          <thead>
            <tr className="border-b border-rule">
              <Th>Numéro</Th>
              <Th>Passée le</Th>
              <Th>Client</Th>
              <Th>Montre</Th>
              <Th>Étape</Th>
              <Th align="right">Total</Th>
              <Th align="right">Marge</Th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((commande) => {
              const margeLigne = commande.items.reduce(
                (somme, ligne) =>
                  somme + (ligne.unitPriceCents - ligne.partsCostCents) * ligne.quantity,
                0,
              );
              return (
                <tr key={commande.id} className={LIGNE_TABLEAU}>
                  <Td>
                    <Link
                      href={`/atelier/commandes/${commande.number}`}
                      className="type-mono lien-atelier link-underline text-accent-ink"
                    >
                      {commande.number}
                    </Link>
                    {commande.isSample && (
                      <span className="type-caption ml-2 text-fg-soft">exemple</span>
                    )}
                  </Td>
                  <Td>
                    <span className="type-caption text-fg-soft" data-numeric>{formatDate(commande.createdAt)}</span>
                  </Td>
                  <Td>
                    {commande.user ? (
                      <Link
                        href={`/atelier/clients/${commande.user.id}`}
                        className="type-ui link-underline text-fg"
                      >
                        {commande.user.name ?? commande.email}
                      </Link>
                    ) : (
                      <span className="type-ui text-fg">{commande.email}</span>
                    )}
                  </Td>
                  <Td>
                    <span className="type-ui text-fg">
                      {(commande.items[0]?.snapshot as { modele?: string } | null)?.modele ?? "—"}
                    </span>
                  </Td>
                  <Td>
                    <Pill>{libelleStatut(commande.status)}</Pill>
                  </Td>
                  <Td align="right">
                    <span className="type-ui text-fg" data-numeric>
                      {formatPrice(commande.totalCents)}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="type-caption text-fg-soft" data-numeric>
                      {formatPrice(margeLigne)}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Tableau>

      {commandes.length === 0 && (
        <EtatVide className="mt-4">Aucune commande dans ce filtre.</EtatVide>
      )}
    </div>
  );
}
