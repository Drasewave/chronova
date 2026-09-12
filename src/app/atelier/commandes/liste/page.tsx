import Link from "next/link";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { formatDate, libelleStatut } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/enums";

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
          <h1 className="type-display-2">Commandes</h1>
          <p className="type-body mt-2 text-fg-soft">
            {commandes.length} commande(s) · marge cumulée {formatPrice(marge)} (prix de vente moins
            coût des pièces)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <a
            href="/api/atelier/commandes"
            download
            className="type-ui link-underline text-accent"
          >
            Exporter en CSV
          </a>
          <Link href="/atelier/commandes" className="type-ui link-underline text-accent">
            Revenir au kanban
          </Link>
        </div>
      </header>

      <BandeauExemple
        nombre={commandes.filter((commande) => commande.isSample).length}
        quoi="commandes de cette liste"
      />

      <nav aria-label="Filtrer les commandes" className="mb-6 flex flex-wrap gap-2">
        {FILTRES.map((item) => (
          <Link
            key={item.cle}
            href={item.cle === "toutes" ? "/atelier/commandes/liste" : `?filtre=${item.cle}`}
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[54rem] border-collapse">
          <thead>
            <tr className="border-b border-rule text-left">
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
                <tr key={commande.id} className="border-b border-rule">
                  <Td>
                    <Link
                      href={`/atelier/commandes/${commande.number}`}
                      className="type-mono link-underline text-accent"
                    >
                      {commande.number}
                    </Link>
                    {commande.isSample && (
                      <span className="type-caption ml-2 text-alert">exemple</span>
                    )}
                  </Td>
                  <Td>
                    <span className="type-mono text-fg-soft">{formatDate(commande.createdAt)}</span>
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
                    <span className="type-mono text-fg-soft" data-numeric>
                      {formatPrice(margeLigne)}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {commandes.length === 0 && (
        <p className="type-body mt-8 text-fg-soft">Aucune commande dans ce filtre.</p>
      )}
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      scope="col"
      className={`type-mono px-3 py-3 font-normal text-fg-soft ${align === "right" ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return <td className={`px-3 py-3 ${align === "right" ? "text-right" : ""}`}>{children}</td>;
}
