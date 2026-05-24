import { NextResponse } from 'next/server';
import { createParticipant, getAllParticipants, getParticipantByEmail, getParticipantById, updateParticipantArrivalStatus, updateParticipantCheckin, updateParticipantEquipe, updateParticipantType } from '@/lib/data/participants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const participants = await getAllParticipants();
    return NextResponse.json(participants, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erreur API participants:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { participantId, arrived, status, type, equipeId } = body;

    if (!participantId) {
      return NextResponse.json({ error: 'participantId requis' }, { status: 400 });
    }

    let success = false;

    if (type === 'Joueur' || type === 'Spectateur' || type === 'Bénévole' || type === 'Staff') {
      success = await updateParticipantType(participantId, type);
    } else if (equipeId !== undefined) {
      success = await updateParticipantEquipe(participantId, equipeId ? [String(equipeId)] : []);
    } else if (status === 'present' || status === 'absent' || status === 'en_attente') {
      success = await updateParticipantArrivalStatus(participantId, status);
    } else {
      success = await updateParticipantCheckin(participantId, arrived !== false);
    }

    if (!success) {
      return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 });
    }

    if (type === 'Bénévole') {
      const participant = await getParticipantById(participantId);
      return NextResponse.json({
        success: true,
        benevolePassword: participant?.benevolePassword || null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur update participant:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nomComplet, email, iut, telephone, transport, hebergement } = body;

    if (!nomComplet || !email || !iut) {
      return NextResponse.json({ error: 'nomComplet, email et iut requis' }, { status: 400 });
    }

    const existing = await getParticipantByEmail(String(email));
    if (existing) {
      return NextResponse.json({ error: 'Un participant avec cet email existe déjà' }, { status: 409 });
    }

    const id = await createParticipant({
      nomComplet: String(nomComplet),
      email: String(email),
      iut: String(iut),
      telephone: telephone ? String(telephone) : undefined,
      transport: transport ? String(transport) : undefined,
      hebergement: Boolean(hebergement),
      type: 'Spectateur',
    });

    if (!id) {
      return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Erreur création participant:', error);
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
