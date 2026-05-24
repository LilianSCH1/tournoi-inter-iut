'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, User, CheckCircle } from 'lucide-react';

type Mode = 'equipe' | 'spectateur' | null;

type Spectateur = {
  id: string;
  nomComplet: string;
  email: string;
  iut: string;
  type: string;
  equipeIds: string[];
};

export default function InscriptionPage() {
  const [mode, setMode] = useState<Mode>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isSubmittingEquipe, setIsSubmittingEquipe] = useState(false);
  const [isSubmittingSpectateur, setIsSubmittingSpectateur] = useState(false);

  const [iutOptions, setIutOptions] = useState<string[]>([]);
  const [spectateurs, setSpectateurs] = useState<Spectateur[]>([]);
  const [searchSpectateur, setSearchSpectateur] = useState('');

  const [nomEquipe, setNomEquipe] = useState('');
  const [iutEquipe, setIutEquipe] = useState('');
  const [capitaineNom, setCapitaineNom] = useState('');
  const [capitaineEmail, setCapitaineEmail] = useState('');
  const [capitaineTel, setCapitaineTel] = useState('');
  const [selectedSpectateurIds, setSelectedSpectateurIds] = useState<string[]>([]);

  const [spectateurNom, setSpectateurNom] = useState('');
  const [spectateurEmail, setSpectateurEmail] = useState('');
  const [spectateurTel, setSpectateurTel] = useState('');
  const [spectateurIut, setSpectateurIut] = useState('');
  const [transportSpect, setTransportSpect] = useState(false);
  const [hebergementSpect, setHebergementSpect] = useState(false);

  const selectedCount = selectedSpectateurIds.length;
  const availableSpectateursCount = spectateurs.length;
  const canCreateEquipe = selectedCount === 10 && availableSpectateursCount >= 10 && nomEquipe.trim() && iutEquipe.trim() && capitaineNom.trim() && capitaineEmail.trim() && capitaineTel.trim();

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
            (p: any) => p.type === 'Spectateur' && (!Array.isArray(p.equipeIds) || p.equipeIds.length === 0)
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

    return spectateurs.filter((s) =>
      s.nomComplet.toLowerCase().includes(key) ||
      s.email.toLowerCase().includes(key) ||
      String(s.iut || '').toLowerCase().includes(key)
    );
  }, [spectateurs, searchSpectateur]);

  const toggleSpectateur = (id: string) => {
    setSelectedSpectateurIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
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

    try {
      setIsSubmittingEquipe(true);
      const res = await fetch('/api/equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomEquipe,
          iut: iutEquipe,
          capitaineNom,
          capitaineEmail,
          capitaineTel,
          selectedSpectateurIds,
        }),
      });

      if (res.ok) {
        setSubmitMessage('Équipe créée avec succès. Les 10 spectateurs sélectionnés sont passés automatiquement en joueurs.');
        setSubmitted(true);
      } else {
        const err = await res.json().catch(() => ({}));
        if (Array.isArray(err.failedPlayers) && err.failedPlayers.length > 0) {
          const details = err.failedPlayers
            .map((p: any) => `${p.nom || p.id} (rôle: ${p.roleOk ? 'ok' : 'échec'}, équipe: ${p.teamOk ? 'ok' : 'échec'})`)
            .join('\n');
          alert(`${err.error || 'Affectation incomplète'}\n\nJoueurs en échec:\n${details}`);
        } else {
          alert(err.error || 'Erreur lors de la création de l\'équipe.');
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
        setSubmitMessage('Inscription spectateur enregistrée dans Airtable.');
        setSubmitted(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erreur lors de l\'inscription spectateur.');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur réseau');
    } finally {
      setIsSubmittingSpectateur(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full panel-raised rounded p-8 text-center">
          <CheckCircle className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Inscription confirmée</h2>
          <p className="text-slate-600 mb-6">{submitMessage}</p>
          <Link href="/" className="inline-block btn-primary">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-5xl py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          <div className="panel-raised rounded p-6 md:p-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-800 mb-2">Inscriptions du tournoi</h1>
            <p className="text-slate-600">14-15 janvier 2027 - POJC Saint-Dié-des-Vosges</p>
            <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
              <div className="rounded panel-deep px-4 py-2 text-slate-700">16 équipes au total</div>
              <div className="rounded panel-deep px-4 py-2 text-slate-700">4 sports par équipe</div>
              <div className="rounded panel-deep px-4 py-2 text-slate-700">10 joueurs obligatoires par équipe</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => setMode('equipe')}
              className="panel interactive-tile rounded p-8 text-left hover:bg-slate-100/80"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded flex items-center justify-center bg-slate-200">
                  <Users className="w-7 h-7 text-slate-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800">Ajouter une équipe</h2>
                  <p className="text-slate-500 text-sm">Parcours capitaine</p>
                </div>
              </div>
              <p className="text-slate-700 mb-3">Sélectionnez 10 spectateurs inscrits. Ils passent automatiquement en joueurs.</p>
              <p className="text-sm text-slate-500">La liste est chargée en temps réel depuis Airtable.</p>
            </button>

            <button
              onClick={() => setMode('spectateur')}
              className="panel interactive-tile rounded p-8 text-left hover:bg-slate-100/80"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded flex items-center justify-center bg-slate-200">
                  <User className="w-7 h-7 text-slate-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800">S'inscrire en spectateur</h2>
                  <p className="text-slate-500 text-sm">Inscription simple</p>
                </div>
              </div>
              <p className="text-slate-700 mb-3">Votre inscription est enregistrée et visible par les capitaines d'équipe.</p>
              <p className="text-sm text-slate-500">Vous pourrez ensuite être sélectionné pour rejoindre une équipe.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'equipe') {
    return (
      <div className="min-h-screen p-4">
        <div className="container mx-auto max-w-5xl py-8">
          <button onClick={() => setMode(null)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          <div className="panel-raised rounded p-8">
            <h1 className="text-3xl font-semibold text-slate-800 mb-2">Créer une équipe</h1>
            <p className="text-slate-600 mb-6">Suivez les étapes: informations équipe puis sélection de 10 joueurs.</p>
            <div className="mb-6 grid md:grid-cols-2 gap-3">
              <div className="rounded panel-deep px-4 py-3 text-slate-700">
                Spectateurs disponibles: <strong>{availableSpectateursCount}</strong>
              </div>
              <div className="rounded panel-deep px-4 py-3 text-slate-600">
                Joueurs requis pour créer une équipe: <strong>10</strong>
              </div>
            </div>

            {availableSpectateursCount < 10 && (
              <div className="mb-6 rounded bg-slate-200 px-4 py-3 text-slate-700">
                Il faut au moins 10 spectateurs inscrits avant de pouvoir créer une équipe.
              </div>
            )}

            <form onSubmit={handleCreateEquipe} className="space-y-6">
              <section className="rounded-lg section-split p-5 md:p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">1. Informations de l'équipe</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nom de l'équipe *</label>
                    <input type="text" required value={nomEquipe} onChange={(e) => setNomEquipe(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">IUT *</label>
                    <select required value={iutEquipe} onChange={(e) => setIutEquipe(e.target.value)} className="input">
                      <option value="">Sélectionnez...</option>
                      {iutOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-lg section-split p-5 md:p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">2. Contact capitaine</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Capitaine - Nom *</label>
                    <input type="text" required value={capitaineNom} onChange={(e) => setCapitaineNom(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Capitaine - Email *</label>
                    <input type="email" required value={capitaineEmail} onChange={(e) => setCapitaineEmail(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Capitaine - Téléphone *</label>
                    <input type="tel" required value={capitaineTel} onChange={(e) => setCapitaineTel(e.target.value)} className="input" />
                  </div>
                </div>
              </section>

              <section className="rounded-lg section-split p-2 md:p-3">
                <h2 className="px-3 pt-3 text-lg font-semibold text-slate-800">3. Sélection des joueurs</h2>
                <div className="rounded panel mt-3">
                  <div className="p-4 panel-deep flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Spectateurs disponibles (Airtable)</h2>
                      <p className="text-sm text-slate-500">Sélection obligatoire: 10/10</p>
                    </div>
                    <div className={`text-sm font-semibold px-3 py-1 rounded-full ${selectedCount === 10 ? 'bg-slate-300 text-slate-800' : 'bg-slate-200 text-slate-700'}`}>
                      {selectedCount}/10 sélectionnés
                    </div>
                  </div>

                  <div className="p-4 panel-deep">
                    <input
                      type="text"
                      value={searchSpectateur}
                      onChange={(e) => setSearchSpectateur(e.target.value)}
                      placeholder="Rechercher un spectateur (nom, email, IUT)..."
                      className="input"
                    />
                  </div>

                  <div className="max-h-80 overflow-auto">
                    <table className="min-w-full">
                      <thead className="panel-deep sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs uppercase text-slate-500">Sélection</th>
                          <th className="px-4 py-2 text-left text-xs uppercase text-slate-500">Nom</th>
                          <th className="px-4 py-2 text-left text-xs uppercase text-slate-500">Email</th>
                          <th className="px-4 py-2 text-left text-xs uppercase text-slate-500">IUT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSpectateurs.map((s) => {
                          const checked = selectedSpectateurIds.includes(s.id);
                          const disabled = !checked && selectedCount >= 10;

                          return (
                            <tr key={s.id} className="odd:bg-slate-50 even:bg-slate-100/70 hover:bg-slate-200/70">
                              <td className="px-4 py-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={disabled}
                                  onChange={() => toggleSpectateur(s.id)}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="px-4 py-2 font-medium text-slate-800">{s.nomComplet}</td>
                              <td className="px-4 py-2 text-sm text-slate-600">{s.email}</td>
                              <td className="px-4 py-2 text-sm text-slate-600">{s.iut}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredSpectateurs.length === 0 && (
                      <div className="p-6 text-center text-sm text-slate-500">Aucun spectateur disponible.</div>
                    )}
                  </div>
                </div>
              </section>

              <button
                type="submit"
                disabled={!canCreateEquipe || isSubmittingEquipe}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingEquipe ? 'Création en cours...' : 'Créer l\'équipe (10 joueurs)'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <button onClick={() => setMode(null)} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="panel-raised rounded p-8">
          <h1 className="text-3xl font-semibold text-slate-800 mb-2">Inscription spectateur</h1>
          <p className="text-slate-600 mb-6">Formulaire simple et rapide en moins d'une minute.</p>

          <form onSubmit={handleCreateSpectateur} className="space-y-5">
            <section className="rounded-lg section-split p-5 md:p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800">1. Vos informations</h2>
              <div>
                <label className="label">Nom complet *</label>
                <input type="text" required value={spectateurNom} onChange={(e) => setSpectateurNom(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" required value={spectateurEmail} onChange={(e) => setSpectateurEmail(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Téléphone *</label>
                <input type="tel" required value={spectateurTel} onChange={(e) => setSpectateurTel(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">IUT d'origine *</label>
                <select required value={spectateurIut} onChange={(e) => setSpectateurIut(e.target.value)} className="input">
                  <option value="">Sélectionnez...</option>
                  {iutOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="rounded-lg section-split p-5 md:p-6 space-y-3 text-slate-700">
              <h2 className="text-lg font-semibold text-slate-800">2. Besoins logistiques</h2>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={transportSpect} onChange={(e) => setTransportSpect(e.target.checked)} className="w-4 h-4" />
                <span>Transport organisé souhaité</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={hebergementSpect} onChange={(e) => setHebergementSpect(e.target.checked)} className="w-4 h-4" />
                <span>Hébergement souhaité</span>
              </label>
            </section>

            <button
              type="submit"
              disabled={isSubmittingSpectateur}
              className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingSpectateur ? 'Inscription en cours...' : 'Valider mon inscription'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
