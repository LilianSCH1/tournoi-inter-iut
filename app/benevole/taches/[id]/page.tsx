'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const STATUTS = ['À faire', 'En cours', 'Terminé', 'En attente'] as const;

export default function TacheDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || '');
  const router = useRouter();
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatut, setNewStatut] = useState('');
  const [notes, setNotes] = useState('');
  const [uiMessage, setUiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

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
      } catch {
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
      const refreshed = await fetch(`/api/taches/${id}`, { cache: 'no-store' });
      if (refreshed.ok) setTask(await refreshed.json());
    } catch (error) {
      showUiMessage('error', (error as Error).message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFEF3F] mx-auto mb-4" />
          <p className="text-gray-500 text-sm uppercase tracking-widest">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Tâche introuvable.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 btn-secondary text-sm py-2"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const prioriteLabel = String(task.priorite || '').toLowerCase();
  const isUrgent =
    prioriteLabel.includes('urgent') ||
    prioriteLabel.includes('critique') ||
    prioriteLabel.includes('important');

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* Header */}
      <div className="bg-[#0D0D0D] border-b-[3px] border-[#FFEF3F]">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#FFEF3F] text-sm transition-colors uppercase tracking-widest font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* UI feedback */}
        {uiMessage && (
          <div
            className={`mb-6 border-l-4 px-4 py-3 text-sm font-semibold ${
              uiMessage.type === 'success'
                ? 'border-green-500 bg-green-50 text-green-800'
                : 'border-[#DC2626] bg-red-50 text-red-700'
            }`}
          >
            {uiMessage.text}
          </div>
        )}

        {/* Task info */}
        <div className="bg-white border border-gray-200 p-6 md:p-8 mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold mb-2">
                Détail tâche
              </p>
              <h1 className="text-2xl font-black text-[#0D0D0D] leading-tight">{task.tache}</h1>
            </div>
            {isUrgent && (
              <span className="flex-shrink-0 bg-[#FFEF3F] text-[#0D0D0D] text-[10px] font-black uppercase tracking-widest px-3 py-1.5">
                Urgent
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            {task.deadline && (
              <div className="border border-gray-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  Deadline
                </p>
                <p className="font-semibold text-[#0D0D0D] mt-0.5">{task.deadline}</p>
              </div>
            )}
            {task.priorite && (
              <div className="border border-gray-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  Priorité
                </p>
                <p className="font-semibold text-[#0D0D0D] mt-0.5">{task.priorite}</p>
              </div>
            )}
            {task.statut && (
              <div className="border border-gray-200 px-3 py-2">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                  Statut actuel
                </p>
                <p className="font-semibold text-[#0D0D0D] mt-0.5">{task.statut}</p>
              </div>
            )}
          </div>
        </div>

        {/* Update form */}
        <div className="bg-white border border-gray-200 p-6 md:p-8 space-y-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] border-b border-gray-100 pb-3">
            Mettre à jour
          </h2>

          <div>
            <label className="label">Nouveau statut</label>
            <select
              value={newStatut}
              onChange={(e) => setNewStatut(e.target.value)}
              className="input"
            >
              <option value="">— Choisir —</option>
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Ajouter des précisions, observations…"
              className="input resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={() => router.back()} className="btn-secondary">
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
