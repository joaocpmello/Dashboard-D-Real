'use client';

import { useState } from 'react';
import { MobileSidebar } from './MobileSidebar';
import { MenuButton } from './MenuButton';
import type { Role } from '@/lib/data/types';

type Props = {
  pathname: string;
  role: Role | null;
  isSuperAdmin: boolean;
};

/**
 * Client-side controller: hamburger button + mobile drawer.
 * Server components embed this directly; it owns its own state.
 */
export function MobileShellController({ pathname, role, isSuperAdmin }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <MenuButton onClick={() => setOpen(true)} />
      <MobileSidebar
        pathname={pathname}
        role={role}
        isSuperAdmin={isSuperAdmin}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
