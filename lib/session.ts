import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import type { UserRole } from './auth';

const COOKIE_NAME = 'tournoi_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 12; // 12h

export interface SessionPayload {
  role: UserRole;
  email?: string;
  nomComplet?: string;
  equipeId?: string;
  equipeName?: string;
  iut?: string;
  codeEquipe?: string;
  participantId?: string;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET manquant dans les variables d\'environnement.');
  }
  return secret;
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function encodeSession(
  payload: Omit<SessionPayload, 'iat' | 'exp'>,
  ttlSeconds = DEFAULT_TTL_SECONDS
): string {
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const body = Buffer.from(JSON.stringify(full)).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie(
  payload: Omit<SessionPayload, 'iat' | 'exp'>,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession(payload, ttlSeconds), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ttlSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

type RoleCheckResult =
  | { session: SessionPayload; error?: undefined }
  | { session?: undefined; error: NextResponse };

export async function requireRole(roles: UserRole[]): Promise<RoleCheckResult> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Authentification requise' }, { status: 401 }) };
  }
  if (!roles.includes(session.role)) {
    return { error: NextResponse.json({ error: 'Accès refusé pour ce rôle' }, { status: 403 }) };
  }
  return { session };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
