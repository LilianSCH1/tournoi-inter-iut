'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
    let interval: ReturnType<typeof setInterval> | undefined;

    const init = async () => {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!res.ok) {
        sessionStorage.removeItem('joueur_session');
        router.push('/joueur/login');
        return;
      }

      const { session } = await res.json();
      sessionStorage.setItem('joueur_session', JSON.stringify(session));
      setEquipeData(session);

      loadLiveData(session);
      interval = setInterval(() => loadLiveData(session), 3000);
    };

    init();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      sessionStorage.removeItem('joueur_session');
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-[#FFEF3F] mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm uppercase tracking-widest">Chargement…</p>
        </div>
      </div>
    );
  }

  const prochainMatch = matchs.find(m => m.statut === 'À venir');

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#0D0D0D] border-b-[3px] border-[#FFEF3F] shadow-lg">
        <div className="container mx-auto px-4 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Image src="/Logo_Tournoi_IUT_jaune.png" alt="Logo" width={40} height={40} className="flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500 mb-1">Espace Joueur</p>
                <h1 className="text-xl font-black uppercase text-white tracking-wide">
                  {equipeData?.equipeName}
                </h1>
                <p className="text-sm text-[#FFEF3F] mt-0.5">{equipeData?.iut}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border border-white/20 hover:border-[#FFEF3F] hover:text-[#FFEF3F] text-gray-400 px-4 py-2 text-sm transition-colors uppercase tracking-wide font-semibold"
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
          <div className="bg-[#FFEF3F] border-l-4 border-[#0D0D0D] p-6 mb-8 animate-pulse-slow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#0D0D0D]/60 font-bold mb-2">Prochain match</p>
                <h2 className="text-2xl font-black uppercase tracking-tight text-[#0D0D0D] mb-2">
                  {prochainMatch.sport} — {prochainMatch.phase}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#0D0D0D]/70 font-medium">
                  <span>{new Date(prochainMatch.date).toLocaleDateString('fr-FR')}</span>
                  <span>{prochainMatch.heure}</span>
                  <span>{prochainMatch.terrain}</span>
                </div>
                <p className="mt-3 text-xl font-black text-[#0D0D0D]">
                  VS {prochainMatch.adversaire}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-bold uppercase tracking-widest text-[#0D0D0D]/60">Dans</div>
                <div className="text-5xl font-black text-[#0D0D0D]">2J 8H</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Carte info rapide */}
          <div className="panel-raised p-6 border-l-4 border-[#FFEF3F]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#FFEF3F] flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-black text-[#0D0D0D]">✓</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Statut</p>
                <p className="font-black text-[#0D0D0D] uppercase text-sm">Inscrit</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Licence</span>
                <span className="font-bold text-[#0D0D0D]">✓ Validée</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paiement</span>
                <span className="font-bold text-[#0D0D0D]">✓ OK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transport</span>
                <span className="font-bold text-[#0D0D0D]">✓ Confirmé</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="panel-raised p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#0D0D0D] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-[#FFEF3F]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Mes matchs</p>
                <p className="text-2xl font-black text-[#0D0D0D]">{matchs.length}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-500">À venir</span>
                <span className="font-bold">{matchs.filter(m => m.statut === 'À venir').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Joués</span>
                <span className="font-bold">0</span>
              </div>
            </div>
          </div>

          {/* Équipe */}
          <div className="panel-raised p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#0D0D0D] flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#FFEF3F]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Mon équipe</p>
                <p className="text-2xl font-black text-[#0D0D0D]">{joueurs.length}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Joueurs</span>
                <span className="font-bold">{joueurs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Licences OK</span>
                <span className="font-bold text-[#0D0D0D]">
                  {joueurs.filter(j => j.valide).length}/{joueurs.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Mes matchs */}
          <div className="panel-raised">
            <div className="p-5 panel-deep border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Mes Matchs
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {matchs.length === 0 && (
                <div className="p-6 text-sm text-gray-400 text-center">Aucun match programmé.</div>
              )}
              {matchs.map(match => (
                <div key={match.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <div>
                      <div className="font-black text-[#0D0D0D] uppercase tracking-wide">{match.sport}</div>
                      <div className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">{match.phase}</div>
                    </div>
                    <span className="flex-shrink-0 bg-[#0D0D0D] text-[#FFEF3F] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                      {match.statut}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3 font-medium">
                    <span>{new Date(match.date).toLocaleDateString('fr-FR')}</span>
                    <span>·</span>
                    <span>{match.heure}</span>
                    <span>·</span>
                    <span>{match.terrain}</span>
                  </div>
                  <div className="mt-3 text-base font-black text-[#0D0D0D] uppercase">
                    VS {match.adversaire}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mon équipe */}
          <div className="panel-raised">
            <div className="p-5 panel-deep border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] flex items-center gap-2">
                <Users className="w-4 h-4" />
                Mon Équipe
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {joueurs.length === 0 && (
                <div className="p-6 text-sm text-gray-400 text-center">Aucun joueur trouvé.</div>
              )}
              {joueurs.map((joueur, index) => (
                <div key={index} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <div className="font-semibold text-[#0D0D0D]">{joueur.nom}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{joueur.licence}</div>
                  </div>
                  {joueur.valide ? (
                    <span className="bg-[#0D0D0D] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                      ✓ OK
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-bold uppercase border border-red-200">
                      À valider
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Infos pratiques */}
        <div className="mt-6">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-400 mb-4">Infos pratiques</p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="panel-raised p-5 border-t-2 border-[#0D0D0D]">
              <div className="flex items-center gap-2 mb-3">
                <Bus className="w-4 h-4 text-[#0D0D0D]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0D0D0D]">Transport</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-semibold text-[#0D0D0D]">Navette organisée</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Départ</span>
                  <span className="font-semibold text-[#0D0D0D]">29 janv. 7h30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lieu RDV</span>
                  <span className="font-semibold text-[#0D0D0D]">IUT Nancy</span>
                </div>
              </div>
            </div>

            <div className="panel-raised p-5 border-t-2 border-[#0D0D0D]">
              <div className="flex items-center gap-2 mb-3">
                <Bed className="w-4 h-4 text-[#0D0D0D]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0D0D0D]">Hébergement</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Lieu</span>
                  <span className="font-semibold text-[#0D0D0D]">Gymnase Jules Ferry</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Arrivée</span>
                  <span className="font-semibold text-[#0D0D0D]">29 janv. 19h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Matériel</span>
                  <span className="font-semibold text-[#0D0D0D]">Sac de couchage</span>
                </div>
              </div>
            </div>

            <div className="panel-raised p-5 border-t-2 border-[#0D0D0D]">
              <div className="flex items-center gap-2 mb-3">
                <Utensils className="w-4 h-4 text-[#0D0D0D]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0D0D0D]">Repas</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendredi midi</span>
                  <span className="font-bold text-[#0D0D0D]">✓ Inclus</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendredi soir</span>
                  <span className="font-bold text-[#0D0D0D]">✓ BBQ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Samedi midi</span>
                  <span className="font-bold text-[#0D0D0D]">✓ Inclus</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton urgence */}
        <div className="mt-6">
          <a
            href="tel:0612345678"
            className="block bg-[#DC2626] hover:bg-red-700 text-white p-6 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-7 h-7 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wide">Besoin d'aide ?</h3>
                  <p className="text-red-200 text-sm mt-0.5">
                    Urgence médicale ou problème logistique : appelez le PC Organisation.
                  </p>
                </div>
              </div>
              <span className="text-2xl font-black">→</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
