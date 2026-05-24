import { NextResponse } from 'next/server';
import { getAllTaches, getTachesForResponsable, getTachesEnRetardOuImportantesForResponsable } from '@/lib/data/taches';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
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
