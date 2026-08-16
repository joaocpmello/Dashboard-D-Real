'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(translateAuthError(signInError.message));
        setBusy(false);
        return;
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Não foi possível entrar. Tente novamente em instantes.');
      setBusy(false);
    }
  }

  function useDemoCredentials() {
    setEmail('admin@marmitaos.com.br');
    setPassword('demo1234');
    setError(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-50 via-white to-brand-50/40">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Lado esquerdo — branding e copy de venda */}
        <div className="hidden flex-col justify-between bg-ink-900 px-12 py-10 text-white lg:flex">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-base font-bold">
              M
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold">MarmitaOS</p>
              <p className="text-xs text-ink-300">Operações iFood para consultorias</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl font-semibold leading-tight">
              A operação das suas marmitarias, em um só lugar.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-300">
              Sincronização com iFood, gestão multi-tenant de lojas e usuários,
              credenciais criptografadas e audit log. Pronto para a sua consultoria
              escalar sem perder o controle.
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <CheckIcon />
                Multi-tenant com isolamento total por organização
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon />
                Credenciais iFood criptografadas em repouso (AES-256-GCM)
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon />
                RBAC granular: Super Admin, Admin, Gerente, Operador, Visualizador
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon />
                Sincronização sob demanda e audit log de ações sensíveis
              </li>
            </ul>
          </div>

          <div className="text-xs text-ink-400">
            © {new Date().getFullYear()} MarmitaOS · v0.1 · MVP
          </div>
        </div>

        {/* Lado direito — formulário */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            {/* Logo no mobile */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-base font-bold text-white">
                M
              </div>
              <div className="leading-tight">
                <p className="text-base font-semibold text-ink-900">MarmitaOS</p>
                <p className="text-xs text-ink-500">Operações iFood</p>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-ink-900">
                Bem-vindo de volta
              </h1>
              <p className="mt-1 text-sm text-ink-600">
                Entre com sua conta corporativa para acessar o painel.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-ink-700"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-ink-700"
                  >
                    Senha
                  </label>
                  <a
                    href="#"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    onClick={(e) => e.preventDefault()}
                  >
                    Esqueci minha senha
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Entrando…
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>

              <button
                type="button"
                onClick={useDemoCredentials}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
              >
                Entrar com credenciais de demo
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-ink-500">
              Acesso protegido · Sessões criptografadas · Conformidade LGPD
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-500/15 text-brand-400">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" />
      </svg>
    </span>
  );
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }
  if (m.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos.';
  }
  return 'Não foi possível entrar. Verifique suas credenciais.';
}
