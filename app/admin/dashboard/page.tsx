'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, Users, Trophy, DollarSign, AlertCircle, CheckCircle, ClipboardList } from 'lucide-react';

const BUDGET_CATEGORIES = ['Logistique', 'Sport', 'Communication', 'Restauration', 'Hébergement', 'Transport', 'Autre'];
const POULE_OPTIONS = ['', 'Poule A', 'Poule B', 'Poule C', 'Poule D'];
const TACHE_PRIORITES = ['Normale', 'Importante', 'Urgente', 'Critique'];
const TACHE_CATEGORIES = ['Logistique', 'Sport', 'Communication', 'Restauration', 'Hébergement', 'Transport', 'Sécurité', 'Autre'];

interface AdminDashboardApiData {
  overview: {
    iutConfirmes: number;
    iutTotal: number;
    participantsInscrits: number;
    participantsTotal: number;
    budgetCollecte: number;
    budgetPrevu: number;
    tachesUrgentes: number;
    devisEnAttente: number;
    devisTotal: number;
  };
  iut: Array<{
    id: string;
    nom: string;
    statutParticipation: string;
    nombreParticipants: number;
    nombreSpectateurs: number;
    transportSouhaite: string;
    hebergementRequis: string;
    budgetPaye: boolean;
  }>;
  equipes: Array<{
    id: string;
    nom: string;
    iut: string;
    statutInscription: string;
    statutValidation: 'En attente' | 'Validée' | 'Refusée';
    documentsValides: boolean;
    motifRefus?: string;
    pouleAssignee?: string;
  }>;
  matchs: Array<{
    id: string;
    idMatch: string;
    sport: string;
    date: string;
    heureDebut: string;
    terrain?: string;
    equipeA: string;
    equipeB: string;
    statut: string;
    scoreA?: number;
    scoreB?: number;
  }>;
  participants: Array<{
    id: string;
    nomComplet: string;
    email: string;
    iut: string;
    equipe?: string;
    equipeIds: string[];
    type: string;
    licenceValidee: boolean;
    arriveeConfirmee: boolean;
    allergiesAlimentaires?: string;
    tailleMaillot?: string;
    licenceSportive?: string;
    transport?: string;
    hebergement?: boolean;
    departConfirme?: boolean;
  }>;
  budget: Array<{
    id: string;
    poste: string;
    categorie: string;
    type: string;
    montantPrevu: number;
    montantReel: number;
    statutPaiement: string;
  }>;
  urgentTasks: Array<{
    id: string;
    tache: string;
    description: string;
    priorite: string;
    statut: string;
  }>;
  incidentsEnCours: Array<{
    id: string;
    typeUrgence: string;
    gravite: string;
    lieu: string;
    description: string;
    statut: string;
  }>;
  devis: Array<{
    id: string;
    titre: string;
    montant: number;
    assigne?: string;
    statut: string;
    dateReception?: string;
    notes?: string;
    piecesJointes?: Array<{ id: string; url: string; filename: string; size: number; type: string }>;
  }>;
}

interface IncidentRow {
  id: string;
  typeUrgence: string;
  gravite: string;
  lieu: string;
  description: string;
  statut: 'Signalé' | 'En traitement' | 'Résolu' | 'Clôturé';
  personneConcernee?: string;
  contactSignalant?: string;
}

