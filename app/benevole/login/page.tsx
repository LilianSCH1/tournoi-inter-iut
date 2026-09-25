'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function BenevoleLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/benevole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Identifiants invalides');

      const data = await res.json();
      sessionStorage.setItem('benevole_session', JSON.stringify(data.session));
      window.location.href = '/benevole/dashboard';
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      <div className="border-b-[3px] border-[#FFEF3F]" />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#FFEF3F] text-sm transition-colors mb-10 uppercase tracking-widest font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          <div className="bg-white p-8 md:p-10">
            <div className="flex items-center gap-4 mb-8">
              <Image src="/Logo_Tournoi_IUT_noir.png" alt="Logo Tournoi Inter-IUT" width={56} height={56} className="flex-shrink-0" />
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-[#0D0D0D]">
                  Espace Bénévole
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Accès réservé au staff d'organisation
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@etu.univ-lorraine.fr"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  required
                />
              </div>

              {error && (
                <div className="border-l-4 border-[#DC2626] bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary justify-center py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
