'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TacheDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '');
  const router = useRouter();
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatut, setNewStatut] = useState('');
  const [notes, setNotes] = useState('');
  const [uiMessage, setUiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/taches/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Tâche introuvable');
        const json = await res.json();
        setTask(json);
        setNewStatut(json.statut || '');
        setNotes(json.notes || '');
      } catch (error) {
        setTask(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const showUiMessage = (type: 'success' | 'error', text: string) => {
    setUiMessage({ type, text });
    setTimeout(() => setUiMessage(null), 2600);
  };

  const handleSave = async () => {
    if (!newStatut) return showUiMessage('error', 'Sélectionne un statut.');
    try {
      setSaving(true);
      const res = await fetch(`/api/taches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut, notes }),
      });
      if (!res.ok) throw new Error('Mise à jour impossible');
      showUiMessage('success', 'Statut mis à jour.');
      // refresh
      const refreshed = await fetch(`/api/taches/${id}`, { cache: 'no-store' });
      if (refreshed.ok) setTask(await refreshed.json());
    } catch (error) {
      showUiMessage('error', (error as Error).message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!task) return <div className="p-6">Tâche introuvable.</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto panel-raised rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Détail tâche</h1>
          <button onClick={() => router.back()} className="text-sm text-gray-600">Retour</button>
        </div>

        {uiMessage && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${uiMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {uiMessage.text}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <div className="font-semibold text-lg">{task.tache}</div>
            {task.description && <div className="text-sm text-gray-600 mt-1">{task.description}</div>}
            {task.deadline && <div className="text-xs text-gray-500 mt-1">Deadline: {task.deadline}</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={newStatut} onChange={(e) => setNewStatut(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">-- Choisir --</option>
              <option value="À faire">À faire</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
              <option value="En attente">En attente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded" />
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => router.back()} className="bg-gray-200 px-4 py-2 rounded">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
