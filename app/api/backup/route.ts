import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'excel';
  const table = searchParams.get('table') || 'all';

  try {
    if (format === 'excel') {
      const clientes = await prisma.cliente.findMany();
      const movimientos = await prisma.movimiento.findMany({ include: { cliente: true } });
      const gastos = await prisma.gasto.findMany();
      const bajadas = await prisma.bajada.findMany();

      const wb = xlsx.utils.book_new();
      
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(clientes), 'Clientes');
      
      const movsFormatted = movimientos.map(m => ({
        id: m.id,
        fecha: m.fecha,
        tipo: m.tipo,
        clienteId: m.clienteId,
        clienteNombre: m.cliente.nombre,
        cartones: m.cartones,
        tipoCarton: m.tipoCarton,
        precioUnit: m.precioUnit,
        monto: m.monto,
        notas: m.notas,
        createdAt: m.createdAt,
      }));
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(movsFormatted), 'Movimientos');
      
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(gastos), 'Gastos');
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(bajadas), 'Despachos');

      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="backup_avicola_trebol.xlsx"',
        },
      });
    }

    if (format === 'csv') {
      let data: any[] = [];
      let filename = 'backup.csv';

      if (table === 'clientes') {
        data = await prisma.cliente.findMany();
        filename = 'clientes.csv';
      } else if (table === 'movimientos') {
        const movs = await prisma.movimiento.findMany({ include: { cliente: true } });
        data = movs.map(m => ({
          id: m.id,
          fecha: m.fecha,
          tipo: m.tipo,
          clienteId: m.clienteId,
          clienteNombre: m.cliente.nombre,
          cartones: m.cartones,
          tipoCarton: m.tipoCarton,
          precioUnit: m.precioUnit,
          monto: m.monto,
          notas: m.notas,
          createdAt: m.createdAt,
        }));
        filename = 'movimientos.csv';
      } else if (table === 'gastos') {
        data = await prisma.gasto.findMany();
        filename = 'gastos.csv';
      } else if (table === 'despachos') {
        data = await prisma.bajada.findMany();
        filename = 'despachos.csv';
      } else {
        return new NextResponse('Bad Request: Invalid table', { status: 400 });
      }

      const ws = xlsx.utils.json_to_sheet(data);
      const csv = xlsx.utils.sheet_to_csv(ws);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return new NextResponse('Bad Request', { status: 400 });

  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
