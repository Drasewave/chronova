import type { FaceLayer } from "./types";

/**
 * Registre des pièces dessinables.
 *
 * C'est la frontière annoncée dans le README : la GÉOMÉTRIE vit ici, dans le
 * code ; l'APPARENCE (teinte, nom, prix, stock, activation) vit en base. Le CRM
 * propose cette liste dans un menu déroulant quand l'horloger crée une option.
 *
 * Ajouter un coloris de cadran ou de cuir : aucune ligne de code.
 * Dessiner une forme d'aiguille inédite : une entrée de plus ici, et le dessin.
 */
export const PART_REGISTRY: Record<FaceLayer, readonly { key: string; label: string }[]> = {
  ombre: [],
  bracelet: [
    { key: "acier-3-maillons", label: "Acier, trois maillons" },
    { key: "acier-jubile", label: "Acier, jubilé" },
    { key: "cuir", label: "Cuir" },
    { key: "caoutchouc", label: "Caoutchouc" },
    { key: "nato", label: "NATO" },
  ],
  boitier: [
    { key: "brosse", label: "Acier brossé" },
    { key: "poli", label: "Acier poli" },
    { key: "microbille", label: "Acier microbillé" },
    // Forme de la carrure (`caseShape`) : indépendante de la finition.
    { key: "rond", label: "Carrure ronde" },
    { key: "coussin", label: "Carrure coussin, cornes courtes" },
  ],
  lunette: [
    { key: "lisse", label: "Lisse" },
    { key: "cannelee", label: "Cannelée" },
    { key: "plongee", label: "Plongée, 120 clics" },
    { key: "gmt", label: "GMT, 24 heures" },
  ],
  insert: [
    { key: "ceramique", label: "Céramique" },
    { key: "aluminium", label: "Aluminium" },
  ],
  cadran: [
    { key: "emaille", label: "Émail" },
    { key: "soleille", label: "Soleillé" },
    { key: "mat", label: "Mat" },
    { key: "soleil-profond", label: "Soleil profond, fumé et gaufré" },
  ],
  // Réhaut (`innerRing`) : la bague inclinée qui entoure le cadran.
  minuterie: [
    { key: "aucun", label: "Réhaut simple" },
    { key: "boussole", label: "Réhaut boussole, seconde couronne à 4 h" },
  ],
  index: [
    { key: "batons", label: "Index bâtons" },
    { key: "arabes", label: "Chiffres arabes" },
    { key: "plongee", label: "Ronds et triangle, plongée" },
  ],
  signature: [],
  "guichet-date": [
    { key: "date", label: "Quantième" },
    { key: "jour-date", label: "Jour et quantième" },
  ],
  aiguilles: [
    { key: "glaive", label: "Glaive" },
    { key: "mercedes", label: "Mercedes" },
    { key: "crayon", label: "Crayon" },
    { key: "fleche", label: "Flèche et glaive large, plongée" },
    { key: "dauphine", label: "Dauphine, deux facettes polies" },
    { key: "cathedrale", label: "Cathédrale, ajourées" },
  ],
  axe: [],
  verre: [
    { key: "plat", label: "Saphir plat" },
    { key: "bombe", label: "Saphir bombé" },
  ],
  reflet: [],
  couronne: [
    { key: "signee", label: "Signée Chronova" },
    { key: "lisse", label: "Lisse" },
    // Position horaire (`crownAt`).
    { key: "3", label: "À 3 h" },
    { key: "4", label: "À 4 h, déportée" },
  ],
};
