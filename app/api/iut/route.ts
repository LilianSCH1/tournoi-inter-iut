import { NextResponse } from 'next/server';
import { getAllIUT, updateIUT } from '@/lib/data/iut';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

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

export async function PATCH(request: Request) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, statutParticipation, budgetPaye } = body as {
      id?: string;
      statutParticipation?: string;
      budgetPaye?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const ok = await updateIUT(id, { statutParticipation, budgetPaye });
    if (!ok) return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PATCH IUT:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
