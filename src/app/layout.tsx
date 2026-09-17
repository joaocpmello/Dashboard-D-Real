import './globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'sonner';
import { SuppressHydrationWarning } from 'next';

export const metadata = {
  title: 'Marmitarias iFood — Consultoria',
  description: 'SaaS para gestão de marmitarias integradas ao iFood',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <SuppressHydrationWarning>
      <html lang="pt-BR" suppressHydrationWarning>
        <body className="min-h-screen bg-slate-50 dark:bg-ink-900 text-slate-900 dark:text-slate-100 antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </body>
      </html>
    </SuppressHydrationWarning>
  );
}
