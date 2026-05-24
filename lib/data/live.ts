import { airtable, TABLES } from '../airtable';
import { getAllEquipes } from './equipes';
import { getAllIUT } from './iut';
import { getAllMatchs } from './matchs';
import { getAllDevis } from './devis';
import { getAllParticipants } from './participants';
import { getIncidentsEnCours } from './incidents';

export interface DashboardOverview {
  iutConfirmes: number;
  iutTotal: number;
  participantsInscrits: number;
  participantsTotal: number;
  budgetCollecte: number;
  budgetPrevu: number;
  tachesUrgentes: number;
  devisEnAttente: number;
  devisTotal: number;
}

export interface BudgetLine {
  id: string;
  poste: string;
  categorie: string;
  type: string;
  montantPrevu: number;
  montantReel: number;
  statutPaiement: string;
}

export interface BudgetCreateInput {
  poste: string;
  categorie: string;
  type: string;
  montantPrevu: number;
  montantReel: number;
  statutPaiement: string;
}

export interface TaskLine {
  id: string;
  tache: string;
  description: string;
  responsable: string;
  statut: string;
  priorite: string;
  deadline: string;
  categorie: string;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isRevenue(value: string): boolean {
  const normalized = String(value || '').toLowerCase();
  return normalized.includes('recette') || normalized.includes('revenu') || normalized.includes('income');
}

function isExpense(value: string): boolean {
  const normalized = String(value || '').toLowerCase();
  return normalized.includes('depense') || normalized.includes('dépense') || normalized.includes('expense') || normalized.includes('cout') || normalized.includes('coût');
}

function classifyBudgetLine(line: BudgetLine): 'revenu' | 'depense' | 'unknown' {
  const scope = `${line.type} ${line.categorie} ${line.poste}`;
  if (isRevenue(scope)) return 'revenu';
  if (isExpense(scope)) return 'depense';
  return 'unknown';
}

function isCriticalPriority(priority: string): boolean {
  const normalized = String(priority || '').toLowerCase();
  return normalized.includes('critique') || normalized.includes('urgent') || normalized.includes('haute');
}

function formatResponsable(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).join(', ');
  }

  return String(value || '').trim();
}

export async function getBudgetLines(): Promise<BudgetLine[]> {
  try {
    const records = await airtable.getAll(TABLES.BUDGET);

    return records.map((record: any) => ({
      id: record.id,
      poste: record.fields.Poste || 'Non renseigné',
      categorie: record.fields['Catégorie'] || 'Autre',
      type: record.fields.Type || 'Depense',
      montantPrevu: toNumber(record.fields['Montant prévu']),
      montantReel: toNumber(record.fields['Montant réel']),
      statutPaiement: record.fields['Statut paiement'] || 'Non renseigné',
    }));
  } catch (error) {
    console.error('Erreur récupération budget:', error);
    return [];
  }
}

export async function updateBudgetLine(
  id: string,
  fields: Partial<{
    poste: string;
    categorie: string;
    type: string;
    montantPrevu: number;
    montantReel: number;
    statutPaiement: string;
  }>
): Promise<boolean> {
  try {
    const payload: any = {};

    if (fields.poste !== undefined) payload.Poste = fields.poste;
    if (fields.categorie !== undefined) payload['Catégorie'] = fields.categorie;
    if (fields.type !== undefined) payload.Type = fields.type;
    if (fields.montantPrevu !== undefined) payload['Montant prévu'] = fields.montantPrevu;
    if (fields.montantReel !== undefined) payload['Montant réel'] = fields.montantReel;
    if (fields.statutPaiement !== undefined) payload['Statut paiement'] = fields.statutPaiement;

    await airtable.update(TABLES.BUDGET, id, payload);
    return true;
  } catch (error) {
    console.error('Erreur update budget:', error);
    return false;
  }
}

export async function createBudgetLine(input: BudgetCreateInput): Promise<boolean> {
  try {
    await airtable.create(TABLES.BUDGET, {
      Poste: input.poste,
      'Catégorie': input.categorie,
      Type: input.type,
      'Montant prévu': input.montantPrevu,
      'Montant réel': input.montantReel,
      'Statut paiement': input.statutPaiement,
    });
    return true;
  } catch (error) {
    console.error('Erreur création ligne budget:', error);
    return false;
  }
}

export async function getUrgentTasks(): Promise<TaskLine[]> {
  try {
    const records = await airtable.getAll(TABLES.TACHES);

    return records
      .map((record: any) => ({
        id: record.id,
        tache: record.fields['Tâche'] || '',
        description: record.fields.Description || '',
        responsable: formatResponsable(record.fields.Responsable),
        statut: record.fields.Statut || '',
        priorite: record.fields['Priorité'] || '',
        deadline: record.fields.Deadline || '',
        categorie: record.fields['Catégorie'] || '',
      }))
      .filter((task) => isCriticalPriority(task.priorite) && !String(task.statut).toLowerCase().includes('termin'));
  } catch (error) {
    console.error('Erreur récupération tâches urgentes:', error);
    return [];
  }
}

export async function getLiveAdminData() {
  const [iut, equipes, participants, matchs, incidentsEnCours, budget, urgentTasks, devis] = await Promise.all([
    getAllIUT(),
    getAllEquipes(),
    getAllParticipants(),
    getAllMatchs(),
    getIncidentsEnCours(),
    getBudgetLines(),
    getUrgentTasks(),
    getAllDevis(),
  ]);

  const iutConfirmes = iut.filter((item) => item.statutParticipation === 'Confirmé').length;
  const participantsActifs = participants.filter((participant) => participant.statutArrivee !== 'absent');
  const participantsInscrits = participantsActifs.length;

  const budgetCollecte = budget
    .filter((line) => classifyBudgetLine(line) === 'revenu')
    .reduce((sum, line) => sum + line.montantReel, 0);
  const budgetPrevu = budget
    .filter((line) => classifyBudgetLine(line) === 'revenu')
    .reduce((sum, line) => sum + line.montantPrevu, 0);
  const devisEnAttente = devis.filter((item) => item.statut === 'En attente').length;

  const matchsTries = [...matchs].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.heureDebut || '00:00'}`).getTime();
    const dateB = new Date(`${b.date}T${b.heureDebut || '00:00'}`).getTime();
    return dateA - dateB;
  });

  const overview: DashboardOverview = {
    iutConfirmes,
    iutTotal: iut.length,
    participantsInscrits,
    participantsTotal: 300,
    budgetCollecte,
    budgetPrevu,
    tachesUrgentes: urgentTasks.length,
    devisEnAttente,
    devisTotal: devis.length,
  };

  return {
    overview,
    iut,
    equipes,
    participants,
    matchs: matchsTries,
    budget,
    incidentsEnCours,
    urgentTasks,
    devis,
  };
}

export async function getPublicSummary() {
  const [iut, equipes, participants, matchs] = await Promise.all([
    getAllIUT(),
    getAllEquipes(),
    getAllParticipants(),
    getAllMatchs(),
  ]);

  const participantsActifs = participants.filter((participant) => participant.statutArrivee !== 'absent');

  const sports = new Set<string>();
  for (const match of matchs) {
    if (match.sport) sports.add(match.sport);
  }

  return {
    participants: participantsActifs.length,
    iut: iut.length,
    sports: sports.size,
    matchs: matchs.length,
    iutOptions: iut.map((entry) => {
      const nom = String(entry.nom || '').trim();
      return /^iut\b/i.test(nom) ? nom : `IUT ${nom}`;
    }),
  };
}
