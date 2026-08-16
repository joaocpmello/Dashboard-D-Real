import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserMenu } from './UserMenu';
import { MobileShellController } from './MobileShellController';
import type { Role } from '@/lib/data/types';

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  OPERATOR: 'Operador',
  VIEWER: 'Visualizador',
};

type Props = {
  title: string;
  subtitle?: string;
  orgName?: string | null;
  isDemo?: boolean;
  user: {
    email: string;
    fullName: string | null;
    role: Role | null;
    isSuperAdmin: boolean;
  };
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  orgName,
  isDemo,
  user,
  actions,
  children,
}: Props) {
  // pathname via header setado pelo middleware
  const h = headers();
  const pathname = h.get('x-pathname') ?? h.get('x-invoke-path') ?? '';
  const roleLabel = user.isSuperAdmin
    ? 'Super Admin'
    : user.role
      ? ROLE_LABEL[user.role]
      : 'Sem papel';

  const navProps = {
    pathname,
    role: user.role,
    isSuperAdmin: user.isSuperAdmin,
  };

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Sidebar desktop (≥md) */}
      <div className="hidden md:block">
        <Sidebar {...navProps} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          subtitle={subtitle}
          orgName={orgName}
          isDemo={isDemo}
          actions={
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <MobileShellController {...navProps} />
              </div>
              {actions ?? (
                <UserMenu
                  email={user.email}
                  fullName={user.fullName}
                  roleLabel={roleLabel}
                />
              )}
            </div>
          }
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
