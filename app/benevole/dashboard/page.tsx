'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, UserCheck, Trophy, AlertTriangle, ClipboardList, ShieldAlert, FileText } from 'lucide-react';

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

  const result = Array.from(aliases).filter(Boolean);
  console.log('📧 Derived aliases for', email, ':', result);
  return result;
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
  const scrollPanelClass = 'divide-y divide-slate-200/70 max-h-[41.4rem] overflow-y-auto';
  const matchScrollPanelClass = 'divide-y divide-slate-200/70 max-h-[34.7rem] overflow-y-auto';

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
      
      console.log('🔍 DEBUG - Normalized Aliases:', normalizedAliases);
      console.log('🔍 DEBUG - Participant ID:', pidLower);
      console.log('🔍 DEBUG - All tasks count:', allTasks.length);
      
      const matchedTasks = allTasks.filter((task: any) => {
        // Direct ID match
        if (pidLower && String(task.responsable || '').trim().toLowerCase() === pidLower) {
          console.log('✅ Task matched by ID:', task.titre, '| Responsable ID:', task.responsable);
          return true;
        }
        
        // Name/alias match
        const taskResponsables = Array.isArray(task.responsable) ? task.responsable : [task.responsable];
        const normalizedResponsables = taskResponsables.map((value: unknown) => normalizeLabel(String(value || ''))).filter(Boolean);

        if (normalizedResponsables.length === 0) {
          return false;
        }

        const isMatch = normalizedResponsables.some((taskResponsable: string) =>
          normalizedAliases.some((alias) => {
            return taskResponsable === alias || taskResponsable.includes(alias) || alias.includes(taskResponsable);
          })
        );
        
        if (isMatch) {
          console.log('✅ Task matched by name:', task.titre, '| Responsables:', normalizedResponsables);
        }
        
        return isMatch;
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
    const session = sessionStorage.getItem('benevole_session');
    if (!session) {
      router.push('/benevole/login');
      return;
    }
    const parsedSession = JSON.parse(session);

    const initializeBenevole = async () => {
      let nextSession = parsedSession;

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
    };

    initializeBenevole();
    const interval = setInterval(loadLiveData, 5000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (benevoleTasks.length > 0 && !tasksAlertShown) {
      setTasksAlertShown(true);
      showUiMessage('success', `Vous avez ${benevoleTasks.length} tâche(s) à réaliser.`);
    }
  }, [benevoleTasks, tasksAlertShown]);

  const handleLogout = () => {
    sessionStorage.removeItem('benevole_session');
    router.push('/');
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
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lorraine-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-lorraine-red to-red-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Bénévole</h1>
              <p className="text-red-100 mt-1">{benevoleData.email}</p>
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
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="panel-raised rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Check-in</p>
                <p className="text-2xl font-bold">
                  {participants.filter((p) => p.statutArrivee === 'present').length}/{participants.filter((p) => p.statutArrivee !== 'absent').length}
                </p>
              </div>
            </div>
          </div>

          <div className="panel-raised rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-lorraine-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Matchs du jour</p>
                <p className="text-2xl font-bold">{matchsDuJour.length}</p>
              </div>
            </div>
          </div>

          <div className="panel-raised rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold">
                  {matchsDuJour.filter(m => m.statut === 'En cours').length}
                </p>
              </div>
            </div>
          </div>

          <div className="panel-raised rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Incidents</p>
                <p className="text-2xl font-bold">{incidents.filter((i) => i.statut !== 'Résolu' && i.statut !== 'Clôturé').length}</p>
              </div>
            </div>
          </div>

          <div className="panel-raised rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mes tâches</p>
                <p className="text-2xl font-bold">{benevoleTasks.length}</p>
              </div>
            </div>
          </div>
        </div>


        {uiMessage && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${uiMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {uiMessage.text}
          </div>
        )}

        <div className="panel-raised rounded-lg p-3 mb-6">
          <div className="grid sm:grid-cols-3 gap-2">
            <button
              onClick={() => setActiveSection('checkin')}
              className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${activeSection === 'checkin' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
            >
              <UserCheck className="w-4 h-4" />
              Check-in
            </button>
            <button
              onClick={() => setActiveSection('matchs')}
              className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${activeSection === 'matchs' ? 'bg-lorraine-blue text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
            >
              <ClipboardList className="w-4 h-4" />
              Matchs
            </button>
            <button
              onClick={() => setActiveSection('incidents')}
              className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${activeSection === 'incidents' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              Incidents
            </button>
            <button
              onClick={() => setActiveSection('taches')}
              className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${activeSection === 'taches' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
            >
              <ClipboardList className="w-4 h-4" />
              Tâches
            </button>
            <button
              onClick={() => setActiveSection('devis')}
              className={`px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${activeSection === 'devis' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
            >
              <FileText className="w-4 h-4" />
              Devis
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 px-1">
            Zone active: {activeSection === 'checkin' ? 'Validation des arrivées' : activeSection === 'matchs' ? 'Pilotage des matchs' : activeSection === 'incidents' ? 'Gestion des incidents' : 'Gestion des devis'}
            {lastRefresh ? ` • Données rafraîchies à ${lastRefresh}` : ''}
          </p>
        </div>

        {activeSection === 'checkin' && (
          <div className="panel-raised rounded-lg">
            <div className="p-6 panel-deep rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Check-in Participants
              </h2>
              <p className="text-sm text-gray-600 mt-1">Recherche rapide puis changement de statut en un clic.</p>
              <input
                type="text"
                placeholder="Rechercher un participant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lorraine-red"
              />
              <div className="mt-3 grid sm:grid-cols-5 gap-2">
                <button
                  onClick={() => setArrivalFilter('all')}
                  className={`px-3 py-2 rounded text-sm font-semibold ${arrivalFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setArrivalFilter('confirmed')}
                  className={`px-3 py-2 rounded text-sm font-semibold ${arrivalFilter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
                >
                  Confirmées
                </button>
                <button
                  onClick={() => setArrivalFilter('en_attente')}
                  className={`px-3 py-2 rounded text-sm font-semibold ${arrivalFilter === 'en_attente' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
                >
                  En attente
                </button>
                <button
                  onClick={() => setArrivalFilter('absent')}
                  className={`px-3 py-2 rounded text-sm font-semibold ${arrivalFilter === 'absent' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
                >
                  Absents
                </button>
              </div>
            </div>
            <div className={matchScrollPanelClass}>
              {filteredParticipants.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-600">Aucun participant trouvé avec ce filtre.</div>
              )}
              {filteredParticipants.map((participant, index) => (
                <div key={participant.id || index} className="p-4 hover:bg-slate-100/80">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold">{participant.nomComplet}</div>
                      <div className="text-sm text-gray-600">{participant.iut}</div>
                      <div className="text-xs text-gray-500 mt-1">{participant.licenceSportive || 'Licence non renseignée'}</div>
                      <div className="mt-2">
                        {participant.statutArrivee === 'present' && (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">Présent</span>
                        )}
                        {participant.statutArrivee === 'absent' && (
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">Absent</span>
                        )}
                        {participant.statutArrivee === 'en_attente' && (
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">En attente</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-1 gap-2 min-w-40">
                      <button
                        onClick={() => handleArrivalStatus(participant.id, participant.nomComplet, 'present')}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Présent
                      </button>
                      <button
                        onClick={() => handleArrivalStatus(participant.id, participant.nomComplet, 'absent')}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleArrivalStatus(participant.id, participant.nomComplet, 'en_attente')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        En attente
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'matchs' && (
          <div className="panel-raised rounded-lg">
            <div className="p-6 panel-deep rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-lorraine-blue" />
                Matchs du Jour
              </h2>
              <p className="text-sm text-gray-600 mt-1">Démarre un match, saisis son score, puis clôture.</p>
            </div>
            <div className={scrollPanelClass}>
              {matchsDuJour.length === 0 && (
                <div className="p-8 text-center text-sm text-gray-600">Aucun match disponible pour le moment.</div>
              )}
              {matchsDuJour.map((match) => (
                <div key={match.id} className="p-4 hover:bg-slate-100/80">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div>
                      <div className="font-bold text-lg flex items-center gap-2">
                        {match.sport === 'Basket' && '🏀'}
                        {match.sport === 'Volley' && '🏐'}
                        {match.idMatch || match.id}
                      </div>
                      <div className="text-sm text-gray-600">{match.terrain || 'Terrain non renseigné'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-lorraine-blue">{match.heureDebut || '--:--'}</div>
                      {match.statut === 'En cours' ? (
                        <div className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold mt-1">En cours</div>
                      ) : (
                        <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold mt-1">{match.statut}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 items-center mb-2">
                    <div className="font-semibold text-sm">{match.equipeA}</div>
                    <div className="text-center text-gray-500 text-sm">VS</div>
                    <div className="font-semibold text-sm text-right">{match.equipeB}</div>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">
                    Score actuel: {match.scoreA ?? '-'} - {match.scoreB ?? '-'}
                  </div>

                  <button
                    onClick={() => handleSelectMatch(match)}
                    className="w-full bg-lorraine-blue hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm"
                  >
                    Saisir le score
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleSetMatchStatus(match.id, 'En cours')}
                      className="bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-lg font-semibold transition-colors text-xs"
                    >
                      Démarrer
                    </button>
                    <button
                      onClick={() => handleSetMatchStatus(match.id, 'Terminé')}
                      className="bg-gray-700 hover:bg-gray-800 text-white py-2 px-3 rounded-lg font-semibold transition-colors text-xs"
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
                    className="w-full bg-lorraine-red hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {incidentSubmitting ? 'Déclaration en cours...' : 'Déclarer l\'incident'}
                  </button>
                </form>
              </div>

              <div className="panel-raised rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Suivi des incidents</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {incidents.length === 0 && <p className="text-sm text-gray-500">Aucun incident déclaré.</p>}
                  {incidents.map((incident) => (
                    <div key={incident.id} className="section-split rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm">{incident.gravite} {incident.typeUrgence}</div>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{incident.statut}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{incident.lieu}</p>
                      <p className="text-xs text-gray-600 mt-1">{incident.description}</p>
                      {incident.statut !== 'Résolu' && incident.statut !== 'Clôturé' && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <button onClick={() => handleIncidentStatus(incident.id, 'En traitement')} className="bg-amber-500 hover:bg-amber-600 text-white text-xs py-1.5 rounded">En traitement</button>
                          <button onClick={() => handleIncidentStatus(incident.id, 'Résolu')} className="bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded">Résolu</button>
                          <button onClick={() => handleIncidentStatus(incident.id, 'Clôturé')} className="bg-gray-700 hover:bg-gray-800 text-white text-xs py-1.5 rounded">Clôturé</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Numéros d'Urgence
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <a href="tel:15" className="panel hover:bg-slate-100/80 rounded-lg p-4 flex items-center gap-3 transition-colors">
                  <div className="text-2xl">🚑</div>
                  <div>
                    <div className="font-bold">SAMU</div>
                    <div className="text-red-600 font-bold">15</div>
                  </div>
                </a>
                <a href="tel:18" className="panel hover:bg-slate-100/80 rounded-lg p-4 flex items-center gap-3 transition-colors">
                  <div className="text-2xl">🚒</div>
                  <div>
                    <div className="font-bold">Pompiers</div>
                    <div className="text-red-600 font-bold">18</div>
                  </div>
                </a>
                <a href="tel:0612345678" className="panel hover:bg-slate-100/80 rounded-lg p-4 flex items-center gap-3 transition-colors">
                  <div className="text-2xl">👨‍💼</div>
                  <div>
                    <div className="font-bold">PC Organisation</div>
                    <div className="text-red-600 font-bold">06 12 34 56 78</div>
                  </div>
                </a>
              </div>
            </div>
          </>
        )}

        {benevoleUrgentTasks.length > 0 && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-amber-900">Tâches prioritaires</h2>
                <p className="text-sm text-amber-800 mt-1">
                  {benevoleUrgentTasks.length} tâche(s) importante(s) vous sont associées.
                </p>
              </div>
              <div className="text-2xl font-bold text-amber-700">{benevoleUrgentTasks.length}</div>
            </div>
          </div>
        )}

        {activeSection === 'devis' && (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="panel-raised rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Ajouter un devis</h3>
              <p className="text-sm text-gray-600 mb-4">
                Le devis sera relié à votre compte et visible dans le dashboard admin.
              </p>
              <form onSubmit={handleCreateDevis} className="space-y-3">
                <input
                  type="text"
                  value={newDevisTitre}
                  onChange={(e) => setNewDevisTitre(e.target.value)}
                  placeholder="Titre du devis"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={newDevisMontant}
                  onChange={(e) => setNewDevisMontant(e.target.value)}
                  placeholder="Montant"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  value={newDevisNotes}
                  onChange={(e) => setNewDevisNotes(e.target.value)}
                  placeholder="Notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pièces jointes</label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setNewDevisFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm"
                  />
                  {newDevisFiles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {newDevisFiles.length} fichier(s) sélectionné(s)
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={devisSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50"
                >
                  {devisSubmitting ? 'Ajout en cours...' : 'Ajouter le devis'}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-3">
                Les fichiers sont déposés sur le site puis enregistrés dans Airtable comme pièces jointes.
              </p>
            </div>

            <div className="panel-raised rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-2">Mes devis</h3>
              <p className="text-sm text-gray-600 mb-4">
                {devisLoading ? 'Chargement...' : `${benevoleDevis.length} devis lié(s) à votre compte.`}
              </p>
              <div className="space-y-3 max-h-[34rem] overflow-y-auto">
                {benevoleDevis.length === 0 && !devisLoading && (
                  <p className="text-sm text-gray-500">Aucun devis pour le moment.</p>
                )}
                {benevoleDevis.map((devis) => (
                  <div key={devis.id} className="section-split rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{devis.titre}</div>
                        <div className="text-sm text-gray-600">{devis.montant?.toLocaleString('fr-FR')}€</div>
                      </div>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{devis.statut}</span>
                    </div>
                    {devis.dateReception && <p className="text-xs text-gray-500 mt-2">Réception: {devis.dateReception}</p>}
                    {devis.notes && <p className="text-sm text-gray-700 mt-2">{devis.notes}</p>}
                    {Array.isArray(devis.piecesJointes) && devis.piecesJointes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {devis.piecesJointes.map((piece: any) => (
                          <a
                            key={piece.id}
                            href={piece.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-lorraine-blue hover:underline"
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
          <div className="panel-raised rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              📊 Saisie Score - {selectedMatch.idMatch || selectedMatch.id}
            </h3>

            <div className="space-y-6">
              {/* Équipe A */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedMatch.equipeA}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setScoreA(Math.max(0, scoreA - 1))}
                    className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-5xl font-bold text-lorraine-blue">{scoreA}</div>
                    <input
                      type="number"
                      min={0}
                      value={scoreA}
                      onChange={(e) => setScoreA(Math.max(0, Number(e.target.value) || 0))}
                      className="mt-2 w-24 text-center px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <button
                    onClick={() => setScoreA(scoreA + 1)}
                    className="w-12 h-12 bg-lorraine-blue hover:bg-blue-700 text-white rounded-lg font-bold text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Équipe B */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedMatch.equipeB}
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setScoreB(Math.max(0, scoreB - 1))}
                    className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-xl"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-5xl font-bold text-lorraine-blue">{scoreB}</div>
                    <input
                      type="number"
                      min={0}
                      value={scoreB}
                      onChange={(e) => setScoreB(Math.max(0, Number(e.target.value) || 0))}
                      className="mt-2 w-24 text-center px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <button
                    onClick={() => setScoreB(scoreB + 1)}
                    className="w-12 h-12 bg-lorraine-blue hover:bg-blue-700 text-white rounded-lg font-bold text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveScore}
                  className="flex-1 bg-lorraine-red hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
                >
                  💾 Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
