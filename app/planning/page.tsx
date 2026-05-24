'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

interface MatchData {
  id: string;
  idMatch: string;
  sport: string;
  phase: string;
  date: string;
  heureDebut: string;
  terrain: string;
  equipeA: string;
  equipeB: string;
  scoreA?: number;
  scoreB?: number;
  statut: string;
}

export default function PlanningPage() {
  const [matchs, setMatchs] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMatchs = async () => {
    try {
      const res = await fetch('/api/matchs', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setMatchs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement planning:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchs();
    const interval = setInterval(loadMatchs, 3000);
    return () => clearInterval(interval);
  }, []);

  const matchsByDate = useMemo(() => {
    const grouped = matchs.reduce((acc, match) => {
      const date = match.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(match);
      return acc;
    }, {} as Record<string, MatchData[]>);

    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
    });

    return grouped;
  }, [matchs]);

  const dates = useMemo(() => Object.keys(matchsByDate).sort(), [matchsByDate]);
  const totalMatchs = matchs.length;

  const formatDate = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      <div className="bg-lorraine-blue text-white py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            Planning des Matchs
          </h1>
          <p className="text-blue-200 mt-2">{totalMatchs} matchs</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center border border-gray-100">
            <p className="text-gray-600">Chargement du planning...</p>
          </div>
        ) : dates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center border border-gray-100">
            <p className="text-gray-600">Aucun match programmé pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {dates.map((date) => (
              <div key={date} className="bg-white rounded-2xl shadow overflow-hidden border border-gray-100">
                <div className="bg-lorraine-blue text-white px-6 py-4">
                  <h2 className="text-2xl font-bold">
                    {formatDate(date)}
                  </h2>
                  <p className="text-blue-200">{matchsByDate[date].length} matchs</p>
                </div>
                <div className="divide-y">
                  {matchsByDate[date].map((match) => (
                    <div key={match.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex gap-3 mb-3">
                            <span className="text-2xl">
                              {match.sport === 'Basket' && '🏀'}
                              {match.sport === 'Volley' && '🏐'}
                              {match.sport === 'Futsal' && '⚽'}
                              {match.sport === 'Handball' && '🤾'}
                            </span>
                            <div>
                              <div className="font-semibold">{match.idMatch} - {match.sport}</div>
                              <div className="text-sm text-gray-600">{match.phase} • Terrain {match.terrain}</div>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-3 gap-4 items-center">
                            <div className="font-bold text-lg">{match.equipeA}</div>
                            <div className="text-center">
                              {match.statut === 'Terminé' && match.scoreA !== undefined ? (
                                <div className="inline-flex gap-3 bg-gray-100 rounded px-6 py-2">
                                  <span className="text-2xl font-bold text-lorraine-blue">{match.scoreA}</span>
                                  <span>-</span>
                                  <span className="text-2xl font-bold text-lorraine-blue">{match.scoreB}</span>
                                </div>
                              ) : match.statut === 'En cours' ? (
                                <span className="bg-red-100 text-red-700 px-4 py-1 rounded">🔴 EN DIRECT</span>
                              ) : (
                                <span className="text-gray-500">VS</span>
                              )}
                            </div>
                            <div className="font-bold text-lg text-right">{match.equipeB}</div>
                          </div>
                        </div>
                        <div className="ml-6 text-right">
                          <div className="text-2xl font-bold text-lorraine-blue">{match.heureDebut}</div>
                          <div className="text-sm text-gray-600">
                            {match.statut === 'Terminé' ? 'Terminé' : match.statut === 'En cours' ? 'En cours' : 'Programmé'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
