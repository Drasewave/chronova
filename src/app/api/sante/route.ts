import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Sonde de santé : la base répond-elle ? Publique (hors du matcher de src/proxy.ts). */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
