"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function crearCliente(data: { nombre: string; telefono?: string; direccion?: string }) {
  try {
    const cliente = await prisma.cliente.create({ data });
    revalidatePath("/clientes");
    return { success: true, cliente };
  } catch (error) {
    return { success: false, error: "Error al crear cliente" };
  }
}

export async function registrarMovimiento(data: {
  clienteId: string;
  tipo: "ENTREGA" | "PAGO";
  fecha: Date;
  cartones?: number;
  tipoCarton?: number;
  precioUnit?: number;
  monto?: number;
  notas?: string;
}) {
  try {
    const mov = await prisma.movimiento.create({ data });
    revalidatePath(`/clientes/${data.clienteId}`);
    revalidatePath("/clientes");
    revalidatePath("/");
    return { success: true, movimiento: mov };
  } catch (error) {
    return { success: false, error: "Error al registrar movimiento" };
  }
}

export async function registrarGasto(data: {
  fecha: Date;
  categoria: string;
  descripcion?: string;
  monto: number;
}) {
  try {
    const gasto = await prisma.gasto.create({ data });
    revalidatePath("/gastos");
    revalidatePath("/");
    return { success: true, gasto };
  } catch (error) {
    return { success: false, error: "Error al registrar gasto" };
  }
}

export async function registrarBajada(data: {
  fecha: Date;
  cartones13: number;
  cartones15: number;
  cartones18: number;
  cartones20: number;
  notas?: string;
}) {
  try {
    const bajada = await prisma.bajada.create({ data });
    revalidatePath("/produccion");
    revalidatePath("/");
    return { success: true, bajada };
  } catch (error) {
    return { success: false, error: "Error al registrar producción" };
  }
}
