import { supabase } from '../supabase';

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

function mapRowToIncident(row: any): IncidentData {
  return {
    id: row.id,
    typeUrgence: row.type_urgence || 'Autre',
    gravite: row.gravite || '🟢 Faible',
    lieu: row.lieu || '',
    description: row.description || '',
    personneConcernee: row.personne_concernee || undefined,
    contactSignalant: row.contact_signalant || '',
    statut: row.statut || 'Signalé',
    prisEnChargePar: row.pris_en_charge_par || undefined,
    actionsPrises: row.actions_prises || undefined,
    dateResolution: row.date_resolution || undefined,
    notesInternes: row.notes_internes || undefined,
    motUrgenceUtilise: row.mot_urgence_utilise || false,
  };
}

export async function getAllIncidents(): Promise<IncidentData[]> {
  const { data, error } = await supabase.from('incidents_urgences').select('*');
  if (error) { console.error('Erreur récupération incidents:', error); return []; }
  return (data || []).map(mapRowToIncident);
}

export async function getIncidentsEnCours(): Promise<IncidentData[]> {
  const all = await getAllIncidents();
  return all.filter(i => i.statut !== 'Résolu' && i.statut !== 'Clôturé');
}

export async function createIncident(data: Partial<IncidentData>): Promise<string | null> {
  const { data: row, error } = await supabase
    .from('incidents_urgences')
    .insert({
      type_urgence: data.typeUrgence,
      gravite: data.gravite,
      lieu: data.lieu,
      description: data.description,
      personne_concernee: data.personneConcernee || null,
      contact_signalant: data.contactSignalant,
      statut: 'Signalé',
      mot_urgence_utilise: data.motUrgenceUtilise || false,
    })
    .select('id')
    .single();

  if (error) { console.error('Erreur création incident:', error); return null; }
  return row?.id || null;
}

export async function updateIncidentStatut(
  id: string,
  statut: 'Signalé' | 'En traitement' | 'Résolu' | 'Clôturé',
  prisEnChargePar?: string,
  actionsPrises?: string
): Promise<boolean> {
  const payload: any = { statut };
  if (prisEnChargePar) payload.pris_en_charge_par = prisEnChargePar;
  if (actionsPrises) payload.actions_prises = actionsPrises;
  if (statut === 'Résolu') payload.date_resolution = new Date().toISOString();

  const { error } = await supabase.from('incidents_urgences').update(payload).eq('id', id);
  if (error) { console.error('Erreur mise à jour incident:', error); return false; }
  return true;
}
