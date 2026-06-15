import { supabase } from '../supabase';

export interface EquipeData {
  id: string;
  nom: string;
  iut: string;
  numeroEquipe: number;
  sportsPratiques: string[];
  pouleAssignee?: string;
  statutInscription: string;
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
    numeroEquipe: row.numero_equipe || 0,
    sportsPratiques: row.sports_pratiques || [],
    pouleAssignee: row.poule_assignee,
    statutInscription: row.statut_inscription || 'Incomplète',
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

export async function createEquipe(input: EquipeCreateInput): Promise<EquipeData | null> {
  const { data, error } = await supabase
    .from('liste_equipes')
    .insert({
      nom_equipe: input.nom,
      iut: input.iut,
      statut_inscription: 'Validée',
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
