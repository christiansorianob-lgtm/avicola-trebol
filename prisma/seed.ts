const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seedeo de la base de datos...');

  // 1. Crear 5 clientes
  const clientes = [
    { nombre: 'Tienda La Esquina', telefono: '3001234567', direccion: 'Calle 10 # 20-30' },
    { nombre: 'Minimercado El Sol', telefono: '3109876543', direccion: 'Carrera 15 # 5-10' },
    { nombre: 'Doña Rosa', telefono: '3156781234', direccion: 'Barrio Central' },
    { nombre: 'Panadería La Migaja', telefono: '3205559999', direccion: 'Avenida Siempre Viva 123' },
    { nombre: 'Restaurante El Sabor', telefono: '3012223344', direccion: 'Plaza Principal' },
  ];

  const clientesCreados = [];
  for (const c of clientes) {
    const cliente = await prisma.cliente.create({ data: c });
    clientesCreados.push(cliente);
  }
  console.log(`✅ ${clientesCreados.length} clientes creados.`);

  // 2. Crear 10 movimientos
  const fechaActual = new Date();
  
  const movimientosData = [
    { clienteId: clientesCreados[0].id, tipo: 'ENTREGA', fecha: new Date(fechaActual.getTime() - 15 * 86400000), cartones: 30, tipoCarton: 30, precioUnit: 15000, notas: 'Entrega quincenal' },
    { clienteId: clientesCreados[0].id, tipo: 'PAGO', fecha: new Date(fechaActual.getTime() - 10 * 86400000), monto: 450000, notas: 'Pago completo' },
    { clienteId: clientesCreados[1].id, tipo: 'ENTREGA', fecha: new Date(fechaActual.getTime() - 35 * 86400000), cartones: 50, tipoCarton: 30, precioUnit: 14000, notas: 'Deuda antigua' }, // Deuda > 30 días
    { clienteId: clientesCreados[2].id, tipo: 'ENTREGA', fecha: new Date(fechaActual.getTime() - 5 * 86400000), cartones: 10, tipoCarton: 15, precioUnit: 8000, notas: '' },
    { clienteId: clientesCreados[3].id, tipo: 'ENTREGA', fecha: new Date(fechaActual.getTime() - 2 * 86400000), cartones: 20, tipoCarton: 30, precioUnit: 15000, notas: '' },
    { clienteId: clientesCreados[3].id, tipo: 'PAGO', fecha: new Date(fechaActual.getTime() - 1 * 86400000), monto: 150000, notas: 'Abono 50%' },
    { clienteId: clientesCreados[4].id, tipo: 'ENTREGA', fecha: new Date(fechaActual.getTime() - 1 * 86400000), cartones: 40, tipoCarton: 15, precioUnit: 8000, notas: '' },
    { clienteId: clientesCreados[4].id, tipo: 'PAGO', fecha: new Date(), monto: 320000, notas: 'Pago de contado' },
    { clienteId: clientesCreados[0].id, tipo: 'ENTREGA', fecha: new Date(), cartones: 35, tipoCarton: 30, precioUnit: 15000, notas: 'Nueva entrega' },
    { clienteId: clientesCreados[1].id, tipo: 'ENTREGA', fecha: new Date(fechaActual.getTime() - 20 * 86400000), cartones: 10, tipoCarton: 30, precioUnit: 15000, notas: 'Poco stock' },
  ];

  for (const m of movimientosData) {
    await prisma.movimiento.create({ data: m });
  }
  console.log(`✅ ${movimientosData.length} movimientos creados.`);

  // 3. Crear 5 gastos
  const gastosData = [
    { fecha: new Date(fechaActual.getTime() - 20 * 86400000), categoria: 'Concentrado', monto: 1200000, descripcion: 'Bultos purina inicio' },
    { fecha: new Date(fechaActual.getTime() - 18 * 86400000), categoria: 'Vacunas', monto: 350000, descripcion: 'New Castle' },
    { fecha: new Date(fechaActual.getTime() - 10 * 86400000), categoria: 'Cartones (empaques)', monto: 150000, descripcion: '1000 panales vacíos' },
    { fecha: new Date(fechaActual.getTime() - 2 * 86400000), categoria: 'Concentrado', monto: 1200000, descripcion: 'Bultos postura' },
    { fecha: new Date(), categoria: 'Otros', monto: 50000, descripcion: 'Transporte imprevisto' },
  ];

  for (const g of gastosData) {
    await prisma.gasto.create({ data: g });
  }
  console.log(`✅ ${gastosData.length} gastos creados.`);

  // 4. Crear 3 bajadas de producción
  const bajadasData = [
    { fecha: new Date(fechaActual.getTime() - 15 * 86400000), cartones13: 5, cartones15: 10, cartones18: 20, cartones20: 0, notas: 'Bajada normal' },
    { fecha: new Date(fechaActual.getTime() - 7 * 86400000), cartones13: 2, cartones15: 12, cartones18: 25, cartones20: 5, notas: 'Aumento de producción' },
    { fecha: new Date(), cartones13: 4, cartones15: 8, cartones18: 22, cartones20: 3, notas: 'Lluvia, huevos un poco sucios' },
  ];

  for (const b of bajadasData) {
    await prisma.bajada.create({ data: b });
  }
  console.log(`✅ ${bajadasData.length} bajadas de producción creadas.`);

  console.log('🎉 Seedeo completado con éxito!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
