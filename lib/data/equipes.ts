import { supabase } from '../supabase';
import { getParticipantsByEquipe, updateParticipantEquipe, updateParticipantType } from './participants';

export type StatutValidation = 'En attente' | 'Validée' | 'Refusée';

export interface EquipeData {
  id: string;
  nom: string;
  iut: string;
  pouleAssignee?: string;
  statutInscription: string;
  statutValidation: StatutValidation;
  documentsValides: boolean;
  motifRefus?: string;
  codeEquipe?: string;
  joueurs?: any[];
}

export interface EquipeCreateInput {
  nom: string;
  iut: string;
  capitaineNom: string;
  capitaineEmail: string;
  capitaineTelephone: string;
  nombreJoueurs: number;
}

function mapRowToEquipe(row: any): EquipeData {
  return {
    id: row.id,
    nom: row.nom_equipe || '',
    iut: row.iut || '',
    pouleAssignee: row.poule_assignee,
    statutInscription: row.statut_inscription || 'Incomplète',
    statutValidation: (row.statut_validation || 'En attente') as StatutValidation,
    documentsValides: row.documents_valides || false,
    motifRefus: row.motif_refus || undefined,
    codeEquipe: row.code_equipe,
  };
}

export async function getAllEquipes(): Promise<EquipeData[]> {
  const { data, error } = await supabase.from('liste_equipes').select('*');
  if (error) { console.error('Erreur récupération équipes:', error); return []; }
  return (data || []).map(mapRowToEquipe);
}

export async function getEquipeByCode(code: string): Promise<EquipeData | null> {
  const { data, error } = await supabase
    .from('liste_equipes')
    .select('*')
    .eq('code_equipe', code)
    .single();
  if (error || !data) return null;
  return mapRowToEquipe(data);
}

export async function getEquipeById(id: string): Promise<EquipeData | null> {
  const { data, error } = await supabase
    .from('liste_equipes')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapRowToEquipe(data);
}

export async function getEquipeByNomEtIut(nom: string, iut?: string): Promise<EquipeData | null> {
  const all = await getAllEquipes();
  const normalizedNom = String(nom || '').trim().toLowerCase();
  const normalizedIut = String(iut || '').trim().toLowerCase();

  if (!normalizedNom) return null;

  const withSameName = all.filter(t => t.nom.trim().toLowerCase() === normalizedNom);
  if (!withSameName.length) return null;
  if (!normalizedIut) return withSameName[0];

  return withSameName.find(t => t.iut.trim().toLowerCase() === normalizedIut) || withSameName[0];
}

function slugifyForCode(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 20);
}

async function generateUniqueCodeEquipe(iut: string, nom: string): Promise<string> {
  const base = `${slugifyForCode(iut)}-${slugifyForCode(nom)}-2027`;
  let candidate = base;
  let attempt = 0;
  while (await getEquipeByCode(candidate)) {
    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
  return candidate;
}

export async function createEquipe(input: EquipeCreateInput): Promise<EquipeData | null> {
  const codeEquipe = await generateUniqueCodeEquipe(input.iut, input.nom);

  const { data, error } = await supabase
    .from('liste_equipes')
    .insert({
      nom_equipe: input.nom,
      iut: input.iut,
      statut_inscription: 'Validée',
      statut_validation: 'En attente',
      code_equipe: codeEquipe,
      capitaine_nom: input.capitaineNom,
      capitaine_email: input.capitaineEmail,
      capitaine_telephone: input.capitaineTelephone,
      nombre_joueurs: input.nombreJoueurs,
    })
    .select()
    .single();

  if (error || !data) { console.error('Erreur création équipe:', error); return null; }
  return mapRowToEquipe(data);
}

export async function updateEquipePoule(id: string, pouleAssignee: string): Promise<boolean> {
  const { error } = await supabase
    .from('liste_equipes')
    .update({ poule_assignee: pouleAssignee || null })
    .eq('id', id);
  if (error) { console.error('Erreur affectation poule:', error); return false; }
  return true;
}

export async function updateEquipeValidation(
  id: string,
  fields: { statutValidation: StatutValidation; documentsValides?: boolean; motifRefus?: string }
): Promise<boolean> {
  const payload: Record<string, unknown> = { statut_validation: fields.statutValidation };
  if (fields.documentsValides !== undefined) payload.documents_valides = fields.documentsValides;
  if (fields.statutValidation === 'Refusée') {
    payload.motif_refus = fields.motifRefus || 'Non précisé';
  } else if (fields.motifRefus !== undefined) {
    payload.motif_refus = fields.motifRefus || null;
  }

  const { error } = await supabase.from('liste_equipes').update(payload).eq('id', id);
  if (error) { console.error('Erreur validation équipe:', error); return false; }

  if (fields.statutValidation === 'Refusée') {
    // Une candidature refusée libère le roster : les 10 joueurs promus
    // redeviennent des spectateurs disponibles pour une autre équipe.
    const joueurs = await getParticipantsByEquipe(id);
    await Promise.all(
      joueurs.map(async (joueur) => {
        await updateParticipantType(joueur.id, 'Spectateur');
        await updateParticipantEquipe(joueur.id, []);
      })
    );
  }

  return true;
}
