// lib/data/participants.ts
import { randomBytes } from 'crypto';
import { airtable, TABLES } from '../airtable';

export type StatutArrivee = 'present' | 'absent' | 'en_attente';
const BENEVOLE_PASSWORD_FIELD = 'Mot de passe bénévole';

export interface ParticipantData {
  id: string;
  nomComplet: string;
  iut: string;
  equipe?: string;
  equipeIds: string[];
  type: 'Joueur' | 'Spectateur' | 'Bénévole' | 'Staff';
  email: string;
  telephone?: string;
  allergiesAlimentaires?: string;
  tailleMaillot?: string;
  licenceSportive?: string;
  licenceValidee: boolean;
  transport?: string;
  hebergement: boolean;
  arriveeConfirmee: boolean;
  statutArrivee: StatutArrivee;
  departConfirme: boolean;
  benevolePassword?: string;
}

function normalizeArrivalStatus(fields: any): StatutArrivee {
  const arrivalRaw = String(fields['Arrivée confirmée'] || '').toLowerCase();

  if (arrivalRaw === 'oui') return 'present';
  if (arrivalRaw === 'non') return 'absent';
  return 'en_attente';
}

function parseArriveeConfirmee(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === 'string') return value.toLowerCase() === 'oui';
  return false;
}

function parseOuiNon(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === 'string') return value.toLowerCase() === 'oui';
  return false;
}

function generateBenevolePassword(length: number = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(length);
  let password = '';

  for (let index = 0; index < length; index += 1) {
    password += alphabet[bytes[index] % alphabet.length];
  }

  return password;
}

function mapParticipantRecord(record: any): ParticipantData {
  return {
    id: record.id,
    nomComplet: record.fields['Nom complet'] || '',
    iut: Array.isArray(record.fields.IUT) ? record.fields.IUT[0] : record.fields.IUT || '',
    equipe: Array.isArray(record.fields.Équipe) ? record.fields.Équipe[0] : record.fields.Équipe,
    equipeIds: Array.isArray(record.fields.Équipe) ? record.fields.Équipe : (record.fields.Équipe ? [record.fields.Équipe] : []),
    type: record.fields.Type || 'Spectateur',
    email: record.fields.Email || '',
    telephone: record.fields.Téléphone,
    allergiesAlimentaires: record.fields['Allergies alimentaires'],
    tailleMaillot: record.fields['Taille maillot'],
    licenceSportive: record.fields['Licence sportive'],
    licenceValidee: record.fields['Licence validée'] || false,
    transport: record.fields.Transport,
    hebergement: parseOuiNon(record.fields.Hébergement),
    arriveeConfirmee: parseArriveeConfirmee(record.fields['Arrivée confirmée']),
    statutArrivee: normalizeArrivalStatus(record.fields),
    departConfirme: record.fields['Départ confirmé'] || false,
    benevolePassword: record.fields[BENEVOLE_PASSWORD_FIELD] || '',
  };
}

function normalizeOuiNon(value: unknown): 'Oui' | 'Non' {
  if (value === true) return 'Oui';
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'oui' || normalized === 'true' || normalized === '1') return 'Oui';
  }
  return 'Non';
}

export async function getAllParticipants(): Promise<ParticipantData[]> {
  try {
    const records = await airtable.getAll(TABLES.PARTICIPANTS);
    
    return records.map(mapParticipantRecord);
  } catch (error) {
    console.error('Erreur récupération participants:', error);
    return [];
  }
}

export async function getParticipantsByEquipe(equipeId: string): Promise<ParticipantData[]> {
  try {
    const records = await airtable.search(
      TABLES.PARTICIPANTS,
      `FIND("${equipeId}", {Équipe})`
    );
    
    return records.map(mapParticipantRecord);
  } catch (error) {
    console.error('Erreur récupération participants par équipe:', error);
    return [];
  }
}

export async function updateParticipantCheckin(
  participantId: string,
  arrived: boolean = true
): Promise<boolean> {
  return updateParticipantArrivalStatus(participantId, arrived ? 'present' : 'en_attente');
}

