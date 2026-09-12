import type { Metadata } from "next";
import { auth } from "@/auth";
import { FormulaireAdresse } from "@/components/compte/formulaire-adresse";
import { definirAdresseParDefaut, supprimerAdresse } from "@/app/actions/compte";
import { Pill } from "@/components/ui/pill";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Mes adresses",
  robots: { index: false, follow: false },
};

export default async function Adresses() {
  const session = await auth();
  const adresses = await prisma.address.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ isDefaultShipping: "desc" }, { city: "asc" }],
  });

  return (
    <div>
      <h1 className="type-display-2">Adresses</h1>
      <p className="type-body measure mt-5 text-fg-soft">
        L&apos;adresse par défaut est celle proposée au moment de commander. Vous pourrez toujours
        en choisir une autre au paiement.
      </p>

      {adresses.length > 0 && (
        <ul className="mt-10 grid gap-px bg-rule sm:grid-cols-2">
          {adresses.map((adresse) => (
            <li key={adresse.id} className="bg-bg p-6">
              <div className="flex items-start justify-between gap-4">
                <p className="type-mono text-fg-soft">{adresse.label ?? "Adresse"}</p>
                {adresse.isDefaultShipping && <Pill ton="accent">Par défaut</Pill>}
              </div>

              <p className="type-body mt-4 text-fg">
                {adresse.fullName}
                <br />
                {adresse.line1}
                {adresse.line2 && (
                  <>
                    <br />
                    {adresse.line2}
                  </>
                )}
                <br />
                {adresse.postalCode} {adresse.city}
                <br />
                {adresse.country}
              </p>

              <div className="mt-5 flex flex-wrap gap-5">
                {!adresse.isDefaultShipping && (
                  <form action={definirAdresseParDefaut}>
                    <input type="hidden" name="id" value={adresse.id} />
                    <button type="submit" className="type-caption link-underline text-fg-soft hover:text-accent">
                      Définir par défaut
                    </button>
                  </form>
                )}
                <form action={supprimerAdresse}>
                  <input type="hidden" name="id" value={adresse.id} />
                  <button type="submit" className="type-caption link-underline text-fg-soft hover:text-alert">
                    Supprimer
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-14">
        <h2 className="type-title-1">Ajouter une adresse</h2>
        <div className="mt-7 max-w-[34rem] rounded-card border border-rule bg-panel p-7">
          <FormulaireAdresse />
        </div>
      </section>
    </div>
  );
}
