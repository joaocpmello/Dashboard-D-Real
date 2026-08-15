import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Marmitarias iFood — Consultoria',
  description: 'SaaS para gestão de marmitarias integradas ao iFood',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
