import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Delete in correct order to avoid foreign key constraint errors
  console.log("Eliminando Movimientos...");
  await prisma.movimiento.deleteMany()
  
  console.log("Eliminando Clientes...");
  await prisma.cliente.deleteMany()
  
  console.log("Eliminando Gastos...");
  await prisma.gasto.deleteMany()
  
  console.log("Eliminando Bajadas (Producción)...");
  await prisma.bajada.deleteMany()
  
  console.log("¡Base de datos limpiada con éxito!");
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
