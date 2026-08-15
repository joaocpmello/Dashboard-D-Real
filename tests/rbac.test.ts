/**
 * Testes de RBAC server-side.
 * Mockamos getSessionUser para evitar Supabase/Prisma em runtime.
 */
import { describe, expect, it } from 'vitest';
import { RBACService } from '@/lib/auth/rbac';
import { ForbiddenError, UnauthorizedError } from '@/lib/auth/errors';
import type { SessionUser } from '@/lib/auth/session';

// Mock simples do módulo de sessão.
const mockSession = (s: SessionUser | null) => {
  // Vitest não tem jest.mock — vamos patchar via vi.spyOn no objeto cacheado.
  // Como getSessionUser vem de react.cache, patchamos via dynamic import.
};

import { vi } from 'vitest';

vi.mock('@/lib/auth/session', async () => {
  let current: SessionUser | null = null;
  return {
    getSessionUser: async () => current,
    requireSession: async () => {
      if (!current) throw new UnauthorizedError();
      return current;
    },
    __setSession: (s: SessionUser | null) => {
      current = s;
    },
  };
});

const baseUser = (overrides: Partial<SessionUser>): SessionUser => ({
  id: 'user-1',
  email: 'a@b.com',
  isSuperAdmin: false,
  organizationId: 'org-1',
  role: 'VIEWER',
  ...overrides,
});

describe('RBACService', () => {
  it('rejeita quando não há sessão', async () => {
    const { __setSession } = await import('@/lib/auth/session');
    __setSession(null);
    await expect(RBACService.requireRole('VIEWER')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('SUPER_ADMIN passa qualquer checagem', async () => {
    const { __setSession } = await import('@/lib/auth/session');
    __setSession(baseUser({ isSuperAdmin: true, organizationId: null, role: null }));
    const s = await RBACService.requireRole('VIEWER');
    expect(s.isSuperAdmin).toBe(true);
  });

  it('VIEWER não passa checagem de ADMIN', async () => {
    const { __setSession } = await import('@/lib/auth/session');
    __setSession(baseUser({ role: 'VIEWER' }));
    await expect(RBACService.requireRole('ADMIN')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('ADMIN passa checagem de MANAGER (hierarquia)', async () => {
    const { __setSession } = await import('@/lib/auth/session');
    __setSession(baseUser({ role: 'ADMIN' }));
    const s = await RBACService.requireRole('MANAGER');
    expect(s.role).toBe('ADMIN');
  });

  it('requireSuperAdmin rejeita usuário comum', async () => {
    const { __setSession } = await import('@/lib/auth/session');
    __setSession(baseUser({ role: 'ADMIN' }));
    await expect(RBACService.requireSuperAdmin()).rejects.toBeInstanceOf(ForbiddenError);
  });
});
