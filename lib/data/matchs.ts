// lib/data/matchs.ts
import { airtable, TABLES } from '../airtable';

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
    .replace(/[\u0300-\u036f]/g, '')
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

function mapRecordToMatch(record: any): MatchData {
  const rawScoreA = record.fields['Score A'];
  const rawScoreB = record.fields['Score B'];

  const resolvedScoreA = rawScoreA !== undefined && rawScoreA !== null ? Number(rawScoreA) : undefined;
  const resolvedScoreB = rawScoreB !== undefined && rawScoreB !== null ? Number(rawScoreB) : undefined;

  return {
    id: record.id,
    idMatch: record.fields['ID Match'] || '',
    sport: record.fields.Sport || '',
    phase: record.fields.Phase || '',
    date: record.fields.Date || '',
    heureDebut: record.fields['Heure debut'] || '',
    terrain: record.fields.Terrain || '',
    equipeA: Array.isArray(record.fields['Equipe A'])
      ? record.fields['Equipe A'][0]
      : record.fields['Equipe A'] || 'À définir',
    equipeB: Array.isArray(record.fields['Equipe B'])
      ? record.fields['Equipe B'][0]
      : record.fields['Equipe B'] || 'À définir',
    scoreA: Number.isFinite(resolvedScoreA) ? resolvedScoreA : undefined,
    scoreB: Number.isFinite(resolvedScoreB) ? resolvedScoreB : undefined,
    statut: normalizeStatutForUi(record.fields.Statut),
    notes: record.fields.Notes,
  };
}

async function resolveMatchRecordId(matchId: string): Promise<string | null> {
  const trimmed = String(matchId || '').trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('rec')) return trimmed;

  const escaped = trimmed.replace(/"/g, '\\"');
  const records = await airtable.search(TABLES.MATCHS, `{ID Match} = "${escaped}"`);
  if (!records.length) return null;

  return (records[0] as any).id;
}

function getStatusCandidates(statut: string): string[] {
  const input = normalizeText(statut);

  if (input.includes('cours')) return ['En cours'];
  if (input.includes('termin')) return ['Terminé', 'Termine'];
  if (input.includes('annul')) return ['Annulé', 'Annule'];
  if (input.includes('programm')) return ['Programmé', 'Programme'];

  return [statut];
}

function stripScoreTagFromNotes(value: unknown): string {
  return String(value || '').replace(/\s*\[score\]\s*\d+\s*-\s*\d+/gi, '').trim();
}

export async function getAllMatchs(): Promise<MatchData[]> {
  try {
    const records = await airtable.getAll(TABLES.MATCHS);

    return records.map((record: any) => mapRecordToMatch(record));
  } catch (error) {
    console.error('Erreur récupération matchs:', error);
    return [];
  }
}

export async function getMatchsBySport(sport: string): Promise<MatchData[]> {
  try {
    const records = await airtable.search(
      TABLES.MATCHS,
      `{Sport} = "${sport}"`
    );
    
    return records.map((record: any) => mapRecordToMatch(record));
  } catch (error) {
    console.error('Erreur récupération matchs par sport:', error);
    return [];
  }
}

export async function getMatchsByDate(date: string): Promise<MatchData[]> {
  try {
    const records = await airtable.search(
      TABLES.MATCHS,
      `{Date} = "${date}"`
    );
    
    return records.map((record: any) => mapRecordToMatch(record));
  } catch (error) {
    console.error('Erreur récupération matchs par date:', error);
    return [];
  }
}

export async function updateMatchScore(
  matchId: string,
  scoreA?: number,
  scoreB?: number,
  statut: string = 'Terminé'
): Promise<{ success: boolean; error?: string }> {
  try {
    const recordId = await resolveMatchRecordId(matchId);
    if (!recordId) {
      console.error('Match introuvable pour update:', matchId);
      return { success: false, error: `Match introuvable (${matchId})` };
    }

    const statusCandidates = getStatusCandidates(statut);
    const scorePayloadCandidates: Array<Record<string, unknown>> =
      scoreA !== undefined && scoreB !== undefined
        ? [
            { 'Score A': scoreA, 'Score B': scoreB },
            { 'Score A': String(scoreA), 'Score B': String(scoreB) },
          ]
        : [{}];

    const candidateErrors: string[] = [];

    for (const statusCandidate of statusCandidates) {
      for (const scorePayload of scorePayloadCandidates) {
        try {
          const payload: Record<string, unknown> = {
            ...scorePayload,
            Statut: statusCandidate,
          };

          if (scoreA !== undefined && scoreB !== undefined) {
            const existing = await airtable.getById(TABLES.MATCHS, recordId) as any;
            const cleanedNotes = stripScoreTagFromNotes(existing?.fields?.Notes);
            if (String(existing?.fields?.Notes || '') !== cleanedNotes) {
              payload.Notes = cleanedNotes || null;
            }
          }

          await airtable.update(TABLES.MATCHS, recordId, {
            ...payload,
          });
          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : JSON.stringify(error);
          const scoreMode = scorePayload['Score A'] !== undefined ? typeof scorePayload['Score A'] : 'none';
          candidateErrors.push(`${statusCandidate} (score:${scoreMode}) -> ${message}`);
        }
      }
    }

    return {
      success: false,
      error: `Impossible d'écrire Score A/Score B. Détails: ${candidateErrors.join(' | ')}`,
    };
  } catch (error) {
    console.error('Erreur mise à jour score:', error);
    const message = error instanceof Error ? error.message : 'Mise à jour Airtable impossible';
    return { success: false, error: message };
  }
}
