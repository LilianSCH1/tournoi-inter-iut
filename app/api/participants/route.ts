import { NextResponse } from 'next/server';
import { createParticipant, ensureBenevolePassword, getAllParticipants, getParticipantByEmail, updateParticipantArrivalStatus, updateParticipantCheckin, updateParticipantEquipe, updateParticipantType } from '@/lib/data/participants';
import { getSession, requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Accès à trois niveaux :
// - anonyme (parcours d'inscription public) : uniquement les spectateurs,
//   avec les seuls champs nécessaires à la sélection de joueurs par un capitaine.
// - joueur : uniquement les participants de son propre IUT (pas les autres équipes).
// - admin / bénévole : accès complet (nécessaire à l'opérationnel terrain).
export async function GET() {
  try {
    const session = await getSession();
    const allParticipants = await getAllParticipants();

    if (!session) {
      const publicView = allParticipants
        .filter((p) => p.type === 'Spectateur')
        .map((p) => ({
          id: p.id,
          nomComplet: p.nomComplet,
          email: p.email,
          iut: p.iut,
          type: p.type,
          equipeIds: p.equipeIds,
        }));
      return NextResponse.json(publicView, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    if (session.role === 'joueur') {
      const iut = String(session.iut || '').trim().toLowerCase();
      const scoped = iut
        ? allParticipants.filter((p) => String(p.iut || '').trim().toLowerCase() === iut)
        : [];
      return NextResponse.json(scoped, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    return NextResponse.json(allParticipants, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    console.error('Erreur API participants:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRole(['admin', 'benevole']);
  if (auth.error) return auth.error;

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
      const benevolePassword = await ensureBenevolePassword(participantId);
      return NextResponse.json({ success: true, benevolePassword });
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