export default function DashboardAdminPage() {
  const router = useRouter();
  const [adminData, setAdminData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [liveData, setLiveData] = useState<AdminDashboardApiData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [budgetEdits, setBudgetEdits] = useState<Record<string, {
    poste: string;
    categorie: string;
    type: string;
    montantPrevu: number;
    montantReel: number;
    statutPaiement: string;
  }>>({});
  const [budgetSaving, setBudgetSaving] = useState<string | null>(null);
  const [creatingBudgetLine, setCreatingBudgetLine] = useState(false);
  const [newBudgetLine, setNewBudgetLine] = useState({
    poste: '',
    categorie: 'Logistique',
    type: 'Dépense',
    montantPrevu: 0,
    montantReel: 0,
    statutPaiement: 'En attente',
  });
  const [selectedEquipeId, setSelectedEquipeId] = useState<string>('');
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [rosterSaving, setRosterSaving] = useState<string | null>(null);
  const [participantSaving, setParticipantSaving] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [incidentSaving, setIncidentSaving] = useState<string | null>(null);
  const [matchSaving, setMatchSaving] = useState<string | null>(null);
  const [matchSearch, setMatchSearch] = useState<string>('');
  const [matchStatusFilter, setMatchStatusFilter] = useState<'all' | 'Programmé' | 'En cours' | 'Terminé'>('all');
  const [matchSportFilter, setMatchSportFilter] = useState<string>('all');
  const [matchEdits, setMatchEdits] = useState<Record<string, {
    scoreA: string;
    scoreB: string;
    statut: 'Programmé' | 'En cours' | 'Terminé';
  }>>({});
  const [uiMessage, setUiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [candidatureSaving, setCandidatureSaving] = useState<string | null>(null);
  const [motifRefusDraft, setMotifRefusDraft] = useState<Record<string, string>>({});
  const [iutSaving, setIutSaving] = useState<string | null>(null);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [newMatch, setNewMatch] = useState({
    idMatch: '', sport: '', phase: '', date: '', heureDebut: '', terrain: '', equipeA: '', equipeB: '',
  });
  const [taches, setTaches] = useState<Array<{
    id: string; tache: string; description: string; responsable: string; statut: string; priorite: string; deadline: string; categorie: string;
  }>>([]);
  const [creatingTache, setCreatingTache] = useState(false);
  const [newTache, setNewTache] = useState({
    tache: '', description: '', responsable: '', priorite: 'Normale', deadline: '', categorie: 'Logistique',
  });
  const [tacheSaving, setTacheSaving] = useState<string | null>(null);

  const showUiMessage = (type: 'success' | 'error', text: string) => {
    setUiMessage({ type, text });
    setTimeout(() => setUiMessage(null), 3200);
  };

  const loadAdminData = async () => {
    try {
      const [dashboardRes, incidentsRes] = await Promise.all([
        fetch('/api/admin/dashboard', { cache: 'no-store' }),
        fetch('/api/incidents', { cache: 'no-store' }),
      ]);

      if (dashboardRes.status === 401 || dashboardRes.status === 403) {
        sessionStorage.removeItem('admin_session');
        router.push('/admin/login');
        return;
      }
      if (!dashboardRes.ok) throw new Error('Erreur API dashboard');

      const dashboardJson = await dashboardRes.json();
      setLiveData(dashboardJson);

      if (incidentsRes.ok) {
        const incidentsJson = await incidentsRes.json();
        setIncidents(Array.isArray(incidentsJson) ? incidentsJson : []);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard admin:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const updateIncidentStatus = async (
    incidentId: string,
    statut: 'Signalé' | 'En traitement' | 'Résolu' | 'Clôturé'
  ) => {
    try {
      setIncidentSaving(incidentId);
      const res = await fetch('/api/incidents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: incidentId,
          statut,
          prisEnChargePar: adminData?.email || 'admin',
        }),
      });

      if (!res.ok) throw new Error('Erreur incident');
      await loadAdminData();
    } catch {
      showUiMessage('error', 'Impossible de mettre à jour cet incident.');
    } finally {
      setIncidentSaving(null);
    }
  };

  const handleMatchEditChange = (
    matchId: string,
    field: 'scoreA' | 'scoreB' | 'statut',
    value: string
  ) => {
    const match = matchs.find((m) => m.id === matchId);
    if (!match) return;

    const current = matchEdits[matchId] || {
      scoreA: match.scoreA !== undefined ? String(match.scoreA) : '',
      scoreB: match.scoreB !== undefined ? String(match.scoreB) : '',
      statut: (match.statut as 'Programmé' | 'En cours' | 'Terminé') || 'Programmé',
    };

    setMatchEdits((prev) => ({
      ...prev,
      [matchId]: {
        ...current,
        [field]: value,
      },
    }));
  };

  const saveMatchUpdate = async (matchId: string) => {
    const match = matchs.find((m) => m.id === matchId);
    if (!match) return;

    const patch = matchEdits[matchId] || {
      scoreA: match.scoreA !== undefined ? String(match.scoreA) : '',
      scoreB: match.scoreB !== undefined ? String(match.scoreB) : '',
      statut: (match.statut as 'Programmé' | 'En cours' | 'Terminé') || 'Programmé',
    };

    const hasScoreA = patch.scoreA.trim() !== '';
    const hasScoreB = patch.scoreB.trim() !== '';

    if (hasScoreA !== hasScoreB) {
      showUiMessage('error', 'Pour enregistrer un score, renseignez les deux équipes.');
      return;
    }

    const payload: any = {
      matchId,
      statut: patch.statut,
    };

    if (hasScoreA && hasScoreB) {
      const parsedA = Number(patch.scoreA);
      const parsedB = Number(patch.scoreB);
      if (!Number.isFinite(parsedA) || !Number.isFinite(parsedB)) {
        showUiMessage('error', 'Les scores doivent être des nombres valides.');
        return;
      }
      payload.scoreA = parsedA;
      payload.scoreB = parsedB;
    }

    try {
      setMatchSaving(matchId);
      const res = await fetch('/api/matchs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur match');
      }

      await loadAdminData();
      setMatchEdits((prev) => {
        const clone = { ...prev };
        delete clone[matchId];
        return clone;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de sauvegarder ce match.';
      showUiMessage('error', message);
    } finally {
      setMatchSaving(null);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const init = async () => {
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!res.ok) {
        sessionStorage.removeItem('admin_session');
        router.push('/admin/login');
        return;
      }
      const { session } = await res.json();
      sessionStorage.setItem('admin_session', JSON.stringify(session));
      setAdminData(session);
      loadAdminData();
      loadTaches();
      interval = setInterval(loadAdminData, 10000);
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
      sessionStorage.removeItem('admin_session');
      router.push('/');
    }
  };

  const handleBudgetFieldChange = (
    lineId: string,
    field: 'poste' | 'categorie' | 'type' | 'montantPrevu' | 'montantReel' | 'statutPaiement',
    value: string
  ) => {
    const line = budget.find((item) => item.id === lineId);
    if (!line) return;

    const current = budgetEdits[lineId] || {
      poste: line.poste,
      categorie: line.categorie,
      type: line.type,
      montantPrevu: line.montantPrevu,
      montantReel: line.montantReel,
      statutPaiement: line.statutPaiement,
    };

    const nextValue = field === 'montantPrevu' || field === 'montantReel' ? Number(value || 0) : value;
    setBudgetEdits((prev) => ({
      ...prev,
      [lineId]: {
        ...current,
        [field]: nextValue,
      },
    }));
  };

  const saveBudgetLine = async (lineId: string) => {
    const patch = budgetEdits[lineId];
    if (!patch) return;

    try {
      setBudgetSaving(lineId);
      const res = await fetch('/api/budget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lineId, ...patch }),
      });
      if (!res.ok) throw new Error('Erreur budget');
      await loadAdminData();
      setBudgetEdits((prev) => {
        const clone = { ...prev };
        delete clone[lineId];
        return clone;
      });
    } catch {
      showUiMessage('error', 'Impossible de sauvegarder la ligne budget.');
    } finally {
      setBudgetSaving(null);
    }
  };

  const createBudgetLine = async () => {
    if (!newBudgetLine.poste.trim()) {
      showUiMessage('error', 'Le poste est obligatoire.');
      return;
    }

    try {
      setCreatingBudgetLine(true);
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBudgetLine),
      });

      if (!res.ok) throw new Error('Erreur création');

      setNewBudgetLine({
        poste: '',
        categorie: 'Logistique',
        type: 'Dépense',
        montantPrevu: 0,
        montantReel: 0,
        statutPaiement: 'En attente',
      });

      await loadAdminData();
    } catch {
      showUiMessage('error', 'Impossible d\'ajouter la ligne budget.');
    } finally {
      setCreatingBudgetLine(false);
    }
  };

  const updateRoster = async (participantId: string, equipeId: string, action: 'add' | 'remove') => {
    try {
      setRosterSaving(participantId);
      const res = await fetch('/api/equipes/roster', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, equipeId, action }),
      });
      if (!res.ok) throw new Error('Erreur roster');
      await loadAdminData();
      if (action === 'add') setPlayerSearch('');
    } catch {
      showUiMessage('error', 'Impossible de mettre à jour les joueurs de cette équipe.');
    } finally {
      setRosterSaving(null);
    }
  };

  const updateParticipantRole = async (
    participantId: string,
    type: 'Joueur' | 'Spectateur' | 'Bénévole' | 'Staff',
    email: string
  ) => {
    try {
      setParticipantSaving(participantId);
      const res = await fetch('/api/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, type }),
      });

      if (!res.ok) throw new Error('Erreur rôle');
      const data = await res.json().catch(() => ({}));
      await loadAdminData();

      if (type === 'Bénévole') {
        const password = data?.benevolePassword;
        alert(
          password
            ? `Compte bénévole activé pour ${email || 'cet utilisateur'}. Login: ${email || 'Email manquant'} / mot de passe: ${password}`
            : `Compte bénévole activé pour ${email || 'cet utilisateur'}, mais le mot de passe n'a pas pu être généré. Réessayez ou contactez l'admin technique.`
        );
      }
    } catch {
      showUiMessage('error', 'Impossible de mettre à jour le rôle participant.');
    } finally {
      setParticipantSaving(null);
    }
  };

  const updateParticipantTeam = async (participantId: string, equipeId: string) => {
    try {
      setParticipantSaving(participantId);
      const res = await fetch('/api/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, equipeId: equipeId || null }),
      });

      if (!res.ok) throw new Error('Erreur équipe');
      await loadAdminData();
    } catch {
      showUiMessage('error', 'Impossible d\'affecter ce participant à une équipe.');
    } finally {
      setParticipantSaving(null);
    }
  };

  const updateEquipePoule = async (equipeId: string, pouleAssignee: string) => {
    try {
      setCandidatureSaving(equipeId);
      const res = await fetch('/api/equipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipeId, pouleAssignee }),
      });
      if (!res.ok) throw new Error('Erreur poule');
      await loadAdminData();
    } catch {
      showUiMessage('error', 'Impossible d\'affecter la poule.');
    } finally {
      setCandidatureSaving(null);
    }
  };

  const updateEquipeCandidature = async (
    equipeId: string,
    statutValidation: 'Validée' | 'Refusée',
    documentsValides?: boolean
  ) => {
    if (statutValidation === 'Refusée' && !motifRefusDraft[equipeId]?.trim()) {
      showUiMessage('error', 'Indiquez un motif de refus avant de refuser cette candidature.');
      return;
    }

    try {
      setCandidatureSaving(equipeId);
      const res = await fetch('/api/equipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipeId,
          statutValidation,
          documentsValides,
          motifRefus: motifRefusDraft[equipeId],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur candidature');
      }
      showUiMessage(
        'success',
        statutValidation === 'Validée'
          ? 'Candidature validée : les joueurs peuvent maintenant se connecter.'
          : 'Candidature refusée : le roster a été libéré (joueurs repassés en spectateurs).'
      );
      await loadAdminData();
    } catch (error) {
      showUiMessage('error', (error as Error).message || 'Impossible de mettre à jour la candidature.');
    } finally {
      setCandidatureSaving(null);
    }
  };

  const toggleDocumentsValides = async (equipeId: string, statutValidation: string, value: boolean) => {
    try {
      setCandidatureSaving(equipeId);
      const res = await fetch('/api/equipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipeId, statutValidation, documentsValides: value }),
      });
      if (!res.ok) throw new Error('Erreur documents');
      await loadAdminData();
    } catch {
      showUiMessage('error', 'Impossible de mettre à jour les documents.');
    } finally {
      setCandidatureSaving(null);
    }
  };

  const updateIutField = async (id: string, fields: { statutParticipation?: string; budgetPaye?: boolean }) => {
    try {
      setIutSaving(id);
      const res = await fetch('/api/iut', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...fields }),
      });
      if (!res.ok) throw new Error('Erreur IUT');
      await loadAdminData();
    } catch {
      showUiMessage('error', 'Impossible de mettre à jour cet IUT.');
    } finally {
      setIutSaving(null);
    }
  };

  const createMatchHandler = async () => {
    if (!newMatch.sport.trim() || !newMatch.phase.trim() || !newMatch.date || !newMatch.heureDebut || !newMatch.terrain.trim()) {
      showUiMessage('error', 'Sport, phase, date, heure et terrain sont obligatoires.');
      return;
    }

    try {
      setCreatingMatch(true);
      const res = await fetch('/api/matchs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMatch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur création match');
      }
      setNewMatch({ idMatch: '', sport: '', phase: '', date: '', heureDebut: '', terrain: '', equipeA: '', equipeB: '' });
      showUiMessage('success', 'Match créé.');
      await loadAdminData();
    } catch (error) {
      showUiMessage('error', (error as Error).message || 'Impossible de créer ce match.');
    } finally {
      setCreatingMatch(false);
    }
  };

  const loadTaches = async () => {
    try {
      const res = await fetch('/api/taches', { cache: 'no-store' });
      if (res.ok) setTaches(await res.json());
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    }
  };

  const createTacheHandler = async () => {
    if (!newTache.tache.trim() || !newTache.responsable.trim()) {
      showUiMessage('error', 'Tâche et responsable sont obligatoires.');
      return;
    }

    try {
      setCreatingTache(true);
      const res = await fetch('/api/taches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTache),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur création tâche');
      }
      setNewTache({ tache: '', description: '', responsable: '', priorite: 'Normale', deadline: '', categorie: 'Logistique' });
      showUiMessage('success', 'Tâche créée.');
      await loadTaches();
    } catch (error) {
      showUiMessage('error', (error as Error).message || 'Impossible de créer cette tâche.');
    } finally {
      setCreatingTache(false);
    }
  };

  const updateTacheStatutHandler = async (id: string, statut: string) => {
    try {
      setTacheSaving(id);
      const res = await fetch(`/api/taches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) throw new Error('Erreur statut tâche');
      await loadTaches();
    } catch {
      showUiMessage('error', 'Impossible de mettre à jour cette tâche.');
    } finally {
      setTacheSaving(null);
    }
  };

  if (!adminData || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFEF3F]"></div>
      </div>
    );
  }

  const overview = liveData?.overview;
  const iutList = liveData?.iut || [];
  const equipes = liveData?.equipes || [];
  const matchs = liveData?.matchs || [];
  const participants = liveData?.participants || [];
  const budget = liveData?.budget || [];
  const urgentTasks = liveData?.urgentTasks || [];
  const incidentsEnCours = liveData?.incidentsEnCours || [];
  const devis = liveData?.devis || [];
  const matchsDuJour = matchs.slice(0, 5);
  const participantsSansLicence = participants.filter((p) => p.type === 'Joueur' && !p.licenceValidee);
  const isRevenue = (line: { type: string; categorie: string; poste: string }) => {
    const key = `${line.type} ${line.categorie} ${line.poste}`.toLowerCase();
    return key.includes('recette') || key.includes('revenu') || key.includes('income');
  };
  const budgetDepenses = budget
    .filter((line) => !isRevenue(line))
    .reduce((sum, line) => sum + line.montantReel, 0);
  const budgetRevenus = budget
    .filter((line) => isRevenue(line))
    .reduce((sum, line) => sum + line.montantReel, 0);
  const selectedEquipe = equipes.find((equipe) => equipe.id === selectedEquipeId) || null;
  const normalizeValue = (value: unknown) => String(value || '').trim().toLowerCase();
  const participantBelongsToEquipe = (participant: any, equipe: { id: string; nom: string } | null) => {
    if (!equipe) return false;

    const equipeId = normalizeValue(equipe.id);
    const equipeNom = normalizeValue(equipe.nom);
    const ids = Array.isArray(participant.equipeIds) ? participant.equipeIds : [];
    const normalizedIds = ids.map((id: string) => normalizeValue(id));
    const normalizedEquipe = normalizeValue(participant.equipe);

    return normalizedIds.includes(equipeId) || normalizedIds.includes(equipeNom) || normalizedEquipe === equipeNom;
  };
  const equipeById = Object.fromEntries(equipes.map((e) => [e.id, e]));
  const joueursDeLEquipe = participants.filter(
    (participant) => participantBelongsToEquipe(participant, selectedEquipe)
  );
  const joueursDisponibles = participants.filter((participant) => {
    const canBeAssigned = participant.type === 'Joueur' || participant.type === 'Spectateur';
    const alreadyInTeam = participantBelongsToEquipe(participant, selectedEquipe);
    const search = playerSearch.toLowerCase();
    const matchesSearch = !search || participant.nomComplet.toLowerCase().includes(search) || participant.iut.toLowerCase().includes(search);
    return canBeAssigned && !alreadyInTeam && selectedEquipeId && matchesSearch;
  });
  const sportsDisponibles = Array.from(new Set(matchs.map((m) => String(m.sport || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const matchsFiltres = [...matchs]
    .sort((a, b) => {
      const aDate = new Date(`${a.date || ''}T${a.heureDebut || '00:00'}`).getTime();
      const bDate = new Date(`${b.date || ''}T${b.heureDebut || '00:00'}`).getTime();
      return aDate - bDate;
    })
    .filter((match) => {
      const search = matchSearch.trim().toLowerCase();
      const text = `${match.idMatch} ${match.sport} ${match.equipeA} ${match.equipeB} ${match.terrain || ''}`.toLowerCase();
      const matchesSearch = !search || text.includes(search);
      const matchesStatus = matchStatusFilter === 'all' || match.statut === matchStatusFilter;
      const matchesSport = matchSportFilter === 'all' || match.sport === matchSportFilter;
      return matchesSearch && matchesStatus && matchesSport;
    });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[#0D0D0D] border-b-[3px] border-[#FFEF3F] text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Image src="/Logo_Tournoi_IUT_jaune.png" alt="Logo" width={40} height={40} className="flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500 mb-1">Espace Admin</p>
                <h1 className="text-xl font-black uppercase text-white tracking-wide">Dashboard</h1>
                <p className="text-sm text-[#FFEF3F] mt-0.5">{adminData.email}</p>
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

      {/* Tabs */}
      <div className="panel border-b border-gray-100">
        <div className="container mx-auto px-4 overflow-x-auto">
          <div className="flex min-w-max">
            {[
              { id: 'overview', label: 'Vue d\'ensemble' },
              { id: 'iut', label: 'IUT' },
              { id: 'equipes', label: 'Équipes' },
              { id: 'matchs', label: 'Matchs' },
              { id: 'incidents', label: 'Incidents' },
              { id: 'participants', label: 'Participants' },
              { id: 'taches', label: 'Tâches' },
              { id: 'budget', label: 'Budget' },
              { id: 'devis', label: 'Devis' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 border-b-2 text-sm font-bold uppercase tracking-wide transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#FFEF3F] text-[#0D0D0D] bg-[#FFEF3F]/5'
                    : 'border-transparent text-gray-500 hover:text-[#0D0D0D] hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
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

        {activeTab === 'overview' && (
          <div>
            {/* KPIs */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="stat-card border-l-4 border-white/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">IUT Confirmés</p>
                  <CheckCircle className="w-4 h-4 text-[#FFEF3F]" />
                </div>
                <p className="text-3xl font-black text-white">
                  {overview?.iutConfirmes ?? 0}/{overview?.iutTotal ?? 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">Synchronisé Airtable</p>
              </div>

              <div className="stat-card border-l-4 border-[#FFEF3F]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Participants</p>
                  <Users className="w-4 h-4 text-[#FFEF3F]" />
                </div>
                <p className="text-3xl font-black text-white">
                  {overview?.participantsInscrits ?? 0}/{overview?.participantsTotal ?? 300}
                </p>
                <p className="text-xs text-gray-400 mt-1">Mis à jour toutes les 10s</p>
              </div>

              <div className="stat-card border-l-4 border-[#FFEF3F]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Budget collecté</p>
                  <DollarSign className="w-4 h-4 text-[#FFEF3F]" />
                </div>
                <p className="text-3xl font-black text-white">
                  {(overview?.budgetCollecte ?? 0).toLocaleString('fr-FR')}€
                </p>
                <p className="text-xs text-gray-400 mt-1">sur {(overview?.budgetPrevu ?? 0).toLocaleString('fr-FR')}€</p>
              </div>

              <div className="stat-card border-l-4 border-[#DC2626]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Tâches urgentes</p>
                  <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                </div>
                <p className="text-3xl font-black text-white">{overview?.tachesUrgentes ?? 0}</p>
                <p className="text-xs text-gray-400 mt-1">Priorité critique</p>
              </div>

              <div className="stat-card border-l-4 border-white/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Devis</p>
                  <DollarSign className="w-4 h-4 text-[#FFEF3F]" />
                </div>
                <p className="text-3xl font-black text-white">{overview?.devisTotal ?? 0}</p>
                <p className="text-xs text-gray-400 mt-1">{overview?.devisEnAttente ?? 0} en attente</p>
              </div>
            </div>

            {/* Planning du jour */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="panel-raised">
                <div className="p-5 panel-deep border-b border-gray-100">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Planning aujourd'hui
                  </h2>
                </div>
                <div className="p-4 space-y-2">
                  {matchsDuJour.length === 0 && <p className="text-sm text-gray-400">Aucun match aujourd'hui.</p>}
                  {matchsDuJour.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 panel-deep">
                      <div>
                        <div className="font-semibold text-sm text-[#0D0D0D]">{match.idMatch} — {match.sport}</div>
                        <div className="text-xs text-gray-500">{match.equipeA} vs {match.equipeB}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-[#0D0D0D]">{match.heureDebut}</div>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 border border-gray-200 font-bold uppercase mt-1 inline-block">
                          {match.statut}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-raised">
                <div className="p-5 panel-deep border-b border-gray-100">
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                    Alertes & Actions
                  </h2>
                </div>
                <div className="p-4 space-y-2">
                  <div className="p-3 border-l-4 border-[#DC2626] bg-red-50">
                    <div className="font-bold text-sm text-[#0D0D0D]">Paiements en attente</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {iutList.filter((i) => !i.budgetPaye).map((i) => i.nom).join(', ') || 'Aucun'}
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-[#FFEF3F] bg-[#FFEF3F]/10">
                    <div className="font-bold text-sm text-[#0D0D0D]">Licences non validées</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {participantsSansLicence.length} participant(s) à vérifier
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-[#DC2626] bg-red-50">
                    <div className="font-bold text-sm text-[#0D0D0D]">Incidents en cours</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {incidentsEnCours.length > 0
                        ? `${incidentsEnCours.length} incident(s) non clôturé(s)`
                        : 'Aucun incident actif'}
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-[#FFEF3F] bg-[#FFEF3F]/10">
                    <div className="font-bold text-sm text-[#0D0D0D]">Tâches critiques</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {urgentTasks.length > 0 ? urgentTasks.slice(0, 2).map((task) => task.tache).join(' · ') : 'Aucune'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu Budget */}
            <div className="panel-raised p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] mb-4">Aperçu Budget</h2>
              <div className="space-y-2">
                {budget.slice(0, 8).map((line) => (
                  <div key={line.id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <div className="font-semibold text-sm text-[#0D0D0D]">{line.poste}</div>
                      <div className="text-xs text-gray-500">{line.categorie} · {line.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{line.montantReel.toLocaleString('fr-FR')}€</div>
                      <div className="text-xs text-gray-400">prévu {line.montantPrevu.toLocaleString('fr-FR')}€</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center font-black text-[#0D0D0D]">
                  <span>Solde</span>
                  <span>{((overview?.budgetCollecte ?? 0) - budgetDepenses).toLocaleString('fr-FR')}€</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'iut' && (
          <div className="table-frame">
            <div className="p-5 panel-deep border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D]">Gestion des IUT</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#0D0D0D]">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">IUT</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Participants</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Spectateurs</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Transport souhaité</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Hébergement requis</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Paiement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {iutList.map((iut) => (
                    <tr key={iut.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#0D0D0D]">{iut.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={iut.statutParticipation}
                          onChange={(e) => updateIutField(iut.id, { statutParticipation: e.target.value })}
                          disabled={iutSaving === iut.id}
                          className="px-2 py-1 border border-gray-200 text-xs font-bold uppercase bg-white focus:outline-none focus:border-[#FFEF3F]"
                        >
                          <option value="En attente">En attente</option>
                          <option value="Confirmé">Confirmé</option>
                          <option value="Désisté">Désisté</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{iut.nombreParticipants}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{iut.nombreSpectateurs}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{iut.transportSouhaite || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{iut.hebergementRequis || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => updateIutField(iut.id, { budgetPaye: !iut.budgetPaye })}
                          disabled={iutSaving === iut.id}
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-60 ${
                            iut.budgetPaye
                              ? 'bg-[#0D0D0D] text-[#FFEF3F]'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {iut.budgetPaye ? '✓ Payé' : 'En attente'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'equipes' && (
          <div className="space-y-5">
            <div className="table-frame overflow-x-auto">
              <div className="p-5 panel-deep border-b border-gray-100">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D]">Équipes</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#0D0D0D]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Nom</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">IUT</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Poule</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Candidature</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Joueurs</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...equipes]
                    .sort((a, b) => (a.statutValidation === 'En attente' ? -1 : 1) - (b.statutValidation === 'En attente' ? -1 : 1))
                    .map((equipe) => {
                    const count = participants.filter((p) => participantBelongsToEquipe(p, equipe)).length;
                    return (
                      <tr key={equipe.id} className={equipe.statutValidation === 'En attente' ? 'bg-[#FFEF3F]/10' : ''}>
                        <td className="px-4 py-2 font-semibold">{equipe.nom}</td>
                        <td className="px-4 py-2">{equipe.iut}</td>
                        <td className="px-4 py-2">
                          <select
                            value={equipe.pouleAssignee || ''}
                            onChange={(e) => updateEquipePoule(equipe.id, e.target.value)}
                            disabled={candidatureSaving === equipe.id}
                            className="px-2 py-1 border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#FFEF3F]"
                          >
                            {POULE_OPTIONS.map((poule) => (
                              <option key={poule || 'none'} value={poule}>{poule || 'Non assignée'}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                            equipe.statutValidation === 'Validée'
                              ? 'bg-[#0D0D0D] text-[#FFEF3F]'
                              : equipe.statutValidation === 'Refusée'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {equipe.statutValidation}
                          </span>
                        </td>
                        <td className="px-4 py-2">{count}/10</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => setSelectedEquipeId(equipe.id)}
                            className="text-[#0D0D0D] font-semibold hover:text-[#FFEF3F]"
                          >
                            Gérer / Valider
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedEquipe && (
              <div className="panel-raised p-5">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] mb-1">Joueurs — {selectedEquipe.nom}</h3>
                <p className="text-xs text-gray-400 mb-4">{joueursDeLEquipe.length}/10 joueurs affectés</p>

                <div className="mb-5 border border-gray-200 p-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#0D0D0D] mb-3">Candidature</h4>

                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={selectedEquipe.documentsValides}
                      onChange={(e) => toggleDocumentsValides(selectedEquipe.id, selectedEquipe.statutValidation, e.target.checked)}
                      disabled={candidatureSaving === selectedEquipe.id}
                      className="w-4 h-4 accent-[#0D0D0D]"
                    />
                    <span className="text-sm text-gray-700">Documents reçus et vérifiés</span>
                  </label>

                  {selectedEquipe.statutValidation === 'Refusée' && selectedEquipe.motifRefus && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 mb-3">
                      Motif de refus : {selectedEquipe.motifRefus}
                    </p>
                  )}

                  {selectedEquipe.statutValidation !== 'Validée' && (
                    <div className="mb-3">
                      <label className="label">Motif de refus (requis pour refuser)</label>
                      <textarea
                        value={motifRefusDraft[selectedEquipe.id] || ''}
                        onChange={(e) => setMotifRefusDraft((prev) => ({ ...prev, [selectedEquipe.id]: e.target.value }))}
                        rows={2}
                        placeholder="Documents manquants, équipe incomplète…"
                        className="input resize-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    {selectedEquipe.statutValidation !== 'Validée' && (
                      <button
                        onClick={() => updateEquipeCandidature(selectedEquipe.id, 'Validée', selectedEquipe.documentsValides)}
                        disabled={candidatureSaving === selectedEquipe.id}
                        className="btn-primary disabled:opacity-60"
                      >
                        Valider la candidature
                      </button>
                    )}
                    {selectedEquipe.statutValidation !== 'Refusée' && (
                      <button
                        onClick={() => updateEquipeCandidature(selectedEquipe.id, 'Refusée', selectedEquipe.documentsValides)}
                        disabled={candidatureSaving === selectedEquipe.id}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold uppercase disabled:opacity-60 transition-colors"
                      >
                        Refuser
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="label">Ajouter un joueur</label>
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Rechercher par nom ou IUT…"
                    className="input"
                  />
                  {playerSearch && (
                    <div className="mt-2 max-h-44 overflow-y-auto border border-gray-200">
                      {joueursDisponibles.slice(0, 12).map((joueur) => (
                        <div key={joueur.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                          <div>
                            <div className="font-semibold text-sm text-[#0D0D0D]">{joueur.nomComplet}</div>
                            <div className="text-xs text-gray-500">{joueur.iut}</div>
                          </div>
                          <button
                            onClick={() => updateRoster(joueur.id, selectedEquipe.id, 'add')}
                            disabled={rosterSaving === joueur.id || joueursDeLEquipe.length >= 10}
                            className="bg-[#0D0D0D] hover:bg-[#222] text-white px-3 py-1 text-xs font-bold uppercase disabled:opacity-60 transition-colors"
                          >
                            Ajouter
                          </button>
                        </div>
                      ))}
                      {joueursDisponibles.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-400">Aucun joueur correspondant.</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-[#0D0D0D]">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Nom</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">IUT</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Licence</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {joueursDeLEquipe.map((joueur) => (
                        <tr key={joueur.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-sm text-[#0D0D0D]">{joueur.nomComplet}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{joueur.iut}</td>
                          <td className="px-4 py-3">
                            {joueur.licenceValidee ? (
                              <span className="bg-[#0D0D0D] text-[#FFEF3F] px-2 py-0.5 text-[10px] font-bold uppercase">Validée</span>
                            ) : (
                              <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase">À valider</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => updateRoster(joueur.id, selectedEquipe.id, 'remove')}
                              disabled={rosterSaving === joueur.id}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs font-bold uppercase disabled:opacity-60 transition-colors"
                            >
                              Retirer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'matchs' && (
          <div className="space-y-5">
            <div className="panel-raised p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] mb-4">Créer un match</h2>
              <div className="grid md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={newMatch.idMatch}
                  onChange={(e) => setNewMatch((prev) => ({ ...prev, idMatch: e.target.value }))}
                  placeholder="ID (optionnel)"
                  className="input"
                />
                <input
                  type="text"
                  value={newMatch.sport}
                  onChange={(e) => setNewMatch((prev) => ({ ...prev, sport: e.target.value }))}
                  placeholder="Sport *"
                  className="input"
                />
                <input
                  type="text"
                  value={newMatch.phase}
                  onChange={(e) => setNewMatch((prev) => ({ ...prev, phase: e.target.value }))}
                  placeholder="Phase (ex: Poule A) *"
                  className="input"
                />
                <input
                  type="text"
                  value={newMatch.terrain}
                  onChange={(e) => setNewMatch((prev) => ({ ...prev, terrain: e.target.value }))}
                  placeholder="Terrain *"
                  className="input"
                />
                <input
                  type="date"
                  value={newMatch.date}
                  onChange={(e) => setNewMatch((prev) => ({ ...prev, date: e.target.value }))}
                  className="input"
                />
                <input
                  type="time"
                  value={newMatch.heureDebut}
                  onChange={(e) => setNewMatch((prev) => ({ ...prev, heureDebut: e.target.value }))}
                  className="input"
                />
                <input
                  type="text"
                  value={newMatch.equipeA}
                  onChange={(e) => setNewMatch((prev) => ({ ...prev, equipeA: e.target.value }))}
                  placeholder="Équipe A"
                  className="input"
                />
                <input
                  type="text"
                  value={newMatch.equipeB}
                  onChange={(e) => setNewMatch((prev) => ({ ...prev, equipeB: e.target.value }))}
                  placeholder="Équipe B"
                  className="input"
                />
              </div>
              <button
                onClick={createMatchHandler}
                disabled={creatingMatch}
                className="btn-primary mt-3 disabled:opacity-60"
              >
                {creatingMatch ? 'Création…' : '+ Créer le match'}
              </button>
            </div>

            <div className="panel-raised p-5">
              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <label className="label">Recherche</label>
                  <input
                    type="text"
                    value={matchSearch}
                    onChange={(e) => setMatchSearch(e.target.value)}
                    placeholder="ID match, sport, équipe, terrain..."
                    className="input"
                  />
                </div>
                <div className="w-full md:w-52">
                  <label className="label">Statut</label>
                  <select value={matchStatusFilter} onChange={(e) => setMatchStatusFilter(e.target.value as 'all' | 'Programmé' | 'En cours' | 'Terminé')} className="input">
                    <option value="all">Tous</option>
                    <option value="Programmé">Programmé</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
                <div className="w-full md:w-52">
                  <label className="label">Sport</label>
                  <select value={matchSportFilter} onChange={(e) => setMatchSportFilter(e.target.value)} className="input">
                    <option value="all">Tous</option>
                    {sportsDisponibles.map((sport) => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">{matchsFiltres.length} match(s) affiché(s)</p>
            </div>

            <div className="space-y-3">
              {matchsFiltres.map((match) => {
                const edit = matchEdits[match.id] || {
                  scoreA: match.scoreA !== undefined ? String(match.scoreA) : '',
                  scoreB: match.scoreB !== undefined ? String(match.scoreB) : '',
                  statut: (match.statut as 'Programmé' | 'En cours' | 'Terminé') || 'Programmé',
                };

                return (
                  <div key={match.id} className="section-split p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{match.idMatch || match.id}</p>
                        <h3 className="text-base font-black text-[#0D0D0D]">{match.sport} · {match.date} · {match.heureDebut}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{match.equipeA} vs {match.equipeB}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 w-fit">
                        {match.statut}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-4 gap-3">
                      <div>
                        <label className="label">Statut</label>
                        <select
                          value={edit.statut}
                          onChange={(e) => handleMatchEditChange(match.id, 'statut', e.target.value)}
                          className="input"
                        >
                          <option value="Programmé">Programmé</option>
                          <option value="En cours">En cours</option>
                          <option value="Terminé">Terminé</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Score équipe A</label>
                        <input
                          type="number"
                          min={0}
                          value={edit.scoreA}
                          onChange={(e) => handleMatchEditChange(match.id, 'scoreA', e.target.value)}
                          className="input"
                          placeholder="-"
                        />
                      </div>
                      <div>
                        <label className="label">Score équipe B</label>
                        <input
                          type="number"
                          min={0}
                          value={edit.scoreB}
                          onChange={(e) => handleMatchEditChange(match.id, 'scoreB', e.target.value)}
                          className="input"
                          placeholder="-"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => saveMatchUpdate(match.id)}
                          disabled={matchSaving === match.id}
                          className="w-full btn-primary disabled:opacity-60"
                        >
                          {matchSaving === match.id ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}

              {matchsFiltres.length === 0 && (
                <div className="panel-raised p-6 text-center text-gray-400 text-sm">Aucun match ne correspond aux filtres.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="table-frame overflow-x-auto">
            <div className="p-5 panel-deep border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D]">Incidents</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[#0D0D0D]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Gravité</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Lieu</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Concerné / Contact</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-[#0D0D0D]">{incident.typeUrgence}</td>
                    <td className="px-4 py-3 text-sm">{incident.gravite}</td>
                    <td className="px-4 py-3 text-sm">{incident.lieu}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-sm">{incident.description}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div>{incident.personneConcernee || '—'}</div>
                      <div className="text-gray-400">{incident.contactSignalant || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 font-bold uppercase border border-gray-200">{incident.statut}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        <button
                          onClick={() => updateIncidentStatus(incident.id, 'En traitement')}
                          disabled={incidentSaving === incident.id}
                          className="bg-[#FFEF3F] hover:bg-[#e6d400] text-[#0D0D0D] px-2 py-1 text-xs font-bold uppercase transition-colors disabled:opacity-60"
                        >
                          En traitement
                        </button>
                        <button
                          onClick={() => updateIncidentStatus(incident.id, 'Résolu')}
                          disabled={incidentSaving === incident.id}
                          className="bg-[#0D0D0D] hover:bg-[#222] text-white px-2 py-1 text-xs font-bold uppercase transition-colors disabled:opacity-60"
                        >
                          Résolu
                        </button>
                        <button
                          onClick={() => updateIncidentStatus(incident.id, 'Clôturé')}
                          disabled={incidentSaving === incident.id}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 text-xs font-bold uppercase transition-colors disabled:opacity-60"
                        >
                          Clôturé
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="table-frame overflow-x-auto">
            <div className="p-5 panel-deep border-b border-gray-100">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D]">Participants</h2>
              <p className="text-xs text-gray-400 mt-1">Lorsqu'un participant passe en Bénévole, un mot de passe est généré automatiquement et affiché une seule fois.</p>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[#0D0D0D]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Nom</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">IUT</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Équipe</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Licence</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Allergies</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Maillot</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Transport</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Hébergement</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Arrivée</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Départ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {participants.slice(0, 120).map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-sm text-[#0D0D0D]">{participant.nomComplet}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{participant.email || '—'}</td>
                    <td className="px-4 py-3 text-sm">{participant.iut}</td>
                    <td className="px-4 py-3">
                      <select
                        value={participant.type}
                        onChange={(e) => updateParticipantRole(participant.id, e.target.value as 'Joueur' | 'Spectateur' | 'Bénévole' | 'Staff', participant.email)}
                        disabled={participantSaving === participant.id}
                        className="px-2 py-1 border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#FFEF3F]"
                      >
                        <option value="Joueur">Joueur</option>
                        <option value="Spectateur">Spectateur</option>
                        <option value="Bénévole">Bénévole</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={participant.equipeIds?.[0] || ''}
                        onChange={(e) => updateParticipantTeam(participant.id, e.target.value)}
                        disabled={participantSaving === participant.id}
                        className="px-2 py-1 border border-gray-200 text-sm min-w-44 bg-white focus:outline-none focus:border-[#FFEF3F]"
                      >
                        <option value="">Aucune équipe</option>
                        {equipes.map((equipe) => (
                          <option key={equipe.id} value={equipe.id}>{equipe.nom}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {participant.licenceValidee ? (
                        <span className="bg-[#0D0D0D] text-[#FFEF3F] px-2 py-0.5 text-[10px] font-bold uppercase">OK</span>
                      ) : (
                        <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-[10px] font-bold uppercase">À vérifier</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[12rem]">{participant.allergiesAlimentaires || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{participant.tailleMaillot || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{participant.transport || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{participant.hebergement ? 'Oui' : 'Non'}</td>
                    <td className="px-4 py-3">
                      {participant.arriveeConfirmee ? (
                        <span className="bg-[#0D0D0D] text-white px-2 py-0.5 text-[10px] font-bold uppercase">Arrivé</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Non</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {participant.departConfirme ? (
                        <span className="bg-[#0D0D0D] text-white px-2 py-0.5 text-[10px] font-bold uppercase">Parti</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Non</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'taches' && (
          <div className="space-y-5">
            <div className="panel-raised p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] mb-4">Créer une tâche</h2>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newTache.tache}
                  onChange={(e) => setNewTache((prev) => ({ ...prev, tache: e.target.value }))}
                  placeholder="Tâche *"
                  className="input"
                />
                <input
                  type="text"
                  value={newTache.responsable}
                  onChange={(e) => setNewTache((prev) => ({ ...prev, responsable: e.target.value }))}
                  placeholder="Responsable *"
                  list="benevoles-connus"
                  className="input"
                />
                <datalist id="benevoles-connus">
                  {participants.filter((p) => p.type === 'Bénévole').map((p) => (
                    <option key={p.id} value={p.nomComplet} />
                  ))}
                </datalist>
                <select
                  value={newTache.priorite}
                  onChange={(e) => setNewTache((prev) => ({ ...prev, priorite: e.target.value }))}
                  className="input"
                >
                  {TACHE_PRIORITES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  value={newTache.categorie}
                  onChange={(e) => setNewTache((prev) => ({ ...prev, categorie: e.target.value }))}
                  className="input"
                >
                  {TACHE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="date"
                  value={newTache.deadline}
                  onChange={(e) => setNewTache((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="input"
                />
                <input
                  type="text"
                  value={newTache.description}
                  onChange={(e) => setNewTache((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optionnel)"
                  className="md:col-span-2 input"
                />
              </div>
              <button
                onClick={createTacheHandler}
                disabled={creatingTache}
                className="btn-primary mt-3 disabled:opacity-60"
              >
                {creatingTache ? 'Création…' : '+ Créer la tâche'}
              </button>
            </div>

            <div className="table-frame overflow-x-auto">
              <div className="p-5 panel-deep border-b border-gray-100">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D]">Toutes les tâches ({taches.length})</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#0D0D0D]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Tâche</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Responsable</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Priorité</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Deadline</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Catégorie</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {taches.map((tache) => (
                    <tr key={tache.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-sm text-[#0D0D0D]">{tache.tache}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tache.responsable}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tache.priorite}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tache.deadline || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tache.categorie}</td>
                      <td className="px-4 py-3">
                        <select
                          value={tache.statut}
                          onChange={(e) => updateTacheStatutHandler(tache.id, e.target.value)}
                          disabled={tacheSaving === tache.id}
                          className="px-2 py-1 border border-gray-200 text-xs font-bold uppercase bg-white focus:outline-none focus:border-[#FFEF3F]"
                        >
                          <option value="À faire">À faire</option>
                          <option value="En cours">En cours</option>
                          <option value="Terminé">Terminé</option>
                          <option value="En attente">En attente</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {taches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Aucune tâche pour le moment.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="stat-card border-l-4 border-white/20">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Revenus</p>
                <p className="text-2xl font-black text-white mt-1">{budgetRevenus.toLocaleString('fr-FR')}€</p>
              </div>
              <div className="stat-card border-l-4 border-[#DC2626]">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Dépenses</p>
                <p className="text-2xl font-black text-white mt-1">{budgetDepenses.toLocaleString('fr-FR')}€</p>
              </div>
              <div className="stat-card border-l-4 border-[#FFEF3F]">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Solde</p>
                <p className="text-2xl font-black text-white mt-1">{((overview?.budgetCollecte ?? 0) - budgetDepenses).toLocaleString('fr-FR')}€</p>
              </div>
            </div>

            <div className="panel-raised p-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] mb-4">Ajouter une ligne budget</h2>
              <div className="grid md:grid-cols-6 gap-3">
                <input
                  type="text"
                  value={newBudgetLine.poste}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, poste: e.target.value }))}
                  placeholder="Poste"
                  className="md:col-span-2 input"
                />
                <select
                  value={newBudgetLine.categorie}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, categorie: e.target.value }))}
                  className="input"
                >
                  {BUDGET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={newBudgetLine.type}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, type: e.target.value }))}
                  className="input"
                >
                  <option value="Dépense">Dépense</option>
                  <option value="Revenu">Revenu</option>
                </select>
                <input
                  type="number"
                  value={newBudgetLine.montantPrevu}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, montantPrevu: Number(e.target.value || 0) }))}
                  placeholder="Prévu"
                  className="input"
                />
                <input
                  type="number"
                  value={newBudgetLine.montantReel}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, montantReel: Number(e.target.value || 0) }))}
                  placeholder="Réel"
                  className="input"
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <select
                  value={newBudgetLine.statutPaiement}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, statutPaiement: e.target.value }))}
                  className="input w-auto"
                >
                  <option value="En attente">En attente</option>
                  <option value="Payé">Payé</option>
                  <option value="Partiel">Partiel</option>
                </select>
                <button
                  onClick={createBudgetLine}
                  disabled={creatingBudgetLine}
                  className="btn-primary disabled:opacity-60"
                >
                  {creatingBudgetLine ? 'Ajout…' : '+ Ajouter'}
                </button>
              </div>
            </div>

            <div className="table-frame overflow-x-auto">
              <div className="p-5 panel-deep border-b border-gray-100">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D]">Tableau budget (édition directe)</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#0D0D0D]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Poste</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Catégorie</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Prévu</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Réel</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {budget.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={(budgetEdits[line.id]?.poste ?? line.poste)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'poste', e.target.value)}
                          className="w-44 px-2 py-1 border border-gray-200 text-sm focus:outline-none focus:border-[#FFEF3F]"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={(budgetEdits[line.id]?.categorie ?? line.categorie)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'categorie', e.target.value)}
                          className="w-36 px-2 py-1 border border-gray-200 text-sm focus:outline-none focus:border-[#FFEF3F]"
                        >
                          {BUDGET_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={(budgetEdits[line.id]?.type ?? line.type)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'type', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-200 text-sm focus:outline-none focus:border-[#FFEF3F]"
                        >
                          <option value="Dépense">Dépense</option>
                          <option value="Revenu">Revenu</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          value={(budgetEdits[line.id]?.montantPrevu ?? line.montantPrevu)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'montantPrevu', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-200 text-sm focus:outline-none focus:border-[#FFEF3F]"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          value={(budgetEdits[line.id]?.montantReel ?? line.montantReel)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'montantReel', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-200 text-sm focus:outline-none focus:border-[#FFEF3F]"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={(budgetEdits[line.id]?.statutPaiement ?? line.statutPaiement)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'statutPaiement', e.target.value)}
                          className="w-32 px-2 py-1 border border-gray-200 text-sm focus:outline-none focus:border-[#FFEF3F]"
                        >
                          <option value="En attente">En attente</option>
                          <option value="Payé">Payé</option>
                          <option value="Partiel">Partiel</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => saveBudgetLine(line.id)}
                          disabled={budgetSaving === line.id}
                          className="bg-[#0D0D0D] hover:bg-[#222] text-white px-3 py-1 text-xs font-bold uppercase disabled:opacity-60 transition-colors"
                        >
                          {budgetSaving === line.id ? 'Sauvegarde…' : 'Sauvegarder'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'devis' && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="stat-card border-l-4 border-white/20">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Total devis</p>
                <p className="text-2xl font-black text-white mt-1">{devis.length}</p>
              </div>
              <div className="stat-card border-l-4 border-[#FFEF3F]">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">En attente</p>
                <p className="text-2xl font-black text-white mt-1">
                  {devis.filter((item) => item.statut === 'En attente').length}
                </p>
              </div>
              <div className="stat-card border-l-4 border-white/20">
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Accord mutuel</p>
                <p className="text-2xl font-black text-white mt-1">
                  {devis.filter((item) => item.statut === 'Accord mutuel').length}
                </p>
              </div>
            </div>

            <div className="table-frame overflow-x-auto">
              <div className="p-5 panel-deep border-b border-gray-100">
                <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D]">Devis liés par personne</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-[#0D0D0D]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Titre</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Assigné</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Montant</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Statut</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">PJ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {devis.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-sm text-[#0D0D0D]">{item.titre}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.assigne || '—'}</td>
                      <td className="px-4 py-3 font-black text-sm">{Number(item.montant || 0).toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border ${item.statut === 'En attente' ? 'bg-[#FFEF3F]/20 text-[#0D0D0D] border-[#FFEF3F]' : item.statut === 'Accord mutuel' ? 'bg-[#0D0D0D] text-[#FFEF3F] border-[#0D0D0D]' : item.statut === 'Refus' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {item.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.dateReception || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.piecesJointes?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
