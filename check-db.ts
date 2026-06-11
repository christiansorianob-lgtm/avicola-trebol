import { PrismaClient } from "@prisma/client";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log("Tables in DATABASE_URL (oper-app):", result);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
