import { supabase } from '../supabase';

export interface IUTData {
  id: string;
  nom: string;
  ville: string;
  referent: string;
  emailReferent: string;
  telephoneReferent: string;
  statutParticipation: string;
  nombreEquipes: number;
  nombreParticipants: number;
  budgetPaye: boolean;
  montantDu: number;
  notes?: string;
}

function mapRowToIUT(row: any): IUTData {
  return {
    id: row.id,
    nom: row.nom_iut || '',
    ville: row.ville || '',
    referent: row.referent_iut || '',
    emailReferent: row.email_referent || '',
    telephoneReferent: row.telephone_referent || '',
    statutParticipation: row.statut_participation || 'À confirmer',
    nombreEquipes: row.nombre_total_participants || 0,
    nombreParticipants: row.nombre_total_participants || 0,
    budgetPaye: row.budget_paye || false,
    montantDu: row.montant_du || 0,
    notes: row.notes,
  };
}

export async function getAllIUT(): Promise<IUTData[]> {
  const { data, error } = await supabase.from('liste_iut').select('*');
  if (error) { console.error('Erreur récupération IUT:', error); return []; }
  return (data || []).map(mapRowToIUT);
}

export async function getIUTConfirmes(): Promise<IUTData[]> {
  const { data, error } = await supabase
    .from('liste_iut')
    .select('*')
    .eq('statut_participation', 'Confirmé');
  if (error) { console.error('Erreur récupération IUT confirmés:', error); return []; }
  return (data || []).map(mapRowToIUT);
}
