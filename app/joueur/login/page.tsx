'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Users } from 'lucide-react';

export default function JoueurLoginPage() {
  const [codeEquipe, setCodeEquipe] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/auth/joueur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codeEquipe }),
      });

      if (!res.ok) {
        throw new Error('Code équipe invalide');
      }

      const data = await res.json();
      sessionStorage.setItem('joueur_session', JSON.stringify(data.session));
      window.location.href = '/joueur/dashboard';
    } catch {
      alert('Code équipe invalide. Vérifiez le code fourni par votre capitaine.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-lorraine-blue to-blue-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Retour */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        {/* Card de connexion */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-lorraine-blue rounded-full mb-4">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Espace Joueur
            </h1>
            <p className="text-gray-600">
              Connectez-vous avec votre code équipe
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Équipe
              </label>
              <input
                type="text"
                value={codeEquipe}
                onChange={(e) => setCodeEquipe(e.target.value.toUpperCase())}
                placeholder="NANCY-ALPHA-2027"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lorraine-blue focus:border-transparent text-center font-mono text-lg"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Format: IUT-EQUIPE-2027
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-lorraine-blue hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              SE CONNECTER
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Vous n'avez pas votre code ?<br />
              Contactez le capitaine de votre équipe
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">
              🚧 En développement
            </p>
            <p className="text-xs text-blue-700">
              La connexion joueur sera fonctionnelle dans les prochains jours.
              Vous pourrez alors accéder à votre espace personnel avec vos matchs,
              votre équipe et toutes les infos pratiques.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
