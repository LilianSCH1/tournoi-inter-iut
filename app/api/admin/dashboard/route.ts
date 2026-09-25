import { NextResponse } from 'next/server';
import { getLiveAdminData } from '@/lib/data/live';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  try {
    const data = await getLiveAdminData();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erreur API admin dashboard:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
