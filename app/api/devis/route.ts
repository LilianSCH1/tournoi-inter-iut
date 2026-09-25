import { NextResponse } from 'next/server';
import { createDevis, getAllDevis, getDevisByAssigne, getDevisByStatut, getTotalDevis, updateDevisStatut, type DevisStatut } from '@/lib/data/devis';
import { requireRole } from '@/lib/session';

const VALID_DEVIS_STATUTS: DevisStatut[] = ['Envoyé', 'Refus', 'En attente', 'Accord mutuel'];

export async function GET(request: Request) {
  const auth = await requireRole(['admin', 'benevole']);
  if (auth.error) return auth.error;

  try {
    // Un bénévole ne voit que ses propres devis, quels que soient les paramètres
    // de requête : on ignore tout filtre client et on force son identité.
    if (auth.session.role === 'benevole') {
      const own = auth.session.nomComplet || auth.session.email || '';
      const devis = await getDevisByAssigne(own);
      return NextResponse.json(devis);
    }

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const assigne = searchParams.get('assigne');
    const total = searchParams.get('total');

    if (total) {
      const totalAmount = await getTotalDevis();
      return NextResponse.json({ total: totalAmount });
    }

    if (statut) {
      const devis = await getDevisByStatut(statut);
      return NextResponse.json(devis);
    }

    if (assigne) {
      const devis = await getDevisByAssigne(assigne);
      return NextResponse.json(devis);
    }

    const allDevis = await getAllDevis();
    return NextResponse.json(allDevis);
  } catch (error) {
    console.error('Erreur API devis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des devis' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(['admin', 'benevole']);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const titre = String(body?.titre || '').trim();
    const montant = Number(body?.montant || 0);

    // Un bénévole ne peut créer un devis qu'à son propre nom, même si le body
    // client indique autre chose.
    const assigne =
      auth.session.role === 'benevole'
        ? auth.session.nomComplet || auth.session.email || ''
        : String(body?.assigne || '').trim();

    if (!titre || !assigne || !Number.isFinite(montant) || montant < 0) {
      return NextResponse.json(
        { error: 'titre, assigne et montant valides sont requis' },
        { status: 400 }
      );
    }

    const created = await createDevis({
      titre,
      montant,
      assigne,
      statut: body?.statut,
      dateReception: body?.dateReception,
      notes: String(body?.notes || ''),
      pieceJointeUrls: Array.isArray(body?.pieceJointeUrls)
        ? body.pieceJointeUrls.map((item: unknown) => String(item || '').trim()).filter(Boolean)
        : [],
    });

    if (!created) {
      return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true, devis: created });
  } catch (error) {
    console.error('Erreur API devis POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { id, statut } = body as { id?: string; statut?: string };

    if (!id || !statut) {
      return NextResponse.json({ error: 'id et statut requis' }, { status: 400 });
    }
    if (!VALID_DEVIS_STATUTS.includes(statut as DevisStatut)) {
      return NextResponse.json({ error: 'statut invalide' }, { status: 400 });
    }

    await updateDevisStatut(id, statut as DevisStatut);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API devis PATCH:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
