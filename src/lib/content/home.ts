/**
 * Textes de la page d'accueil.
 *
 * Règle tenue partout : aucun chiffre inventé, aucune promesse invérifiable.
 * Ce qui relève d'une décision de l'atelier (durée de garantie, délai moyen,
 * tarifs) est laissé en `[À REMPLIR]` plutôt que comblé au jugé.
 */

export const ETAPES = [
  {
    numero: "01",
    titre: "Vous composez",
    texte:
      "Boîtier, cadran, aiguilles, lunette, couronne, bracelet, verre, mouvement, fond. Le rendu se met à jour à chaque choix, le prix et le délai aussi. La configuration tient dans un lien : vous pouvez la garder de côté ou la faire relire.",
    icone: "mouvement",
  },
  {
    numero: "02",
    titre: "Je commande et je contrôle les pièces",
    texte:
      "Ce qui est en stock à l'atelier est réservé pour vous le jour de la commande. Le reste est commandé auprès des fournisseurs, puis contrôlé pièce par pièce à réception : cotes, finition, absence de rayure.",
    icone: "colis",
  },
  {
    numero: "03",
    titre: "J'assemble et je teste",
    texte:
      "Montage du mouvement, pose du cadran et des aiguilles, emboîtage, réglage. Puis deux contrôles : étanchéité sous pression, et marche suivie pendant 72 heures pour mesurer l'écart en secondes par jour.",
    icone: "tournevis",
  },
  {
    numero: "04",
    titre: "Expédition assurée",
    texte:
      "La montre part dans son écrin avec sa fiche de contrôle : écart mesuré, pression testée, références des pièces montées. Envoi suivi et assuré, numéro de suivi visible depuis votre compte.",
    icone: "etancheite",
  },
] as const;

export const FAQ = [
  {
    question: "Quelle est la garantie ?",
    reponse:
      "La garantie couvre le mouvement et l'assemblage : tout défaut de montage ou de fonctionnement est repris à l'atelier, sans frais. Elle ne couvre ni les rayures d'usage, ni les chocs, ni l'ouverture de la montre par un tiers. Durée exacte et modalités : [À REMPLIR : durée de garantie et conditions].",
  },
  {
    question: "Quels mouvements équipent les montres ?",
    reponse:
      "Trois calibres automatiques japonais de la famille NH, choisis pour leur robustesse et parce que n'importe quel horloger sait les réviser. Le NH35 : 24 rubis, 21 600 alternances par heure, arrêt de la trotteuse et remontage manuel possibles, environ 41 heures de réserve de marche. Le NH34 ajoute une aiguille 24 heures réglable indépendamment. Le NH38 se passe de date et laisse voir le balancier par une ouverture du cadran.",
  },
  {
    question: "Que signifie l'étanchéité annoncée ?",
    reponse:
      "Les valeurs suivent la norme ISO 22810 : elles correspondent à une pression statique en laboratoire, pas à une profondeur de plongée. En pratique, 50 m supporte les éclaboussures et le lavage des mains, 100 m la natation, 200 m la plongée en apnée et en bouteille. Dans tous les cas, la couronne doit être vissée ou enfoncée avant tout contact avec l'eau, et jamais manipulée sous l'eau.",
  },
  {
    question: "Combien de temps faut-il pour recevoir sa montre ?",
    reponse:
      "Le délai dépend des pièces à commander : il est calculé et affiché dans le configurateur au moment du choix, puis rappelé sur le récapitulatif et dans l'e-mail de confirmation. Si une pièce prend du retard chez un fournisseur, vous en êtes informé avec la nouvelle date. [À REMPLIR : délai moyen constaté].",
  },
  {
    question: "Comment entretenir sa montre ?",
    reponse:
      "Un mouvement mécanique se révise généralement tous les cinq à sept ans : démontage, nettoyage, huilage, remplacement des joints. Entre deux révisions, rincez la montre à l'eau douce après la mer ou la piscine, ne laissez pas un bracelet cuir tremper, et faites contrôler l'étanchéité après tout changement de joint ou de verre.",
  },
  {
    question: "Puis-je retourner une montre composée sur mesure ?",
    reponse:
      "Une montre assemblée selon votre configuration est un bien confectionné à votre demande : elle relève a priori de l'exception au droit de rétractation prévue à l'article L221-28 3° du Code de la consommation. Un défaut de fabrication, lui, reste bien sûr pris en charge. [À FAIRE VALIDER PAR UN JURISTE].",
  },
] as const;

/** Vue éclatée : une couche = une pièce que l'horloger pose à la main. */
export const COUCHES_ECLATEES = [
  { cle: "verre", titre: "Verre", detail: "Saphir bombé, antireflet interne" },
  { cle: "lunette", titre: "Lunette", detail: "120 crans, insert céramique" },
  { cle: "cadran", titre: "Cadran", detail: "Index appliqués, luminova à la main" },
  { cle: "aiguilles", titre: "Aiguilles", detail: "Chassées au potence, une à une" },
  { cle: "mouvement", titre: "Mouvement", detail: "Automatique NH35, 24 rubis" },
  { cle: "boitier", titre: "Boîtier", detail: "Acier 316L, flancs brossés" },
  { cle: "fond", titre: "Fond", detail: "Vissé, joint torique, gravure possible" },
] as const;

/** Aucun avis réel pour l'instant : la section reste un emplacement, pas une invention. */
export const AVIS_PUBLIES: { auteur: string; ville?: string; texte: string }[] = [];
