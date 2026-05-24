'use client';

import { useEffect, useState } from 'react';
import { DevisData } from '@/lib/data/devis';
import { Download, FileText, Filter } from 'lucide-react';

const STATUTS = ['Envoyé', 'Refus', 'En attente', 'Accord mutuel'] as const;

export default function DevisPage() {
  const [devis, setDevis] = useState<DevisData[]>([]);
  const [filteredDevis, setFilteredDevis] = useState<DevisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatut, setSelectedStatut] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchDevis();
    fetchTotalAmount();
  }, []);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/devis');
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

  useEffect(() => {
    const filtered = selectedStatut ? devis.filter((d) => d.statut === selectedStatut) : devis;
    setFilteredDevis(filtered);
  }, [selectedStatut, devis]);

  const handleStatutChange = (statut: string) => {
    setSelectedStatut(selectedStatut === statut ? null : statut);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'Accord mutuel':
        return 'bg-green-100 text-green-800';
      case 'Refus':
        return 'bg-red-100 text-red-800';
      case 'Envoyé':
        return 'bg-blue-100 text-blue-800';
      case 'En attente':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Gestion des Devis</h1>
          <p className="text-slate-600">Consultez et gérez les devis et pièces jointes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-slate-600 mb-1">Total des devis</div>
            <div className="text-3xl font-bold text-slate-900">{filteredDevis.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-slate-600 mb-1">Montant total</div>
            <div className="text-3xl font-bold text-slate-900">{totalAmount.toFixed(2)}€</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-slate-600 mb-1">En attente</div>
            <div className="text-3xl font-bold text-amber-600">
              {filteredDevis.filter((d) => d.statut === 'En attente').length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Filtres</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
            <div className="flex flex-wrap gap-2">
              {STATUTS.map((statut) => (
                <button
                  key={statut}
                  onClick={() => handleStatutChange(statut)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedStatut === statut
                      ? getStatutColor(statut)
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {statut}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredDevis.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Titre
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Assigné
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Date réception
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Pièces jointes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDevis.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {item.titre}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{item.assigne || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        {item.montant.toFixed(2)}€
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(
                            item.statut
                          )}`}
                        >
                          {item.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.dateReception || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.piecesJointes && item.piecesJointes.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-blue-600" />
                            <span className="text-blue-600 font-medium">
                              {item.piecesJointes.length}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              <p>Aucun devis trouvé</p>
            </div>
          )}
        </div>

        {filteredDevis.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Détails des devis</h2>
            <div className="grid grid-cols-1 gap-4">
              {filteredDevis.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{item.titre}</h3>
                      <p className="text-sm text-slate-600">{item.assigne || 'Non assigné'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">
                        {item.montant.toFixed(2)}€
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(
                        item.statut
                      )}`}
                    >
                      {item.statut}
                    </span>
                  </div>

                  {item.dateReception && (
                    <div className="mb-4 text-sm text-slate-600">
                      Date réception: {item.dateReception}
                    </div>
                  )}

                  {item.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                        {item.notes}
                      </p>
                    </div>
                  )}

                  {item.piecesJointes && item.piecesJointes.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Download size={16} />
                        Pièces jointes ({item.piecesJointes.length})
                      </h4>
                      <div className="space-y-2">
                        {item.piecesJointes.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors"
                          >
                            <Download size={16} className="text-blue-600" />
                            <span className="text-sm text-blue-600 font-medium">
                              {attachment.filename}
                            </span>
                            <span className="text-xs text-slate-500 ml-auto">
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
          </div>
        )}
      </div>
    </div>
  );
}
