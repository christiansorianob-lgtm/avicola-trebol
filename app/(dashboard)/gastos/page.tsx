import { prisma } from "@/lib/prisma";
import GastosClient from "./GastosClient";

export default async function GastosPage() {
  const gastos = await prisma.gasto.findMany({
    orderBy: { fecha: 'desc' }
  });

  return <GastosClient initialGastos={gastos} />;
}
