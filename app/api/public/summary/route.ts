import { NextResponse } from 'next/server';
import { getPublicSummary } from '@/lib/data/live';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const summary = await getPublicSummary();

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erreur API public summary:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
