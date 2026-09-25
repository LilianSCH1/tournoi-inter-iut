import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'tournoi_session';

const ROUTE_RULES: Array<{ prefix: string; role: string; loginPath: string }> = [
  { prefix: '/admin', role: 'admin', loginPath: '/admin/login' },
  { prefix: '/benevole', role: 'benevole', loginPath: '/benevole/login' },
  { prefix: '/joueur', role: 'joueur', loginPath: '/joueur/login' },
];

// Lecture "légère" du rôle, sans vérification de signature : ce middleware tourne
// en Edge runtime et ne sert qu'à éviter d'afficher la coquille d'un dashboard
// avant la redirection. La vérification cryptographique réelle (source de vérité
// pour la sécurité) se fait côté routes API via lib/session.ts#requireRole.
function readRole(request: NextRequest): string | null {
  const raw = request.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const [body] = raw.split('.');
  if (!body) return null;
  try {
    const json = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (typeof json.exp === 'number' && json.exp < Math.floor(Date.now() / 1000)) return null;
    return typeof json.role === 'string' ? json.role : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const rule of ROUTE_RULES) {
    if (pathname.startsWith(rule.prefix) && pathname !== rule.loginPath) {
      if (readRole(request) !== rule.role) {
        return NextResponse.redirect(new URL(rule.loginPath, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/benevole/:path*', '/joueur/:path*'],
};
