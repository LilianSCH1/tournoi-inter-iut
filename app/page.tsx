'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Users, Trophy, MapPin } from 'lucide-react';

function calculateTimeLeft() {
  const eventDate = new Date('2027-01-14T09:00:00');
  const now = new Date();
  const difference = eventDate.getTime() - now.getTime();

  if (difference > 0) {
    return {
      jours: Math.floor(difference / (1000 * 60 * 60 * 24)),
      heures: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      secondes: Math.floor((difference / 1000) % 60),
    };
  }

  return { jours: 0, heures: 0, minutes: 0, secondes: 0 };
}

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState({ jours: 0, heures: 0, minutes: 0, secondes: 0 });
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState({ participants: 0, iut: 0, sports: 0, matchs: 0 });

  const loadSummary = async () => {
    try {
      const res = await fetch('/api/public/summary', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setSummary({
        participants: data.participants || 0,
        iut: data.iut || 0,
        sports: data.sports || 0,
        matchs: data.matchs || 0,
      });
    } catch (error) {
      console.error('Erreur chargement résumé public:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());
    loadSummary();

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    const summaryTimer = setInterval(loadSummary, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(summaryTimer);
    };
  }, []);

  return (
    <div className="min-h-screen text-foreground">
      <header className="glass sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="InterCampus Logo" width={54} height={54} />
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Tournoi Inter-IUT</p>
                <h1 className="text-lg md:text-2xl font-semibold text-slate-800">Lorraine 2027</h1>
              </div>
            </div>
            <p className="hidden md:flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-500" />
              POJC Saint-Dié-des-Vosges • 14-15 janvier
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 md:py-14 space-y-8">
        <section className="rounded p-6 md:p-10 animate-rise-in panel-raised">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Edition 2027</p>
          <h2 className="text-4xl md:text-5xl font-semibold leading-tight mt-3 max-w-4xl text-slate-800">
            Tournoi inter-IUT
            <span className="block text-slate-600">plateforme officielle</span>
          </h2>
          <p className="mt-6 max-w-2xl text-sm md:text-base text-slate-600">
            Un seul point d'entrée pour s'inscrire, se connecter et suivre le tournoi en temps réel.
          </p>
          <div className="mt-8">
            <Link href="/inscription" className="btn-primary inline-flex">Je m'inscris</Link>
          </div>
        </section>

        <section className="panel rounded p-5 md:p-7 live-stripe pl-6 md:pl-8">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Compte à rebours</p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {(mounted
              ? [
                  { label: 'Jours', value: timeLeft.jours },
                  { label: 'Heures', value: timeLeft.heures },
                  { label: 'Minutes', value: timeLeft.minutes },
                  { label: 'Secondes', value: timeLeft.secondes },
                ]
              : [
                  { label: 'Jours', value: '--' },
                  { label: 'Heures', value: '--' },
                  { label: 'Minutes', value: '--' },
                  { label: 'Secondes', value: '--' },
                ]).map((item) => (
              <div key={item.label} className="panel-deep rounded px-4 py-5">
                <div className="font-display text-4xl md:text-5xl font-semibold text-slate-800 tabular-nums">
                  {typeof item.value === 'number' ? String(item.value).padStart(2, '0') : item.value}
                </div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500 mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link href="/joueur/login" className="card-hover interactive-tile">
            <Users className="w-6 h-6 text-slate-600" />
            <h3 className="mt-4 text-xl font-semibold text-slate-800">Joueur</h3>
            <p className="mt-2 text-sm text-slate-600">Accès direct à votre espace personnel et à vos informations d'équipe.</p>
          </Link>

          <Link href="/benevole/login" className="card-hover interactive-tile">
            <Trophy className="w-6 h-6 text-slate-600" />
            <h3 className="mt-4 text-xl font-semibold text-slate-800">Bénévole</h3>
            <p className="mt-2 text-sm text-slate-600">Consignes terrain et suivi des missions en un clic.</p>
          </Link>

          <Link href="/admin/login" className="rounded p-6 panel-deep interactive-tile md:col-span-2 xl:col-span-1">
            <div className="w-6 h-6 flex items-center justify-center text-lg">🛠️</div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-800">Administration</h3>
            <p className="mt-2 text-sm text-slate-600">Supervision globale, données en direct et priorités organisationnelles.</p>
          </Link>
        </section>

        <section className="panel rounded p-6 md:p-8">
          <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Informations rapides</p>
              <h3 className="text-2xl font-semibold text-slate-800 mt-1">Le tournoi en chiffres</h3>
            </div>
            <p className="text-sm text-slate-500">Tous les indicateurs sont mis à jour automatiquement.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Étudiants inscrits', value: summary.participants },
              { label: 'IUT', value: summary.iut },
              { label: 'Sports', value: summary.sports },
              { label: 'Matchs', value: summary.matchs },
            ].map((item) => (
              <div key={item.label} className="panel-deep rounded p-4">
                <p className="font-display text-3xl font-semibold text-slate-800">{item.value}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500 mt-2">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/planning" className="inline-flex items-center gap-2 px-4 py-2 rounded panel-deep text-sm text-slate-700 hover:bg-slate-200/70 transition">
              <Calendar className="w-4 h-4" />
              Voir le planning
            </Link>
            <Link href="/resultats" className="inline-flex items-center gap-2 px-4 py-2 rounded panel-deep text-sm text-slate-700 hover:bg-slate-200/70 transition">
              <Trophy className="w-4 h-4" />
              Résultats en direct
            </Link>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="panel rounded p-6">
            <h3 className="text-xl font-semibold text-slate-800">Parcours simple</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p><strong>1.</strong> Cliquez sur Je m'inscris.</p>
              <p><strong>2.</strong> Choisissez Équipe ou Spectateur.</p>
              <p><strong>3.</strong> Validez votre formulaire et suivez les infos en direct.</p>
            </div>
          </div>
          <div className="panel-deep rounded p-6">
            <h3 className="text-xl font-semibold text-slate-800">Accès public rapide</h3>
            <p className="mt-3 text-sm text-slate-600">Planning et résultats sont accessibles sans compte pour orienter les visiteurs en quelques secondes.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/planning" className="btn-secondary text-sm">Planning</Link>
              <Link href="/resultats" className="btn-secondary text-sm">Résultats</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-slate-500">
        <p>Organisé par IUT Saint-Die-des-Vosges</p>
        <p className="mt-1">Contact: lilian.schmitt1@etu.univ-lorraine.fr</p>
      </footer>
    </div>
  );
}
