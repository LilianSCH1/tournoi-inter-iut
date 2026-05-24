import { NextResponse } from 'next/server';
import { authenticateJoueur } from '@/lib/auth';
import { getEquipeByCode } from '@/lib/data/equipes';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const codeEquipe = String(body?.codeEquipe || '').trim();

    if (!codeEquipe) {
      return NextResponse.json({ error: 'Code équipe requis' }, { status: 400 });
    }

    const user = await authenticateJoueur(codeEquipe);
    if (!user) {
      return NextResponse.json({ error: 'Code équipe invalide' }, { status: 401 });
    }

    const equipe = await getEquipeByCode(codeEquipe.toUpperCase());

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
