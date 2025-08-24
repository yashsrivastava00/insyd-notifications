// src/lib/prismadb.ts
import pkg from '@prisma/client';

const { PrismaClient } = (pkg as any);

class PrismaClientSingleton {
  private static instance: any;
  private static connectionPromise: Promise<void> | null = null;
  private static isConnected = false;

  static getInstance() {
    if (!this.instance) {
      this.instance = new PrismaClient({
        log: ['warn', 'error'],
      });
    }
    return this.instance;
  }

  static async connect() {
    if (this.isConnected) return;

    if (!this.connectionPromise) {
      this.connectionPromise = (async () => {
        try {
          const client = this.getInstance();
          await client.$connect();
          this.isConnected = true;
          console.log('Database connected successfully');
        } catch (e) {
          console.error('Failed to connect to database:', e);
          this.isConnected = false;
          throw e;
        } finally {
          this.connectionPromise = null;
        }
      })();
    }

    await this.connectionPromise;
  }

  static async disconnect() {
    if (this.instance) {
      await this.instance.$disconnect();
      this.isConnected = false;
    }
  }
}

// For development hot reloading
const globalForPrisma = globalThis as unknown as { prisma: any | undefined };

export const prisma = globalForPrisma.prisma ?? PrismaClientSingleton.getInstance();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Ensure connection on first use
PrismaClientSingleton.connect().catch(console.error);
