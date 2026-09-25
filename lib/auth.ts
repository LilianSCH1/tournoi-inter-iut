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

export type JoueurAuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: 'not_found' | 'pending' | 'refused' };

// La candidature d'une équipe doit être validée par un admin avant que ses
// joueurs puissent se connecter — voir lib/data/equipes.ts#updateEquipeValidation.
export async function authenticateJoueur(codeEquipe: string): Promise<JoueurAuthResult> {
  try {
    const equipe = await getEquipeByCode(codeEquipe.toUpperCase());

    if (!equipe) {
      return { ok: false, reason: 'not_found' };
    }
    if (equipe.statutValidation === 'Refusée') {
      return { ok: false, reason: 'refused' };
    }
    if (equipe.statutValidation !== 'Validée') {
      return { ok: false, reason: 'pending' };
    }

    return {
      ok: true,
      user: {
        role: 'joueur',
        equipeId: equipe.id,
        equipeName: equipe.nom,
      },
    };
  } catch (error) {
    console.error('Erreur auth joueur:', error);
    return { ok: false, reason: 'not_found' };
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
  // Nécessite STAFF_DEFAULT_PASSWORD (pas de valeur par défaut codée en dur :
  // sans cette variable d'env, ce mode de provisioning est simplement désactivé).
  const staffDefaultPassword = process.env.STAFF_DEFAULT_PASSWORD || process.env.BENEVOLE_DEFAULT_PASSWORD;
  if (staffDefaultPassword) {
    const staff = await getStaffByEmail(email);
    if (staff && password === staffDefaultPassword) {
      return {
        email,
        role: 'admin',
      };
    }
  }

  return null;
}
