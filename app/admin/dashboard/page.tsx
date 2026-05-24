'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users, Trophy, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

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
    budgetPaye: boolean;
  }>;
  equipes: Array<{
    id: string;
    nom: string;
    iut: string;
    statutInscription: string;
    sportsPratiques: string[];
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

  const loadAdminData = async () => {
    try {
      const [dashboardRes, incidentsRes] = await Promise.all([
        fetch('/api/admin/dashboard', { cache: 'no-store' }),
        fetch('/api/incidents', { cache: 'no-store' }),
      ]);

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
      alert('Impossible de mettre à jour cet incident.');
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
      alert('Pour enregistrer un score, renseignez les deux équipes.');
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
        alert('Les scores doivent être des nombres valides.');
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
      alert(message);
    } finally {
      setMatchSaving(null);
    }
  };

  useEffect(() => {
    const session = sessionStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }
    setAdminData(JSON.parse(session));

    loadAdminData();
    const interval = setInterval(loadAdminData, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_session');
    router.push('/');
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
      alert('Impossible de sauvegarder la ligne budget.');
    } finally {
      setBudgetSaving(null);
    }
  };

  const createBudgetLine = async () => {
    if (!newBudgetLine.poste.trim()) {
      alert('Le poste est obligatoire.');
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
      alert('Impossible d\'ajouter la ligne budget.');
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
      alert('Impossible de mettre à jour les joueurs de cette équipe.');
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
      await loadAdminData();

      if (type === 'Bénévole') {
        const defaultPassword = 'Benevole2027!';
        alert(`Compte bénévole activé pour ${email || 'cet utilisateur'}. Login: ${email || 'Email manquant'} / mot de passe: ${defaultPassword}`);
      }
    } catch {
      alert('Impossible de mettre à jour le rôle participant.');
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
      alert('Impossible d\'affecter ce participant à une équipe.');
    } finally {
      setParticipantSaving(null);
    }
  };

  if (!adminData || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lorraine-blue"></div>
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
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🚀 Dashboard Admin</h1>
              <p className="text-gray-300 mt-1">{adminData.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel border-b border-slate-200/70">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: '📊 Vue d\'ensemble' },
              { id: 'iut', label: '🏫 IUT' },
              { id: 'equipes', label: '👥 Équipes' },
              { id: 'matchs', label: '🏆 Matchs' },
              { id: 'incidents', label: '🚨 Incidents' },
              { id: 'participants', label: '🧑 Participants' },
              { id: 'budget', label: '💰 Budget' },
              { id: 'devis', label: '🧾 Devis' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-lorraine-blue text-lorraine-blue'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div>
            {/* KPIs */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="panel-raised rounded-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">IUT Confirmés</p>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {overview?.iutConfirmes ?? 0}/{overview?.iutTotal ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Synchronisé Airtable</p>
              </div>

              <div className="panel-raised rounded-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Participants</p>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {overview?.participantsInscrits ?? 0}/{overview?.participantsTotal ?? 300}
                </p>
                <p className="text-xs text-gray-500 mt-1">Mis à jour toutes les 10s</p>
              </div>

              <div className="panel-raised rounded-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Budget</p>
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-yellow-600">
                  {(overview?.budgetCollecte ?? 0).toLocaleString('fr-FR')}€
                </p>
                <p className="text-xs text-gray-500 mt-1">sur {(overview?.budgetPrevu ?? 0).toLocaleString('fr-FR')}€</p>
              </div>

              <div className="panel-raised rounded-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Tâches Urgentes</p>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">{overview?.tachesUrgentes ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">Priorité critique dans ToDo</p>
              </div>

              <div className="panel-raised rounded-lg p-6 border-l-4 border-slate-500">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Devis</p>
                  <DollarSign className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-3xl font-bold text-slate-700">{overview?.devisTotal ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">{overview?.devisEnAttente ?? 0} en attente</p>
              </div>
            </div>

            {/* Planning du jour */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="panel-raised rounded-lg">
                <div className="p-6 panel-deep rounded-t-lg">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-lorraine-blue" />
                    Planning aujourd'hui
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {matchsDuJour.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 panel-deep rounded-lg">
                        <div>
                          <div className="font-semibold">{match.idMatch} - {match.sport}</div>
                          <div className="text-sm text-gray-600">{match.equipeA} vs {match.equipeB}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{match.heureDebut}</div>
                          <div className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded mt-1">
                            {match.statut}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel-raised rounded-lg">
                <div className="p-6 panel-deep rounded-t-lg">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Alertes & Actions
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                      <div className="font-semibold text-red-900">🔴 Paiements en attente</div>
                      <div className="text-sm text-red-700 mt-1">
                        {iutList.filter((i) => !i.budgetPaye).map((i) => i.nom).join(', ') || 'Aucun'}
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                      <div className="font-semibold text-yellow-900">⚠️ Licences non validées</div>
                      <div className="text-sm text-yellow-700 mt-1">
                        {participantsSansLicence.length} participant(s) à vérifier
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                      <div className="font-semibold text-orange-900">🚨 Incidents en cours</div>
                      <div className="text-sm text-orange-700 mt-1">
                        {incidentsEnCours.length > 0
                          ? `${incidentsEnCours.length} incident(s) non clôturé(s)`
                          : 'Aucun incident actif'}
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <div className="font-semibold text-blue-900">ℹ️ Tâches critiques</div>
                      <div className="text-sm text-blue-700 mt-1">
                        {urgentTasks.length > 0 ? urgentTasks.slice(0, 2).map((task) => task.tache).join(' • ') : 'Aucune'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Graphique Budget */}
            <div className="panel-raised rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">💰 Aperçu Budget</h2>
              <div className="space-y-3">
                {budget.slice(0, 8).map((line) => (
                  <div key={line.id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div>
                      <div className="font-semibold">{line.poste}</div>
                      <div className="text-xs text-gray-500">{line.categorie} • {line.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{line.montantReel.toLocaleString('fr-FR')}€</div>
                      <div className="text-xs text-gray-500">prévu {line.montantPrevu.toLocaleString('fr-FR')}€</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Solde</span>
                  <span className="text-green-600">
                    {((overview?.budgetCollecte ?? 0) - budgetDepenses).toLocaleString('fr-FR')}€
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'iut' && (
          <div className="panel-raised rounded-lg">
            <div className="p-6 panel-deep rounded-t-lg">
              <h2 className="text-xl font-bold">🏫 Gestion des IUT</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IUT</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {iutList.map((iut) => (
                    <tr key={iut.id} className="hover:bg-slate-100/80">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">{iut.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {iut.statutParticipation}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{iut.nombreParticipants}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {iut.budgetPaye ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Payé
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            ⚠ En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-500 text-sm">Synchronisé</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'equipes' && (
          <div className="space-y-6">
            <div className="panel-raised rounded-lg p-6 overflow-x-auto">
              <h2 className="text-xl font-bold mb-4">👥 Equipes</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Nom</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">IUT</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Sports</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Statut</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Joueurs</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {equipes.map((equipe) => {
                    const count = participants.filter((p) => participantBelongsToEquipe(p, equipe)).length;
                    return (
                      <tr key={equipe.id}>
                        <td className="px-4 py-2 font-semibold">{equipe.nom}</td>
                        <td className="px-4 py-2">{equipe.iut}</td>
                        <td className="px-4 py-2">{equipe.sportsPratiques.join(', ')}</td>
                        <td className="px-4 py-2">{equipe.statutInscription}</td>
                        <td className="px-4 py-2">{count}/10</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => setSelectedEquipeId(equipe.id)}
                            className="text-lorraine-blue font-semibold hover:text-blue-700"
                          >
                            Gérer joueurs
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedEquipe && (
              <div className="panel-raised rounded-lg p-6">
                <h3 className="text-lg font-bold mb-1">Joueurs - {selectedEquipe.nom}</h3>
                <p className="text-sm text-gray-600 mb-4">{joueursDeLEquipe.length}/10 joueurs affectés</p>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ajouter un joueur (autocomplete)</label>
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Rechercher un joueur par nom ou IUT..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {playerSearch && (
                    <div className="mt-2 max-h-44 overflow-y-auto border border-gray-200 rounded-lg">
                      {joueursDisponibles.slice(0, 12).map((joueur) => (
                        <div key={joueur.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-b-0">
                          <div>
                            <div className="font-medium">{joueur.nomComplet}</div>
                            <div className="text-xs text-gray-500">{joueur.iut}</div>
                          </div>
                          <button
                            onClick={() => updateRoster(joueur.id, selectedEquipe.id, 'add')}
                            disabled={rosterSaving === joueur.id || joueursDeLEquipe.length >= 10}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-60"
                          >
                            Ajouter
                          </button>
                        </div>
                      ))}
                      {joueursDisponibles.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">Aucun joueur correspondant.</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Nom</th>
                        <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">IUT</th>
                        <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Licence</th>
                        <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {joueursDeLEquipe.map((joueur) => (
                        <tr key={joueur.id}>
                          <td className="px-4 py-2 font-semibold">{joueur.nomComplet}</td>
                          <td className="px-4 py-2">{joueur.iut}</td>
                          <td className="px-4 py-2">{joueur.licenceValidee ? 'Validée' : 'À valider'}</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => updateRoster(joueur.id, selectedEquipe.id, 'remove')}
                              disabled={rosterSaving === joueur.id}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-60"
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
            <div className="panel-raised rounded-lg p-5">
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
              <p className="mt-3 text-sm text-slate-600">{matchsFiltres.length} match(s) affiché(s)</p>
            </div>

            <div className="space-y-3">
              {matchsFiltres.map((match) => {
                const edit = matchEdits[match.id] || {
                  scoreA: match.scoreA !== undefined ? String(match.scoreA) : '',
                  scoreB: match.scoreB !== undefined ? String(match.scoreB) : '',
                  statut: (match.statut as 'Programmé' | 'En cours' | 'Terminé') || 'Programmé',
                };

                return (
                  <div key={match.id} className="section-split rounded-lg p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">{match.idMatch || match.id}</p>
                        <h3 className="text-lg font-semibold text-slate-800">{match.sport} • {match.date} • {match.heureDebut}</h3>
                        <p className="text-sm text-slate-600 mt-1">{match.equipeA} vs {match.equipeB}</p>
                      </div>
                      <div className="text-sm font-semibold px-3 py-1 rounded-full bg-slate-200 text-slate-700 w-fit">
                        {match.statut}
                      </div>
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
                <div className="panel-raised rounded-lg p-6 text-center text-slate-500">Aucun match ne correspond aux filtres.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="panel-raised rounded-lg p-6 overflow-x-auto">
            <h2 className="text-xl font-bold mb-4">🚨 Incidents</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Type</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Gravité</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Lieu</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Description</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Statut</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="px-4 py-2">{incident.typeUrgence}</td>
                    <td className="px-4 py-2">{incident.gravite}</td>
                    <td className="px-4 py-2">{incident.lieu}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 max-w-sm">{incident.description}</td>
                    <td className="px-4 py-2">{incident.statut}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateIncidentStatus(incident.id, 'En traitement')}
                          disabled={incidentSaving === incident.id}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs"
                        >
                          En traitement
                        </button>
                        <button
                          onClick={() => updateIncidentStatus(incident.id, 'Résolu')}
                          disabled={incidentSaving === incident.id}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Résolu
                        </button>
                        <button
                          onClick={() => updateIncidentStatus(incident.id, 'Clôturé')}
                          disabled={incidentSaving === incident.id}
                          className="bg-gray-700 hover:bg-gray-800 text-white px-2 py-1 rounded text-xs"
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
          <div className="panel-raised rounded-lg p-6 overflow-x-auto">
            <h2 className="text-xl font-bold mb-4">🧑 Participants</h2>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Nom</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Email</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">IUT</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Type</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Équipe</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Licence</th>
                  <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Arrivee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {participants.slice(0, 120).map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-4 py-2 font-semibold">{participant.nomComplet}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{participant.email || 'Email manquant'}</td>
                    <td className="px-4 py-2">{participant.iut}</td>
                    <td className="px-4 py-2">
                      <select
                        value={participant.type}
                        onChange={(e) => updateParticipantRole(participant.id, e.target.value as 'Joueur' | 'Spectateur' | 'Bénévole' | 'Staff', participant.email)}
                        disabled={participantSaving === participant.id}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="Joueur">Joueur</option>
                        <option value="Spectateur">Spectateur</option>
                        <option value="Bénévole">Bénévole</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={participant.equipeIds?.[0] || ''}
                        onChange={(e) => updateParticipantTeam(participant.id, e.target.value)}
                        disabled={participantSaving === participant.id}
                        className="px-2 py-1 border border-gray-300 rounded text-sm min-w-44"
                      >
                        <option value="">Aucune équipe</option>
                        {equipes.map((equipe) => (
                          <option key={equipe.id} value={equipe.id}>{equipe.nom}</option>
                        ))}
                      </select>
                      {participant.equipeIds?.[0] && (
                        <div className="text-xs text-gray-500 mt-1">
                          {equipeById[participant.equipeIds[0]]?.nom || participant.equipeIds[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">{participant.licenceValidee ? 'OK' : 'A verifier'}</td>
                    <td className="px-4 py-2">{participant.arriveeConfirmee ? 'Arrive' : 'Non'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-3">
              Lorsqu'un participant passe en rôle Bénévole, son accès bénévole est créé automatiquement via son email (mot de passe par défaut: Benevole2027!).
            </p>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                <div className="text-sm text-emerald-700 font-medium">Vue d'ensemble - Revenus</div>
                <div className="text-2xl font-bold text-emerald-800 mt-1">{budgetRevenus.toLocaleString('fr-FR')}€</div>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-xl p-4">
                <div className="text-sm text-rose-700 font-medium">Vue d'ensemble - Dépenses</div>
                <div className="text-2xl font-bold text-rose-800 mt-1">{budgetDepenses.toLocaleString('fr-FR')}€</div>
              </div>
              <div className="bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 rounded-xl p-4">
                <div className="text-sm text-sky-700 font-medium">Solde connecté</div>
                <div className="text-2xl font-bold text-sky-800 mt-1">{((overview?.budgetCollecte ?? 0) - budgetDepenses).toLocaleString('fr-FR')}€</div>
              </div>
            </div>

            <div className="panel-raised rounded-xl p-5">
              <h2 className="text-xl font-bold mb-4">💰 Ajouter une ligne budget</h2>
              <div className="grid md:grid-cols-6 gap-3">
                <input
                  type="text"
                  value={newBudgetLine.poste}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, poste: e.target.value }))}
                  placeholder="Poste"
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={newBudgetLine.categorie}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, categorie: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {['Logistique', 'Sport', 'Communication', 'Restauration', 'Hébergement', 'Transport', 'Autre'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  value={newBudgetLine.type}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="Dépense">Dépense</option>
                  <option value="Revenu">Revenu</option>
                </select>
                <input
                  type="number"
                  value={newBudgetLine.montantPrevu}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, montantPrevu: Number(e.target.value || 0) }))}
                  placeholder="Prévu"
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  value={newBudgetLine.montantReel}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, montantReel: Number(e.target.value || 0) }))}
                  placeholder="Réel"
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <select
                  value={newBudgetLine.statutPaiement}
                  onChange={(e) => setNewBudgetLine((prev) => ({ ...prev, statutPaiement: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="En attente">En attente</option>
                  <option value="Payé">Payé</option>
                  <option value="Partiel">Partiel</option>
                </select>
                <button
                  onClick={createBudgetLine}
                  disabled={creatingBudgetLine}
                  className="bg-lorraine-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
                >
                  {creatingBudgetLine ? 'Ajout...' : '+ Ajouter la ligne'}
                </button>
              </div>
            </div>

            <div className="panel-raised rounded-xl p-5 overflow-x-auto">
              <h3 className="text-lg font-bold mb-3">Tableau budget (édition directe)</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Poste</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Categorie</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Type</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Prevu</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Reel</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Statut paiement</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {budget.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={(budgetEdits[line.id]?.poste ?? line.poste)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'poste', e.target.value)}
                          className="w-44 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={(budgetEdits[line.id]?.categorie ?? line.categorie)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'categorie', e.target.value)}
                          className="w-36 px-2 py-1 border border-gray-300 rounded"
                        >
                          {['Logistique', 'Sport', 'Communication', 'Restauration', 'Hébergement', 'Transport', 'Autre'].map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={(budgetEdits[line.id]?.type ?? line.type)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'type', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="Dépense">Dépense</option>
                          <option value="Revenu">Revenu</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={(budgetEdits[line.id]?.montantPrevu ?? line.montantPrevu)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'montantPrevu', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={(budgetEdits[line.id]?.montantReel ?? line.montantReel)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'montantReel', e.target.value)}
                          className="w-28 px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={(budgetEdits[line.id]?.statutPaiement ?? line.statutPaiement)}
                          onChange={(e) => handleBudgetFieldChange(line.id, 'statutPaiement', e.target.value)}
                          className="w-36 px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="En attente">En attente</option>
                          <option value="Payé">Payé</option>
                          <option value="Partiel">Partiel</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => saveBudgetLine(line.id)}
                          disabled={budgetSaving === line.id}
                          className="bg-lorraine-blue hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold disabled:opacity-60"
                        >
                          {budgetSaving === line.id ? 'Sauvegarde...' : 'Sauvegarder'}
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
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="panel-raised rounded-xl p-4 border-l-4 border-slate-500">
                <div className="text-sm text-slate-700 font-medium">Total devis</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">{devis.length}</div>
              </div>
              <div className="panel-raised rounded-xl p-4 border-l-4 border-amber-500">
                <div className="text-sm text-amber-700 font-medium">En attente</div>
                <div className="text-2xl font-bold text-amber-800 mt-1">
                  {devis.filter((item) => item.statut === 'En attente').length}
                </div>
              </div>
              <div className="panel-raised rounded-xl p-4 border-l-4 border-green-500">
                <div className="text-sm text-green-700 font-medium">Accord mutuel</div>
                <div className="text-2xl font-bold text-green-800 mt-1">
                  {devis.filter((item) => item.statut === 'Accord mutuel').length}
                </div>
              </div>
            </div>

            <div className="panel-raised rounded-lg p-6 overflow-x-auto">
              <h2 className="text-xl font-bold mb-4">🧾 Devis liés par personne</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Titre</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Assigné</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Montant</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Statut</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs uppercase text-gray-500">PJ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {devis.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-100/80">
                      <td className="px-4 py-2 font-semibold">{item.titre}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.assigne || '-'}</td>
                      <td className="px-4 py-2">{Number(item.montant || 0).toLocaleString('fr-FR')}€</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.statut === 'En attente' ? 'bg-amber-100 text-amber-800' : item.statut === 'Accord mutuel' ? 'bg-green-100 text-green-800' : item.statut === 'Refus' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                          {item.statut}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.dateReception || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{item.piecesJointes?.length || 0}</td>
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
