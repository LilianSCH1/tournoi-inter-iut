'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DevisData } from '@/lib/data/devis';
import { Download, FileText, Filter } from 'lucide-react';

const STATUTS = ['Envoyé', 'Refus', 'En attente', 'Accord mutuel'] as const;

function getStatutStyle(statut: string): string {
  switch (statut) {
    case 'Accord mutuel':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'Refus':
      return 'bg-red-100 text-red-700 border border-red-200';
    case 'Envoyé':
      return 'bg-[#FFEF3F]/25 text-[#78350F] border border-[#FFEF3F]/50';
    case 'En attente':
      return 'bg-gray-100 text-gray-700 border border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
}

export default function DevisPage() {
  const router = useRouter();
  const [devis, setDevis] = useState<DevisData[]>([]);
  const [filteredDevis, setFilteredDevis] = useState<DevisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [statutSaving, setStatutSaving] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!res.ok) {
        router.push('/admin/login');
        return;
      }
      fetchDevis();
      fetchTotalAmount();
    };
    init();
  }, [router]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devis');
      if (response.status === 401 || response.status === 403) {
        router.push('/admin/login');
        return;
      }
      const data = await response.json();
      setDevis(data);
      setFilteredDevis(data);
    } catch (error) {
      console.error('Erreur récupération devis:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalAmount = async () => {
    try {
      const response = await fetch('/api/devis?total=true');
      const data = await response.json();
      setTotalAmount(data.total);
    } catch (error) {
      console.error('Erreur calcul total:', error);
    }
  };

  const updateStatut = async (id: string, statut: string) => {
    try {
      setStatutSaving(id);
      const res = await fetch('/api/devis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut }),
      });
      if (!res.ok) throw new Error('Erreur statut devis');
      await fetchDevis();
    } catch (error) {
      console.error('Erreur mise à jour statut devis:', error);
    } finally {
      setStatutSaving(null);
    }
  };

  useEffect(() => {
    const filtered = selectedStatut
      ? devis.filter((d) => d.statut === selectedStatut)
      : devis;
    setFilteredDevis(filtered);
  }, [selectedStatut, devis]);

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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* Header */}
      <div className="bg-[#0D0D0D] border-b-[3px] border-[#FFEF3F]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold mb-1">
            Administration
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            Gestion des devis
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Consultez et gérez les devis et pièces jointes</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total des devis', value: filteredDevis.length, accent: false },
            {
              label: 'Montant total',
              value: `${totalAmount.toFixed(2)} €`,
              accent: false,
            },
            {
              label: 'En attente',
              value: filteredDevis.filter((d) => d.statut === 'En attente').length,
              accent: true,
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`stat-card border-l-4 ${s.accent ? 'border-[#FFEF3F]' : 'border-white/20'}`}
            >
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
                {s.label}
              </p>
              <p className="text-3xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-gray-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[#0D0D0D]">
              Filtres
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUTS.map((statut) => (
              <button
                key={statut}
                onClick={() =>
                  setSelectedStatut(selectedStatut === statut ? null : statut)
                }
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors border ${
                  selectedStatut === statut
                    ? 'bg-[#0D0D0D] text-[#FFEF3F] border-[#0D0D0D]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#0D0D0D] hover:text-[#0D0D0D]'
                }`}
              >
                {statut}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-frame overflow-hidden">
          {filteredDevis.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0D0D0D]">
                  <tr>
                    {['Titre', 'Assigné', 'Montant', 'Statut', 'Date réception', 'PJ'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDevis.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-[#0D0D0D]">
                        {item.titre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.assigne || '—'}</td>
                      <td className="px-6 py-4 text-sm font-black text-[#0D0D0D]">
                        {item.montant.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={item.statut}
                          onChange={(e) => updateStatut(item.id, e.target.value)}
                          disabled={statutSaving === item.id}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border disabled:opacity-60 ${getStatutStyle(
                            item.statut
                          )}`}
                        >
                          {STATUTS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.dateReception || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.piecesJointes && item.piecesJointes.length > 0 ? (
                          <div className="flex items-center gap-1.5 font-bold text-[#0D0D0D]">
                            <FileText size={14} />
                            {item.piecesJointes.length}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">Aucun devis trouvé</p>
            </div>
          )}
        </div>

        {/* Detail cards */}
        {filteredDevis.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black uppercase tracking-tight text-[#0D0D0D]">
              Détails des devis
            </h2>
            {filteredDevis.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-[#0D0D0D]">{item.titre}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{item.assigne || 'Non assigné'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-black text-[#0D0D0D]">
                      {item.montant.toFixed(2)} €
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${getStatutStyle(
                    item.statut
                  )}`}
                >
                  {item.statut}
                </span>

                {item.dateReception && (
                  <p className="mt-3 text-sm text-gray-500">Reçu le : {item.dateReception}</p>
                )}

                {item.notes && (
                  <p className="mt-3 text-sm text-gray-600 bg-gray-50 border border-gray-100 p-3">
                    {item.notes}
                  </p>
                )}

                {item.piecesJointes && item.piecesJointes.length > 0 && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#0D0D0D] mb-3 flex items-center gap-2">
                      <Download size={14} />
                      Pièces jointes ({item.piecesJointes.length})
                    </h4>
                    <div className="space-y-2">
                      {item.piecesJointes.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2.5 bg-[#F4F4F5] hover:bg-[#FFEF3F]/20 hover:border-[#FFEF3F] border border-transparent transition-colors group"
                        >
                          <Download size={14} className="text-gray-400 group-hover:text-[#0D0D0D]" />
                          <span className="text-sm font-semibold text-[#0D0D0D] flex-1">
                            {attachment.filename}
                          </span>
                          <span className="text-xs text-gray-400">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
