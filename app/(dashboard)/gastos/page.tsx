import { prisma } from "@/lib/prisma";
import GastosClient from "./GastosClient";

export default async function GastosPage() {
  let gastos: { id: string; fecha: Date; categoria: string; descripcion: string | null; monto: number }[] = [];

  try {
    gastos = await prisma.gasto.findMany({ orderBy: { fecha: 'desc' } });
  } catch (error) {
    console.error("Database error on /gastos:", error);
  }

  return <GastosClient initialGastos={gastos} />;
}
