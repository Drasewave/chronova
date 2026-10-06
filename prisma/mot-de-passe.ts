import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { erreurMotDePasse, hacherMotDePasse } from "@/lib/securite/mot-de-passe";

/**
 * Donne un mot de passe à un compte existant (le compte d'atelier, un client qui
 * s'était inscrit par lien magique…). Sans e-mail sortant, c'est aussi la voie du
 * « mot de passe oublié ».
 *
 *   npm run compte:mot-de-passe -- atelier@chronova.test
 *       → tire un mot de passe provisoire et l'écrit dans un fichier en 600, jamais à l'écran
 *   MOT_DE_PASSE='…' npm run compte:mot-de-passe -- client@exemple.fr
 *       → utilise celui-ci
 *
 * Les sessions ouvertes du compte sont fermées.
 */
const email = String(process.argv[2] ?? "").trim().toLowerCase();
if (!email) throw new Error("Usage : npm run compte:mot-de-passe -- <adresse e-mail>");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const fourni = process.env.MOT_DE_PASSE;
const motDePasse = fourni ?? `Provisoire-${randomBytes(9).toString("base64url")}`;
const regle = erreurMotDePasse(motDePasse);
if (regle) throw new Error(`Mot de passe refusé : ${regle}`);

const compte = await prisma.user.findUnique({ where: { email }, select: { id: true } });
if (!compte) throw new Error(`Aucun compte pour ${email}.`);

await prisma.$transaction([
  prisma.user.update({ where: { id: compte.id }, data: { passwordHash: await hacherMotDePasse(motDePasse) } }),
  prisma.session.deleteMany({ where: { userId: compte.id } }),
]);

if (fourni) {
  console.log(`Mot de passe enregistré pour ${email}.`);
} else {
  const { writeFileSync } = await import("node:fs");
  const fichier = `${process.env.HOME}/.chronova-mot-de-passe-${email.replace(/[^a-z0-9]+/g, "-")}.txt`;
  writeFileSync(fichier, `${email}\n${motDePasse}\n`, { mode: 0o600 });
  console.log(`Mot de passe provisoire pour ${email} écrit dans ${fichier} (à changer depuis /compte/profil).`);
}
await prisma.$disconnect();
