import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { FillMe } from "@/components/ui/placeholder";
import { LegalPage } from "@/components/ui/legal-page";
import { Section, SectionHeader } from "@/components/ui/section";
import { IconEtancheite, IconMouvement, IconTournevis } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Entretien & garantie",
  description:
    "Ce que couvre la garantie, à quel rythme réviser un mouvement mécanique, comment entretenir un bracelet et que faire en cas de problème.",
  alternates: { canonical: "/entretien-garantie" },
};

const GESTES = [
  {
    icone: IconMouvement,
    titre: "Remonter et régler",
    texte:
      "Un automatique se remonte au porté. Après quelques jours sans la porter, faites-lui une trentaine de tours de couronne avant de régler l'heure : un mouvement peu armé se règle mal. Évitez de changer la date entre 21 h et 3 h, le mécanisme de quantième est alors engagé.",
  },
  {
    icone: IconEtancheite,
    titre: "Eau et couronne",
    texte:
      "Vissez ou enfoncez toujours la couronne avant tout contact avec l'eau, et ne la manipulez jamais mouillée. Rincez la montre à l'eau douce après la mer ou la piscine. Les joints vieillissent : faites contrôler l'étanchéité tous les deux ans si vous nagez avec.",
  },
  {
    icone: IconTournevis,
    titre: "Bracelets",
    texte:
      "Le cuir n'aime ni l'eau ni la transpiration prolongée : alternez avec un brin caoutchouc ou NATO l'été. L'acier se nettoie à l'eau tiède savonneuse et à la brosse douce, en insistant entre les maillons où le sel s'accumule.",
  },
];

export default function EntretienGarantie() {
  return (
    <>
      <Section fond="papier" compact>
        <header className="measure">
          <p className="type-mono text-fg-soft">Après l&apos;achat</p>
          <h1 className="type-display-2 mt-4">Entretien &amp; garantie</h1>
          <p className="type-lead mt-6 text-fg-soft">
            Une montre mécanique est un objet qui s&apos;entretient. Bien traitée, elle passera
            plusieurs générations ; négligée, elle s&apos;arrête au bout de quelques années. Voici
            ce qu&apos;il faut savoir.
          </p>
        </header>
      </Section>

      <Section fond="alterne">
        <SectionHeader surtitre="Au quotidien" titre="Trois gestes qui changent tout" />
        <div className="mt-12 grid gap-px bg-rule lg:grid-cols-3">
          {GESTES.map((geste) => (
            <div key={geste.titre} className="bg-bg-alt p-7">
              <geste.icone className="text-accent-decor" width={26} height={26} />
              <h2 className="type-title-2 mt-6">{geste.titre}</h2>
              <p className="type-body mt-3 text-fg-soft">{geste.texte}</p>
            </div>
          ))}
        </div>
      </Section>

      <LegalPage
        surtitre="Garantie"
        titre="Ce que couvre la garantie"
        miseAJour="[à dater lors de la mise en ligne]"
      >
        <h2>Ce qui est pris en charge</h2>
        <p>
          La garantie couvre le <strong>mouvement</strong> et l&apos;<strong>assemblage</strong> :
          un calibre qui s&apos;arrête, une aiguille qui touche, un défaut d&apos;étanchéité
          constaté à la réception, un index décollé. Dans ces cas, la montre revient à
          l&apos;atelier, elle est reprise et repartie sans frais, port retour compris.
        </p>

        <h2>Ce qui n&apos;est pas couvert</h2>
        <ul>
          <li>Les rayures, chocs et traces d&apos;usage normal du boîtier, du verre et du bracelet.</li>
          <li>L&apos;usure du cuir, qui est une matière vivante.</li>
          <li>Les dégâts dus à l&apos;eau lorsque la couronne n&apos;était pas fermée.</li>
          <li>Toute intervention faite par un tiers : ouvrir la montre met fin à la garantie.</li>
          <li>La perte et le vol.</li>
        </ul>

        <h2>Durée et modalités</h2>
        <FillMe>durée exacte de la garantie, point de départ, et conditions complètes</FillMe>
        <p>
          La garantie est rattachée à la commande, pas à une carte papier : elle est visible depuis
          votre compte, avec sa date de fin. En cas de revente, transmettez simplement le numéro de
          commande.
        </p>

        <h2>Révision</h2>
        <p>
          Un mouvement mécanique se révise généralement <strong>tous les cinq à sept ans</strong> :
          démontage complet, nettoyage, huilage, remplacement des joints, remontage et réglage. Ce
          n&apos;est pas une réparation, c&apos;est de l&apos;entretien — comme une vidange. Une
          montre jamais révisée finit par user ses pivots, et la facture devient alors tout autre.
        </p>
        <p>
          L&apos;atelier assure les révisions des montres qu&apos;il a montées.{" "}
          <FillMe inline>tarif de révision</FillMe>
        </p>

        <h2>Un problème ?</h2>
        <p>
          Écrivez avant de renvoyer quoi que ce soit : beaucoup de cas se règlent en trois messages,
          et un envoi inutile fait prendre un risque à la montre. Décrivez ce que vous observez, à
          quel moment, et depuis quand.
        </p>
      </LegalPage>

      <Section fond="nuit" compact>
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="type-lead measure text-night-soft">
            Une montre qui prend ou perd quelques secondes par jour est normale. Une montre qui
            s&apos;arrête, non.
          </p>
          <ButtonLink href="/contact">Décrire mon problème</ButtonLink>
        </div>
      </Section>
    </>
  );
}