export async function updateParticipantArrivalStatus(
  participantId: string,
  status: StatutArrivee
): Promise<boolean> {
  try {
    const arrivalValue = status === 'present' ? 'Oui' : status === 'absent' ? 'Non' : null;

    await airtable.update(TABLES.PARTICIPANTS, participantId, {
      'Arrivée confirmée': arrivalValue,
    });

    return true;
  } catch (error) {
    console.error('Erreur update statut arrivée:', error);
    return false;
  }
}

export async function updateParticipantEquipe(
  participantId: string,
  equipeIds: string[]
): Promise<boolean> {
  try {
    await airtable.update(TABLES.PARTICIPANTS, participantId, {
      'Équipe': equipeIds,
    });
    return true;
  } catch (error) {
    console.error('Erreur update équipe participant:', error);
    return false;
  }
}

export async function updateParticipantType(
  participantId: string,
  type: ParticipantData['type']
): Promise<boolean> {
  try {
    await airtable.update(TABLES.PARTICIPANTS, participantId, {
      Type: type,
    });
    return true;
  } catch (error) {
    console.error('Erreur update type participant:', error);
    return false;
  }
}

export async function getBenevoleByEmail(email: string): Promise<ParticipantData | null> {
  try {
    const normalized = email.replace(/"/g, '\\"');
    const records = await airtable.search(
      TABLES.PARTICIPANTS,
      `AND({Email} = "${normalized}", {Type} = "Bénévole")`
    );

    if (!records.length) return null;

    return mapParticipantRecord(records[0]);
  } catch (error) {
    console.error('Erreur recherche bénévole par email:', error);
    return null;
  }
}

export async function getStaffByEmail(email: string): Promise<ParticipantData | null> {
  try {
    const normalized = email.replace(/"/g, '\\"');
    const records = await airtable.search(
      TABLES.PARTICIPANTS,
      `AND({Email} = "${normalized}", {Type} = "Staff")`
    );

    if (!records.length) return null;

    return mapParticipantRecord(records[0]);
  } catch (error) {
    console.error('Erreur recherche staff par email:', error);
    return null;
  }
}

function mapRecordToParticipant(record: any): ParticipantData {
  return mapParticipantRecord(record);
}

export async function getParticipantByEmail(email: string): Promise<ParticipantData | null> {
  try {
    const normalized = email.replace(/"/g, '\\"');
    const records = await airtable.search(
      TABLES.PARTICIPANTS,
      `{Email} = "${normalized}"`
    );

    if (!records.length) return null;
    return mapRecordToParticipant(records[0]);
  } catch (error) {
    console.error('Erreur recherche participant par email:', error);
    return null;
  }
}

export async function getParticipantById(participantId: string): Promise<ParticipantData | null> {
  try {
    const record = await airtable.getById(TABLES.PARTICIPANTS, participantId);
    return mapRecordToParticipant(record);
  } catch (error) {
    console.error('Erreur recherche participant par id:', error);
    return null;
  }
}

export async function createParticipant(input: {
  nomComplet: string;
  email: string;
  iut: string;
  telephone?: string;
  type?: ParticipantData['type'];
  transport?: string;
  hebergement?: boolean;
  benevolePassword?: string;
}): Promise<string | null> {
  try {
    const nomComplet = String(input.nomComplet || '').trim();
    const email = String(input.email || '').trim();
    const iut = String(input.iut || '').trim();
    const benevolePassword = String(input.benevolePassword || '').trim() || (input.type === 'Bénévole' ? generateBenevolePassword() : '');

    const payload: any = {
      'Nom complet': nomComplet,
      Email: email,
      IUT: iut,
      Type: input.type || 'Spectateur',
      'Hébergement': normalizeOuiNon(input.hebergement),
    };

    if (input.telephone) payload['Téléphone'] = String(input.telephone).trim();
    if (input.transport) payload['Transport'] = normalizeOuiNon(input.transport);
    if (benevolePassword) payload[BENEVOLE_PASSWORD_FIELD] = benevolePassword;

    const record = await airtable.create(TABLES.PARTICIPANTS, payload) as any;
    return record?.id || null;
  } catch (error) {
    console.error('Erreur création participant:', error);
    return null;
  }
}
