import { supabase } from '../supabase';

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
}

function mapRowToObjet(row: any): ObjetPerduData {
  return {
    id: row.id,
    type: row.type || 'Perdu',
    objet: row.objet || '',
    description: row.description || '',
    couleur: row.couleur || undefined,
    marque: row.marque || undefined,
    lieu: row.lieu || '',
    dateHeure: row.date_heure || '',
    declareParNom: row.declare_par_nom || '',
    declareParEmail: row.declare_par_email || '',
    declareParTelephone: row.declare_par_telephone || '',
    statut: row.statut || 'En cours',
    correspondanceId: row.correspondance_id || undefined,
  };
}

export async function getAllObjetsPerdus(): Promise<ObjetPerduData[]> {
  const { data, error } = await supabase.from('objets_perdus_trouves').select('*');
  if (error) { console.error('Erreur récupération objets perdus:', error); return []; }
  return (data || []).map(mapRowToObjet);
}

export async function getObjetsPerdusEnCours(): Promise<ObjetPerduData[]> {
  const { data, error } = await supabase
    .from('objets_perdus_trouves')
    .select('*')
    .eq('statut', 'En cours');
  if (error) { console.error('Erreur récupération objets en cours:', error); return []; }
  return (data || []).map(mapRowToObjet);
}

export async function createObjetPerdu(data: Partial<ObjetPerduData>): Promise<string | null> {
  const { data: row, error } = await supabase
    .from('objets_perdus_trouves')
    .insert({
      type: data.type,
      objet: data.objet,
      description: data.description,
      couleur: data.couleur || null,
      marque: data.marque || null,
      lieu: data.lieu,
      date_heure: data.dateHeure || new Date().toISOString(),
      declare_par_nom: data.declareParNom,
      declare_par_email: data.declareParEmail,
      declare_par_telephone: data.declareParTelephone,
      statut: 'En cours',
    })
    .select('id')
    .single();

  if (error) { console.error('Erreur création objet perdu:', error); return null; }
  return row?.id || null;
}

export async function updateObjetStatut(
  id: string,
  statut: 'En cours' | 'Matché' | 'Rendu' | 'Clôturé'
): Promise<boolean> {
  const { error } = await supabase
    .from('objets_perdus_trouves')
    .update({ statut })
    .eq('id', id);
  if (error) { console.error('Erreur mise à jour objet:', error); return false; }
  return true;
}
