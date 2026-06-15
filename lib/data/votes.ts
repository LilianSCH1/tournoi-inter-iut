import { supabase } from '../supabase';

export interface VoteMVPData {
  id: string;
  sport: 'Basket' | 'Volley' | 'Futsal' | 'Handball' | 'Fair-Play';
  joueurNomine: string;
  equipe: string;
  nombreVotes: number;
  position: number;
  emailVotants?: string;
}

function mapRowToVote(row: any): VoteMVPData {
  return {
    id: row.id,
    sport: row.sport || 'Basket',
    joueurNomine: row.joueur_nomine || '',
    equipe: row.equipe || '',
    nombreVotes: row.nombre_votes || 0,
    position: row.position || 0,
    emailVotants: row.email_votants || '',
  };
}

export async function getAllVotesMVP(): Promise<VoteMVPData[]> {
  const { data, error } = await supabase.from('votes_mvp').select('*');
  if (error) { console.error('Erreur récupération votes MVP:', error); return []; }
  return (data || []).map(mapRowToVote);
}

export async function getVotesBySport(sport: string): Promise<VoteMVPData[]> {
  const { data, error } = await supabase
    .from('votes_mvp')
    .select('*')
    .eq('sport', sport)
    .order('nombre_votes', { ascending: false });
  if (error) { console.error('Erreur récupération votes par sport:', error); return []; }
  return (data || []).map(mapRowToVote);
}

export async function ajouterVote(sport: string, joueurNomine: string, emailVotant: string): Promise<boolean> {
  const { data: votes, error } = await supabase
    .from('votes_mvp')
    .select('*')
    .eq('sport', sport)
    .eq('joueur_nomine', joueurNomine)
    .single();

  if (error || !votes) return false;

  const emailsList = votes.email_votants ? votes.email_votants.split(',').filter(Boolean) : [];
  if (emailsList.includes(emailVotant)) return false;

  emailsList.push(emailVotant);
  const { error: updateError } = await supabase
    .from('votes_mvp')
    .update({
      nombre_votes: (votes.nombre_votes || 0) + 1,
      email_votants: emailsList.join(','),
    })
    .eq('id', votes.id);

  if (updateError) { console.error('Erreur ajout vote:', updateError); return false; }
  return true;
}

export async function aDejaVote(email: string, sport: string): Promise<boolean> {
  const votes = await getVotesBySport(sport);
  return votes.some(v => v.emailVotants && v.emailVotants.split(',').includes(email));
}
