import { supabase } from '../supabase';

export interface MatchData {
  id: string;
  idMatch: string;
  sport: string;
  phase: string;
  date: string;
  heureDebut: string;
  terrain: string;
  equipeA: string;
  equipeB: string;
  scoreA?: number;
  scoreB?: number;
  statut: string;
  notes?: string;
}

function normalizeText(value: unknown): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeStatutForUi(value: unknown): string {
  const normalized = normalizeText(value);
  if (normalized.includes('cours')) return 'En cours';
  if (normalized.includes('termin')) return 'Terminé';
  if (normalized.includes('annul')) return 'Annulé';
  if (normalized.includes('programm')) return 'Programmé';
  return String(value || 'Programmé');
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function mapRowToMatch(row: any): MatchData {
  return {
    id: row.id,
    idMatch: row.id_match || '',
    sport: row.sport || '',
    phase: row.phase || '',
    date: row.date || '',
    heureDebut: row.heure_debut || '',
    terrain: row.terrain || '',
    equipeA: row.equipe_a || 'À définir',
    equipeB: row.equipe_b || 'À définir',
    scoreA: row.score_a !== null && row.score_a !== undefined ? Number(row.score_a) : undefined,
    scoreB: row.score_b !== null && row.score_b !== undefined ? Number(row.score_b) : undefined,
    statut: normalizeStatutForUi(row.statut),
    notes: row.notes,
  };
}

async function resolveMatchRowId(matchId: string): Promise<string | null> {
  const trimmed = String(matchId || '').trim();
  if (!trimmed) return null;

  if (isUUID(trimmed)) return trimmed;

  const { data } = await supabase
    .from('orga_matchs')
    .select('id')
    .eq('id_match', trimmed)
    .single();

  return data?.id || null;
}

export async function getAllMatchs(): Promise<MatchData[]> {
  const { data, error } = await supabase.from('orga_matchs').select('*');
  if (error) { console.error('Erreur récupération matchs:', error); return []; }
  return (data || []).map(mapRowToMatch);
}

export async function getMatchsBySport(sport: string): Promise<MatchData[]> {
  const { data, error } = await supabase.from('orga_matchs').select('*').eq('sport', sport);
  if (error) { console.error('Erreur récupération matchs par sport:', error); return []; }
  return (data || []).map(mapRowToMatch);
}

export async function getMatchsByDate(date: string): Promise<MatchData[]> {
  const { data, error } = await supabase.from('orga_matchs').select('*').eq('date', date);
  if (error) { console.error('Erreur récupération matchs par date:', error); return []; }
  return (data || []).map(mapRowToMatch);
}

export async function updateMatchScore(
  matchId: string,
  scoreA?: number,
  scoreB?: number,
  statut: string = 'Terminé'
): Promise<{ success: boolean; error?: string }> {
  try {
    const rowId = await resolveMatchRowId(matchId);
    if (!rowId) return { success: false, error: `Match introuvable (${matchId})` };

    const payload: Record<string, unknown> = { statut };
    if (scoreA !== undefined && scoreB !== undefined) {
      payload.score_a = scoreA;
      payload.score_b = scoreB;
    }

    const { error } = await supabase.from('orga_matchs').update(payload).eq('id', rowId);
    if (error) return { success: false, error: error.message };

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mise à jour impossible';
    return { success: false, error: message };
  }
}
