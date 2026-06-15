import { supabase } from '../supabase';
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
    const parsed = Number(value.replace(',', '.').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function isRevenue(line: BudgetLine): boolean {
  const scope = `${line.type} ${line.categorie} ${line.poste}`.toLowerCase();
  return scope.includes('recette') || scope.includes('revenu') || scope.includes('income') || scope.includes('subvention') || scope.includes('sponsor') || scope.includes('inscription') || scope.includes('tombola');
}

function isCriticalPriority(priority: string): boolean {
  const n = String(priority || '').toLowerCase();
  return n.includes('critique') || n.includes('urgent') || n.includes('haute');
}

function mapRowToBudget(row: any): BudgetLine {
  return {
    id: row.id,
    poste: row.poste || 'Non renseigné',
    categorie: row.categorie || 'Autre',
    type: row.type || 'Depense',
    montantPrevu: toNumber(row.montant_prevu),
    montantReel: toNumber(row.montant_reel),
    statutPaiement: row.statut_paiement || 'Non renseigné',
  };
}

export async function getBudgetLines(): Promise<BudgetLine[]> {
  const { data, error } = await supabase.from('logi_budget').select('*');
  if (error) { console.error('Erreur récupération budget:', error); return []; }
  return (data || []).map(mapRowToBudget);
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
  const payload: any = {};
  if (fields.poste !== undefined) payload.poste = fields.poste;
  if (fields.categorie !== undefined) payload.categorie = fields.categorie;
  if (fields.type !== undefined) payload.type = fields.type;
  if (fields.montantPrevu !== undefined) payload.montant_prevu = fields.montantPrevu;
  if (fields.montantReel !== undefined) payload.montant_reel = fields.montantReel;
  if (fields.statutPaiement !== undefined) payload.statut_paiement = fields.statutPaiement;

  const { error } = await supabase.from('logi_budget').update(payload).eq('id', id);
  if (error) { console.error('Erreur update budget:', error); return false; }
  return true;
}

export async function createBudgetLine(input: BudgetCreateInput): Promise<boolean> {
  const { error } = await supabase.from('logi_budget').insert({
    poste: input.poste,
    categorie: input.categorie,
    type: input.type,
    montant_prevu: input.montantPrevu,
    montant_reel: input.montantReel,
    statut_paiement: input.statutPaiement,
  });
  if (error) { console.error('Erreur création ligne budget:', error); return false; }
  return true;
}

export async function getUrgentTasks(): Promise<TaskLine[]> {
  const { data, error } = await supabase.from('todo_list').select('*');
  if (error) { console.error('Erreur récupération tâches urgentes:', error); return []; }
  return (data || [])
    .map((row: any) => ({
      id: row.id,
      tache: row.tache || '',
      description: row.description || '',
      responsable: row.responsable || '',
      statut: row.statut || '',
      priorite: row.priorite || '',
      deadline: row.deadline || '',
      categorie: row.categorie || '',
    }))
    .filter((t: TaskLine) => isCriticalPriority(t.priorite) && !t.statut.toLowerCase().includes('termin'));
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

  const iutConfirmes = iut.filter(i => i.statutParticipation === 'Confirmé').length;
  const participantsActifs = participants.filter(p => p.statutArrivee !== 'absent');

  const budgetCollecte = budget.filter(isRevenue).reduce((sum, l) => sum + l.montantReel, 0);
  const budgetPrevu = budget.filter(isRevenue).reduce((sum, l) => sum + l.montantPrevu, 0);
  const devisEnAttente = devis.filter(d => d.statut === 'En attente').length;

  const matchsTries = [...matchs].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.heureDebut || '00:00'}`).getTime();
    const dateB = new Date(`${b.date}T${b.heureDebut || '00:00'}`).getTime();
    return dateA - dateB;
  });

  const overview: DashboardOverview = {
    iutConfirmes,
    iutTotal: iut.length,
    participantsInscrits: participantsActifs.length,
    participantsTotal: 300,
    budgetCollecte,
    budgetPrevu,
    tachesUrgentes: urgentTasks.length,
    devisEnAttente,
    devisTotal: devis.length,
  };

  return { overview, iut, equipes, participants, matchs: matchsTries, budget, incidentsEnCours, urgentTasks, devis };
}

export async function getPublicSummary() {
  const [iut, equipes, participants, matchs] = await Promise.all([
    getAllIUT(),
    getAllEquipes(),
    getAllParticipants(),
    getAllMatchs(),
  ]);

  const participantsActifs = participants.filter(p => p.statutArrivee !== 'absent');
  const sports = new Set(matchs.map(m => m.sport).filter(Boolean));

  return {
    participants: participantsActifs.length,
    iut: iut.length,
    sports: sports.size,
    matchs: matchs.length,
    iutOptions: iut.map(entry => {
      const nom = String(entry.nom || '').trim();
      return /^iut\b/i.test(nom) ? nom : `IUT ${nom}`;
    }),
  };
}
