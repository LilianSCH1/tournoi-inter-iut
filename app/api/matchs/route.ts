import { NextResponse } from 'next/server';
import { getAllMatchs, updateMatchScore } from '@/lib/data/matchs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const matchs = await getAllMatchs();
    return NextResponse.json(matchs, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erreur API matchs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { matchId, scoreA, scoreB, statut } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    if ((scoreA !== undefined && scoreB === undefined) || (scoreA === undefined && scoreB !== undefined)) {
      return NextResponse.json({ error: 'Les deux scores doivent être fournis ensemble' }, { status: 400 });
    }

    const parsedScoreA = scoreA !== undefined ? Number(scoreA) : undefined;
    const parsedScoreB = scoreB !== undefined ? Number(scoreB) : undefined;

    if ((parsedScoreA !== undefined && !Number.isFinite(parsedScoreA)) || (parsedScoreB !== undefined && !Number.isFinite(parsedScoreB))) {
      return NextResponse.json({ error: 'Les scores doivent être des nombres valides' }, { status: 400 });
    }

    const result = await updateMatchScore(
      matchId,
      parsedScoreA,
      parsedScoreB,
      statut || 'Terminé'
    );
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Mise à jour impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur update score match:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
