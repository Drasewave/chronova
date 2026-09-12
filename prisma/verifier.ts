import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { recomposerStock } from "@/lib/atelier/stock";

/**
 * Contrôle de cohérence de la base.
 *
 * À lancer avant une mise en ligne et après chaque migration. Les tests
 * unitaires vérifient la logique ; celui-ci vérifie les données réelles, ce
 * qu'aucun test en mémoire ne peut faire : les compteurs de stock tiennent-ils
 * face au journal, reste-t-il des données d'exemple, manque-t-il une
 * information légale ?
 *
 * Sort en code 1 si un point bloquant subsiste, pour qu'un script de
 * déploiement puisse s'arrêter dessus.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const erreurs: string[] = [];
const avertissements: string[] = [];

/* ── Stock : les compteurs doivent être la somme du journal ──────────────── */
const pieces = await prisma.part.findMany();
for (const piece of pieces) {
  const mouvements = await prisma.stockMovement.findMany({
    where: { partId: piece.id },
    select: { type: true, quantity: true },
  });
  const etat = recomposerStock(mouvements);

  if (etat.enRayon !== piece.quantityOnHand || etat.reserve !== piece.quantityReserved) {
    erreurs.push(
      `${piece.reference} : compteurs ${piece.quantityOnHand}/${piece.quantityReserved}, journal ${etat.enRayon}/${etat.reserve}`,
    );
  }
  if (piece.quantityOnHand < 0 || piece.quantityReserved < 0) {
    erreurs.push(`${piece.reference} : quantité négative`);
  }
}

/* ── Réservations : ce qui est promis doit correspondre aux commandes ─────── */
const promises = await prisma.orderItemPart.groupBy({
  by: ["partId"],
  where: {
    consumedAt: null,
    orderItem: { order: { status: { in: ["PAYEE", "PIECES_A_COMMANDER", "PIECES_RECUES"] } } },
  },
  _sum: { quantity: true },
});
const attendu = new Map(promises.map((ligne) => [ligne.partId, ligne._sum.quantity ?? 0]));
for (const piece of pieces) {
  const promis = attendu.get(piece.id) ?? 0;
  if (piece.quantityReserved !== promis) {
    erreurs.push(
      `${piece.reference} : ${piece.quantityReserved} réservé(s) pour ${promis} promis par les commandes en cours`,
    );
  }
}

/* ── Commandes : chaque ligne doit pouvoir se réafficher ──────────────────── */
const lignes = await prisma.orderItem.findMany({
  select: { id: true, snapshot: true, order: { select: { number: true } } },
});
for (const ligne of lignes) {
  const instantane = ligne.snapshot as { render?: unknown } | null;
  if (!instantane?.render) {
    erreurs.push(`${ligne.order.number} : configuration figée sans rendu, la montre ne s'affichera pas`);
  }
}

/* ── Options : une pièce oubliée dans un groupe qui en utilise ──────────────
   Beaucoup d'options ne consomment aucune pièce distincte — une finition
   brossée n'est pas une référence de stock. On ne signale donc que le cas
   suspect : un groupe où certaines options sont rattachées et d'autres non. */
const groupes = await prisma.optionGroup.findMany({
  include: { options: { where: { isActive: true }, select: { key: true, partId: true } } },
});
for (const groupe of groupes) {
  const rattachees = groupe.options.filter((option) => option.partId);
  const orphelines = groupe.options.filter((option) => !option.partId);
  if (rattachees.length > 0 && orphelines.length > 0) {
    avertissements.push(
      `Groupe « ${groupe.label} » : ${orphelines.map((o) => o.key).join(", ")} sans pièce alors que ses voisines en ont une`,
    );
  }
}

/* ── Règles : un message vide laisserait le client sans explication ───────── */
const reglesMuettes = await prisma.compatibilityRule.count({
  where: { isActive: true, message: "" },
});
if (reglesMuettes > 0) erreurs.push(`${reglesMuettes} règle(s) active(s) sans message`);

/* ── Mise en ligne : données d'exemple et informations manquantes ─────────── */
const exemples = {
  modèles: await prisma.watchModel.count({ where: { isSample: true } }),
  options: await prisma.option.count({ where: { isSample: true } }),
  pièces: await prisma.part.count({ where: { isSample: true } }),
  clients: await prisma.user.count({ where: { isSample: true } }),
  commandes: await prisma.order.count({ where: { isSample: true } }),
  demandes: await prisma.inquiry.count({ where: { isSample: true } }),
};
const totalExemples = Object.values(exemples).reduce((a, b) => a + b, 0);
if (totalExemples > 0) {
  avertissements.push(
    `Données de démonstration encore en base : ${Object.entries(exemples)
      .filter(([, n]) => n > 0)
      .map(([quoi, n]) => `${n} ${quoi}`)
      .join(", ")}`,
  );
}

const reglages = await prisma.setting.findMany();
for (const reglage of reglages) {
  const valeur = reglage.value as Record<string, unknown> | number | null;
  if (valeur && typeof valeur === "object" && valeur["aRemplir"] === true) {
    avertissements.push(`Réglage à remplir : ${reglage.label}`);
  }
}

const garantiesSansTexte = await prisma.warranty.count({ where: { terms: { startsWith: "[À" } } });
if (garantiesSansTexte > 0) {
  avertissements.push(`${garantiesSansTexte} garantie(s) sans conditions rédigées`);
}

/* ── Sortie ──────────────────────────────────────────────────────────────── */
console.log(`${pieces.length} pièces, ${lignes.length} lignes de commande vérifiées.\n`);

if (avertissements.length > 0) {
  console.log("À faire avant la mise en ligne :");
  for (const a of avertissements) console.log(`  · ${a}`);
  console.log("");
}

if (erreurs.length > 0) {
  console.log("Incohérences :");
  for (const e of erreurs) console.log(`  ✗ ${e}`);
  await prisma.$disconnect();
  process.exit(1);
}

console.log("Aucune incohérence.");
await prisma.$disconnect();
