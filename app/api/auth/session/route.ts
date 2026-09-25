import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Permet au client de vérifier (et de re-synchroniser sa copie d'affichage en
// sessionStorage) que le cookie httpOnly est toujours valide, sans jamais
// exposer le cookie lui-même au JS. Retourne 401 si absent/expiré/invalide.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Aucune session active' }, { status: 401 });
  }
  const { iat, exp, ...rest } = session;
  return NextResponse.json({ session: rest });
}
