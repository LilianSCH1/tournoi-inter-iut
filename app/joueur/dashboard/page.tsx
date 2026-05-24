'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Users, Calendar, MapPin, Utensils, Bed, Bus, AlertCircle } from 'lucide-react';

export default function DashboardJoueurPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [equipeData, setEquipeData] = useState<any>(null);
  const [matchs, setMatchs] = useState<any[]>([]);
  const [joueurs, setJoueurs] = useState<any[]>([]);

  const loadLiveData = async (sessionData: any) => {
    try {
      const [matchsRes, participantsRes] = await Promise.all([
        fetch('/api/matchs', { cache: 'no-store' }),
        fetch('/api/participants', { cache: 'no-store' }),
      ]);

      const allMatchs = matchsRes.ok ? await matchsRes.json() : [];
      const allParticipants = participantsRes.ok ? await participantsRes.json() : [];

      const equipeName = String(sessionData?.equipeName || '').toLowerCase();
      const iut = String(sessionData?.iut || '').toLowerCase();

      const matchsEquipe = (Array.isArray(allMatchs) ? allMatchs : [])
        .filter((m: any) => {
          const a = String(m.equipeA || '').toLowerCase();
          const b = String(m.equipeB || '').toLowerCase();
          return (equipeName && (a.includes(equipeName) || b.includes(equipeName))) || (iut && (a.includes(iut) || b.includes(iut)));
        })
        .map((m: any) => ({
          id: m.id,
          sport: m.sport,
          phase: m.phase,
          date: m.date,
          heure: m.heureDebut,
          terrain: m.terrain,
          adversaire: String(m.equipeA || '').toLowerCase().includes(equipeName) ? m.equipeB : m.equipeA,
          statut: m.statut === 'Programmé' ? 'À venir' : m.statut,
        }));

      const joueursEquipe = (Array.isArray(allParticipants) ? allParticipants : [])
        .filter((p: any) => iut && String(p.iut || '').toLowerCase().includes(iut))
        .filter((p: any) => p.type === 'Joueur')
        .filter((p: any) => p.statutArrivee !== 'absent')
        .map((p: any) => ({
          nom: p.nomComplet,
          poste: 'Joueur',
          licence: p.licenceSportive || 'Non renseignée',
          valide: Boolean(p.licenceValidee),
        }));

      setMatchs(matchsEquipe);
      setJoueurs(joueursEquipe);
    } catch (error) {
      console.error('Erreur chargement dashboard joueur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Récupérer les données de l'équipe depuis sessionStorage
    const session = sessionStorage.getItem('joueur_session');
    if (!session) {
      router.push('/joueur/login');
      return;
    }

    const data = JSON.parse(session);
    setEquipeData(data);

    loadLiveData(data);
    const interval = setInterval(() => loadLiveData(data), 3000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('joueur_session');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lorraine-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const prochainMatch = matchs.find(m => m.statut === 'À venir');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-lorraine-blue to-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Espace Joueur</h1>
              <p className="text-blue-200 mt-1">
                {equipeData?.equipeName} • {equipeData?.iut}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Prochain match */}
        {prochainMatch && (
          <div className="bg-gradient-to-r from-lorraine-red to-red-700 text-white rounded-lg shadow-lg p-6 mb-8 animate-pulse-slow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">⏰ PROCHAIN MATCH</p>
                <h2 className="text-2xl font-bold mb-2">
                  {prochainMatch.sport} - {prochainMatch.phase}
                </h2>
                <div className="flex items-center gap-4 text-red-100">
                  <span>📅 {new Date(prochainMatch.date).toLocaleDateString('fr-FR')}</span>
                  <span>🕐 {prochainMatch.heure}</span>
                  <span>📍 {prochainMatch.terrain}</span>
                </div>
                <p className="mt-3 text-xl">
                  <strong>VS {prochainMatch.adversaire}</strong>
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold">DANS</div>
                <div className="text-3xl font-bold mt-2">2J 8H</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Carte info rapide */}
          <div className="panel-raised rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <p className="font-bold text-green-600">Inscrit</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Licence</span>
                <span className="font-semibold text-green-600">✓ Validée</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paiement</span>
                <span className="font-semibold text-green-600">✓ OK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transport</span>
                <span className="font-semibold text-green-600">✓ Confirmé</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="panel-raised rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-lorraine-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mes matchs</p>
                <p className="text-2xl font-bold text-lorraine-blue">{matchs.length}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">À venir</span>
                <span className="font-semibold">{matchs.filter(m => m.statut === 'À venir').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Joués</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </div>

          {/* Équipe */}
          <div className="panel-raised rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mon équipe</p>
                <p className="text-2xl font-bold text-purple-600">{joueurs.length}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Joueurs</span>
                <span className="font-semibold">{joueurs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Licences OK</span>
                <span className="font-semibold text-green-600">
                  {joueurs.filter(j => j.valide).length}/{joueurs.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mes matchs */}
          <div className="panel-raised rounded-lg">
            <div className="p-6 panel-deep rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-lorraine-blue" />
                Mes Matchs
              </h2>
            </div>
            <div className="divide-y divide-slate-200/70">
              {matchs.map(match => (
                <div key={match.id} className="p-6 hover:bg-slate-100/80 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-lg">{match.sport}</div>
                      <div className="text-sm text-gray-600">{match.phase}</div>
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {match.statut}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                    <span>📅 {new Date(match.date).toLocaleDateString('fr-FR')}</span>
                    <span>🕐 {match.heure}</span>
                    <span>📍 {match.terrain}</span>
                  </div>
                  <div className="mt-3 text-lg font-semibold">
                    VS {match.adversaire}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mon équipe */}
          <div className="panel-raised rounded-lg">
            <div className="p-6 panel-deep rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Mon Équipe
              </h2>
            </div>
            <div className="divide-y divide-slate-200/70">
              {joueurs.map((joueur, index) => (
                <div key={index} className="p-4 flex justify-between items-center hover:bg-slate-100/80">
                  <div>
                    <div className="font-semibold">{joueur.nom}</div>
                    <div className="text-sm text-gray-600">{joueur.poste}</div>
                    <div className="text-xs text-gray-500 mt-1">{joueur.licence}</div>
                  </div>
                  {joueur.valide ? (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Licence OK
                    </div>
                  ) : (
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                      ⚠ À valider
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Infos pratiques */}
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          <div className="panel-raised rounded-lg p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Bus className="w-5 h-5 text-lorraine-blue" />
              Transport
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="font-semibold">Navette organisée</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Départ</span>
                <span className="font-semibold">29 janv. 7h30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lieu RDV</span>
                <span className="font-semibold">IUT Nancy</span>
              </div>
            </div>
          </div>

          <div className="panel-raised rounded-lg p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Bed className="w-5 h-5 text-lorraine-blue" />
              Hébergement
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Lieu</span>
                <span className="font-semibold">Gymnase Jules Ferry</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Arrivée</span>
                <span className="font-semibold">29 janv. 19h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Matériel</span>
                <span className="font-semibold">Sac de couchage</span>
              </div>
            </div>
          </div>

          <div className="panel-raised rounded-lg p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-lorraine-blue" />
              Repas
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Vendredi midi</span>
                <span className="font-semibold">✓ Inclus</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vendredi soir</span>
                <span className="font-semibold">✓ BBQ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Samedi midi</span>
                <span className="font-semibold">✓ Inclus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton urgence */}
        <div className="mt-6">
          <Link
            href="/urgences"
            className="block bg-lorraine-red hover:bg-red-700 text-white rounded-lg p-6 shadow-lg transition-all hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold">🆘 Besoin d'aide ?</h3>
                  <p className="text-red-100 text-sm mt-1">
                    Urgence médicale, objet perdu, problème logistique...
                  </p>
                </div>
              </div>
              <div className="text-3xl">→</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
