'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Users, Trophy, MapPin, ChevronRight, Zap } from 'lucide-react';

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

    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    const summaryTimer = setInterval(loadSummary, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(summaryTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0D0D0D]">

      {/* ── Header ── */}
      <header className="glass sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/Logo_Tournoi_IUT_jaune.png"
                alt="Logo Tournoi Inter-IUT"
                width={44}
                height={44}
              />
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gray-500">Tournoi Inter-IUT</p>
                <h1 className="text-base font-bold text-white tracking-wide">
                  Lorraine <span className="text-[#FFEF3F]">2027</span>
                </h1>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4 text-[#FFEF3F]" />
              <span>POJC Saint-Dié-des-Vosges · 14-15 janvier</span>
            </div>
          </div>
        </div>
      </header>

      <main>

        {/* ── Hero ── */}
        <section className="relative bg-white overflow-hidden py-16 md:py-24">
          <div
            className="absolute top-0 right-0 h-full w-[45%] hidden md:block pointer-events-none"
            style={{
              background: '#FFEF3F',
              clipPath: 'polygon(18% 0%, 100% 0%, 100% 100%, 0% 100%)',
            }}
            aria-hidden="true"
          />
          <div className="absolute top-0 left-0 w-1 h-full bg-[#FFEF3F] hidden md:block" aria-hidden="true" />

          <div className="container mx-auto px-4 relative z-10 animate-rise-in">
            <span className="inline-block bg-[#0D0D0D] text-[#FFEF3F] text-[10px] font-bold uppercase tracking-[0.25em] px-3 py-1.5 mb-7">
              Édition 2027
            </span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tight text-[#0D0D0D] max-w-2xl">
              Tournoi<br />Inter-IUT<br />Lorraine
            </h2>
            <p className="mt-7 max-w-md text-base text-gray-500 leading-relaxed">
              Un seul point d'entrée pour s'inscrire, se connecter et suivre le tournoi en temps réel. 300 étudiants, 7&nbsp;IUT, 4&nbsp;sports.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/inscription" className="btn-primary gap-2">
                Je m'inscris <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/planning" className="btn-secondary gap-2">
                <Calendar className="w-4 h-4" />
                Voir le planning
              </Link>
            </div>
          </div>
        </section>

        {/* ── Countdown ── */}
        <section className="bg-[#0D0D0D] py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-4 h-4 text-[#FFEF3F]" />
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#FFEF3F] font-bold">Compte à rebours</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  ]
              ).map((item) => (
                <div key={item.label} className="border border-white/10 px-5 py-6 md:px-7 md:py-8 hover:border-[#FFEF3F]/40 transition-colors">
                  <div className="text-5xl md:text-6xl font-black text-[#FFEF3F] tabular-nums leading-none">
                    {typeof item.value === 'number'
                      ? String(item.value).padStart(2, '0')
                      : item.value}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-3">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Portal tiles ── */}
        <section className="bg-[#111111] py-12 md:py-14">
          <div className="container mx-auto px-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#FFEF3F] font-bold mb-7">Accès direct</p>
            <div className="grid md:grid-cols-3 gap-3">

              <Link href="/joueur/login" className="portal-tile group">
                <Users className="w-6 h-6 text-[#FFEF3F]" />
                <h3 className="mt-5 text-xl font-bold text-white uppercase tracking-wide">Joueur</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  Accès direct à votre espace personnel et à vos informations d'équipe.
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-[#FFEF3F] text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                  Se connecter <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link href="/benevole/login" className="portal-tile group">
                <Trophy className="w-6 h-6 text-[#FFEF3F]" />
                <h3 className="mt-5 text-xl font-bold text-white uppercase tracking-wide">Bénévole</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  Consignes terrain et suivi des missions en un clic.
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-[#FFEF3F] text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                  Se connecter <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

              <Link href="/admin/login" className="portal-tile group border-[#FFEF3F]/20">
                <div className="text-[#FFEF3F] text-lg font-black">⚙</div>
                <h3 className="mt-5 text-xl font-bold text-white uppercase tracking-wide">Administration</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  Supervision globale, données en direct et priorités organisationnelles.
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-[#FFEF3F] text-xs font-bold uppercase tracking-widest group-hover:gap-3 transition-all">
                  Accéder <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>

            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="bg-white py-14 md:py-16 border-t-[3px] border-[#FFEF3F]">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-bold mb-2">Le tournoi en chiffres</p>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-[#0D0D0D]">
                  Indicateurs clés
                </h3>
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Mis à jour automatiquement</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Étudiants inscrits', value: summary.participants },
                { label: 'IUT participants', value: summary.iut },
                { label: 'Sports au programme', value: summary.sports },
                { label: 'Matchs au total', value: summary.matchs },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-2 border-[#0D0D0D] p-5 md:p-7 hover:bg-[#FFEF3F] transition-colors group cursor-default"
                >
                  <p className="text-4xl md:text-5xl font-black text-[#0D0D0D] tabular-nums leading-none">
                    {item.value}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 group-hover:text-[#0D0D0D] mt-3 font-semibold transition-colors">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/planning" className="btn-secondary gap-2 text-sm py-2.5">
                <Calendar className="w-4 h-4" />
                Planning
              </Link>
              <Link href="/resultats" className="btn-secondary gap-2 text-sm py-2.5">
                <Trophy className="w-4 h-4" />
                Résultats en direct
              </Link>
            </div>
          </div>
        </section>

        {/* ── Info section ── */}
        <section className="bg-[#F9F9F9] py-12 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-200 p-7">
                <h3 className="text-xl font-black uppercase tracking-wide text-[#0D0D0D]">Parcours simple</h3>
                <div className="mt-5 space-y-3 text-sm text-gray-600 leading-relaxed">
                  <p>
                    <strong className="text-black font-bold">1.</strong> Cliquez sur Je m'inscris.
                  </p>
                  <p>
                    <strong className="text-black font-bold">2.</strong> Choisissez Équipe ou Spectateur.
                  </p>
                  <p>
                    <strong className="text-black font-bold">3.</strong> Validez votre formulaire et suivez les infos en direct.
                  </p>
                </div>
              </div>
              <div className="bg-[#0D0D0D] p-7">
                <h3 className="text-xl font-black uppercase tracking-wide text-white">Accès public rapide</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  Planning et résultats accessibles sans compte pour orienter les visiteurs en quelques secondes.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/planning" className="btn-primary text-sm py-2.5">
                    Planning
                  </Link>
                  <Link
                    href="/resultats"
                    className="inline-flex items-center text-sm text-[#FFEF3F] border border-[#FFEF3F]/30 px-5 py-2.5 hover:bg-[#FFEF3F] hover:text-black transition-colors font-bold uppercase tracking-widest"
                  >
                    Résultats
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0D0D0D] py-8 border-t-[3px] border-[#FFEF3F]">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            Organisé par <span className="text-white font-semibold">IUT Saint-Dié-des-Vosges</span>
          </p>
          <p className="mt-1.5 text-xs text-gray-600">
            Contact : lilian.schmitt1@etu.univ-lorraine.fr
          </p>
        </div>
      </footer>

    </div>
  );
}
