import { supabase } from '../supabase';

export interface IUTData {
  id: string;
  nom: string;
  referent: string;
  emailReferent: string;
  telephoneReferent: string;
  statutParticipation: string;
  nombreEquipes: number;
  nombreParticipants: number;
  nombreSpectateurs: number;
  transportSouhaite: string;
  hebergementRequis: string;
  budgetPaye: boolean;
  dateConfirmation?: string;
  notes?: string;
}

function mapRowToIUT(row: any): IUTData {
  return {
    id: row.id,
    nom: row.nom_iut || '',
    referent: row.referent_iut || '',
    emailReferent: row.email_referent || '',
    telephoneReferent: row.telephone_referent || '',
    statutParticipation: row.statut_participation || 'À confirmer',
    nombreEquipes: row.nombre_total_participants || 0,
    nombreParticipants: row.nombre_total_participants || 0,
    nombreSpectateurs: row.nombre_spectateurs || 0,
    transportSouhaite: row.transport_souhaite || '',
    hebergementRequis: row.hebergement_requis || '',
    budgetPaye: row.budget_paye || false,
    dateConfirmation: row.date_confirmation || undefined,
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

export async function updateIUT(
  id: string,
  fields: { statutParticipation?: string; budgetPaye?: boolean }
): Promise<boolean> {
  const payload: Record<string, unknown> = {};
  if (fields.statutParticipation !== undefined) payload.statut_participation = fields.statutParticipation;
  if (fields.budgetPaye !== undefined) payload.budget_paye = fields.budgetPaye;

  const { error } = await supabase.from('liste_iut').update(payload).eq('id', id);
  if (error) { console.error('Erreur mise à jour IUT:', error); return false; }
  return true;
}
