import { NextResponse } from 'next/server';
import { createMatch, getAllMatchs, updateMatchDetails, updateMatchScore } from '@/lib/data/matchs';
import { requireRole } from '@/lib/session';

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

export async function POST(request: Request) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { idMatch, sport, phase, date, heureDebut, terrain, equipeA, equipeB } = body;

    if (!sport || !phase || !date || !heureDebut || !terrain) {
      return NextResponse.json({ error: 'sport, phase, date, heureDebut et terrain sont requis' }, { status: 400 });
    }

    const created = await createMatch({ idMatch, sport, phase, date, heureDebut, terrain, equipeA, equipeB });
    if (!created) {
      return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true, match: created });
  } catch (error) {
    console.error('Erreur création match:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRole(['admin', 'benevole']);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { matchId, scoreA, scoreB, statut, sport, phase, date, heureDebut, terrain, equipeA, equipeB } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const scheduleFields = { sport, phase, date, heureDebut, terrain, equipeA, equipeB };
    const hasScheduleChange = Object.values(scheduleFields).some((value) => value !== undefined);

    if (hasScheduleChange) {
      if (auth.session.role !== 'admin') {
        return NextResponse.json(
          { error: 'Seul un administrateur peut modifier le calendrier des matchs' },
          { status: 403 }
        );
      }
      const result = await updateMatchDetails(matchId, scheduleFields);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Mise à jour impossible' }, { status: 500 });
      }
    }

    const hasScoreChange = scoreA !== undefined || scoreB !== undefined || statut !== undefined;
    if (hasScoreChange) {
      if ((scoreA !== undefined && scoreB === undefined) || (scoreA === undefined && scoreB !== undefined)) {
        return NextResponse.json({ error: 'Les deux scores doivent être fournis ensemble' }, { status: 400 });
      }

      const parsedScoreA = scoreA !== undefined ? Number(scoreA) : undefined;
      const parsedScoreB = scoreB !== undefined ? Number(scoreB) : undefined;

      if ((parsedScoreA !== undefined && !Number.isFinite(parsedScoreA)) || (parsedScoreB !== undefined && !Number.isFinite(parsedScoreB))) {
        return NextResponse.json({ error: 'Les scores doivent être des nombres valides' }, { status: 400 });
      }

      const result = await updateMatchScore(matchId, parsedScoreA, parsedScoreB, statut || 'Terminé');
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Mise à jour impossible' }, { status: 500 });
      }
    }

    if (!hasScheduleChange && !hasScoreChange) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur update match:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
