import { airtable, TABLES } from '../airtable';

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

function normalize(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function formatResponsable(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).join(', ');
  }

  return String(value || '').trim();
}

function mapTask(record: any): TacheData {
  return {
    id: record.id,
    tache: record.fields['Tâche'] || '',
    description: record.fields['Description'] || '',
    responsable: formatResponsable(record.fields['Responsable']),
    statut: record.fields['Statut'] || '',
    priorite: record.fields['Priorité'] || '',
    deadline: record.fields['Deadline'] || '',
    categorie: record.fields['Catégorie'] || '',
    notes: record.fields['Notes'],
  };
}

export async function getAllTaches(): Promise<TacheData[]> {
  try {
    const records = await airtable.getAll(TABLES.TACHES);
    return records.map(mapTask);
  } catch (error) {
    console.error('Erreur récupération tâches:', error);
    return [];
  }
}

export async function getTachesForResponsable(responsable: string): Promise<TacheData[]> {
  try {
    const allTaches = await getAllTaches();
    const target = normalize(responsable);

    if (!target) {
      return [];
    }

    return allTaches.filter((task) => {
      const taskResponsable = normalize(task.responsable);
      return (
        taskResponsable === target ||
        taskResponsable.includes(target) ||
        target.includes(taskResponsable)
      );
    });
  } catch (error) {
    console.error('Erreur filtrage tâches par responsable:', error);
    return [];
  }
}

export async function getTachesEnRetardOuImportantesForResponsable(responsable: string): Promise<TacheData[]> {
  try {
    const allTaches = await getTachesForResponsable(responsable);
    return allTaches.filter((task) => {
      const priorite = normalize(task.priorite);
      const statut = normalize(task.statut);
      const important = priorite.includes('urgent') || priorite.includes('important') || priorite.includes('critique');
      const notDone = !statut.includes('termin');
      return important && notDone;
    });
  } catch (error) {
    console.error('Erreur filtrage tâches importantes:', error);
    return [];
  }
}

export async function getTacheById(id: string): Promise<TacheData | null> {
  try {
    const record = await airtable.getById(TABLES.TACHES, id);
    if (!record) return null;
    return mapTask(record);
  } catch (error) {
    console.error('Erreur récupération tâche par id:', error);
    return null;
  }
}

export async function updateTacheStatut(id: string, statut: string, notes?: string): Promise<boolean> {
  try {
    const fields: any = { Statut: statut };
    if (typeof notes === 'string') {
      fields.Notes = notes;
    }
    await airtable.update(TABLES.TACHES, id, fields);
    return true;
  } catch (error) {
    console.error('Erreur mise à jour statut tâche:', error);
    return false;
  }
}
