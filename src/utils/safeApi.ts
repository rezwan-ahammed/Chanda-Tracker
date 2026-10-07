import { User, DivisionName, UserRole } from '../types';

export interface SafeApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtmlResponse?: boolean;
}

/**
 * Safely fetches JSON from an endpoint.
 * Protects against HTML error responses (such as Vercel 404 "The page could not be found...")
 * which cause "SyntaxError: Unexpected token 'T', 'The page c'... is not valid JSON".
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    // If the server returned HTML or non-JSON
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `সার্ভার থেকে অনাকাঙ্ক্ষিত রেসপন্স এসেছে (HTTP ${res.status})`,
        isHtmlResponse: true,
      };
    }

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
      error: res.ok ? undefined : (data.error || `অনুরোধ ব্যর্থ হয়েছে (HTTP ${res.status})`),
      isHtmlResponse: false,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'নেটওয়ার্ক সংযোগ ত্রুটি',
      isHtmlResponse: false,
    };
  }
}

// Built-in standard citizen test accounts
const DEFAULT_TEST_ACCOUNTS: User[] = [
  {
    id: 'usr_01711000001',
    name: 'তানভীর আহমেদ',
    phoneOrEmail: '01711000001',
    division: 'ঢাকা',
    role: 'CITIZEN',
    zkpHash: 'sha256_e7d8c91a2b3c4d5e',
    karma: 150,
    createdAt: '২০২৬-১০-০১',
    votedSpotIds: {},
    reportedSpotIds: [],
    isVerified: true,
  },
  {
    id: 'usr_01811000002',
    name: 'ফারহানা ইসলাম',
    phoneOrEmail: '01811000002',
    division: 'চট্টগ্রাম',
    role: 'JUROR',
    zkpHash: 'sha256_f8a9b01c2d3e4f5a',
    karma: 320,
    createdAt: '২০২৬-০৯-১৫',
    votedSpotIds: {},
    reportedSpotIds: [],
    isVerified: true,
  },
  {
    id: 'usr_01911000003',
    name: 'মাহবুবুর রহমান',
    phoneOrEmail: '01911000003',
    division: 'রাজশাহী',
    role: 'INVESTIGATOR',
    zkpHash: 'sha256_b1c2d3e4f5a6b7c8',
    karma: 490,
    createdAt: '২০২৬-০৮-২০',
    votedSpotIds: {},
    reportedSpotIds: [],
    isVerified: true,
  },
];

// In-memory or localStorage fallback auth manager for static Vercel deployments
export function getClientStoredUsers(): Record<string, { user: User; password?: string; token: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('civic_registered_users');
    if (!raw) {
      // Seed default accounts
      const initial: Record<string, { user: User; password?: string; token: string }> = {};
      DEFAULT_TEST_ACCOUNTS.forEach(acc => {
        initial[acc.phoneOrEmail] = {
          user: acc,
          password: 'password123',
          token: `token_${acc.id}`,
        };
      });
      localStorage.setItem('civic_registered_users', JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveClientUser(user: User, password?: string, token?: string): string {
  const users = getClientStoredUsers();
  const userToken = token || `token_${user.id}_${Date.now()}`;
  users[user.phoneOrEmail] = {
    user,
    password: password || 'default_pass',
    token: userToken,
  };
  try {
    localStorage.setItem('civic_registered_users', JSON.stringify(users));
  } catch {}
  return userToken;
}

export function clientAuthenticate(phoneOrEmail: string, password?: string): { user: User; token: string } | null {
  const users = getClientStoredUsers();
  const entry = users[phoneOrEmail.trim()];
  if (!entry) return null;

  if (password && entry.password && entry.password !== password) {
    return null;
  }

  return { user: entry.user, token: entry.token };
}

export function clientGetUserByToken(token: string): User | null {
  const users = getClientStoredUsers();
  for (const key of Object.keys(users)) {
    if (users[key].token === token) {
      return users[key].user;
    }
  }
  return null;
}
