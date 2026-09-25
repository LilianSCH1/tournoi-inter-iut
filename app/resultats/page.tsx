'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface MatchData {
  id: string;
  idMatch: string;
  sport: string;
  equipeA: string;
  equipeB: string;
  scoreA?: number;
  scoreB?: number;
  statut: string;
  date: string;
  heureDebut: string;
}

export default function ResultatsPage() {
  const [matchs, setMatchs] = useState<MatchData[]>([]);

  const load = async () => {
    try {
      const res = await fetch('/api/matchs', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setMatchs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement resultats:', error);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const matchsEnCours = useMemo(() => matchs.filter((m) => m.statut === 'En cours'), [matchs]);
  const matchsTermines = useMemo(() => matchs.filter((m) => m.statut === 'Terminé'), [matchs]);
  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-[#0D0D0D] border-b-[3px] border-[#FFEF3F] py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#FFEF3F] mb-5 text-sm uppercase tracking-widest font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Résultats en direct
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Synchronisé automatiquement.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white shadow p-5 border border-gray-100">
            <div className="text-sm text-gray-500">Matchs en cours</div>
            <div className="text-3xl font-black text-[#DC2626] mt-1">{matchsEnCours.length}</div>
          </div>
          <div className="bg-white shadow p-5 border border-gray-100">
            <div className="text-sm text-gray-500">Matchs terminés</div>
            <div className="text-3xl font-black text-[#0D0D0D] mt-1">{matchsTermines.length}</div>
          </div>
          <div className="bg-white shadow p-5 border border-gray-100">
            <div className="text-sm text-gray-500">Total affiché</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">{matchs.length}</div>
          </div>
        </div>

        <div className="bg-white shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold">🔴 Matchs en cours</h2>
            <span className="text-sm text-gray-500">Mise à jour automatique</span>
          </div>
          {matchsEnCours.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-gray-600">
              Aucun match en cours pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {matchsEnCours.map((match) => (
                <div key={match.id} className="border-l-4 border-[#DC2626] bg-red-50 p-5">
                  <div className="font-semibold">{match.idMatch} - {match.sport}</div>
                  <div className="text-sm text-gray-700 mt-1">{match.equipeA} vs {match.equipeB}</div>
                  <div className="text-xs text-gray-600 mt-1">{formatDate(match.date)} • {match.heureDebut}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow p-6 border border-gray-100">
          <h2 className="text-xl font-bold mb-4">✅ Matchs terminés ({matchsTermines.length})</h2>
          {matchsTermines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-gray-600">
              Pas encore de résultat final.
            </div>
          ) : (
            <div className="space-y-3">
              {matchsTermines.map((match) => (
                <div key={match.id} className="border border-gray-200 rounded-xl p-5">
                  <div className="font-semibold">{match.idMatch} - {match.sport}</div>
                  <div className="text-sm text-gray-700 mt-1 flex items-center justify-between">
                    <span>{match.equipeA}</span>
                    <span className="font-bold text-xl">{match.scoreA ?? 0} - {match.scoreB ?? 0}</span>
                    <span>{match.equipeB}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{formatDate(match.date)} • {match.heureDebut}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
