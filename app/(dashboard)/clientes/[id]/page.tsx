import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DetalleClienteClient from "./DetalleClienteClient";

export default async function ClienteDetallePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      movimientos: {
        orderBy: { fecha: 'desc' }
      }
    }
  });

  if (!cliente) {
    notFound();
  }

  let saldoPesos = 0;
  cliente.movimientos.forEach(m => {
    if (m.tipo === "ENTREGA") {
      saldoPesos += (m.cartones || 0) * (m.precioUnit || 0);
    } else {
      saldoPesos -= (m.monto || 0);
    }
  });

  let saldoCartones = 0;
  if (saldoPesos > 0) {
    const entregas = cliente.movimientos.filter(m => m.tipo === "ENTREGA");
    if (entregas.length > 0) {
      const precioUltimo = entregas[0].precioUnit || 15000;
      saldoCartones = Math.ceil(saldoPesos / precioUltimo);
    }
  }

  return (
    <DetalleClienteClient 
      cliente={{ id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono, direccion: cliente.direccion }}
      movimientos={cliente.movimientos}
      saldoPesos={saldoPesos}
      saldoCartones={saldoCartones}
    />
  );
}
