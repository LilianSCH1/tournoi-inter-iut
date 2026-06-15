import { supabase } from '../supabase';

export interface TacheData {
  id: string;
  tache: string;
  description: string;
  responsable: string;
  statut: string;
  priorite: string;
  deadline: string;
  categorie: string;
  notes?: string;
}

function mapRowToTache(row: any): TacheData {
  return {
    id: row.id,
    tache: row.tache || '',
    description: row.description || '',
    responsable: row.responsable || '',
    statut: row.statut || '',
    priorite: row.priorite || '',
    deadline: row.deadline || '',
    categorie: row.categorie || '',
    notes: row.notes,
  };
}

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export async function getAllTaches(): Promise<TacheData[]> {
  const { data, error } = await supabase.from('todo_list').select('*');
  if (error) { console.error('Erreur récupération tâches:', error); return []; }
  return (data || []).map(mapRowToTache);
}

export async function getTachesForResponsable(responsable: string): Promise<TacheData[]> {
  const all = await getAllTaches();
  const target = normalize(responsable);
  if (!target) return [];

  return all.filter(task => {
    const r = normalize(task.responsable);
    return r === target || r.includes(target) || target.includes(r);
  });
}

export async function getTachesEnRetardOuImportantesForResponsable(responsable: string): Promise<TacheData[]> {
  const all = await getTachesForResponsable(responsable);
  return all.filter(task => {
    const priorite = normalize(task.priorite);
    const statut = normalize(task.statut);
    const important = priorite.includes('urgent') || priorite.includes('important') || priorite.includes('critique');
    return important && !statut.includes('termin');
  });
}

export async function getTacheById(id: string): Promise<TacheData | null> {
  const { data, error } = await supabase.from('todo_list').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapRowToTache(data);
}

export async function updateTacheStatut(id: string, statut: string, notes?: string): Promise<boolean> {
  const payload: any = { statut };
  if (typeof notes === 'string') payload.notes = notes;

  const { error } = await supabase.from('todo_list').update(payload).eq('id', id);
  if (error) { console.error('Erreur mise à jour statut tâche:', error); return false; }
  return true;
}
