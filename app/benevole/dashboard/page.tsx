'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, UserCheck, Trophy, AlertTriangle, ClipboardList, ShieldAlert, FileText, ExternalLink } from 'lucide-react';

function normalizeLabel(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function titleCase(value: string): string {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function deriveBenevoleAliases(session: any): string[] {
  const aliases = new Set<string>();
  const email = String(session?.email || '').trim().toLowerCase();
  const fullName = String(session?.nomComplet || '').trim();
  const participantId = String(session?.participantId || '').trim().toLowerCase();

  if (participantId) {
    aliases.add(participantId);
  }

  if (fullName) {
    aliases.add(normalizeLabel(fullName));

    const fullNameParts = fullName.split(/\s+/).filter(Boolean);
    if (fullNameParts.length > 0) {
      aliases.add(normalizeLabel(fullNameParts[0]));
      aliases.add(normalizeLabel(titleCase(fullNameParts[0])));
      aliases.add(normalizeLabel(fullNameParts.map((part) => part.replace(/\d+$/g, '')).filter(Boolean).join(' ')));
    }
    
    // Add reverse order for full name parts
    if (fullNameParts.length >= 2) {
      aliases.add(normalizeLabel([...fullNameParts].reverse().join(' ')));
    }
  }

  if (email) {
    const localPart = email.split('@')[0] || '';
    const localPieces = localPart
      .split(/[._-]+/)
      .map((piece) => piece.replace(/\d+$/g, ''))
      .filter(Boolean);

    if (localPieces.length > 0) {
      aliases.add(normalizeLabel(localPieces[0]));
      aliases.add(normalizeLabel(titleCase(localPieces[0])));
      aliases.add(normalizeLabel(localPieces.map((piece) => titleCase(piece)).join(' ')));
    }
    
    // Add full email local part
    aliases.add(normalizeLabel(localPart.replace(/\d+$/g, '')));
  }

  return Array.from(aliases).filter(Boolean);
}

export default function DashboardBenevolePage() {
  const router = useRouter();
  const [benevoleData, setBenevoleData] = useState<any>(null);
  const [benevoleTasks, setBenevoleTasks] = useState<any[]>([]);
  const [benevoleUrgentTasks, setBenevoleUrgentTasks] = useState<any[]>([]);
  const [benevoleDevis, setBenevoleDevis] = useState<any[]>([]);
  const [tasksAlertShown, setTasksAlertShown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [matchsDuJour, setMatchsDuJour] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [arrivalFilter, setArrivalFilter] = useState<'all' | 'confirmed' | 'absent' | 'en_attente'>('all');
  const [incidentType, setIncidentType] = useState<'Médicale' | 'Sécurité' | 'Logistique' | 'Autre'>('Logistique');
  const [incidentGravite, setIncidentGravite] = useState<'🟢 Faible' | '🟡 Modérée' | '🔴 Grave' | '🆘 Critique'>('🟡 Modérée');
  const [incidentLieu, setIncidentLieu] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentPersonne, setIncidentPersonne] = useState('');
  const [incidentUrgenceCode, setIncidentUrgenceCode] = useState(false);
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<'checkin' | 'matchs' | 'incidents' | 'taches' | 'devis'>('checkin');
  const [devisLoading, setDevisLoading] = useState(false);
  const [devisSubmitting, setDevisSubmitting] = useState(false);
  const [newDevisTitre, setNewDevisTitre] = useState('');
  const [newDevisMontant, setNewDevisMontant] = useState('');
  const [newDevisNotes, setNewDevisNotes] = useState('');
  const [newDevisFiles, setNewDevisFiles] = useState<File[]>([]);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [uiMessage, setUiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const scrollPanelClass = 'divide-y divide-gray-100 max-h-[41.4rem] overflow-y-auto';
  const matchScrollPanelClass = 'divide-y divide-gray-100 max-h-[34.7rem] overflow-y-auto';

  const showUiMessage = (type: 'success' | 'error', text: string) => {
    setUiMessage({ type, text });
    setTimeout(() => setUiMessage(null), 2600);
  };

  const loadLiveData = async () => {
    try {
      const [matchsRes, participantsRes, incidentsRes] = await Promise.all([
        fetch('/api/matchs', { cache: 'no-store' }),
        fetch('/api/participants', { cache: 'no-store' }),
        fetch('/api/incidents', { cache: 'no-store' }),
      ]);

      if (matchsRes.ok) {
        const matchs = await matchsRes.json();
        setMatchsDuJour(Array.isArray(matchs) ? matchs.slice(0, 12) : []);
      }

      if (participantsRes.ok) {
        const list = await participantsRes.json();
        setParticipants(Array.isArray(list) ? list : []);
      }

      if (incidentsRes.ok) {
        const list = await incidentsRes.json();
        setIncidents(Array.isArray(list) ? list : []);
      }

      setLastRefresh(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Erreur chargement dashboard benevole:', error);
    }
  };

  const loadBenevoleTasks = async (aliases?: string[], participantId?: string) => {
    const normalizedAliases = Array.from(new Set((aliases || []).map((alias) => normalizeLabel(alias)).filter(Boolean)));
    const pidLower = String(participantId || '').trim().toLowerCase();

    if (normalizedAliases.length === 0 && !pidLower) {
      setBenevoleTasks([]);
      setBenevoleUrgentTasks([]);
      return;
    }

    try {
      const res = await fetch('/api/taches', {
        cache: 'no-store',
      });

      if (!res.ok) {
        setBenevoleTasks([]);
        setBenevoleUrgentTasks([]);
        return;
      }

      const tasks = await res.json();
      const allTasks = Array.isArray(tasks) ? tasks : [];

      const matchedTasks = allTasks.filter((task: any) => {
        // Correspondance directe par identifiant
        if (pidLower && String(task.responsable || '').trim().toLowerCase() === pidLower) {
          return true;
        }

        // Correspondance par nom/alias (repli si l'identifiant n'est pas disponible)
        const taskResponsables = Array.isArray(task.responsable) ? task.responsable : [task.responsable];
        const normalizedResponsables = taskResponsables.map((value: unknown) => normalizeLabel(String(value || ''))).filter(Boolean);

        if (normalizedResponsables.length === 0) {
          return false;
        }

        return normalizedResponsables.some((taskResponsable: string) =>
          normalizedAliases.some((alias) => {
            return taskResponsable === alias || taskResponsable.includes(alias) || alias.includes(taskResponsable);
          })
        );
      });

      setBenevoleTasks(matchedTasks);
      setBenevoleUrgentTasks(
        matchedTasks.filter((task: any) => {
          const priorite = String(task.priorite || '').toLowerCase();
          const statut = String(task.statut || '').toLowerCase();
          const important = priorite.includes('urgent') || priorite.includes('important') || priorite.includes('critique');
          const notDone = !statut.includes('termin');
          return important && notDone;
        })
      );

      if (matchedTasks.length > 0) {
        setActiveSection('taches');
      }
    } catch (error) {
      console.error('Erreur chargement tâches bénévole:', error);
      setBenevoleTasks([]);
      setBenevoleUrgentTasks([]);
    }
  };

  const loadBenevoleDevis = async (responsable?: string) => {
    const target = String(responsable || '').trim();

    if (!target) {
      setBenevoleDevis([]);
      return;
    }

    try {
      setDevisLoading(true);
      const res = await fetch(`/api/devis?assigne=${encodeURIComponent(target)}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        setBenevoleDevis([]);
        return;
      }

      const devis = await res.json();
      setBenevoleDevis(Array.isArray(devis) ? devis : []);
    } catch (error) {
      console.error('Erreur chargement devis bénévole:', error);
      setBenevoleDevis([]);
    } finally {
      setDevisLoading(false);
    }
  };

  useEffect(() => {
    let liveInterval: ReturnType<typeof setInterval> | undefined;
    let taskInterval: ReturnType<typeof setInterval> | undefined;

    const initializeBenevole = async () => {
      const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!sessionRes.ok) {
        sessionStorage.removeItem('benevole_session');
        router.push('/benevole/login');
        return;
      }
      let nextSession = (await sessionRes.json()).session;

      // Always try to fetch and set participantId from email if not already set
      if (!nextSession?.participantId && nextSession?.email) {
        try {
          const res = await fetch('/api/participants', { cache: 'no-store' });
          if (res.ok) {
            const participantsList = await res.json();
            const match = Array.isArray(participantsList)
              ? participantsList.find((item: any) => String(item.email || '').trim().toLowerCase() === String(nextSession.email || '').trim().toLowerCase())
              : null;

            if (match?.id) {
              nextSession = { ...nextSession, participantId: match.id };
              if (!nextSession?.nomComplet && match?.nomComplet) {
                nextSession = { ...nextSession, nomComplet: match.nomComplet };
              }
              sessionStorage.setItem('benevole_session', JSON.stringify(nextSession));
            }
          }
        } catch (error) {
          console.error('Erreur résolution participant bénévole:', error);
        }
      }

      if (!nextSession?.nomComplet && nextSession?.email) {
        const derivedAliases = deriveBenevoleAliases(nextSession);
        const fallbackName = derivedAliases.find((alias) => alias && alias.includes(' ')) || derivedAliases[0] || nextSession.email;
        nextSession = {
          ...nextSession,
          nomComplet: titleCase(fallbackName),
        };
        sessionStorage.setItem('benevole_session', JSON.stringify(nextSession));
      }

      setBenevoleData(nextSession);
      loadLiveData();
      loadBenevoleTasks(deriveBenevoleAliases(nextSession), nextSession?.participantId);
      loadBenevoleDevis(nextSession?.nomComplet || nextSession?.email);

      liveInterval = setInterval(loadLiveData, 5000);
      // Tâches/devis changent moins souvent que les scores en direct : un
      // rafraîchissement plus espacé suffit et évite des requêtes inutiles.
      taskInterval = setInterval(() => {
        loadBenevoleTasks(deriveBenevoleAliases(nextSession), nextSession?.participantId);
        loadBenevoleDevis(nextSession?.nomComplet || nextSession?.email);
      }, 20000);
    };

    initializeBenevole();
    return () => {
      if (liveInterval) clearInterval(liveInterval);
      if (taskInterval) clearInterval(taskInterval);
    };
  }, [router]);

  useEffect(() => {
    if (benevoleTasks.length > 0 && !tasksAlertShown) {
      setTasksAlertShown(true);
      showUiMessage('success', `Vous avez ${benevoleTasks.length} tâche(s) à réaliser.`);
    }
  }, [benevoleTasks, tasksAlertShown]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      sessionStorage.removeItem('benevole_session');
      router.push('/');
    }
  };

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch = String(p.nomComplet || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (arrivalFilter === 'confirmed') return p.statutArrivee === 'present';
    if (arrivalFilter === 'absent') return p.statutArrivee === 'absent';
    if (arrivalFilter === 'en_attente') return p.statutArrivee !== 'present';
    return true;
  });

  const handleArrivalStatus = async (participantId: string, nom: string, status: 'present' | 'absent' | 'en_attente') => {
    try {
      const res = await fetch('/api/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, status }),
      });

      if (!res.ok) throw new Error('Erreur check-in');
      await loadLiveData();
      if (status === 'present') showUiMessage('success', `${nom} enregistré comme présent.`);
      if (status === 'absent') showUiMessage('success', `${nom} marqué absent.`);
      if (status === 'en_attente') showUiMessage('success', `${nom} repassé en attente.`);
    } catch {
      showUiMessage('error', 'Impossible de mettre à jour le statut d\'arrivée.');
    }
  };

  const handleSelectMatch = (match: any) => {
    setSelectedMatch(match);
    setScoreA(Number.isFinite(match?.scoreA) ? Number(match.scoreA) : 0);
    setScoreB(Number.isFinite(match?.scoreB) ? Number(match.scoreB) : 0);
  };

  const handleSaveScore = async () => {
    if (selectedMatch) {
      try {
        const res = await fetch('/api/matchs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: selectedMatch.id,
            scoreA,
            scoreB,
            statut: 'Terminé',
          }),
        });

        if (!res.ok) throw new Error('Erreur score');

        showUiMessage('success', `Score enregistré: ${selectedMatch.equipeA} ${scoreA} - ${scoreB} ${selectedMatch.equipeB}`);
        setSelectedMatch(null);
        setScoreA(0);
        setScoreB(0);
        await loadLiveData();
      } catch {
        showUiMessage('error', 'Impossible d\'enregistrer le score.');
      }
    }
  };

  const handleSetMatchStatus = async (matchId: string, statut: 'En cours' | 'Terminé') => {
    try {
      const payload: any = { matchId, statut };

      const res = await fetch('/api/matchs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erreur statut match');
      await loadLiveData();
      showUiMessage('success', `Statut du match mis à jour: ${statut}.`);
    } catch {
      showUiMessage('error', 'Impossible de mettre à jour le statut du match.');
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (incidentSubmitting) return;

    if (!incidentLieu.trim() || !incidentDescription.trim()) {
      showUiMessage('error', 'Lieu et description sont obligatoires.');
      return;
    }

    try {
      setIncidentSubmitting(true);
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeUrgence: incidentType,
          gravite: incidentGravite,
          lieu: incidentLieu,
          description: incidentDescription,
          personneConcernee: incidentPersonne,
          contactSignalant: benevoleData?.email || 'Bénévole',
          motUrgenceUtilise: incidentUrgenceCode,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Création incident impossible');
      }

      setIncidentLieu('');
      setIncidentDescription('');
      setIncidentPersonne('');
      setIncidentUrgenceCode(false);
      await loadLiveData();
      showUiMessage('success', 'Incident déclaré avec succès.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur incident';
      showUiMessage('error', message);
    } finally {
      setIncidentSubmitting(false);
    }
  };

  const handleIncidentStatus = async (id: string, statut: 'En traitement' | 'Résolu' | 'Clôturé') => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          statut,
          prisEnChargePar: benevoleData?.email || 'Bénévole',
        }),
      });

      if (!res.ok) throw new Error('Mise à jour impossible');
      await loadLiveData();
      showUiMessage('success', `Incident passé en statut: ${statut}.`);
    } catch {
      showUiMessage('error', 'Impossible de mettre à jour le statut incident.');
    }
  };

  const handleCreateDevis = async (e: React.FormEvent) => {
    e.preventDefault();

    const titre = newDevisTitre.trim();
    const montant = Number(newDevisMontant);
    if (!titre || !Number.isFinite(montant) || montant < 0) {
      showUiMessage('error', 'Titre et montant valides sont obligatoires.');
      return;
    }

    try {
      setDevisSubmitting(true);
      let pieceJointeUrls: string[] = [];

      if (newDevisFiles.length > 0) {
        const uploadFormData = new FormData();
        newDevisFiles.forEach((file) => uploadFormData.append('files', file));

        const uploadRes = await fetch('/api/devis/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.error || 'Upload impossible');
        }

        const uploadJson = await uploadRes.json();
        pieceJointeUrls = Array.isArray(uploadJson.files)
          ? uploadJson.files.map((file: any) => String(file?.url || '')).filter(Boolean)
          : [];
      }

      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre,
          montant,
          assigne: benevoleData?.nomComplet || benevoleData?.email || 'Bénévole',
          notes: newDevisNotes,
          pieceJointeUrls,
          statut: 'En attente',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Création devis impossible');
      }

      setNewDevisTitre('');
      setNewDevisMontant('');
      setNewDevisNotes('');
      setNewDevisFiles([]);
      await loadBenevoleDevis(benevoleData?.nomComplet || benevoleData?.email);
      showUiMessage('success', 'Devis ajouté avec succès.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur devis';
      showUiMessage('error', message);
    } finally {
      setDevisSubmitting(false);
    }
  };

  if (!benevoleData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFEF3F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#0D0D0D] border-b-[3px] border-[#FFEF3F] text-white">
        <div className="container mx-auto px-4 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Image src="/Logo_Tournoi_IUT_jaune.png" alt="Logo" width={40} height={40} className="flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500 mb-1">Espace Bénévole</p>
                <h1 className="text-xl font-black uppercase tracking-wide text-white">
                  {benevoleData.nomComplet || 'Bénévole'}
                </h1>
                <p className="text-sm text-[#FFEF3F] mt-0.5">{benevoleData.email}</p>
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
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Check-in', value: `${participants.filter((p) => p.statutArrivee === 'present').length}/${participants.filter((p) => p.statutArrivee !== 'absent').length}`, icon: <UserCheck className="w-4 h-4" /> },
            { label: 'Matchs', value: matchsDuJour.length, icon: <Trophy className="w-4 h-4" /> },
            { label: 'En cours', value: matchsDuJour.filter(m => m.statut === 'En cours').length, icon: <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-pulse inline-block" /> },
            { label: 'Incidents', value: incidents.filter((i) => i.statut !== 'Résolu' && i.statut !== 'Clôturé').length, icon: <AlertTriangle className="w-4 h-4" /> },
            { label: 'Mes tâches', value: benevoleTasks.length, icon: <ClipboardList className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="stat-card flex items-center gap-3 !p-4">
              <div className="w-8 h-8 bg-[#FFEF3F] flex items-center justify-center text-[#0D0D0D] flex-shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold leading-tight">{stat.label}</p>
                <p className="text-xl font-black text-white leading-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>


        {uiMessage && (
          <div className={`mb-4 border-l-4 px-4 py-3 text-sm font-semibold ${uiMessage.type === 'success' ? 'border-[#FFEF3F] bg-[#FFEF3F]/10 text-[#0D0D0D]' : 'border-[#DC2626] bg-red-50 text-red-800'}`}>
            {uiMessage.text}
          </div>
        )}

        <div className="panel-raised mb-6">
          <div className="flex overflow-x-auto">
            {([
              { id: 'checkin', label: 'Check-in', icon: <UserCheck className="w-4 h-4" /> },
              { id: 'matchs', label: 'Matchs', icon: <Trophy className="w-4 h-4" /> },
              { id: 'incidents', label: 'Incidents', icon: <ShieldAlert className="w-4 h-4" /> },
              { id: 'taches', label: 'Tâches', icon: <ClipboardList className="w-4 h-4" /> },
              { id: 'devis', label: 'Devis', icon: <FileText className="w-4 h-4" /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeSection === tab.id ? 'border-[#FFEF3F] bg-[#0D0D0D] text-white' : 'border-transparent text-gray-600 hover:text-[#0D0D0D] hover:bg-gray-50'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          {lastRefresh && (
            <p className="text-[10px] text-gray-400 px-4 py-2 border-t border-gray-100 uppercase tracking-widest">
              Données rafraîchies à {lastRefresh}
            </p>
          )}
        </div>

        {activeSection === 'checkin' && (
          <div className="table-frame">
            <div className="p-5 panel-deep border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4" />
                Check-in Participants
              </h2>
              <input
                type="text"
                placeholder="Rechercher un participant…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {(['all', 'confirmed', 'en_attente', 'absent'] as const).map((filter) => {
                  const labels: Record<string, string> = { all: 'Tous', confirmed: 'Présents', en_attente: 'En attente', absent: 'Absents' };
                  return (
                    <button
                      key={filter}
                      onClick={() => setArrivalFilter(filter)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide border transition-colors ${arrivalFilter === filter ? 'bg-[#0D0D0D] text-[#FFEF3F] border-[#0D0D0D]' : 'bg-white text-gray-600 border-gray-300 hover:border-[#0D0D0D] hover:text-[#0D0D0D]'}`}
                    >
                      {labels[filter]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={matchScrollPanelClass}>
              {filteredParticipants.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-600">Aucun participant trouvé avec ce filtre.</div>
              )}
              {filteredParticipants.map((participant, index) => (
                <div key={participant.id || index} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#0D0D0D] truncate">{participant.nomComplet}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{participant.iut}</div>
                      {(participant.allergiesAlimentaires || participant.tailleMaillot) && (
                        <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-3">
                          {participant.allergiesAlimentaires && (
                            <span className="text-amber-700">⚠ Allergies : {participant.allergiesAlimentaires}</span>
                          )}
                          {participant.tailleMaillot && <span>Maillot : {participant.tailleMaillot}</span>}
                        </div>
                      )}
                      <div className="mt-1.5">
                        {participant.statutArrivee === 'present' && (
                          <span className="bg-[#0D0D0D] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">Présent</span>
                        )}
                        {participant.statutArrivee === 'absent' && (
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-bold uppercase border border-red-200">Absent</span>
                        )}
                        {participant.statutArrivee === 'en_attente' && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 text-[10px] font-bold uppercase border border-gray-200">En attente</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleArrivalStatus(participant.id, participant.nomComplet, 'present')}
                        className="bg-[#0D0D0D] hover:bg-[#222] text-[#FFEF3F] px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors"
                      >
                        Présent
                      </button>
                      <button
                        onClick={() => handleArrivalStatus(participant.id, participant.nomComplet, 'absent')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors"
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleArrivalStatus(participant.id, participant.nomComplet, 'en_attente')}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors"
                      >
                        Attente
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'matchs' && (
          <div className="table-frame">
            <div className="p-5 panel-deep border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Matchs du Jour
              </h2>
              <p className="text-xs text-gray-500 mt-1">Démarre un match, saisis son score, puis clôture.</p>
            </div>
            <div className={scrollPanelClass}>
              {matchsDuJour.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">Aucun match disponible pour le moment.</div>
              )}
              {matchsDuJour.map((match) => (
                <div key={match.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div>
                      <div className="font-black text-[#0D0D0D] uppercase tracking-wide">
                        {match.sport === 'Basket' && '🏀 '}
                        {match.sport === 'Volley' && '🏐 '}
                        {match.idMatch || match.id}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{match.terrain || 'Terrain non renseigné'}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-black text-[#0D0D0D]">{match.heureDebut || '--:--'}</div>
                      {match.statut === 'En cours' ? (
                        <span className="bg-[#DC2626] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest mt-1 inline-block">En cours</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 text-[10px] font-bold uppercase border border-gray-200 mt-1 inline-block">{match.statut}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center mb-2">
                    <div className="font-semibold text-sm text-[#0D0D0D]">{match.equipeA}</div>
                    <div className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest">VS</div>
                    <div className="font-semibold text-sm text-right text-[#0D0D0D]">{match.equipeB}</div>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Score actuel: {match.scoreA ?? '—'} — {match.scoreB ?? '—'}
                  </div>

                  <button
                    onClick={() => handleSelectMatch(match)}
                    className="w-full btn-primary text-sm py-2"
                  >
                    Saisir le score
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleSetMatchStatus(match.id, 'En cours')}
                      className="bg-[#FFEF3F] hover:bg-[#e6d400] text-[#0D0D0D] py-1.5 px-3 font-bold transition-colors text-xs uppercase tracking-wide"
                    >
                      Démarrer
                    </button>
                    <button
                      onClick={() => handleSetMatchStatus(match.id, 'Terminé')}
                      className="bg-[#0D0D0D] hover:bg-[#222] text-white py-1.5 px-3 font-bold transition-colors text-xs uppercase tracking-wide"
                    >
                      Clôturer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'incidents' && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="panel-raised rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-2">Déclarer un incident</h3>
                <p className="text-sm text-gray-600 mb-4">Décris la situation puis sélectionne la gravité pour accélérer la prise en charge.</p>
                <form onSubmit={handleCreateIncident} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value as 'Médicale' | 'Sécurité' | 'Logistique' | 'Autre')}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Médicale">Médicale</option>
                      <option value="Sécurité">Sécurité</option>
                      <option value="Logistique">Logistique</option>
                      <option value="Autre">Autre</option>
                    </select>
                    <select
                      value={incidentGravite}
                      onChange={(e) => setIncidentGravite(e.target.value as '🟢 Faible' | '🟡 Modérée' | '🔴 Grave' | '🆘 Critique')}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="🟢 Faible">🟢 Faible</option>
                      <option value="🟡 Modérée">🟡 Modérée</option>
                      <option value="🔴 Grave">🔴 Grave</option>
                      <option value="🆘 Critique">🆘 Critique</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    value={incidentLieu}
                    onChange={(e) => setIncidentLieu(e.target.value)}
                    placeholder="Lieu de l'incident"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={incidentPersonne}
                    onChange={(e) => setIncidentPersonne(e.target.value)}
                    placeholder="Personne concernée (optionnel)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    placeholder="Description détaillée"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={incidentUrgenceCode}
                      onChange={(e) => setIncidentUrgenceCode(e.target.checked)}
                    />
                    Mot d'urgence utilisé
                  </label>
                  <button
                    type="submit"
                    disabled={incidentSubmitting}
                    className="w-full bg-[#DC2626] hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {incidentSubmitting ? 'Déclaration en cours...' : 'Déclarer l\'incident'}
                  </button>
                </form>
              </div>

              <div className="table-frame rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Suivi des incidents</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {incidents.length === 0 && <p className="text-sm text-gray-500">Aucun incident déclaré.</p>}
                  {incidents.map((incident) => (
                    <div key={incident.id} className="section-split p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-[#0D0D0D]">{incident.gravite} {incident.typeUrgence}</div>
                        <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 font-bold uppercase border border-gray-200">{incident.statut}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{incident.lieu}</p>
                      <p className="text-xs text-gray-500 mt-1">{incident.description}</p>
                      {incident.statut !== 'Résolu' && incident.statut !== 'Clôturé' && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          <button onClick={() => handleIncidentStatus(incident.id, 'En traitement')} className="bg-[#FFEF3F] hover:bg-[#e6d400] text-[#0D0D0D] text-xs py-1 px-2 font-bold uppercase transition-colors">En traitement</button>
                          <button onClick={() => handleIncidentStatus(incident.id, 'Résolu')} className="bg-[#0D0D0D] hover:bg-[#222] text-white text-xs py-1 px-2 font-bold uppercase transition-colors">Résolu</button>
                          <button onClick={() => handleIncidentStatus(incident.id, 'Clôturé')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs py-1 px-2 font-bold uppercase transition-colors">Clôturé</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 bg-[#0D0D0D] border-l-4 border-[#DC2626] p-5">
              <h3 className="font-black text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                Numéros d'Urgence
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                <a href="tel:15" className="bg-white/5 hover:bg-[#FFEF3F]/10 hover:border-[#FFEF3F] border border-white/10 p-4 flex items-center gap-3 transition-colors">
                  <span className="text-2xl">🚑</span>
                  <div>
                    <div className="font-bold text-white">SAMU</div>
                    <div className="text-[#DC2626] font-black text-lg">15</div>
                  </div>
                </a>
                <a href="tel:18" className="bg-white/5 hover:bg-[#FFEF3F]/10 hover:border-[#FFEF3F] border border-white/10 p-4 flex items-center gap-3 transition-colors">
                  <span className="text-2xl">🚒</span>
                  <div>
                    <div className="font-bold text-white">Pompiers</div>
                    <div className="text-[#DC2626] font-black text-lg">18</div>
                  </div>
                </a>
                <a href="tel:0612345678" className="bg-white/5 hover:bg-[#FFEF3F]/10 hover:border-[#FFEF3F] border border-white/10 p-4 flex items-center gap-3 transition-colors">
                  <span className="text-2xl">📞</span>
                  <div>
                    <div className="font-bold text-white">PC Organisation</div>
                    <div className="text-[#DC2626] font-black text-sm">06 12 34 56 78</div>
                  </div>
                </a>
              </div>
            </div>
          </>
        )}

        {activeSection === 'taches' && (
          <div className="table-frame">
            <div className="p-5 panel-deep border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Mes Tâches
              </h2>
              <p className="text-xs text-gray-500 mt-1">{benevoleTasks.length} tâche(s) assignée(s) à votre compte.</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-[41.4rem] overflow-y-auto">
              {benevoleTasks.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-400">Aucune tâche assignée pour le moment.</div>
              )}
              {benevoleTasks.map((task: any) => {
                const priorite = String(task.priorite || '').toLowerCase();
                const isUrgent = priorite.includes('urgent') || priorite.includes('critique') || priorite.includes('important');
                const isDone = String(task.statut || '').toLowerCase().includes('termin');
                return (
                  <div key={task.id} className="p-4 hover:bg-gray-50 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isUrgent && !isDone && (
                          <span className="bg-[#FFEF3F] text-[#0D0D0D] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest flex-shrink-0">Urgent</span>
                        )}
                        <span className={`font-semibold text-sm truncate ${isDone ? 'line-through text-gray-400' : 'text-[#0D0D0D]'}`}>
                          {task.tache || task.titre}
                        </span>
                      </div>
                      {task.deadline && <p className="text-xs text-gray-500">Deadline: {task.deadline}</p>}
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 border border-gray-200 font-bold uppercase mt-1 inline-block">{task.statut}</span>
                    </div>
                    <Link
                      href={`/benevole/taches/${task.id}`}
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-[#0D0D0D] hover:text-[#FFEF3F] uppercase tracking-wide transition-colors"
                    >
                      Détails
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {benevoleUrgentTasks.length > 0 && activeSection !== 'taches' && (
          <div className="mb-4 border-l-4 border-[#FFEF3F] bg-[#FFEF3F]/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D]">Tâches prioritaires</h2>
                <p className="text-sm text-gray-700 mt-1">
                  {benevoleUrgentTasks.length} tâche(s) importante(s) vous sont associées.
                </p>
              </div>
              <div className="text-2xl font-black text-[#0D0D0D]">{benevoleUrgentTasks.length}</div>
            </div>
          </div>
        )}

        {activeSection === 'devis' && (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="panel-raised p-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] mb-4">Ajouter un devis</h3>
              <form onSubmit={handleCreateDevis} className="space-y-3">
                <input
                  type="text"
                  value={newDevisTitre}
                  onChange={(e) => setNewDevisTitre(e.target.value)}
                  placeholder="Titre du devis"
                  className="input"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newDevisMontant}
                  onChange={(e) => setNewDevisMontant(e.target.value)}
                  placeholder="Montant (€)"
                  className="input"
                />
                <textarea
                  value={newDevisNotes}
                  onChange={(e) => setNewDevisNotes(e.target.value)}
                  placeholder="Notes (optionnel)"
                  rows={3}
                  className="input resize-none"
                />
                <div>
                  <label className="label">Pièces jointes</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setNewDevisFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm text-gray-600"
                  />
                  {newDevisFiles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {newDevisFiles.length} fichier(s) sélectionné(s)
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={devisSubmitting}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {devisSubmitting ? 'Ajout en cours…' : 'Ajouter le devis'}
                </button>
              </form>
            </div>

            <div className="table-frame p-5">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] mb-1">Mes devis</h3>
              <p className="text-xs text-gray-400 mb-4">
                {devisLoading ? 'Chargement…' : `${benevoleDevis.length} devis lié(s) à votre compte.`}
              </p>
              <div className="space-y-3 max-h-[34rem] overflow-y-auto">
                {benevoleDevis.length === 0 && !devisLoading && (
                  <p className="text-sm text-gray-400">Aucun devis pour le moment.</p>
                )}
                {benevoleDevis.map((devis) => (
                  <div key={devis.id} className="section-split p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#0D0D0D]">{devis.titre}</div>
                        <div className="text-sm text-gray-600 font-bold">{devis.montant?.toLocaleString('fr-FR')}€</div>
                      </div>
                      <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 font-bold uppercase border border-gray-200 flex-shrink-0">{devis.statut}</span>
                    </div>
                    {devis.dateReception && <p className="text-xs text-gray-400 mt-1.5">Reçu le {devis.dateReception}</p>}
                    {devis.notes && <p className="text-sm text-gray-600 mt-2">{devis.notes}</p>}
                    {Array.isArray(devis.piecesJointes) && devis.piecesJointes.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {devis.piecesJointes.map((piece: any) => (
                          <a
                            key={piece.id}
                            href={piece.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-[#0D0D0D] hover:text-[#FFEF3F] hover:underline font-semibold"
                          >
                            {piece.filename}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal saisie score */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="panel-raised shadow-2xl max-w-md w-full p-6 border-t-4 border-[#FFEF3F]">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] mb-5">
              Saisie Score — {selectedMatch.idMatch || selectedMatch.id}
            </h3>

            <div className="space-y-6">
              {/* Équipe A */}
              <div>
                <label className="label">{selectedMatch.equipeA}</label>
                <div className="flex items-center gap-4 mt-1">
                  <button
                    onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 font-black text-xl transition-colors border border-gray-200"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-6xl font-black text-[#0D0D0D]">{scoreA}</div>
                    <input
                      type="number"
                      min={0}
                      value={scoreA}
                      onChange={(e) => setScoreA(Math.max(0, Number(e.target.value) || 0))}
                      className="mt-2 w-20 text-center input text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setScoreA(scoreA + 1)}
                    className="w-12 h-12 bg-[#0D0D0D] hover:bg-[#222] text-[#FFEF3F] font-black text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Équipe B */}
              <div>
                <label className="label">{selectedMatch.equipeB}</label>
                <div className="flex items-center gap-4 mt-1">
                  <button
                    onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 font-black text-xl transition-colors border border-gray-200"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-6xl font-black text-[#0D0D0D]">{scoreB}</div>
                    <input
                      type="number"
                      min={0}
                      value={scoreB}
                      onChange={(e) => setScoreB(Math.max(0, Number(e.target.value) || 0))}
                      className="mt-2 w-20 text-center input text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setScoreB(scoreB + 1)}
                    className="w-12 h-12 bg-[#0D0D0D] hover:bg-[#222] text-[#FFEF3F] font-black text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 btn-secondary py-3"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveScore}
                  className="flex-1 btn-primary py-3"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
