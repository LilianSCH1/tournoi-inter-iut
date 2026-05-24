import { airtable, TABLES } from '../airtable';

export interface ObjetPerduData {
  id: string;
  type: 'Perdu' | 'Trouvé';
  objet: string;
  description: string;
  couleur?: string;
  marque?: string;
  lieu: string;
  dateHeure: string;
  declareParNom: string;
  declareParEmail: string;
  declareParTelephone: string;
  statut: 'En cours' | 'Matché' | 'Rendu' | 'Clôturé';
  correspondanceId?: string;
  photo?: any[];
}

export async function getAllObjetsPerdus(): Promise<ObjetPerduData[]> {
  try {
    const records = await airtable.getAll(TABLES.OBJETS_PERDUS);
    
    return records.map((record: any) => ({
      id: record.id,
      type: record.fields.Type || 'Perdu',
      objet: record.fields.Objet || '',
      description: record.fields.Description || '',
      couleur: record.fields.Couleur,
      marque: record.fields.Marque,
      lieu: record.fields.Lieu || '',
      dateHeure: record.fields['Date/Heure'] || '',
      declareParNom: record.fields['Déclaré par nom'] || '',
      declareParEmail: record.fields['Déclaré par email'] || '',
      declareParTelephone: record.fields['Déclaré par téléphone'] || '',
      statut: record.fields.Statut || 'En cours',
      correspondanceId: record.fields['Correspondance ID'],
      photo: record.fields.Photo,
    }));
  } catch (error) {
    console.error('Erreur récupération objets perdus:', error);
    return [];
  }
}

export async function getObjetsPerdusEnCours(): Promise<ObjetPerduData[]> {
  const all = await getAllObjetsPerdus();
  return all.filter(o => o.statut === 'En cours');
}

export async function createObjetPerdu(data: Partial<ObjetPerduData>): Promise<string | null> {
  try {
    const fields: any = {
      'Type': data.type,
      'Objet': data.objet,
      'Description': data.description,
      'Couleur': data.couleur || '',
      'Marque': data.marque || '',
      'Lieu': data.lieu,
      'Date/Heure': data.dateHeure || new Date().toISOString(),
      'Déclaré par nom': data.declareParNom,
      'Déclaré par email': data.declareParEmail,
      'Déclaré par téléphone': data.declareParTelephone,
      'Statut': 'En cours',
    };

    const recordId = await airtable.create(TABLES.OBJETS_PERDUS, fields);
    return recordId;
  } catch (error) {
    console.error('Erreur création objet perdu:', error);
    return null;
  }
}

export async function updateObjetStatut(
  id: string,
  statut: 'En cours' | 'Matché' | 'Rendu' | 'Clôturé'
): Promise<boolean> {
  try {
    await airtable.update(TABLES.OBJETS_PERDUS, id, { 'Statut': statut });
    return true;
  } catch (error) {
    console.error('Erreur mise à jour objet:', error);
    return false;
  }
}
