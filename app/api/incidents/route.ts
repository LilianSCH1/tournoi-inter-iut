import { NextResponse } from 'next/server';
import { createIncident, getAllIncidents, updateIncidentStatut } from '@/lib/data/incidents';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const incidents = await getAllIncidents();
    return NextResponse.json(incidents, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erreur API incidents GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { typeUrgence, gravite, lieu, description, personneConcernee, contactSignalant, motUrgenceUtilise } = body;

    if (!typeUrgence || !gravite || !lieu || !description || !contactSignalant) {
      return NextResponse.json(
        { error: 'typeUrgence, gravite, lieu, description et contactSignalant requis' },
        { status: 400 }
      );
    }

    const allowedTypeUrgence = ['Médicale', 'Sécurité', 'Logistique', 'Autre'] as const;
    const allowedGravite = ['🟢 Faible', '🟡 Modérée', '🔴 Grave', '🆘 Critique'] as const;

    if (!allowedTypeUrgence.includes(typeUrgence)) {
      return NextResponse.json({ error: 'typeUrgence invalide' }, { status: 400 });
    }

    if (!allowedGravite.includes(gravite)) {
      return NextResponse.json({ error: 'gravite invalide' }, { status: 400 });
    }

    const id = await createIncident({
      typeUrgence,
      gravite,
      lieu: String(lieu),
      description: String(description),
      personneConcernee: personneConcernee ? String(personneConcernee) : undefined,
      contactSignalant: String(contactSignalant),
      motUrgenceUtilise: Boolean(motUrgenceUtilise),
    });

    if (!id) {
      return NextResponse.json({ error: 'Création impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Erreur API incidents POST:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, statut, prisEnChargePar, actionsPrises } = body;

    if (!id || !statut) {
      return NextResponse.json({ error: 'id et statut requis' }, { status: 400 });
    }

    if (!['Signalé', 'En traitement', 'Résolu', 'Clôturé'].includes(String(statut))) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const success = await updateIncidentStatut(
      String(id),
      String(statut) as 'Signalé' | 'En traitement' | 'Résolu' | 'Clôturé',
      prisEnChargePar ? String(prisEnChargePar) : undefined,
      actionsPrises ? String(actionsPrises) : undefined
    );

    if (!success) {
      return NextResponse.json({ error: 'Mise à jour impossible' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur API incidents PATCH:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
