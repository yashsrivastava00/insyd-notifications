import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const users = await prisma.user.findMany({ 
      select: { 
        id: true, 
        name: true, 
        bio: true 
      },
      orderBy: {
        name: 'asc'
      }
    });
    return NextResponse.json({ users });
  } catch (e: any) {
    console.error('Error fetching users:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch users' }, { status: 500 });
  }
}
