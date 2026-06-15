import { randomBytes } from 'crypto';
import { supabase } from '../supabase';

export type StatutArrivee = 'present' | 'absent' | 'en_attente';
const BENEVOLE_PASSWORD_FIELD = 'mot_de_passe_benevole';

export interface ParticipantData {
  id: string;
  nomComplet: string;
  iut: string;
  equipe?: string;
  equipeIds: string[];
  type: 'Joueur' | 'Spectateur' | 'Bénévole' | 'Staff';
  email: string;
  telephone?: string;
  allergiesAlimentaires?: string;
  tailleMaillot?: string;
  licenceSportive?: string;
  licenceValidee: boolean;
  transport?: string;
  hebergement: boolean;
  arriveeConfirmee: boolean;
  statutArrivee: StatutArrivee;
  departConfirme: boolean;
  benevolePassword?: string;
}

function normalizeArrivalStatus(arriveeConfirmee: string | null): StatutArrivee {
  const val = String(arriveeConfirmee || '').toLowerCase();
  if (val === 'oui') return 'present';
  if (val === 'non') return 'absent';
  return 'en_attente';
}

function generateBenevolePassword(length = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) password += alphabet[bytes[i] % alphabet.length];
  return password;
}

function mapRowToParticipant(row: any): ParticipantData {
  const arrivee = row.arrivee_confirmee;
  return {
    id: row.id,
    nomComplet: row.nom_complet || '',
    iut: row.iut || '',
    equipe: row.equipe_nom || undefined,
    equipeIds: row.equipe_nom ? [row.equipe_nom] : [],
    type: row.type || 'Spectateur',
    email: row.email || '',
    telephone: row.telephone || undefined,
    allergiesAlimentaires: row.allergies_alimentaires || undefined,
    tailleMaillot: row.taille_maillot || undefined,
    licenceSportive: row.licence_sportive || undefined,
    licenceValidee: row.licence_validee || false,
    transport: row.transport || undefined,
    hebergement: String(row.hebergement || '').toLowerCase() === 'oui',
    arriveeConfirmee: String(arrivee || '').toLowerCase() === 'oui',
    statutArrivee: normalizeArrivalStatus(arrivee),
    departConfirme: row.depart_confirme || false,
    benevolePassword: row[BENEVOLE_PASSWORD_FIELD] || '',
  };
}

export async function getAllParticipants(): Promise<ParticipantData[]> {
  const { data, error } = await supabase.from('liste_participants').select('*');
  if (error) { console.error('Erreur récupération participants:', error); return []; }
  return (data || []).map(mapRowToParticipant);
}

export async function getParticipantsByEquipe(equipeNom: string): Promise<ParticipantData[]> {
  const { data, error } = await supabase
    .from('liste_participants')
    .select('*')
    .eq('equipe_nom', equipeNom);
  if (error) { console.error('Erreur récupération participants par équipe:', error); return []; }
  return (data || []).map(mapRowToParticipant);
}

export async function getParticipantByEmail(email: string): Promise<ParticipantData | null> {
  const { data, error } = await supabase
    .from('liste_participants')
    .select('*')
    .eq('email', email)
    .single();
  if (error || !data) return null;
  return mapRowToParticipant(data);
}

export async function getParticipantById(id: string): Promise<ParticipantData | null> {
  const { data, error } = await supabase
    .from('liste_participants')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapRowToParticipant(data);
}

export async function getBenevoleByEmail(email: string): Promise<ParticipantData | null> {
  const { data, error } = await supabase
    .from('liste_participants')
    .select('*')
    .eq('email', email)
    .eq('type', 'Bénévole')
    .single();
  if (error || !data) return null;
  return mapRowToParticipant(data);
}

export async function getStaffByEmail(email: string): Promise<ParticipantData | null> {
  const { data, error } = await supabase
    .from('liste_participants')
    .select('*')
    .eq('email', email)
    .eq('type', 'Staff')
    .single();
  if (error || !data) return null;
  return mapRowToParticipant(data);
}

export async function updateParticipantCheckin(id: string, arrived = true): Promise<boolean> {
  return updateParticipantArrivalStatus(id, arrived ? 'present' : 'en_attente');
}

export async function updateParticipantArrivalStatus(id: string, status: StatutArrivee): Promise<boolean> {
  const arrivee = status === 'present' ? 'Oui' : status === 'absent' ? 'Non' : null;
  const { error } = await supabase
    .from('liste_participants')
    .update({ arrivee_confirmee: arrivee })
    .eq('id', id);
  if (error) { console.error('Erreur update statut arrivée:', error); return false; }
  return true;
}

export async function updateParticipantEquipe(id: string, equipeIds: string[]): Promise<boolean> {
  const equipeNom = equipeIds[0] || '';
  const { error } = await supabase
    .from('liste_participants')
    .update({ equipe_nom: equipeNom })
    .eq('id', id);
  if (error) { console.error('Erreur update équipe participant:', error); return false; }
  return true;
}

export async function updateParticipantType(id: string, type: ParticipantData['type']): Promise<boolean> {
  const { error } = await supabase
    .from('liste_participants')
    .update({ type })
    .eq('id', id);
  if (error) { console.error('Erreur update type participant:', error); return false; }
  return true;
}

export async function createParticipant(input: {
  nomComplet: string;
  email: string;
  iut: string;
  telephone?: string;
  type?: ParticipantData['type'];
  transport?: string;
  hebergement?: boolean;
  benevolePassword?: string;
}): Promise<string | null> {
  const benevolePassword =
    String(input.benevolePassword || '').trim() ||
    (input.type === 'Bénévole' ? generateBenevolePassword() : '');

  const payload: any = {
    nom_complet: String(input.nomComplet || '').trim(),
    email: String(input.email || '').trim(),
    iut: String(input.iut || '').trim(),
    type: input.type || 'Spectateur',
    hebergement: input.hebergement ? 'Oui' : 'Non',
  };

  if (input.telephone) payload.telephone = String(input.telephone).trim();
  if (input.transport) payload.transport = input.transport;
  if (benevolePassword) payload[BENEVOLE_PASSWORD_FIELD] = benevolePassword;

  const { data, error } = await supabase
    .from('liste_participants')
    .insert(payload)
    .select('id')
    .single();

  if (error) { console.error('Erreur création participant:', error); return null; }
  return data?.id || null;
}
