import { NextResponse } from 'next/server';
import { createEquipe, getAllEquipes } from '@/lib/data/equipes';
import { getAllParticipants, updateParticipantEquipe, updateParticipantType } from '@/lib/data/participants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const equipes = await getAllEquipes();
    return NextResponse.json(equipes, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erreur API equipes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nomEquipe, iut, capitaineNom, capitaineEmail, capitaineTel, selectedSpectateurIds } = body as {
      nomEquipe?: string;
      iut?: string;
      capitaineNom?: string;
      capitaineEmail?: string;
      capitaineTel?: string;
      selectedSpectateurIds?: string[];
    };

    if (!nomEquipe || !iut || !capitaineNom || !capitaineEmail || !capitaineTel) {
      return NextResponse.json({ error: 'nomEquipe, iut et informations du capitaine requis' }, { status: 400 });
    }

    const ids = Array.isArray(selectedSpectateurIds) ? selectedSpectateurIds.map(String) : [];
    if (ids.length !== 10) {
      return NextResponse.json({ error: 'Une équipe doit être composée de 10 spectateurs exactement' }, { status: 400 });
    }

    const [equipes, participants] = await Promise.all([
      getAllEquipes(),
      getAllParticipants(),
    ]);

    const existingSameName = equipes.find(
      (team) => team.nom.trim().toLowerCase() === String(nomEquipe).trim().toLowerCase() && team.iut.trim().toLowerCase() === String(iut).trim().toLowerCase()
    );

    if (existingSameName) {
      return NextResponse.json({ error: 'Une équipe avec ce nom existe déjà pour cet IUT' }, { status: 409 });
    }

    const selected = participants.filter((participant) => ids.includes(participant.id));
    if (selected.length !== 10) {
      return NextResponse.json({ error: 'Certains spectateurs sélectionnés sont introuvables' }, { status: 400 });
    }

    const invalid = selected.find((participant) => participant.type !== 'Spectateur' || (participant.equipeIds && participant.equipeIds.length > 0));
    if (invalid) {
      return NextResponse.json({ error: 'Tous les joueurs doivent être des spectateurs non affectés à une équipe' }, { status: 400 });
    }

    const created = await createEquipe({
      nom: String(nomEquipe),
      iut: String(iut),
      capitaineNom: String(capitaineNom),
      capitaineEmail: String(capitaineEmail),
      capitaineTelephone: String(capitaineTel),
      nombreJoueurs: 10,
    });

    if (!created) {
      return NextResponse.json({ error: 'Impossible de créer l\'équipe' }, { status: 500 });
    }

    const updates = await Promise.all(
      selected.map(async (participant) => {
        const roleOk = await updateParticipantType(participant.id, 'Joueur');
        const teamOk = await updateParticipantEquipe(participant.id, [created.id]);

        return {
          id: participant.id,
          nom: participant.nomComplet,
          roleOk,
          teamOk,
          ok: roleOk && teamOk,
        };
      })
    );

    const failedPlayers = updates.filter((item) => !item.ok);
    if (failedPlayers.length > 0) {
      return NextResponse.json(
        {
          error: 'Équipe créée, mais affectation des joueurs incomplète',
          failedPlayers: failedPlayers.map((item) => ({
            id: item.id,
            nom: item.nom,
            roleOk: item.roleOk,
            teamOk: item.teamOk,
          })),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, equipe: created });
  } catch (error) {
    console.error('Erreur création équipe:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
