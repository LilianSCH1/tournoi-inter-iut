import { NextResponse } from 'next/server';
import { createTache, getAllTaches, getTachesForResponsable, getTachesEnRetardOuImportantesForResponsable } from '@/lib/data/taches';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await requireRole(['admin', 'benevole']);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const responsable = searchParams.get('responsable');
    const urgentes = searchParams.get('urgentes');

    if (responsable && urgentes) {
      const tasks = await getTachesEnRetardOuImportantesForResponsable(responsable);
      return NextResponse.json(tasks, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    if (responsable) {
      const tasks = await getTachesForResponsable(responsable);
      return NextResponse.json(tasks, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    if (auth.session.role === 'benevole') {
      // Identité bénévole introuvable : on ne renvoie jamais la liste complète.
      return NextResponse.json([], { headers: { 'Cache-Control': 'no-store, max-age=0' } });
    }

    const tasks = await getAllTaches();
    return NextResponse.json(tasks, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erreur API tâches:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(['admin']);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { tache, description, responsable, priorite, deadline, categorie } = body as {
      tache?: string;
      description?: string;
      responsable?: string;
      priorite?: string;
      deadline?: string;
      categorie?: string;
    };

    if (!tache || !responsable || !priorite || !categorie) {
      return NextResponse.json(
        { error: 'tache, responsable, priorite et categorie sont requis' },
        { status: 400 }
      );
    }

    const created = await createTache({
      tache: String(tache),
      description: description ? String(description) : undefined,
      responsable: String(responsable),
      priorite: String(priorite),
      deadline: deadline ? String(deadline) : undefined,
      categorie: String(categorie),
    });

    if (!created) {
      return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tache: created });
  } catch (error) {
    console.error('Erreur création tâche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
