import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Client Prisma, en une seule instance.
 *
 * En développement, Next recharge les modules à chaque modification : sans ce
 * cache sur `globalThis`, chaque rechargement ouvrirait un nouveau pool de
 * connexions jusqu'à saturer PostgreSQL.
 *
 * Prisma 7 passe par un adaptateur de pilote : la chaîne de connexion est lue
 * ici, à l'exécution, et non plus déclarée dans le schéma.
 */
function creerClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL manquante. Copier .env.example en .env.local et renseigner la connexion PostgreSQL.",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const global_ = globalThis as unknown as { prismaChronova?: PrismaClient };

export const prisma: PrismaClient = global_.prismaChronova ?? creerClient();

if (process.env.NODE_ENV !== "production") global_.prismaChronova = prisma;
