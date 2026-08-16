import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Role } from '@/lib/data/types';
import { Dot } from '@/components/ui/Badge';

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  comingSoon?: boolean;
  requires?: Role;
};

const home = (path: string) =>
  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors';

const active = (path: string, href: string) =>
  path === href
    ? 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-500/20'
    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-800';

function Icon({ children }: { children: ReactNode }) {
  return (
    <span
      className="grid h-5 w-5 place-items-center text-ink-500 group-hover:text-ink-700"
      aria-hidden
    >
      {children}
    </span>
  );
}

export function Sidebar({
  pathname,
  role,
  isSuperAdmin,
}: {
  pathname: string;
  role: Role | null;
  isSuperAdmin: boolean;
}) {
  const canSeeUsers = isSuperAdmin || role === 'ADMIN' || role === 'MANAGER';

  const primary: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: (
        <Icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M3 12 12 4l9 8" />
            <path d="M5 10v10h14V10" />
          </svg>
        </Icon>
      ),
    },
    {
      href: '/lojas',
      label: 'Lojas',
      icon: (
        <Icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M3 9 5 4h14l2 5" />
            <path d="M5 9v11h14V9" />
            <path d="M9 20v-6h6v6" />
          </svg>
        </Icon>
      ),
    },
    {
      href: '/usuarios',
      label: 'Usuários',
      icon: (
        <Icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
            <circle cx="17" cy="8" r="3" />
            <path d="M16 14c3 0 6 1.5 6 4" />
          </svg>
        </Icon>
      ),
      requires: 'MANAGER',
    },
    {
      href: '/configuracoes',
      label: 'Configurações',
      icon: (
        <Icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
          </svg>
        </Icon>
      ),
    },
  ];

  const upcoming: NavItem[] = [
    {
      href: '#',
      label: 'Pedidos',
      comingSoon: true,
      icon: (
        <Icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M4 4h2l2 12h11l2-8H7" />
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="18" cy="20" r="1.5" />
          </svg>
        </Icon>
      ),
    },
    {
      href: '#',
      label: 'Cardápio',
      comingSoon: true,
      icon: (
        <Icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M5 3v18" />
            <path d="M5 6h11a3 3 0 0 1 0 6H5" />
            <path d="M5 12h12a3 3 0 0 1 0 6H5" />
          </svg>
        </Icon>
      ),
    },
    {
      href: '#',
      label: 'Avaliações',
      comingSoon: true,
      icon: (
        <Icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9Z" />
          </svg>
        </Icon>
      ),
    },
    {
      href: '#',
      label: 'Promoções',
      comingSoon: true,
      icon: (
        <Icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M3 11 11 3h10v10L13 21Z" />
            <path d="M7 7l.01.01" />
            <path d="M16 16l.01.01" />
          </svg>
        </Icon>
      ),
    },
    {
      href: '#',
      label: 'Relatórios',
      comingSoon: true,
      icon: (
        <Icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path d="M4 20V10" />
            <path d="M10 20V4" />
            <path d="M16 20v-8" />
            <path d="M22 20H2" />
          </svg>
        </Icon>
      ),
    },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-ink-200 bg-white md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-ink-200 px-5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          M
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink-900">MarmitaOS</p>
          <p className="text-[11px] text-ink-500">Operações iFood</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 px-3 py-4">
        <div>
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Operação
          </p>
          <ul className="space-y-1">
            {primary.map((item) => {
              if (item.requires && !canSeeUsers && item.href === '/usuarios') return null;
              return (
                <li key={item.label}>
                  <Link href={item.href} className={`${home(item.href)} ${active(pathname, item.href)}`}>
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Roadmap
          </p>
          <ul className="space-y-1">
            {upcoming.map((item) => (
              <li key={item.label}>
                <span
                  className={`${home('#')} text-ink-400 hover:bg-ink-50 cursor-not-allowed`}
                  title="Em breve"
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-ink-400">
                    <Dot tone="warning" /> Em breve
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="border-t border-ink-200 p-3 text-[11px] text-ink-500">
        <p className="px-2">v0.1 · MVP</p>
      </div>
    </aside>
  );
}
