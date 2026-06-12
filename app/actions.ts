"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TipoCarton } from "@prisma/client";

export async function crearCliente(data: { nombre: string; telefono?: string; direccion?: string }) {
  try {
    const cliente = await prisma.cliente.create({ data });
    revalidatePath("/clientes");
    return { success: true, cliente };
  } catch (error) {
    return { success: false, error: "Error al crear cliente" };
  }
}

export async function eliminarCliente(id: string) {
  try {
    await prisma.cliente.delete({ where: { id } });
    revalidatePath("/clientes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar cliente" };
  }
}

export async function editarCliente(id: string, data: { nombre: string; telefono?: string; direccion?: string }) {
  try {
    const cliente = await prisma.cliente.update({
      where: { id },
      data,
    });
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/clientes");
    return { success: true, cliente };
  } catch (error) {
    return { success: false, error: "Error al editar cliente" };
  }
}

export async function registrarMovimiento(data: {
  clienteId: string;
  tipo: "ENTREGA" | "PAGO";
  fecha: Date;
  cartones?: number;
  tipoCarton?: TipoCarton;
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
  cartonesPequeno: number;
  cartonesMediano: number;
  cartonesGrande: number;
  cartonesJumbo: number;
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
