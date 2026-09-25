'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, User, CheckCircle, ChevronRight } from 'lucide-react';

type Mode = 'equipe' | 'spectateur' | null;

type Spectateur = {
  id: string;
  nomComplet: string;
  email: string;
  iut: string;
  type: string;
  equipeIds: string[];
};

/* ── Shared page chrome ─────────────────────────────────── */
// Définie hors du composant page : sinon une nouvelle fonction est créée à
// chaque re-render (ex: à chaque frappe dans un champ), ce qui fait perdre
// le focus des inputs puisque React démonte/remonte tout le sous-arbre.
function PageShell({
  onBack,
  children,
}: {
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-[#0D0D0D] border-b-[3px] border-[#FFEF3F]">
        <div className="container mx-auto px-4 py-5">
          {onBack ? (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-[#FFEF3F] text-sm transition-colors uppercase tracking-widest font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-[#FFEF3F] text-sm transition-colors uppercase tracking-widest font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function InscriptionPage() {
  const [mode, setMode] = useState<Mode>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmittingEquipe, setIsSubmittingEquipe] = useState(false);
  const [isSubmittingSpectateur, setIsSubmittingSpectateur] = useState(false);
  const [createdCodeEquipe, setCreatedCodeEquipe] = useState<string | null>(null);

  const [iutOptions, setIutOptions] = useState<string[]>([]);
  const [spectateurs, setSpectateurs] = useState<Spectateur[]>([]);
  const [searchSpectateur, setSearchSpectateur] = useState('');

  const [nomEquipe, setNomEquipe] = useState('');
  const [iutEquipe, setIutEquipe] = useState('');
  const [capitaineTel, setCapitaineTel] = useState('');
  const [capitaineId, setCapitaineId] = useState('');
  const [selectedSpectateurIds, setSelectedSpectateurIds] = useState<string[]>([]);

  const [spectateurNom, setSpectateurNom] = useState('');
  const [spectateurEmail, setSpectateurEmail] = useState('');
  const [spectateurTel, setSpectateurTel] = useState('');
  const [spectateurIut, setSpectateurIut] = useState('');
  const [transportSpect, setTransportSpect] = useState(false);
  const [hebergementSpect, setHebergementSpect] = useState(false);

  const selectedCount = selectedSpectateurIds.length;
  const availableSpectateursCount = spectateurs.length;
  const capitaine = spectateurs.find((s) => s.id === capitaineId) || null;
  const canCreateEquipe =
    selectedCount === 10 &&
    availableSpectateursCount >= 10 &&
    nomEquipe.trim() &&
    iutEquipe.trim() &&
    Boolean(capitaine) &&
    capitaineTel.trim();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryRes, participantsRes] = await Promise.all([
          fetch('/api/public/summary', { cache: 'no-store' }),
          fetch('/api/participants', { cache: 'no-store' }),
        ]);

        if (summaryRes.ok) {
          const summaryJson = await summaryRes.json();
          setIutOptions(Array.isArray(summaryJson.iutOptions) ? summaryJson.iutOptions : []);
        }

        if (participantsRes.ok) {
          const participants = await participantsRes.json();
          const list = (Array.isArray(participants) ? participants : []).filter(
            (p: any) =>
              p.type === 'Spectateur' && (!Array.isArray(p.equipeIds) || p.equipeIds.length === 0)
          );
          setSpectateurs(list);
        }
      } catch (error) {
        console.error('Erreur chargement inscription:', error);
      }
    };
    loadData();
  }, []);

  const filteredSpectateurs = useMemo(() => {
    const key = searchSpectateur.trim().toLowerCase();
    if (!key) return spectateurs;
    return spectateurs.filter(
      (s) =>
        s.nomComplet.toLowerCase().includes(key) ||
        s.email.toLowerCase().includes(key) ||
        String(s.iut || '').toLowerCase().includes(key)
    );
  }, [spectateurs, searchSpectateur]);

  const toggleSpectateur = (id: string) => {
    setSelectedSpectateurIds((prev) => {
      if (prev.includes(id)) {
        // Un joueur retiré de la sélection ne peut plus rester capitaine.
        setCapitaineId((current) => (current === id ? '' : current));
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 10) return prev;
      return [...prev, id];
    });
  };

  const handleCreateEquipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingEquipe) return;
    if (selectedSpectateurIds.length !== 10) {
      alert('Vous devez sélectionner exactement 10 spectateurs pour créer une équipe.');
      return;
    }
    if (!capitaine) {
      alert('Cochez un capitaine parmi les 10 joueurs sélectionnés.');
      return;
    }
    try {
      setIsSubmittingEquipe(true);
      const res = await fetch('/api/equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomEquipe,
          iut: iutEquipe,
          capitaineNom: capitaine.nomComplet,
          capitaineEmail: capitaine.email,
          capitaineTel,
          selectedSpectateurIds,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const codeEquipe = data?.equipe?.codeEquipe;
        setCreatedCodeEquipe(codeEquipe || null);
        setSubmitMessage(
          'Équipe créée avec succès. Les 10 spectateurs sélectionnés sont passés automatiquement en joueurs.'
        );
        setSubmitted(true);
      } else {
        const err = await res.json().catch(() => ({}));
        if (Array.isArray(err.failedPlayers) && err.failedPlayers.length > 0) {
          const details = err.failedPlayers
            .map(
              (p: any) =>
                `${p.nom || p.id} (rôle: ${p.roleOk ? 'ok' : 'échec'}, équipe: ${p.teamOk ? 'ok' : 'échec'})`
            )
            .join('\n');
          alert(`${err.error || 'Affectation incomplète'}\n\nJoueurs en échec:\n${details}`);
        } else {
          alert(err.error || "Erreur lors de la création de l'équipe.");
        }
      }
    } catch (error) {
      console.error(error);
      alert('Erreur réseau');
    } finally {
      setIsSubmittingEquipe(false);
    }
  };

  const handleCreateSpectateur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingSpectateur) return;
    try {
      setIsSubmittingSpectateur(true);
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomComplet: spectateurNom,
          email: spectateurEmail,
          telephone: spectateurTel,
          iut: spectateurIut,
          transport: transportSpect ? 'Oui' : '',
          hebergement: hebergementSpect,
        }),
      });

      if (res.ok) {
        setSubmitMessage('Inscription spectateur enregistrée.');
        setSubmitted(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erreur lors de l'inscription spectateur.");
      }
    } catch (error) {
      console.error(error);
      alert('Erreur réseau');
    } finally {
      setIsSubmittingSpectateur(false);
    }
  };

  /* ── Confirmation ───────────────────────────────────────── */
  if (submitted) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[calc(100vh-56px)] p-6">
          <div className="max-w-md w-full text-center">
            <div className="bg-[#FFEF3F] w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#0D0D0D]" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight text-[#0D0D0D] mb-3">
              Inscription confirmée
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">{submitMessage}</p>
            {createdCodeEquipe && (
              <div className="mb-8 border-2 border-[#0D0D0D] bg-[#FFEF3F]/15 p-6 text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                  Code équipe — à transmettre à vos joueurs
                </p>
                <p className="font-mono text-2xl font-black tracking-widest text-[#0D0D0D]">
                  {createdCodeEquipe}
                </p>
                <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                  Chaque joueur de l'équipe utilise ce code pour se connecter sur l'espace
                  joueur. Notez-le précieusement, il ne sera plus affiché après cette page.
                </p>
              </div>
            )}
            {createdCodeEquipe && (
              <div className="mb-8 border-l-4 border-[#DC2626] bg-red-50 px-4 py-3 text-left text-sm text-red-700">
                Votre équipe est en attente de validation par l'organisation. Le code
                fonctionnera dès que votre candidature aura été validée.
              </div>
            )}
            <Link href="/" className="btn-primary">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  /* ── Mode selection ─────────────────────────────────────── */
  if (!mode) {
    return (
      <PageShell>
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold mb-2">
              Tournoi Inter-IUT Lorraine
            </p>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[#0D0D0D]">
              Inscriptions
            </h1>
            <p className="text-gray-500 mt-3">14-15 janvier 2027 · POJC Saint-Dié-des-Vosges</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {['16 équipes au total', '4 sports par équipe', '10 joueurs par équipe'].map((s) => (
                <span
                  key={s}
                  className="text-xs font-bold uppercase tracking-wide border border-[#0D0D0D] px-3 py-1.5 text-[#0D0D0D]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setMode('equipe')}
              className="portal-tile text-left group"
            >
              <div className="w-12 h-12 bg-[#FFEF3F] flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-[#0D0D0D]" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-wide text-white">
                Ajouter une équipe
              </h2>
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-1 mb-4">
                Parcours capitaine
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Sélectionnez 10 spectateurs inscrits. Ils passent automatiquement en joueurs.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-[#FFEF3F] text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                Commencer <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>

            <button
              onClick={() => setMode('spectateur')}
              className="portal-tile text-left group"
            >
              <div className="w-12 h-12 bg-white/10 flex items-center justify-center mb-5">
                <User className="w-6 h-6 text-[#FFEF3F]" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-wide text-white">
                S'inscrire en spectateur
              </h2>
              <p className="text-xs uppercase tracking-widest text-gray-500 mt-1 mb-4">
                Inscription simple
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Votre inscription est enregistrée et visible par les capitaines d'équipe pour
                rejoindre une équipe.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-[#FFEF3F] text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                Commencer <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  /* ── Equipe form ────────────────────────────────────────── */
  if (mode === 'equipe') {
    return (
      <PageShell onBack={() => setMode(null)}>
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold mb-2">
              Inscriptions · Équipe
            </p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-[#0D0D0D]">
              Créer une équipe
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Renseignez les informations puis sélectionnez 10 joueurs parmi les spectateurs inscrits.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="border-2 border-[#0D0D0D] px-5 py-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Spectateurs disponibles
              </p>
              <p className="text-2xl font-black text-[#0D0D0D]">{availableSpectateursCount}</p>
            </div>
            <div className="border-2 border-[#FFEF3F] bg-[#FFEF3F]/10 px-5 py-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Joueurs sélectionnés
              </p>
              <p className="text-2xl font-black text-[#0D0D0D]">
                {selectedCount}
                <span className="text-sm font-semibold text-gray-400">/10</span>
              </p>
            </div>
          </div>

          {availableSpectateursCount < 10 && (
            <div className="mb-6 border-l-4 border-[#FFEF3F] bg-[#FFEF3F]/10 px-4 py-3 text-sm text-[#0D0D0D] font-medium">
              Il faut au moins 10 spectateurs inscrits avant de pouvoir créer une équipe.
            </div>
          )}

          <form onSubmit={handleCreateEquipe} className="space-y-6">
            {/* Step 1 */}
            <div className="bg-white border border-gray-200 p-6 md:p-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] border-b border-gray-100 pb-3 mb-6">
                1 · Informations de l'équipe
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Nom de l'équipe *</label>
                  <input
                    type="text"
                    required
                    value={nomEquipe}
                    onChange={(e) => setNomEquipe(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">IUT *</label>
                  <select
                    required
                    value={iutEquipe}
                    onChange={(e) => setIutEquipe(e.target.value)}
                    className="input"
                  >
                    <option value="">Sélectionnez…</option>
                    {iutOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-gray-200 p-6 md:p-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] border-b border-gray-100 pb-3 mb-6">
                2 · Contact capitaine
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="label">Capitaine</label>
                  {capitaine ? (
                    <div className="input flex items-center justify-between bg-[#FFEF3F]/10 border-[#FFEF3F]">
                      <span className="font-semibold text-[#0D0D0D]">{capitaine.nomComplet}</span>
                      <span className="text-xs text-gray-500">{capitaine.email}</span>
                    </div>
                  ) : (
                    <div className="input bg-gray-50 text-gray-400 text-sm">
                      Cochez "Capitaine" dans la liste à l'étape 3
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    value={capitaineTel}
                    onChange={(e) => setCapitaineTel(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Step 3 — Player selection */}
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-[#0D0D0D]">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-white">
                    3 · Sélection des joueurs
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">Spectateurs disponibles dans Supabase</p>
                </div>
                <span
                  className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 border ${
                    selectedCount === 10
                      ? 'bg-[#FFEF3F] text-[#0D0D0D] border-[#FFEF3F]'
                      : 'text-gray-400 border-white/20'
                  }`}
                >
                  {selectedCount}/10
                </span>
              </div>

              <div className="p-4 border-b border-gray-100">
                <input
                  type="text"
                  value={searchSpectateur}
                  onChange={(e) => setSearchSpectateur(e.target.value)}
                  placeholder="Rechercher (nom, email, IUT)…"
                  className="input"
                />
              </div>

              <div className="max-h-80 overflow-auto">
                <table className="min-w-full">
                  <thead className="bg-[#F4F4F5] sticky top-0">
                    <tr>
                      {['', 'Nom', 'Email', 'IUT', 'Capitaine'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[10px] uppercase tracking-widest font-bold text-[#0D0D0D]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpectateurs.map((s) => {
                      const checked = selectedSpectateurIds.includes(s.id);
                      const disabled = !checked && selectedCount >= 10;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => !disabled && toggleSpectateur(s.id)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            checked
                              ? 'bg-[#FFEF3F]/15'
                              : disabled
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggleSpectateur(s.id)}
                              className="w-4 h-4 accent-[#0D0D0D]"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-sm text-[#0D0D0D]">
                            {s.nomComplet}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-500">{s.email}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-500">{s.iut}</td>
                          <td className="px-4 py-2.5">
                            <input
                              type="radio"
                              name="capitaine"
                              checked={capitaineId === s.id}
                              disabled={!checked}
                              onChange={() => setCapitaineId(s.id)}
                              title={checked ? 'Désigner comme capitaine' : 'Sélectionnez ce joueur pour pouvoir le désigner capitaine'}
                              className="w-4 h-4 accent-[#0D0D0D]"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredSpectateurs.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-400">
                    Aucun spectateur disponible.
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!canCreateEquipe || isSubmittingEquipe}
              className="w-full btn-primary justify-center py-4 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmittingEquipe ? 'Création en cours…' : "Créer l'équipe (10 joueurs)"}
            </button>
          </form>
        </div>
      </PageShell>
    );
  }

  /* ── Spectateur form ────────────────────────────────────── */
  return (
    <PageShell onBack={() => setMode(null)}>
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold mb-2">
            Inscriptions · Spectateur
          </p>
          <h1 className="text-3xl font-black uppercase tracking-tight text-[#0D0D0D]">
            Inscription spectateur
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Formulaire rapide, moins d'une minute.</p>
        </div>

        <form onSubmit={handleCreateSpectateur} className="space-y-6">
          <div className="bg-white border border-gray-200 p-6 md:p-8 space-y-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] border-b border-gray-100 pb-3">
              1 · Vos informations
            </h2>
            <div>
              <label className="label">Nom complet *</label>
              <input
                type="text"
                required
                value={spectateurNom}
                onChange={(e) => setSpectateurNom(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                required
                value={spectateurEmail}
                onChange={(e) => setSpectateurEmail(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Téléphone *</label>
              <input
                type="tel"
                required
                value={spectateurTel}
                onChange={(e) => setSpectateurTel(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">IUT d'origine *</label>
              <select
                required
                value={spectateurIut}
                onChange={(e) => setSpectateurIut(e.target.value)}
                className="input"
              >
                <option value="">Sélectionnez…</option>
                {iutOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 md:p-8 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#0D0D0D] border-b border-gray-100 pb-3">
              2 · Besoins logistiques
            </h2>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={transportSpect}
                onChange={(e) => setTransportSpect(e.target.checked)}
                className="w-4 h-4 accent-[#0D0D0D]"
              />
              <span className="text-sm text-gray-700 group-hover:text-black">
                Transport organisé souhaité
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={hebergementSpect}
                onChange={(e) => setHebergementSpect(e.target.checked)}
                className="w-4 h-4 accent-[#0D0D0D]"
              />
              <span className="text-sm text-gray-700 group-hover:text-black">
                Hébergement souhaité
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmittingSpectateur}
            className="w-full btn-primary justify-center py-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmittingSpectateur ? 'Inscription en cours…' : 'Valider mon inscription'}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
