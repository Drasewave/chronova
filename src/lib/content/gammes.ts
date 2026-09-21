import { STYLE_LABELS, type WatchStyleKey } from "@/lib/data/types";
import type { WatchModelView } from "@/lib/data/models";

/**
 * Textes des pages de gamme (`/gammes/[style]`) et de la vue d'ensemble
 * (`/collection`).
 *
 * Même règle que `home.ts` : rien d'inventé. Chaque phrase reprend ce que
 * disent déjà les fiches des modèles (tagline, résumé, note de mouvement) et
 * les textes de l'accueil. Les chiffres qui vivent en base (diamètres,
 * étanchéité, prix, nombre de modèles) ne sont PAS écrits ici : les pages les
 * calculent à partir des modèles publiés, pour qu'ils ne divergent jamais.
 */
export interface ContenuGamme {
  /** Une phrase : la vue d'ensemble, les tuiles, la balise description. */
  phrase: string;
  /** Deux ou trois phrases : le bandeau d'ouverture de la page de gamme. */
  presentation: string[];
}

/** Ordre d'affichage des gammes, partout : menu, vue d'ensemble, pied de page. */
export const ORDRE_GAMMES: readonly WatchStyleKey[] = [
  "plongee",
  "terrain",
  "gmt",
  "habillee",
  "chronographe",
];

export const GAMMES: Record<WatchStyleKey, ContenuGamme> = {
  plongee: {
    phrase: "Lunette unidirectionnelle à 120 crans, large insert gravé, couronne vissée à 4 h.",
    presentation: [
      "Je monte mes plongeuses sur un seul cahier des charges : lunette unidirectionnelle à 120 crans, large insert gravé, couronne vissée déportée à 4 h, index et aiguilles luminescents.",
      "Selon le modèle : une carrure coussin dont le flanc enveloppe la couronne, avec un insert céramique, ou un boîtier rond où la couronne se loge entre deux épaulements, avec un insert aluminium.",
      "Avant l'expédition, je contrôle l'étanchéité de chaque montre sous pression.",
    ],
  },
  terrain: {
    phrase: "Chiffres arabes pleins, aiguilles luminescentes, cuir ou sangle NATO.",
    presentation: [
      "Des montres de terrain à chiffres arabes pleins et aiguilles luminescentes.",
      "Selon le modèle : un cadran noir mat sans reflet sur boîtier microbillé, ou un cadran vert soleillé avec un réhaut boussole qu'une seconde couronne, à 4 h, fait tourner pour s'orienter au soleil.",
      "Je les assemble au départ sur cuir ou sur une sangle NATO qui passe sous le boîtier ; vous changez le bracelet dans le configurateur.",
    ],
  },
  gmt: {
    phrase: "Une aiguille 24 heures réglable indépendamment, pour un deuxième fuseau.",
    presentation: [
      "Une aiguille supplémentaire fait un tour de cadran en vingt-quatre heures et se règle indépendamment : elle indique l'heure d'un deuxième fuseau.",
      "Le second fuseau se lit sur la lunette 24 heures bicolore, nuit en haut, jour en bas.",
      "Je monte cette gamme sur le calibre NH34, de la même famille que les autres mouvements automatiques de l'atelier.",
    ],
  },
  habillee: {
    phrase: "Cadran soleillé, index bâtons appliqués, aiguilles dauphine, boîtier poli, fond saphir.",
    presentation: [
      "Je garde le cadran sobre : peu de texte, des index bâtons facettés et des aiguilles dauphine polies, sans luminova.",
      "Le boîtier poli passe sous une manchette de chemise, la couronne oignon se saisit sans ôter la montre, et le fond saphir laisse voir le mouvement.",
      "Selon le modèle, le cadran porte un quantième encadré à 3 h, ou reste sans date et s'ouvre à 9 h sur le balancier.",
    ],
  },
  chronographe: {
    phrase: "Deux compteurs, poussoirs sur le flanc, mouvement méca-quartz.",
    presentation: [
      "Je monte ces chronographes sur un mouvement méca-quartz : la trotteuse et les deux compteurs sont entraînés mécaniquement, la minuterie reste au quartz, sans date.",
      "Le boîtier est épaissi pour loger le module, avec un poussoir de part et d'autre de la couronne.",
      "Les compteurs se choisissent en panda ou en inversé, comme le reste de la montre, dans le configurateur.",
    ],
  },
};

export function estGamme(valeur: string): valeur is WatchStyleKey {
  return (ORDRE_GAMMES as readonly string[]).includes(valeur);
}

export function cheminGamme(style: WatchStyleKey): string {
  return `/gammes/${style}`;
}

/** Une gamme telle que les pages la montrent : ses textes et ses modèles publiés. */
export interface GammeVue {
  style: WatchStyleKey;
  nom: string;
  href: string;
  contenu: ContenuGamme;
  modeles: WatchModelView[];
  /** Le premier modèle de la gamme, dans l'ordre du catalogue : c'est lui qu'on montre en grand. */
  phare: WatchModelView;
  prixMinCents: number;
  /** Diamètres proposés dans la gamme, du plus petit au plus grand. */
  diametres: number[];
  /** Étanchéités présentes dans la gamme, en mètres, croissantes. */
  etancheites: number[];
}

/** Regroupe les modèles publiés par gamme ; une gamme sans modèle n'existe pas. */
export function gammesAvecModeles(modeles: WatchModelView[]): GammeVue[] {
  const gammes: GammeVue[] = [];
  for (const style of ORDRE_GAMMES) {
    const siens = modeles.filter((modele) => modele.style === style);
    const phare = siens[0];
    if (!phare) continue;
    gammes.push({
      style,
      nom: STYLE_LABELS[style],
      href: cheminGamme(style),
      contenu: GAMMES[style],
      modeles: siens,
      phare,
      prixMinCents: Math.min(...siens.map((modele) => modele.basePriceCents)),
      diametres: uniquesTries(siens.flatMap((modele) => modele.availableSizes.map(Number))),
      etancheites: uniquesTries(siens.map((modele) => modele.waterResistM)),
    });
  }
  return gammes;
}

function uniquesTries(valeurs: number[]): number[] {
  return [...new Set(valeurs.filter((valeur) => Number.isFinite(valeur)))].sort((a, b) => a - b);
}

/** « 39 à 40 mm », ou « 41 mm » quand la gamme n'a qu'une valeur. */
export function etendue(valeurs: number[], unite: string): string {
  const premier = valeurs[0];
  const dernier = valeurs[valeurs.length - 1];
  if (premier === undefined || dernier === undefined) return "";
  return premier === dernier ? `${premier} ${unite}` : `${premier} à ${dernier} ${unite}`;
}
