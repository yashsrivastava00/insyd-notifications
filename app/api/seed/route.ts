import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prismadb';
// don't import seedDatabase at module load time to avoid accidental DB clears
let seedDatabase: ((opts?: { fast?: boolean }) => Promise<any>) | null = null;

export const runtime = 'nodejs';

export async function POST() {
  try {
    // Safety: never allow seeding from production deployments unless explicitly enabled
    const skipSeedApi = (process.env.SKIP_SEED_API || process.env.DISABLE_SEED_API) === 'true';
    const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    if (isProd && !skipSeedApi) {
      return NextResponse.json({ error: 'Seed endpoint disabled in production' }, { status: 403 });
    }

    if (!seedDatabase) {
      const mod = await import('../../../prisma/seed');
      seedDatabase = mod.seedDatabase;
    }
    const result = await seedDatabase!({ fast: true });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Seed error' }, { status: 500 });
  }
}

export async function GET() {
  // For demo: return list of users for dropdown
  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  return NextResponse.json({ users });
}
