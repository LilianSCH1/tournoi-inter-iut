import { NextResponse } from 'next/server';
import { authenticateJoueur } from '@/lib/auth';
import { getEquipeByCode } from '@/lib/data/equipes';
import { setSessionCookie } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const codeEquipe = String(body?.codeEquipe || '').trim();

    if (!codeEquipe) {
      return NextResponse.json({ error: 'Code équipe requis' }, { status: 400 });
    }

    const result = await authenticateJoueur(codeEquipe);
    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        not_found: 'Code équipe invalide',
        pending: 'Cette équipe est en attente de validation par l\'organisation. Réessayez un peu plus tard.',
        refused: 'La candidature de cette équipe a été refusée. Contactez l\'organisation.',
      };
      return NextResponse.json({ error: messages[result.reason] }, { status: result.reason === 'not_found' ? 401 : 403 });
    }

    const { user } = result;
    const equipe = await getEquipeByCode(codeEquipe.toUpperCase());

    await setSessionCookie({
      role: 'joueur',
      equipeId: user.equipeId,
      equipeName: user.equipeName || equipe?.nom,
      iut: equipe?.iut || '',
      codeEquipe: codeEquipe.toUpperCase(),
    });

    return NextResponse.json({
      success: true,
      session: {
        role: user.role,
        equipeId: user.equipeId,
        equipeName: user.equipeName || equipe?.nom,
        iut: equipe?.iut || '',
        codeEquipe: codeEquipe.toUpperCase(),
      },
    });
  } catch (error) {
    console.error('Erreur auth joueur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
