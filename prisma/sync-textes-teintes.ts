/**
 * Recopie en base les TEXTES et les TEINTES des fixtures, et rien d'autre.
 *
 * Les libellés du catalogue et les descriptions des modèles vivent en base :
 * les réécrire dans `src/lib/data` ne change donc rien à l'écran tant qu'ils
 * n'y sont pas recopiés. Ce script le fait sans toucher aux prix, aux délais,
 * au stock, aux clés ni aux règles elles-mêmes — seulement ce qui se lit et la
 * couleur qui s'affiche. Il ne retouche que les lignes d'exemple (`isSample`) :
 * une option créée depuis le CRM est laissée telle quelle.
 *
 *   npx tsx prisma/sync-textes-teintes.ts
 */
// `tsx` ne charge pas les fichiers .env : on le fait explicitement.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { RULES, STEPS } from "@/lib/data/catalogue";
import { SAMPLE_MODELS } from "@/lib/data/models";
import { FAQ } from "@/lib/content/home";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  let touches = 0;

  for (const etape of STEPS) {
    const step = await prisma.configStep.updateMany({
      where: { key: etape.key },
      data: { label: etape.label, intro: etape.intro },
    });
    touches += step.count;

    for (const groupe of etape.groups) {
      const group = await prisma.optionGroup.findUnique({ where: { key: groupe.key } });
      if (!group) continue;
      await prisma.optionGroup.update({
        where: { id: group.id },
        data: { label: groupe.label, help: groupe.help ?? null },
      });
      touches += 1;

      for (const option of groupe.options) {
        const { count } = await prisma.option.updateMany({
          where: { groupId: group.id, key: option.key, isSample: true },
          data: {
            label: option.label,
            description: option.description ?? null,
            colorName: option.colorName ?? null,
            colorHex: option.colorHex ?? null,
            renderPatch: (option.render ?? null) as never,
          },
        });
        touches += count;
      }
    }
  }

  // Messages des règles : une règle se reconnaît à son sujet et à ses cibles.
  const options = await prisma.option.findMany({ include: { group: { select: { key: true } } } });
  const idDe = new Map(options.map((o) => [`${o.group.key}:${o.key}`, o.id]));
  for (const regle of RULES) {
    const subjectOptionId = idDe.get(regle.subject);
    if (!subjectOptionId) continue;
    const candidates = await prisma.compatibilityRule.findMany({ where: { subjectOptionId } });
    const cible = candidates.find(
      (r) => JSON.stringify([...r.targetRefs].sort()) === JSON.stringify([...regle.targets].sort()),
    );
    if (!cible || cible.message === regle.message) continue;
    await prisma.compatibilityRule.update({ where: { id: cible.id }, data: { message: regle.message } });
    touches += 1;
  }

  for (const modele of SAMPLE_MODELS) {
    const { count } = await prisma.watchModel.updateMany({
      where: { slug: modele.slug, isSample: true },
      data: { tagline: modele.tagline, summary: modele.summary, movementNote: modele.movementNote },
    });
    touches += count;
  }

  // FAQ : on ne retouche que les réponses dont la question existe déjà telle
  // quelle ; une entrée ajoutée ou reformulée depuis le CRM est laissée en place.
  for (const entree of FAQ) {
    const { count } = await prisma.faqEntry.updateMany({
      where: { question: entree.question },
      data: { answer: entree.reponse },
    });
    touches += count;
  }

  console.log(`${touches} lignes recopiées (textes et teintes uniquement).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (erreur) => {
    console.error(erreur);
    await prisma.$disconnect();
    process.exit(1);
  });
