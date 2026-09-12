import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { FormulaireProfil } from "@/components/compte/formulaire-profil";
import { SuppressionCompte } from "@/components/compte/suppression-compte";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Profil & données",
  robots: { index: false, follow: false },
};

export default async function Profil() {
  const session = await auth();
  const utilisateur = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    select: {
      email: true,
      name: true,
      phone: true,
      wristSizeMm: true,
      preferences: true,
      newsletter: true,
    },
  });

  return (
    <div>
      <h1 className="type-display-2">Profil &amp; données</h1>

      <section className="mt-10 max-w-[34rem]">
        <div className="rounded-card border border-rule bg-panel p-7">
          <FormulaireProfil
            email={utilisateur.email}
            nom={utilisateur.name ?? ""}
            telephone={utilisateur.phone ?? ""}
            poignet={utilisateur.wristSizeMm}
            preferences={utilisateur.preferences ?? ""}
            newsletter={utilisateur.newsletter}
          />
        </div>
      </section>

      <section className="mt-14 max-w-[46rem] border-t border-rule pt-10">
        <h2 className="type-title-1">Vos données</h2>
        <p className="type-body measure mt-4 text-fg-soft">
          Le détail de ce qui est collecté, pourquoi et pour combien de temps se trouve dans la{" "}
          <Link href="/confidentialite" className="link-underline text-accent">
            politique de confidentialité
          </Link>
          .
        </p>

        <div className="mt-8 flex flex-col gap-8">
          <div>
            <h3 className="type-title-2">Récupérer une copie</h3>
            <p className="type-body measure mt-2 text-fg-soft">
              Un fichier JSON contenant votre compte, vos adresses, vos commandes, vos consentements
              et vos échanges. Téléchargé directement : rien ne transite par e-mail.
            </p>
            <a
              href="/api/compte/export"
              download
              className="type-ui link-underline mt-4 inline-block text-accent"
            >
              Télécharger mes données
            </a>
          </div>

          <SuppressionCompte />
        </div>
      </section>
    </div>
  );
}
