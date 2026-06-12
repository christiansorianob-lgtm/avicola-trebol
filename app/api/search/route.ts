import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ clientes: [], gastos: [], despachos: [] });
  }

  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        nombre: { contains: q, mode: "insensitive" }
      },
      select: { id: true, nombre: true, telefono: true },
      take: 5
    });

    const gastos = await prisma.gasto.findMany({
      where: {
        OR: [
          { descripcion: { contains: q, mode: "insensitive" } },
          { categoria: { contains: q, mode: "insensitive" } }
        ]
      },
      select: { id: true, fecha: true, categoria: true, descripcion: true, monto: true },
      orderBy: { fecha: "desc" },
      take: 5
    });

    const despachos = await prisma.bajada.findMany({
      orderBy: { fecha: "desc" },
      take: 5,
      select: {
        id: true,
        fecha: true,
        cartonesPequeno: true,
        cartonesMediano: true,
        cartonesGrande: true,
        cartonesJumbo: true
      }
    });

    // Filter despachos by date string if query looks like a date
    const filteredDespachos = despachos.filter(d => {
      const dateStr = new Date(d.fecha).toLocaleDateString("es-CO");
      return dateStr.includes(q);
    });

    return NextResponse.json({
      clientes,
      gastos,
      despachos: filteredDespachos.length > 0 ? filteredDespachos : (q.length <= 3 ? [] : despachos.slice(0, 3))
    });
  } catch (error) {
    return NextResponse.json({ clientes: [], gastos: [], despachos: [] });
  }
}
