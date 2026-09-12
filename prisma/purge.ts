import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Vide toutes les tables applicatives sans toucher au schéma.
 *
 * `prisma migrate reset` rejoue les migrations, ce qui est long et inutile ici :
 * on veut seulement repartir d'une base propre avant de réamorcer. Les sessions
 * de connexion sont conservées : inutile de se reconnecter à chaque essai.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL manquante.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Ordre sans importance : TRUNCATE ... CASCADE coupe les clés étrangères.
const TABLES = [
  "AuditLog",
  "StockMovement",
  "OrderItemPart",
  "AssemblyTask",
  "QualityControl",
  "OrderPhoto",
  "OrderEvent",
  "OrderItem",
  "Warranty",
  "ServiceCase",
  "Quote",
  "Order",
  "CartItem",
  "Cart",
  "Configuration",
  "PurchaseOrderLine",
  "PurchaseOrder",
  "CompatibilityRule",
  "Option",
  "OptionGroup",
  "ConfigStep",
  "Part",
  "Supplier",
  "WatchModel",
  "Inquiry",
  "InternalNote",
  "Testimonial",
  "FaqEntry",
  "EmailTemplate",
  "Address",
  "ConsentLog",
  "CustomerTag",
  "Setting",
];

const existantes: { tablename: string }[] =
  await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = current_schema()`;
const connues = new Set(existantes.map((ligne) => ligne.tablename));
const manquantes = TABLES.filter((table) => !connues.has(table));
if (manquantes.length > 0) {
  throw new Error(`Tables inconnues, la liste est à mettre à jour : ${manquantes.join(", ")}`);
}

const liste = TABLES.map((table) => `"${table}"`).join(", ");
await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${liste} RESTART IDENTITY CASCADE`);
console.log(`Purge : ${TABLES.length} tables vidées.`);
await prisma.$disconnect();
