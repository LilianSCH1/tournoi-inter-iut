import { NextResponse } from 'next/server';
import { createDevis, getAllDevis, getDevisByAssigne, getDevisByStatut, getTotalDevis } from '@/lib/data/devis';

export async function GET(request: Request) {
  try {
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
  try {
    const body = await request.json();
    const titre = String(body?.titre || '').trim();
    const assigne = String(body?.assigne || '').trim();
    const montant = Number(body?.montant || 0);

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
