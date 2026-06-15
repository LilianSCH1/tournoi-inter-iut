import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const TABLES = {
  IUT_DELEGATIONS: 'liste_iut',
  EQUIPES: 'liste_equipes',
  PARTICIPANTS: 'liste_participants',
  MATCHS: 'orga_matchs',
  BUDGET: 'logi_budget',
  TACHES: 'todo_list',
  INCIDENTS: 'incidents_urgences',
  OBJETS_PERDUS: 'objets_perdus_trouves',
  VOTES_MVP: 'votes_mvp',
  DEVIS: 'devis_pieces_jointes',
} as const;
