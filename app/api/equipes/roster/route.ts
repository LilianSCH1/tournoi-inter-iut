import { NextResponse } from 'next/server';
import { getAllParticipants, updateParticipantEquipe } from '@/lib/data/participants';
import { getAllEquipes } from '@/lib/data/equipes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { participantId, equipeId, action } = body as {
      participantId?: string;
      equipeId?: string;
      action?: 'add' | 'remove';
    };

    if (!participantId || !equipeId || !action) {
      return NextResponse.json({ error: 'participantId, equipeId et action requis' }, { status: 400 });
    }

    const [participants, equipes] = await Promise.all([
      getAllParticipants(),
      getAllEquipes(),
    ]);
    const participant = participants.find((p) => p.id === participantId);
    const equipe = equipes.find((team) => team.id === equipeId);
    const equipeName = String(equipe?.nom || '').trim().toLowerCase();

    if (!participant) {
      return NextResponse.json({ error: 'Participant introuvable' }, { status: 404 });
    }

    const current = Array.isArray(participant.equipeIds) ? participant.equipeIds : [];
    let next: string[] = current;

    if (action === 'add') {
      next = Array.from(new Set([equipeId]));
    }

    if (action === 'remove') {
      next = current.filter((id) => {
        const normalized = String(id || '').trim().toLowerCase();
        return id !== equipeId && (!equipeName || normalized !== equipeName);
      });
    }

    const success = await updateParticipantEquipe(participantId, next);

    if (!success) {
      return NextResponse.json({ error: 'Mise à jour roster impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API roster:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
