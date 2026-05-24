import { NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');

    const user = await authenticateAdmin(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      session: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erreur auth admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
