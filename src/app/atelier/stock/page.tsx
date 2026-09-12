import Link from "next/link";
import { BandeauExemple } from "@/components/atelier/bandeau-exemple";
import { Chiffre, Panneau } from "@/components/atelier/graphiques";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";
import {
  CATEGORIES_PIECES,
  LIBELLE_CATEGORIE,
  LIBELLE_ETAT,
  TON_ETAT,
  etatPiece,
} from "@/lib/atelier/stock";
import { getCatalogue, getModels } from "@/lib/data/queries";
import { defaultConfiguration } from "@/lib/configurateur/configuration";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Stock" };
export const dynamic = "force-dynamic";

/**
 * Le stock, vu de l'établi.
 *
 * Une seule table, triée par état : ce qui manque remonte en haut. Les
 * quantités sont le reflet du journal des mouvements — aucune n'est saisie
 * directement, ce qui garantit qu'on peut toujours expliquer un chiffre.
 */
export default async function Stock(props: PageProps<"/atelier/stock">) {
  const { categorie, filtre } = await props.searchParams;
  const categorieActive = CATEGORIES_PIECES.find((c) => c === categorie);

  const pieces = await prisma.part.findMany({
    where: categorieActive ? { category: categorieActive } : {},
    orderBy: [{ category: "asc" }, { reference: "asc" }],
    include: { supplier: { select: { id: true, name: true, leadTimeDays: true } } },
  });

  const avecEtat = pieces.map((piece) => ({ piece, etat: etatPiece(piece) }));
  const alertes = avecEtat.filter(({ etat }) => etat === "rupture" || etat === "a-commander");
  const affichees = filtre === "alertes" ? alertes : avecEtat;

  const immobilise = pieces.reduce(
    (somme, piece) => somme + piece.quantityOnHand * piece.purchasePriceCents,
    0,
  );

  // Marge par configuration de base : c'est ici qu'on voit tout de suite l'effet
  // d'une hausse de prix d'achat sur chaque modèle.
  const [catalogue, modeles] = await Promise.all([getCatalogue(), getModels()]);
  const marges = modeles.map((modele) => {
    const configuration = defaultConfiguration(catalogue, modele);
    return {
      modele,
      vente: configuration.price.totalCents,
      cout: configuration.partsCostCents,
      marge: configuration.price.totalCents - configuration.partsCostCents,
    };
  });

  return (
    <div>
      <header className="mb-8">
        <h1 className="type-display-2">Stock</h1>
        <p className="type-body mt-2 text-fg-soft">
          {pieces.length} référence(s). Les quantités sont recomposées depuis le journal des
          mouvements : pour corriger un chiffre, on ajoute un mouvement.
        </p>
      </header>

      <BandeauExemple
        nombre={pieces.filter((piece) => piece.isSample).length}
        quoi="références du stock"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Chiffre terme="Références" valeur={String(pieces.length)} />
        <Chiffre
          terme="Sous le seuil"
          valeur={String(alertes.length)}
          ton={alertes.length > 0 ? "alerte" : "positif"}
          detail={alertes.length > 0 ? "À commander auprès des fournisseurs" : "Rien à commander"}
        />
        <Chiffre
          terme="Réservé"
          valeur={String(pieces.reduce((s, p) => s + p.quantityReserved, 0))}
          detail="Pièces promises à une commande en cours"
        />
        <Chiffre
          terme="Valeur en rayon"
          valeur={formatPrice(immobilise)}
          detail="Au prix d'achat, hors pièces déjà montées"
        />
      </div>

      <nav aria-label="Filtrer le stock" className="mb-6 flex flex-wrap gap-2">
        <Filtre href="/atelier/stock" actif={!categorieActive && filtre !== "alertes"}>
          Toutes
        </Filtre>
        <Filtre href="/atelier/stock?filtre=alertes" actif={filtre === "alertes"}>
          Sous le seuil ({alertes.length})
        </Filtre>
        {CATEGORIES_PIECES.map((cle) => (
          <Filtre key={cle} href={`/atelier/stock?categorie=${cle}`} actif={categorieActive === cle}>
            {LIBELLE_CATEGORIE[cle]}
          </Filtre>
        ))}
      </nav>

      {/* L'état et la quantité libre viennent avant le reste : sur une tablette
          étroite, ce sont les deux colonnes qu'on veut voir sans faire défiler. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] border-collapse">
          <thead>
            <tr className="border-b border-rule text-left">
              <Th>Référence</Th>
              <Th>Pièce</Th>
              <Th>État</Th>
              <Th align="right">Libre</Th>
              <Th align="right">Rayon</Th>
              <Th align="right">Réservé</Th>
              <Th align="right">Seuil</Th>
              <Th align="right">Prix d&apos;achat</Th>
              <Th>Fournisseur</Th>
            </tr>
          </thead>
          <tbody>
            {affichees.map(({ piece, etat }) => (
              <tr key={piece.id} className="border-b border-rule">
                <Td>
                  <Link
                    href={`/atelier/stock/${piece.reference}`}
                    className="type-mono link-underline text-accent"
                  >
                    {piece.reference}
                  </Link>
                </Td>
                <Td>
                  <span className="type-ui text-fg">{piece.name}</span>
                  <span className="type-caption block text-fg-soft">
                    {LIBELLE_CATEGORIE[piece.category]}
                  </span>
                </Td>
                <td className="whitespace-nowrap px-3 py-3">
                  <Pill ton={TON_ETAT[etat]}>{LIBELLE_ETAT[etat]}</Pill>
                </td>
                <Nombre fort>{piece.quantityOnHand - piece.quantityReserved}</Nombre>
                <Nombre>{piece.quantityOnHand}</Nombre>
                <Nombre>{piece.quantityReserved}</Nombre>
                <Nombre>{piece.reorderThreshold}</Nombre>
                <Td align="right">
                  <span className="type-mono text-fg-soft" data-numeric>
                    {formatPrice(piece.purchasePriceCents)}
                  </span>
                </Td>
                <Td>
                  {piece.supplier ? (
                    <Link
                      href={`/atelier/fournisseurs/${piece.supplier.id}`}
                      className="type-caption link-underline text-fg"
                    >
                      {piece.supplier.name}
                    </Link>
                  ) : (
                    <span className="type-caption text-fg-soft">[À REMPLIR : fournisseur]</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {affichees.length === 0 && (
        <p className="type-body mt-8 text-fg-soft">Aucune référence dans ce filtre.</p>
      )}

      <Panneau
        titre="Marge par modèle"
        aide="Sur la configuration de base, prix de vente moins coût des pièces. Hors temps passé et frais fixes."
        className="mt-10"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse">
            <thead>
              <tr className="border-b border-rule text-left">
                <Th>Modèle</Th>
                <Th align="right">Prix de vente</Th>
                <Th align="right">Coût des pièces</Th>
                <Th align="right">Marge</Th>
                <Th align="right">Part</Th>
              </tr>
            </thead>
            <tbody>
              {marges.map((ligne) => (
                <tr key={ligne.modele.slug} className="border-b border-rule">
                  <Td>
                    <Link
                      href={`/collection/${ligne.modele.slug}`}
                      className="type-ui link-underline text-fg"
                    >
                      {ligne.modele.name}
                    </Link>
                  </Td>
                  <Td align="right">
                    <span className="type-ui text-fg" data-numeric>
                      {formatPrice(ligne.vente)}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="type-mono text-fg-soft" data-numeric>
                      {formatPrice(ligne.cout)}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="type-ui text-fg" data-numeric>
                      {formatPrice(ligne.marge)}
                    </span>
                  </Td>
                  <Td align="right">
                    <span className="type-mono text-fg-soft" data-numeric>
                      {Math.round((ligne.marge / ligne.vente) * 100)} %
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panneau>
    </div>
  );
}

function Filtre({
  href,
  actif,
  children,
}: {
  href: string;
  actif: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={
        actif
          ? "type-ui flex min-h-11 items-center rounded-field border border-accent bg-accent px-4 text-on-accent"
          : "type-ui flex min-h-11 items-center rounded-field border border-rule px-4 text-fg hover:border-accent-decor hover:text-accent"
      }
    >
      {children}
    </Link>
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

function Nombre({ children, fort }: { children: React.ReactNode; fort?: boolean }) {
  return (
    <td className="px-3 py-3 text-right">
      <span className={fort ? "type-ui text-fg" : "type-mono text-fg-soft"} data-numeric>
        {children}
      </span>
    </td>
  );
}
