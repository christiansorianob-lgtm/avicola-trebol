import { prisma } from "@/lib/prisma";
import ProduccionClient from "./ProduccionClient";

export default async function ProduccionPage() {
  const bajadas = await prisma.bajada.findMany({
    orderBy: { fecha: 'desc' }
  });

  return <ProduccionClient initialBajadas={bajadas} />;
}
