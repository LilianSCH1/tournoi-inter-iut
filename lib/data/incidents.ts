import { airtable, TABLES } from '../airtable';

export interface IncidentData {
  id: string;
  typeUrgence: 'Médicale' | 'Sécurité' | 'Logistique' | 'Autre';
  gravite: '🟢 Faible' | '🟡 Modérée' | '🔴 Grave' | '🆘 Critique';
  lieu: string;
  description: string;
  personneConcernee?: string;
  contactSignalant: string;
  statut: 'Signalé' | 'En traitement' | 'Résolu' | 'Clôturé';
  prisEnChargePar?: string;
  actionsPrises?: string;
  dateResolution?: string;
  notesInternes?: string;
  motUrgenceUtilise?: boolean;
}

function isAirtableUnauthorized(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      (error as { statusCode?: number }).statusCode === 403
  );
}

export async function getAllIncidents(): Promise<IncidentData[]> {
  try {
    const records = await airtable.getAll(TABLES.INCIDENTS);
    
    return records.map((record: any) => ({
      id: record.id,
      typeUrgence: record.fields['Type urgence'] || 'Autre',
      gravite: record.fields.Gravité || '🟢 Faible',
      lieu: record.fields.Lieu || '',
      description: record.fields.Description || '',
      personneConcernee: record.fields['Personne concernée'],
      contactSignalant: record.fields['Contact signalant'] || '',
      statut: record.fields.Statut || 'Signalé',
      prisEnChargePar: record.fields['Pris en charge par'],
      actionsPrises: record.fields['Actions prises'],
      dateResolution: record.fields['Date résolution'],
      notesInternes: record.fields['Notes internes'],
      motUrgenceUtilise: record.fields['Mot d\'urgence utilisé'] || false,
    }));
  } catch (error) {
    if (!isAirtableUnauthorized(error)) {
      console.error('Erreur récupération incidents:', error);
    }
    return [];
  }
}

export async function getIncidentsEnCours(): Promise<IncidentData[]> {
  const all = await getAllIncidents();
  return all.filter(i => i.statut !== 'Résolu' && i.statut !== 'Clôturé');
}

export async function createIncident(data: Partial<IncidentData>): Promise<string | null> {
  try {
    const fields: any = {
      'Type urgence': data.typeUrgence,
      'Gravité': data.gravite,
      'Lieu': data.lieu,
      'Description': data.description,
      'Personne concernée': data.personneConcernee || '',
      'Contact signalant': data.contactSignalant,
      'Statut': 'Signalé',
      'Mot d\'urgence utilisé': data.motUrgenceUtilise || false,
    };

    const recordId = await airtable.create(TABLES.INCIDENTS, fields);
    return recordId;
  } catch (error) {
    if (!isAirtableUnauthorized(error)) {
      console.error('Erreur création incident:', error);
    }
    return null;
  }
}

export async function updateIncidentStatut(
  id: string,
  statut: 'Signalé' | 'En traitement' | 'Résolu' | 'Clôturé',
  prisEnChargePar?: string,
  actionsPrises?: string
): Promise<boolean> {
  try {
    const fields: any = { 'Statut': statut };
    
    if (prisEnChargePar) fields['Pris en charge par'] = prisEnChargePar;
    if (actionsPrises) fields['Actions prises'] = actionsPrises;
    if (statut === 'Résolu') fields['Date résolution'] = new Date().toISOString();

    await airtable.update(TABLES.INCIDENTS, id, fields);
    return true;
  } catch (error) {
    if (!isAirtableUnauthorized(error)) {
      console.error('Erreur mise à jour incident:', error);
    }
    return false;
  }
}
