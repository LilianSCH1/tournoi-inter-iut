// lib/airtable.ts
import Airtable from 'airtable';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;

// Configuration Airtable
export const base = new Airtable({ apiKey: AIRTABLE_TOKEN }).base(AIRTABLE_BASE_ID);

// Noms des tables (selon votre base Airtable)
export const TABLES = {
  IUT_DELEGATIONS: 'Liste_IUT',
  EQUIPES: 'Liste_Equipes',
  PARTICIPANTS: 'Liste_Participants',
  MATCHS: 'Orga_Matchs',
  RESULTATS: 'Résultats_Direct',
  REPAS: 'Logi_Repas',
  TRANSPORTS: 'Logi_Transports',
  HEBERGEMENT: 'Logi_Hébergement',
  BUDGET: 'Logi_Budget',
  TACHES: 'ToDo_List',
  COMMUNICATION: 'Comm_Sponsors',
  SECURITE: 'Sécurité_Incidents',
  // Nouvelles tables
  CANDIDATURES: 'Candidatures',
  OBJETS_PERDUS: 'Objets_Perdus_Trouves',
  INCIDENTS: 'Incidents_Urgences',
  VOTES_MVP: 'Votes_MVP',
  PHOTOS: 'Photos_Galerie',
  NOTIFICATIONS: 'Notifications',
  DEVIS: 'Devis_Pièces_Jointes',
} as const;

// Types pour les enregistrements
export interface Participant {
  id: string;
  fields: {
    'Nom complet': string;
    IUT: string[];
    Équipe?: string[];
    Type: 'Joueur' | 'Spectateur' | 'Bénévole' | 'Staff';
    Email: string;
    Téléphone?: string;
    'Allergies alimentaires'?: string;
    'Taille maillot'?: string;
    'Licence sportive'?: string;
    'Licence validée'?: boolean;
    Transport?: string;
    Hébergement?: boolean;
    'Arrivée confirmée'?: boolean;
    'Départ confirmé'?: boolean;
  };
}

export interface Match {
  id: string;
  fields: {
    'ID Match': string;
    Sport: 'Basket' | 'Volley' | 'Futsal' | 'Handball';
    Phase: 'Poules' | 'Demi-finale' | 'Petite finale' | 'Finale';
    Date: string;
    'Heure debut': string;
    Terrain: string;
    'Equipe A': string[];
    'Equipe B': string[];
    'Score A'?: number;
    'Score B'?: number;
    Statut: 'Programmé' | 'En cours' | 'Terminé';
    Notes?: string;
  };
}

export interface Equipe {
  id: string;
  fields: {
    'Nom équipe': string;
    IUT: string[];
    'Numéro équipe': number;
    'Sports pratiqués': string[];
    'Poule assignée'?: string;
    'Statut inscription': 'Complète' | 'Incomplète' | 'Validée';
    'Tailles maillots demandées'?: string;
    'Allergies alimentaires'?: string;
  };
}

export interface Incident {
  id: string;
  fields: {
    'Date/Heure': string;
    'Type incident': string;
    Gravité: '🟢 Mineur' | '🟡 Modéré' | '🔴 Grave';
    Lieu?: string;
    'Personne concernée'?: string[];
    Description: string;
    'Action prise'?: string;
    Intervenant?: string;
    Statut: 'En cours' | 'Résolu' | 'Suivi nécessaire';
    'Rapport rédigé'?: boolean;
    'Mot d\'urgence utilisé'?: boolean;
  };
}

// Fonctions utilitaires pour interagir avec Airtable
export const airtable = {
  // Récupérer tous les enregistrements d'une table
  async getAll<T = any>(tableName: string): Promise<T[]> {
    const records: T[] = [];
    await base(tableName)
      .select()
      .eachPage((pageRecords, fetchNextPage) => {
        records.push(...(pageRecords as any));
        fetchNextPage();
      });
    return records;
  },

  // Récupérer un enregistrement par ID
  async getById<T = any>(tableName: string, recordId: string): Promise<T> {
    return (await base(tableName).find(recordId)) as T;
  },

  // Créer un nouvel enregistrement
  async create<T = any>(tableName: string, fields: any): Promise<T> {
    return (await base(tableName).create([{ fields }], { typecast: true }))[0] as T;
  },

  // Mettre à jour un enregistrement
  async update<T = any>(tableName: string, recordId: string, fields: any): Promise<T> {
    return (await base(tableName).update(recordId, fields)) as T;
  },

  // Supprimer un enregistrement
  async delete(tableName: string, recordId: string): Promise<void> {
    await base(tableName).destroy(recordId);
  },

  // Rechercher avec un filtre
  async search<T = any>(
    tableName: string,
    filterFormula: string
  ): Promise<T[]> {
    const records: T[] = [];
    await base(tableName)
      .select({ filterByFormula: filterFormula })
      .eachPage((pageRecords, fetchNextPage) => {
        records.push(...(pageRecords as any));
        fetchNextPage();
      });
    return records;
  },
};

export default base;
