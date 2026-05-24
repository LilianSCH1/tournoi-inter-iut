import { NextResponse } from 'next/server';
import { getTacheById, updateTacheStatut } from '@/lib/data/taches';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const task = await getTacheById(id);
    if (!task) return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    return NextResponse.json(task, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Erreur GET tâche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { statut, notes } = body as { statut?: string; notes?: string };

    if (!statut) return NextResponse.json({ error: 'Statut manquant' }, { status: 400 });

    const ok = await updateTacheStatut(id, statut, notes);
    if (!ok) return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PATCH tâche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
