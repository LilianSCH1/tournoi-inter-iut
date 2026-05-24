import { NextResponse } from 'next/server';
import { authenticateBenevole } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');

    const user = await authenticateBenevole(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      session: {
        email: user.email,
        nomComplet: user.nomComplet,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur auth benevole:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
