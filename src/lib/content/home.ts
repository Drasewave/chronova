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
      "Vous choisissez le boîtier, puis le cadran, les aiguilles, la lunette, la couronne, le bracelet, le verre, le mouvement et le fond. À chaque choix, vous voyez le rendu, le prix et le délai changer. Votre configuration tient dans un lien : gardez-le de côté ou envoyez-le à quelqu'un pour avis.",
    icone: "mouvement",
  },
  {
    numero: "02",
    titre: "Je commande et je contrôle les pièces",
    texte:
      "Le jour de la commande, je réserve pour vous les pièces que j'ai en stock à l'atelier. Je commande les autres chez mes fournisseurs et je les contrôle une par une à réception : cotes, finition, absence de rayure.",
    icone: "colis",
  },
  {
    numero: "03",
    titre: "J'assemble et je teste",
    texte:
      "Je monte le mouvement, je pose le cadran et les aiguilles, j'emboîte, puis je règle. Je fais ensuite deux contrôles : l'étanchéité sous pression, et la marche, que je suis pendant 72 heures pour mesurer l'écart en secondes par jour.",
    icone: "tournevis",
  },
  {
    numero: "04",
    titre: "Expédition assurée",
    texte:
      "J'expédie la montre dans son écrin, avec sa fiche de contrôle : écart mesuré, pression testée, références des pièces montées. L'envoi est suivi et assuré, et vous retrouvez le numéro de suivi dans votre compte.",
    icone: "etancheite",
  },
] as const;

export const FAQ = [
  {
    question: "Quelle est la garantie ?",
    reponse:
      "La garantie couvre le mouvement et l'assemblage : je reprends à l'atelier, sans frais, tout défaut de montage ou de fonctionnement. Les rayures d'usage, les chocs et l'ouverture de la montre par un tiers en sont exclus. Durée exacte et modalités : [À REMPLIR : durée de garantie et conditions].",
  },
  {
    question: "Quels mouvements équipent les montres ?",
    reponse:
      "Je monte quatre calibres automatiques japonais de la famille NH, et un calibre méca-quartz, le VK64, sur les chronographes. Je les ai retenus pour leur robustesse et parce que n'importe quel horloger sait les réviser. Le NH35 : 24 rubis, 21 600 alternances par heure, arrêt de la trotteuse et remontage manuel possibles, environ 41 heures de réserve de marche, quantième à 3 h. Le NH36 est le même calibre avec le jour de la semaine en plus du quantième. Le NH34 ajoute une aiguille 24 heures réglable indépendamment. Le NH38 n'a pas de date et laisse voir le balancier par une ouverture du cadran. Sur le VK64, la trotteuse et les compteurs du chronographe sont entraînés mécaniquement, et la marche de la montre est réglée par un quartz.",
  },
  {
    question: "Que signifie l'étanchéité annoncée ?",
    reponse:
      "Les valeurs suivent la norme ISO 22810 : elles indiquent la pression statique que la montre supporte en laboratoire, ce qui ne correspond pas à une profondeur de plongée. En pratique, 50 m supporte les éclaboussures et le lavage des mains, 100 m la natation, 200 m la baignade, l'apnée et les sports nautiques. La plongée en bouteille relève d'une autre norme, l'ISO 6425, que je ne revendique pas. Quelle que soit la valeur, vissez ou enfoncez la couronne avant tout contact avec l'eau, et ne la manipulez pas sous l'eau.",
  },
  {
    question: "Combien de temps faut-il pour recevoir sa montre ?",
    reponse:
      "Le délai dépend des pièces à commander. Vous le voyez dans le configurateur à chaque choix, puis sur le récapitulatif et dans l'e-mail de confirmation. Si un fournisseur prend du retard sur une pièce, je vous préviens et je vous donne la nouvelle date. [À REMPLIR : délai moyen constaté].",
  },
  {
    question: "Comment entretenir sa montre ?",
    reponse:
      "Un mouvement mécanique se révise généralement tous les cinq à sept ans : démontage, nettoyage, huilage, remplacement des joints. Entre deux révisions, rincez la montre à l'eau douce après la mer ou la piscine, ne laissez pas un bracelet cuir tremper, et faites contrôler l'étanchéité après tout changement de joint ou de verre.",
  },
  {
    question: "Puis-je retourner ma montre si je change d'avis ?",
    reponse:
      "Oui : vous avez quatorze jours après réception pour vous rétracter, sans donner de raison. La montre revient dans son écrin, les frais de retour sont à votre charge, et vous êtes remboursé, livraison initiale comprise. Deux exceptions prévues par la loi (article L221-28 3° du Code de la consommation) : une montre portant une gravure personnalisée, et une pièce unique réalisée sur devis, ne peuvent pas être reprises. Un défaut de fabrication, lui, reste pris en charge dans tous les cas au titre des garanties légales.",
  },
] as const;

/** Vue éclatée : une couche = une pièce que l'horloger pose à la main. */
export const COUCHES_ECLATEES = [
  { cle: "verre", titre: "Verre", detail: "Saphir bombé, antireflet interne" },
  { cle: "lunette", titre: "Lunette", detail: "120 crans, insert céramique" },
  { cle: "cadran", titre: "Cadran", detail: "Index appliqués, luminova à la main" },
  { cle: "aiguilles", titre: "Aiguilles", detail: "Chassées à la potence, une à une" },
  { cle: "mouvement", titre: "Mouvement", detail: "Automatique NH36, 24 rubis" },
  { cle: "boitier", titre: "Boîtier", detail: "Acier 316L, flancs brossés" },
  { cle: "fond", titre: "Fond", detail: "Vissé, joint torique, gravure possible" },
] as const;

/** Aucun avis réel pour l'instant : la section reste un emplacement, pas une invention. */
export const AVIS_PUBLIES: { auteur: string; ville?: string; texte: string }[] = [];
