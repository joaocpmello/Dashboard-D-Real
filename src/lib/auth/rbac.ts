import 'server-only';
import type { SessionUser } from '@/lib/auth/session';
import { getSessionUser } from '@/lib/auth/session';
import { ForbiddenError, UnauthorizedError } from '@/lib/auth/errors';

type Role = NonNullable<SessionUser['role']>;

const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 40,
  MANAGER: 30,
  OPERATOR: 20,
  VIEWER: 10,
};

export class RBACService {
  // Verifica role mínimo considerando hierarquia.
  static requireRole(min: Role): Promise<SessionUser> {
    return this.enforce(async (s) => {
      if (s.isSuperAdmin) return;
      if (s.organizationId === null) throw new ForbiddenError('Sem organização ativa');
      if (!s.role) throw new ForbiddenError('Usuário sem papel');
      if (ROLE_HIERARCHY[s.role] < ROLE_HIERARCHY[min]) {
        throw new ForbiddenError(`Papel insuficiente (requer ${min})`);
      }
    }, min);
  }

  // Exige um dos papéis listados (sem hierarquia).
  static requireOneOf(roles: Role[]): Promise<SessionUser> {
    const min: Role = roles[0] ?? 'VIEWER';
    return this.enforce(async (s) => {
      if (s.isSuperAdmin) return;
      if (s.organizationId === null) throw new ForbiddenError('Sem organização ativa');
      if (!s.role || !roles.includes(s.role)) {
        throw new ForbiddenError('Papel não autorizado');
      }
    }, min);
  }

  // Apenas SUPER_ADMIN da plataforma.
  static requireSuperAdmin(): Promise<SessionUser> {
    return this.enforce(async (s) => {
      if (!s.isSuperAdmin) throw new ForbiddenError('Apenas SUPER_ADMIN');
    }, 'ADMIN');
  }

  private static async enforce(
    check: (s: SessionUser) => Promise<void>,
    _min: Role | string,
  ): Promise<SessionUser> {
    const session = await getSessionUser();
    if (!session) throw new UnauthorizedError('Não autenticado');
    await check(session);
    return session;
  }
}
