import { supabase } from '../supabase';

export type DevisStatut = 'Envoyé' | 'Refus' | 'En attente' | 'Accord mutuel';

export interface AttachmentFile {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface DevisData {
  id: string;
  titre: string;
  montant: number;
  assigne?: string;
  statut: DevisStatut;
  dateReception?: string;
  notes?: string;
  piecesJointes?: AttachmentFile[];
}

export interface DevisCreateInput {
  titre: string;
  montant: number;
  assigne: string;
  statut?: DevisStatut;
  dateReception?: string;
  notes?: string;
  pieceJointeUrls?: string[];
}

function mapRowToDevis(row: any): DevisData {
  return {
    id: row.id,
    titre: row.titre || '',
    montant: row.montant || 0,
    assigne: row.assigne,
    statut: row.statut || 'En attente',
    dateReception: row.date_reception,
    notes: row.notes,
    piecesJointes: Array.isArray(row.pieces_jointes) ? row.pieces_jointes : [],
  };
}

export async function getAllDevis(): Promise<DevisData[]> {
  const { data, error } = await supabase.from('devis_pieces_jointes').select('*');
  if (error) { console.error('Erreur récupération devis:', error); return []; }
  return (data || []).map(mapRowToDevis);
}

export async function getDevisById(id: string): Promise<DevisData | null> {
  const { data, error } = await supabase.from('devis_pieces_jointes').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapRowToDevis(data);
}

export async function getDevisByStatut(statut: DevisStatut | string): Promise<DevisData[]> {
  const { data, error } = await supabase
    .from('devis_pieces_jointes')
    .select('*')
    .eq('statut', statut);
  if (error) { console.error('Erreur filtrage devis:', error); return []; }
  return (data || []).map(mapRowToDevis);
}

export async function getDevisByAssigne(assigne: string): Promise<DevisData[]> {
  const normalized = String(assigne || '').trim().toLowerCase();
  if (!normalized) return [];
  const all = await getAllDevis();
  return all.filter(d => String(d.assigne || '').trim().toLowerCase() === normalized);
}

export async function createDevis(input: DevisCreateInput): Promise<DevisData | null> {
  const piecesJointes = (input.pieceJointeUrls || []).map(url => ({ url }));

  const { data, error } = await supabase
    .from('devis_pieces_jointes')
    .insert({
      titre: input.titre,
      montant: input.montant,
      assigne: input.assigne,
      statut: input.statut || 'En attente',
      date_reception: input.dateReception || new Date().toISOString().slice(0, 10),
      notes: input.notes || null,
      pieces_jointes: piecesJointes,
    })
    .select()
    .single();

  if (error) { console.error('Erreur création devis:', error); return null; }
  return mapRowToDevis(data);
}

export async function getTotalDevis(): Promise<number> {
  const all = await getAllDevis();
  return all.reduce((total, d) => total + d.montant, 0);
}

export async function updateDevisStatut(id: string, newStatut: DevisStatut | string): Promise<void> {
  const { error } = await supabase
    .from('devis_pieces_jointes')
    .update({ statut: newStatut })
    .eq('id', id);
  if (error) console.error('Erreur mise à jour statut devis:', error);
}
