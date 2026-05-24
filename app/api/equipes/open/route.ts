import { NextResponse } from 'next/server';
import { getAllEquipes } from '@/lib/data/equipes';
import { getAllParticipants } from '@/lib/data/participants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [equipes, participants] = await Promise.all([
      getAllEquipes(),
      getAllParticipants(),
    ]);

    const joueursByEquipeId: Record<string, number> = {};

    for (const participant of participants) {
      if (participant.type !== 'Joueur') continue;
      for (const equipeId of participant.equipeIds || []) {
        joueursByEquipeId[equipeId] = (joueursByEquipeId[equipeId] || 0) + 1;
      }
    }

    const equipesOuvertes = equipes
      .map((equipe) => {
        const joueurs = joueursByEquipeId[equipe.id] || 0;
        const placesRestantes = Math.max(0, 10 - joueurs);

        return {
          id: equipe.id,
          nom: equipe.nom,
          iut: equipe.iut,
          joueurs,
          placesRestantes,
          complet: placesRestantes <= 0,
        };
      })
      .filter((equipe) => !equipe.complet)
      .sort((a, b) => b.placesRestantes - a.placesRestantes || a.nom.localeCompare(b.nom));

    return NextResponse.json(equipesOuvertes, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erreur API equipes ouvertes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
