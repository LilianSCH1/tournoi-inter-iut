'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function BenevoleLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/auth/benevole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Identifiants invalides');
      }

      const data = await res.json();
      sessionStorage.setItem('benevole_session', JSON.stringify(data.session));
      window.location.href = '/benevole/dashboard';
    } catch {
      alert('Email ou mot de passe incorrect.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-lorraine-red to-red-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-red-200 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-lorraine-red rounded-full mb-4">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Espace Bénévole
            </h1>
            <p className="text-gray-600">
              Accès réservé au staff d'organisation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@etu.univ-lorraine.fr"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lorraine-red focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lorraine-red focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-lorraine-red hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              SE CONNECTER
            </button>
          </form>

          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800 font-medium mb-2">
              🚧 En développement
            </p>
            <p className="text-xs text-red-700">
              Dashboard bénévole : check-in participants, saisie scores,
              gestion incidents. Disponible très bientôt !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
