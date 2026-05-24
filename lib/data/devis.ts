import { base, TABLES } from '../airtable';

export type DevisStatut = 'Envoyé' | 'Refus' | 'En attente' | 'Accord mutuel';

export interface AttachmentFile {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
}

export interface DevisData {
  id: string;
  titre: string;
  montant: number;
  assigne?: string;
  statut: DevisStatut;
  dateReception?: string;
  notes?: string;
  piecesJointes?: AttachmentFile[];
}

export interface DevisCreateInput {
  titre: string;
  montant: number;
  assigne: string;
  statut?: DevisStatut;
  dateReception?: string;
  notes?: string;
  pieceJointeUrls?: string[];
}

function mapAttachments(value: unknown): AttachmentFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((attachment: any) => ({
    id: attachment.id,
    url: attachment.url,
    filename: attachment.filename,
    size: attachment.size,
    type: attachment.type,
  }));
}

function mapRecord(record: any): DevisData {
  return {
    id: record.id,
    titre: record.fields['Titre'] || '',
    montant: record.fields['Montant'] || 0,
    assigne: record.fields['Assigné'],
    statut: record.fields['Statut'] || 'En attente',
    dateReception: record.fields['Date réception'],
    notes: record.fields['Notes'],
    piecesJointes: mapAttachments(record.fields['Pièces jointes']),
  };
}

export async function getAllDevis(): Promise<DevisData[]> {
  try {
    const records = await base(TABLES.DEVIS).select().all();
    return records.map(mapRecord);
  } catch (error) {
    console.error('Erreur récupération devis:', error);
    return [];
  }
}

export async function getDevisById(id: string): Promise<DevisData | null> {
  try {
    const record = await base(TABLES.DEVIS).find(id);
    return mapRecord(record);
  } catch (error) {
    console.error('Erreur récupération devis:', error);
    return null;
  }
}

export async function getDevisByStatut(statut: DevisStatut | string): Promise<DevisData[]> {
  try {
    const allDevis = await getAllDevis();
    return allDevis.filter((d) => d.statut === statut);
  } catch (error) {
    console.error('Erreur filtrage devis:', error);
    return [];
  }
}

export async function getDevisByAssigne(assigne: string): Promise<DevisData[]> {
  try {
    const normalized = String(assigne || '').trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    const allDevis = await getAllDevis();
    return allDevis.filter((devis) => String(devis.assigne || '').trim().toLowerCase() === normalized);
  } catch (error) {
    console.error('Erreur filtrage devis par personne:', error);
    return [];
  }
}

export async function createDevis(input: DevisCreateInput): Promise<DevisData | null> {
  try {
    const payload: any = {
      Titre: input.titre,
      Montant: input.montant,
      'Assigné': input.assigne,
      Statut: input.statut || 'En attente',
      'Date réception': input.dateReception || new Date().toISOString().slice(0, 10),
      Notes: input.notes || '',
      ...(input.pieceJointeUrls && input.pieceJointeUrls.length > 0
        ? {
            'Pièces jointes': input.pieceJointeUrls.map((url) => ({ url })),
          }
        : {}),
    };

    const created = await base(TABLES.DEVIS).create(payload);

    return mapRecord(created as any);
  } catch (error) {
    console.error('Erreur création devis:', error);
    return null;
  }
}

export async function getTotalDevis(): Promise<number> {
  try {
    const allDevis = await getAllDevis();
    return allDevis.reduce((total, devis) => total + devis.montant, 0);
  } catch (error) {
    console.error('Erreur calcul total devis:', error);
    return 0;
  }
}

export async function updateDevisStatut(id: string, newStatut: DevisStatut | string): Promise<void> {
  try {
    await base(TABLES.DEVIS).update(id, {
      Statut: newStatut,
    });
  } catch (error) {
    console.error('Erreur mise à jour statut devis:', error);
  }
}
