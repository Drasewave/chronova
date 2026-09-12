import Link from "next/link";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/commandes/etapes";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

/**
 * Les clients, classés par ce qu'ils ont commandé.
 *
 * Les comptes d'atelier ne figurent pas dans la liste : ce ne sont pas des
 * clients. Les comptes anonymisés y restent, mais sans rien d'identifiant —
 * leur ligne existe pour que la comptabilité reste cohérente.
 */
export default async function Clients() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    include: {
      tags: true,
      orders: {
        where: { status: { notIn: ["EN_ATTENTE_PAIEMENT", "ANNULEE", "REMBOURSEE"] } },
        select: { totalCents: true, createdAt: true },
      },
    },
  });

  const lignes = clients
    .map((client) => ({
      client,
      total: client.orders.reduce((somme, commande) => somme + commande.totalCents, 0),
      derniere: client.orders
        .map((commande) => commande.createdAt)
        .sort((a, b) => b.getTime() - a.getTime())[0],
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div>
      <header className="mb-8">
        <h1 className="type-display-2">Clients</h1>
        <p className="type-body mt-2 text-fg-soft">
          {clients.length} compte(s). Le chiffre est celui des commandes payées, hors annulations
          et remboursements.
        </p>
      </header>

      <BandeauExemple
        nombre={clients.filter((client) => client.isSample).length}
        quoi="fiches clients"
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse">
          <thead>
            <tr className="border-b border-rule text-left">
              <Th>Client</Th>
              <Th>Poignet</Th>
              <Th>Étiquettes</Th>
              <Th align="right">Commandes</Th>
              <Th align="right">Total</Th>
              <Th>Dernière</Th>
              <Th>Lettre</Th>
            </tr>
          </thead>
          <tbody>
            {lignes.map(({ client, total, derniere }) => (
              <tr key={client.id} className="border-b border-rule">
                <Td>
                  <Link
                    href={`/atelier/clients/${client.id}`}
                    className="type-ui link-underline text-fg"
                  >
                    {client.anonymizedAt ? "Compte anonymisé" : (client.name ?? client.email)}
                  </Link>
                  {!client.anonymizedAt && (
                    <span className="type-caption block text-fg-soft">{client.email}</span>
                  )}
                </Td>
                <Td>
                  <span className="type-mono text-fg-soft" data-numeric>
                    {client.wristSizeMm ? `${client.wristSizeMm} mm` : "—"}
                  </span>
                </Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {client.tags.map((etiquette) => (
                      <Pill key={etiquette.id}>{etiquette.label}</Pill>
                    ))}
                  </span>
                </Td>
                <Td align="right">
                  <span className="type-mono text-fg-soft" data-numeric>
                    {client.orders.length}
                  </span>
                </Td>
                <Td align="right">
                  <span className="type-ui text-fg" data-numeric>
                    {formatPrice(total)}
                  </span>
                </Td>
                <Td>
                  <span className="type-caption text-fg-soft">
                    {derniere ? formatDate(derniere) : "—"}
                  </span>
                </Td>
                <Td>
                  <span className="type-caption text-fg-soft">
                    {client.newsletter ? "Inscrit" : "Non"}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {clients.length === 0 && <p className="type-body mt-8 text-fg-soft">Aucun client.</p>}
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
