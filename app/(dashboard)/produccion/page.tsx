import { prisma } from "@/lib/prisma";
import ProduccionClient from "./ProduccionClient";

export default async function ProduccionPage() {
  let bajadas: { id: string; fecha: Date; cartones13: number; cartones15: number; cartones18: number; cartones20: number; notas: string | null }[] = [];

  try {
    bajadas = await prisma.bajada.findMany({ orderBy: { fecha: 'desc' } });
  } catch (error) {
    console.error("Database error on /produccion:", error);
  }

  return <ProduccionClient initialBajadas={bajadas} />;
}
