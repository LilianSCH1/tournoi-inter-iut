// lib/data/equipes.ts
import { airtable, TABLES } from '../airtable';

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

export async function getAllEquipes(): Promise<EquipeData[]> {
  try {
    const records = await airtable.getAll(TABLES.EQUIPES);
    
    return records.map((record: any) => ({
      id: record.id,
      nom: record.fields['Nom équipe'] || '',
      iut: Array.isArray(record.fields.IUT) ? record.fields.IUT[0] : record.fields.IUT || '',
      numeroEquipe: record.fields['Numéro équipe'] || 0,
      sportsPratiques: record.fields['Sports pratiqués'] || [],
      pouleAssignee: record.fields['Poule assignée'],
      statutInscription: record.fields['Statut inscription'] || 'Incomplète',
      codeEquipe: record.fields['Code équipe'],
    }));
  } catch (error) {
    console.error('Erreur récupération équipes:', error);
    return [];
  }
}

export async function getEquipeByCode(code: string): Promise<EquipeData | null> {
  try {
    const records = await airtable.search(
      TABLES.EQUIPES,
      `{Code équipe} = "${code}"`
    );
    
    if (records.length === 0) return null;
    
    const record = records[0] as any;
    return {
      id: record.id,
      nom: record.fields['Nom équipe'] || '',
      iut: Array.isArray(record.fields.IUT) ? record.fields.IUT[0] : record.fields.IUT || '',
      numeroEquipe: record.fields['Numéro équipe'] || 0,
      sportsPratiques: record.fields['Sports pratiqués'] || [],
      pouleAssignee: record.fields['Poule assignée'],
      statutInscription: record.fields['Statut inscription'] || 'Incomplète',
      codeEquipe: record.fields['Code équipe'],
    };
  } catch (error) {
    console.error('Erreur recherche équipe par code:', error);
    return null;
  }
}

export async function getEquipeById(id: string): Promise<EquipeData | null> {
  try {
    const record = await airtable.getById(TABLES.EQUIPES, id) as any;
    
    return {
      id: record.id,
      nom: record.fields['Nom équipe'] || '',
      iut: Array.isArray(record.fields.IUT) ? record.fields.IUT[0] : record.fields.IUT || '',
      numeroEquipe: record.fields['Numéro équipe'] || 0,
      sportsPratiques: record.fields['Sports pratiqués'] || [],
      pouleAssignee: record.fields['Poule assignée'],
      statutInscription: record.fields['Statut inscription'] || 'Incomplète',
      codeEquipe: record.fields['Code équipe'],
    };
  } catch (error) {
    console.error('Erreur récupération équipe par ID:', error);
    return null;
  }
}

export async function getEquipeByNomEtIut(nom: string, iut?: string): Promise<EquipeData | null> {
  const all = await getAllEquipes();
  const normalizedNom = String(nom || '').trim().toLowerCase();
  const normalizedIut = String(iut || '').trim().toLowerCase();

  if (!normalizedNom) return null;

  const withSameName = all.filter((team) => team.nom.trim().toLowerCase() === normalizedNom);
  if (!withSameName.length) return null;

  if (!normalizedIut) return withSameName[0];

  return withSameName.find((team) => team.iut.trim().toLowerCase() === normalizedIut) || withSameName[0];
}

export async function createEquipe(input: EquipeCreateInput): Promise<EquipeData | null> {
  try {
    const record = await airtable.create(TABLES.EQUIPES, {
      'Nom équipe': input.nom,
      IUT: input.iut,
      'Statut inscription': 'Validée',
      'Capitaine nom': input.capitaineNom,
      'Capitaine email': input.capitaineEmail,
      'Capitaine téléphone': input.capitaineTelephone,
      'Nombre joueurs': input.nombreJoueurs,
    }) as any;

    return {
      id: record.id,
      nom: record.fields['Nom équipe'] || '',
      iut: Array.isArray(record.fields.IUT) ? record.fields.IUT[0] : record.fields.IUT || '',
      numeroEquipe: record.fields['Numéro équipe'] || 0,
      sportsPratiques: record.fields['Sports pratiqués'] || [],
      pouleAssignee: record.fields['Poule assignée'],
      statutInscription: record.fields['Statut inscription'] || 'Incomplète',
      codeEquipe: record.fields['Code équipe'],
    };
  } catch (error) {
    console.error('Erreur création équipe:', error);
    return null;
  }
}
