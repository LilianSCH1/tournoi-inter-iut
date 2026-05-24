import { NextResponse } from 'next/server';
import { getAllIUT } from '@/lib/data/iut';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const iut = await getAllIUT();
    return NextResponse.json(iut, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erreur API IUT:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
