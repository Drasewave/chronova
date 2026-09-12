import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import { etatPiece } from "@/lib/atelier/stock";

export const metadata = { title: "Fournisseurs" };
export const dynamic = "force-dynamic";

/**
 * Les fournisseurs, classés par ce qu'ils bloquent.
 *
 * Un fournisseur n'est pas une fiche d'adresses : c'est un délai et une liste
 * de références qui manquent. Ceux chez qui il y a des pièces à commander
 * remontent en tête.
 */
export default async function Fournisseurs() {
  const fournisseurs = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      parts: true,
      orders: { where: { status: { in: ["BROUILLON", "ENVOYEE", "PARTIELLE"] } }, select: { id: true } },
    },
  });

  const lignes = fournisseurs
    .map((fournisseur) => ({
      fournisseur,
      aCommander: fournisseur.parts.filter((piece) => {
        const etat = etatPiece(piece);
        return etat === "rupture" || etat === "a-commander";
      }).length,
      /** Une fiche sans contact ne permet pas de passer commande. */
      incomplet: !fournisseur.email && !fournisseur.phone,
    }))
    .sort((a, b) => b.aCommander - a.aCommander || a.fournisseur.name.localeCompare(b.fournisseur.name));

  return (
    <div>
      <header className="mb-8">
        <h1 className="type-display-2">Fournisseurs</h1>
        <p className="type-body mt-2 text-fg-soft">
          {fournisseurs.length} maison(s). Les coordonnées sont à compléter : elles n&apos;ont pas
          été inventées.
        </p>
      </header>

      <ul className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {lignes.map(({ fournisseur, aCommander, incomplet }) => (
          <li key={fournisseur.id} className="border border-rule bg-bg p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="type-title-2">
                <Link
                  href={`/atelier/fournisseurs/${fournisseur.id}`}
                  className="link-underline text-fg"
                >
                  {fournisseur.name}
                </Link>
              </h2>
              {aCommander > 0 && <Pill ton="alerte">{aCommander} à commander</Pill>}
            </div>

            <dl className="mt-4 flex flex-col gap-2">
              <Ligne terme="Références" valeur={String(fournisseur.parts.length)} />
              <Ligne terme="Délai annoncé" valeur={`${fournisseur.leadTimeDays} jours`} />
              <Ligne
                terme="Bons en cours"
                valeur={fournisseur.orders.length === 0 ? "—" : String(fournisseur.orders.length)}
              />
            </dl>

            <p className="type-caption mt-4 text-fg-soft">
              {incomplet ? (
                <span className="text-alert">[À REMPLIR : contact, e-mail, téléphone]</span>
              ) : (
                [fournisseur.contactName, fournisseur.email, fournisseur.phone]
                  .filter(Boolean)
                  .join(" · ")
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ligne({ terme, valeur }: { terme: string; valeur: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2 last:border-0 last:pb-0">
      <dt className="type-caption text-fg-soft">{terme}</dt>
      <dd className="type-caption text-fg" data-numeric>
        {valeur}
      </dd>
    </div>
  );
}
