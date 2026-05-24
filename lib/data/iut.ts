// lib/data/iut.ts
import { airtable, TABLES } from '../airtable';

export interface IUTData {
  id: string;
  nom: string;
  ville: string;
  referent: string;
  emailReferent: string;
  telephoneReferent: string;
  statutParticipation: string;
  nombreEquipes: number;
  nombreParticipants: number;
  budgetPaye: boolean;
  montantDu: number;
  notes?: string;
}

export async function getAllIUT(): Promise<IUTData[]> {
  try {
    const records = await airtable.getAll(TABLES.IUT_DELEGATIONS);
    
    return records.map((record: any) => ({
      id: record.id,
      nom: record.fields['Nom IUT'] || '',
      ville: record.fields.Ville || '',
      referent: record.fields['Référent IUT'] || '',
      emailReferent: record.fields['Email référent'] || '',
      telephoneReferent: record.fields['Téléphone référent'] || '',
      statutParticipation: record.fields['Statut participation'] || 'À confirmer',
      nombreEquipes: record.fields['Nombre total participants'] || 0,
      nombreParticipants: record.fields['Nombre total participants'] || 0,
      budgetPaye: record.fields['Budget payé'] || false,
      montantDu: 0,
      notes: record.fields.Notes,
    }));
  } catch (error) {
    console.error('Erreur récupération IUT:', error);
    return [];
  }
}

export async function getIUTConfirmes(): Promise<IUTData[]> {
  try {
    const records = await airtable.search(
      TABLES.IUT_DELEGATIONS,
      `{Statut participation} = "Confirmé"`
    );
    
    return records.map((record: any) => ({
      id: record.id,
      nom: record.fields['Nom IUT'] || '',
      ville: record.fields.Ville || '',
      referent: record.fields.Référent || '',
      emailReferent: record.fields['Email référent'] || '',
      telephoneReferent: record.fields['Téléphone référent'] || '',
      statutParticipation: record.fields['Statut participation'] || 'À confirmer',
      nombreEquipes: record.fields['Nombre équipes'] || 0,
      nombreParticipants: record.fields['Nombre participants'] || 0,
      budgetPaye: record.fields['Budget payé'] || false,
      montantDu: record.fields['Montant dû (€)'] || 0,
      notes: record.fields.Notes,
    }));
  } catch (error) {
    console.error('Erreur récupération IUT confirmés:', error);
    return [];
  }
}
