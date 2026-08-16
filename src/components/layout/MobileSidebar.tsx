'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import type { Role } from '@/lib/data/types';

type Props = {
  pathname: string;
  role: Role | null;
  isSuperAdmin: boolean;
  open: boolean;
  onClose: () => void;
};

export function MobileSidebar({ pathname, role, isSuperAdmin, open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-40 md:hidden ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-ink-900/50 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] transform flex-col bg-white shadow-xl transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <Sidebar
          pathname={pathname}
          role={role}
          isSuperAdmin={isSuperAdmin}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}
