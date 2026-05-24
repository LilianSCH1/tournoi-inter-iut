// lib/auth.ts
import { getEquipeByCode } from './data/equipes';
import { getBenevoleByEmail } from './data/participants';
import { getStaffByEmail } from './data/participants';

export type UserRole = 'joueur' | 'benevole' | 'admin';

export interface AuthUser {
  email?: string;
  role: UserRole;
  equipeId?: string;
  equipeName?: string;
  nomComplet?: string;
}

// ========================================
// AUTHENTIFICATION JOUEUR (Code équipe)
// ========================================

export async function authenticateJoueur(codeEquipe: string): Promise<AuthUser | null> {
  try {
    const equipe = await getEquipeByCode(codeEquipe.toUpperCase());
    
    if (!equipe) {
      return null;
    }
    
    return {
      role: 'joueur',
      equipeId: equipe.id,
      equipeName: equipe.nom,
    };
  } catch (error) {
    console.error('Erreur auth joueur:', error);
    return null;
  }
}

// ========================================
// AUTHENTIFICATION BÉNÉVOLE
// ========================================

export async function authenticateBenevole(email: string, password: string): Promise<AuthUser | null> {
  const benevole = await getBenevoleByEmail(email);

  if (benevole?.benevolePassword && password === benevole.benevolePassword) {
    return {
      email,
      nomComplet: benevole.nomComplet,
      role: 'benevole',
    };
  }

  const credentials = process.env.BENEVOLES_CREDENTIALS || '';
  const benevolesList = credentials.split('|').filter(Boolean);

  for (const cred of benevolesList) {
    const [credEmail, credPassword] = cred.split(':');
    if (credEmail === email && credPassword === password) {
      return {
        email,
        nomComplet: benevole?.nomComplet,
        role: 'benevole',
      };
    }
  }
  
  return null;
}

// ========================================
// AUTHENTIFICATION ADMIN
// ========================================

export async function authenticateAdmin(email: string, password: string): Promise<AuthUser | null> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Admin principal
  if (email === adminEmail && password === adminPassword) {
    return {
      email,
      role: 'admin',
    };
  }
  
  // Admin secondaire (optionnel)
  const admin2Email = process.env.ADMIN_2_EMAIL;
  const admin2Password = process.env.ADMIN_2_PASSWORD;
  
  if (admin2Email && admin2Password && email === admin2Email && password === admin2Password) {
    return {
      email,
      role: 'admin',
    };
  }

  // Provisioning automatique Staff -> accès admin
  const staff = await getStaffByEmail(email);
  const staffDefaultPassword = process.env.STAFF_DEFAULT_PASSWORD || process.env.BENEVOLE_DEFAULT_PASSWORD || 'Benevole2027!';

  if (staff && password === staffDefaultPassword) {
    return {
      email,
      role: 'admin',
    };
  }
  
  return null;
}

// ========================================
// GÉNÉRATION DE SESSION TOKEN
// ========================================

export function generateSessionToken(user: AuthUser): string {
  // En production, utilisez un vrai JWT
  // Pour l'instant, simple encodage Base64
  return Buffer.from(JSON.stringify(user)).toString('base64');
}

export function decodeSessionToken(token: string): AuthUser | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
