import { prisma } from "@/lib/prisma";
import ClientesClient from "./ClientesClient";

export default async function ClientesPage() {
  const dbClientes = await prisma.cliente.findMany({
    include: {
      movimientos: {
        orderBy: { fecha: 'desc' }
      }
    },
    orderBy: { nombre: 'asc' }
  });

  const now = new Date().getTime();

  const data = dbClientes.map(c => {
    let saldoPesos = 0;
    let saldoCartones = 0;
    let lastEntregaTime = now;
    let hasEntrega = false;

    // Calcular saldos
    // Sumar entregas, restar pagos
    c.movimientos.forEach(m => {
      if (m.tipo === "ENTREGA") {
        saldoPesos += (m.cartones || 0) * (m.precioUnit || 0);
        saldoCartones += m.cartones || 0;
        
        if (!hasEntrega || m.fecha.getTime() > lastEntregaTime) {
          lastEntregaTime = m.fecha.getTime();
          hasEntrega = true;
        }
      } else if (m.tipo === "PAGO") {
        saldoPesos -= (m.monto || 0);
        // Simplificación: No reducimos saldoCartones al pagar porque no sabemos cuántos está pagando exactamente,
        // pero podemos aproximar si fuera necesario. El prompt pide "total cartones pendientes".
        // Para esto, podríamos asumir que el pago cubre primero los cartones más viejos.
        // Por ahora, mostraremos el saldo en cartones total entregado históricamente vs lo pagado, 
        // o mejor calculamos saldo de cartones asumiendo un precio promedio.
        // Dado que el sistema requiere saber cuántos cartones debe, lo ideal es mantener el valor en pesos.
        // Pero para calcular cartones pendientes reales:
        // cartonesPendientes = saldoPesos / precioPromedio.
        // Para simplificar, llevaremos un tracking simple.
      }
    });

    // Calcular días sin pagar desde la última entrega si debe algo
    let diasSinPagar = 0;
    if (saldoPesos > 0 && hasEntrega) {
      diasSinPagar = Math.floor((now - lastEntregaTime) / (1000 * 60 * 60 * 24));
    }

    // Aproximar saldo cartones
    let cartonesPendientes = 0;
    if (saldoPesos > 0) {
      const entregas = c.movimientos.filter(m => m.tipo === "ENTREGA");
      if (entregas.length > 0) {
        const precioUltimo = entregas[0].precioUnit || 15000;
        cartonesPendientes = Math.ceil(saldoPesos / precioUltimo);
      }
    }

    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      saldoPesos,
      saldoCartones: cartonesPendientes,
      diasSinPagar
    };
  });

  return <ClientesClient initialData={data} />;
}
