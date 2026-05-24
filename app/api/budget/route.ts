import { NextResponse } from 'next/server';
import { createBudgetLine, updateBudgetLine } from '@/lib/data/live';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, poste, categorie, type, montantPrevu, montantReel, statutPaiement } = body;

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const success = await updateBudgetLine(id, {
      poste,
      categorie,
      type,
      montantPrevu: montantPrevu !== undefined ? Number(montantPrevu) : undefined,
      montantReel: montantReel !== undefined ? Number(montantReel) : undefined,
      statutPaiement,
    });

    if (!success) {
      return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API budget PATCH:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { poste, categorie, type, montantPrevu, montantReel, statutPaiement } = body;

    if (!poste) {
      return NextResponse.json({ error: 'poste requis' }, { status: 400 });
    }

    const success = await createBudgetLine({
      poste: String(poste),
      categorie: String(categorie || ''),
      type: String(type || 'Dépense'),
      montantPrevu: Number(montantPrevu || 0),
      montantReel: Number(montantReel || 0),
      statutPaiement: String(statutPaiement || 'En attente'),
    });

    if (!success) {
      return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API budget POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
