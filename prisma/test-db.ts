import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Successfully connected to database');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log('Current user count:', userCount);
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
