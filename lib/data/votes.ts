import { airtable, TABLES } from '../airtable';

export interface VoteMVPData {
  id: string;
  sport: 'Basket' | 'Volley' | 'Futsal' | 'Handball' | 'Fair-Play';
  joueurNomine: string;
  equipe: string;
  nombreVotes: number;
  position: number;
  emailVotants?: string;
}

export async function getAllVotesMVP(): Promise<VoteMVPData[]> {
  try {
    const records = await airtable.getAll(TABLES.VOTES_MVP);
    
    return records.map((record: any) => ({
      id: record.id,
      sport: record.fields.Sport || 'Basket',
      joueurNomine: record.fields['Joueur nominé'] || '',
      equipe: record.fields.Équipe || '',
      nombreVotes: record.fields['Nombre votes'] || 0,
      position: record.fields.Position || 0,
      emailVotants: record.fields['Email votants'],
    }));
  } catch (error) {
    console.error('Erreur récupération votes MVP:', error);
    return [];
  }
}

export async function getVotesBySport(sport: string): Promise<VoteMVPData[]> {
  const all = await getAllVotesMVP();
  return all.filter(v => v.sport === sport).sort((a, b) => b.nombreVotes - a.nombreVotes);
}

export async function ajouterVote(
  sport: string,
  joueurNomine: string,
  emailVotant: string
): Promise<boolean> {
  try {
    // Récupérer tous les votes pour ce joueur
    const votes = await getAllVotesMVP();
    const vote = votes.find(v => v.sport === sport && v.joueurNomine === joueurNomine);

    if (vote) {
      // Vérifier si l'email a déjà voté
      const emailsList = vote.emailVotants ? vote.emailVotants.split(',') : [];
      if (emailsList.includes(emailVotant)) {
        console.log('Déjà voté');
        return false;
      }

      // Ajouter le vote
      emailsList.push(emailVotant);
      await airtable.update(TABLES.VOTES_MVP, vote.id, {
        'Nombre votes': vote.nombreVotes + 1,
        'Email votants': emailsList.join(','),
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erreur ajout vote:', error);
    return false;
  }
}

export async function aDejaVote(email: string, sport: string): Promise<boolean> {
  const votes = await getVotesBySport(sport);
  return votes.some(v => v.emailVotants && v.emailVotants.includes(email));
}
