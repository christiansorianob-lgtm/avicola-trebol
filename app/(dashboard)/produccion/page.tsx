import { prisma } from "@/lib/prisma";
import ProduccionClient from "./ProduccionClient";

export default async function ProduccionPage() {
  let bajadas: { id: string; fecha: Date; cartonesPequeno: number; cartonesMediano: number; cartonesGrande: number; cartonesJumbo: number; notas: string | null }[] = [];
  let inventario = { pequeno: 0, mediano: 0, grande: 0, jumbo: 0 };
  let mermaMes = { pequeno: 0, mediano: 0, grande: 0, jumbo: 0, totalEntradas: 0, totalSalidas: 0 };

  try {
    bajadas = await prisma.bajada.findMany({ orderBy: { fecha: 'desc' } });
    
    // Sumar todas las bajadas (lo que entra al inventario)
    const entradas = bajadas.reduce((acc, curr) => {
      acc.pequeno += curr.cartonesPequeno;
      acc.mediano += curr.cartonesMediano;
      acc.grande += curr.cartonesGrande;
      acc.jumbo += curr.cartonesJumbo;
      return acc;
    }, { pequeno: 0, mediano: 0, grande: 0, jumbo: 0 });

    // Buscar todas las entregas a clientes (lo que sale del inventario)
    const entregas = await prisma.movimiento.findMany({
      where: { tipo: 'ENTREGA' }
    });

    const salidas = entregas.reduce((acc, curr) => {
      if (!curr.cartones || !curr.tipoCarton) return acc;
      
      switch (curr.tipoCarton) {
        case 'PEQUENO': acc.pequeno += curr.cartones; break;
        case 'MEDIANO': acc.mediano += curr.cartones; break;
        case 'GRANDE': acc.grande += curr.cartones; break;
        case 'JUMBO': acc.jumbo += curr.cartones; break;
      }
      return acc;
    }, { pequeno: 0, mediano: 0, grande: 0, jumbo: 0 });

    inventario = {
      pequeno: entradas.pequeno - salidas.pequeno,
      mediano: entradas.mediano - salidas.mediano,
      grande: entradas.grande - salidas.grande,
      jumbo: entradas.jumbo - salidas.jumbo
    };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const bajadasMes = bajadas.filter(b => b.fecha >= startOfMonth);
    const entradasMes = bajadasMes.reduce((acc, curr) => {
      acc.pequeno += curr.cartonesPequeno;
      acc.mediano += curr.cartonesMediano;
      acc.grande += curr.cartonesGrande;
      acc.jumbo += curr.cartonesJumbo;
      return acc;
    }, { pequeno: 0, mediano: 0, grande: 0, jumbo: 0 });

    const entregasMes = entregas.filter(e => e.fecha >= startOfMonth);
    const salidasMes = entregasMes.reduce((acc, curr) => {
      if (!curr.cartones || !curr.tipoCarton) return acc;
      switch (curr.tipoCarton) {
        case 'PEQUENO': acc.pequeno += curr.cartones; break;
        case 'MEDIANO': acc.mediano += curr.cartones; break;
        case 'GRANDE': acc.grande += curr.cartones; break;
        case 'JUMBO': acc.jumbo += curr.cartones; break;
      }
      return acc;
    }, { pequeno: 0, mediano: 0, grande: 0, jumbo: 0 });

    mermaMes = {
      pequeno: entradasMes.pequeno - salidasMes.pequeno,
      mediano: entradasMes.mediano - salidasMes.mediano,
      grande: entradasMes.grande - salidasMes.grande,
      jumbo: entradasMes.jumbo - salidasMes.jumbo,
      totalEntradas: entradasMes.pequeno + entradasMes.mediano + entradasMes.grande + entradasMes.jumbo,
      totalSalidas: salidasMes.pequeno + salidasMes.mediano + salidasMes.grande + salidasMes.jumbo,
    };

  } catch (error) {
    console.error("Database error on /produccion:", error);
  }

  return <ProduccionClient initialBajadas={bajadas} inventario={inventario} mermaMes={mermaMes} />;
}
