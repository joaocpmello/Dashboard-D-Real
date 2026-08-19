'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';

export default function CadastroPage() {
  // useSearchParams() precisa de um Suspense boundary para que a página
  // possa ser pré-renderizada estaticamente (CSR bailout).
  return (
    <Suspense fallback={<CadastroFallback />}>
      <CadastroForm />
    </Suspense>
  );
}

function CadastroFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-50 via-white to-brand-50/40">
      <div className="text-sm text-ink-500">Carregando…</div>
    </div>
  );
}

function CadastroForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/dashboard';

  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgDocument, setOrgDocument] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, orgName, orgDocument }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(translateCadastroError(body.error, body.detail));
        setBusy(false);
        return;
      }

      // Após signup bem-sucedido, faz login automático via client e segue.
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/browser');
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError('Conta criada, mas não foi possível entrar automaticamente. Tente fazer login.');
        setBusy(false);
        router.push('/login');
        return;
      }
      window.location.href = next;
    } catch {
      setError('Não foi possível concluir o cadastro. Tente novamente em instantes.');
      setBusy(false);
    }
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
              Comece agora a gerenciar suas lojas.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-300">
              Crie sua conta e sua organização em menos de 1 minuto. Já começamos
              com um espaço isolado, pronto para convidar sua equipe e configurar
              as credenciais iFood quando quiser.
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <CheckIcon />
                Organização criada automaticamente com isolamento multi-tenant
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon />
                Você entra como ADMIN da sua própria organização
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon />
                Sessões criptografadas e conformidade LGPD
              </li>
              <li className="flex items-center gap-3">
                <CheckIcon />
                Sem cartão de crédito · cancele quando quiser
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
                Crie sua conta
              </h1>
              <p className="mt-1 text-sm text-ink-600">
                Você é o primeiro ADMIN da sua organização.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
              <div>
                <Label htmlFor="fullName">Seu nome</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Como devemos te chamar?"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="orgName">Nome da organização</Label>
                <Input
                  id="orgName"
                  type="text"
                  required
                  autoComplete="organization"
                  placeholder="Ex.: Consultoria Sabor & Cia"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="orgDocument">CNPJ ou CPF da organização</Label>
                <Input
                  id="orgDocument"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Apenas números (14 ou 11 dígitos)"
                  value={orgDocument}
                  onChange={(e) => setOrgDocument(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  maxLength={14}
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
                <p className="mt-1 text-xs text-ink-500">
                  Use ao menos 8 caracteres. Você poderá trocá-la depois.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={busy} size="lg" className="w-full">
                {busy ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Criando conta…
                  </span>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-600">
              Já tem conta?{' '}
              <a
                href="/login"
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                Entrar
              </a>
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

function translateCadastroError(code: string | undefined, detail?: string): string {
  switch (code) {
    case 'email_in_use':
      return 'Este e-mail já está cadastrado. Tente fazer login.';
    case 'document_in_use':
      return 'Este CNPJ/CPF já está cadastrado.';
    case 'invalid_document':
      return 'CNPJ/CPF inválido. Use 14 dígitos (CNPJ) ou 11 (CPF).';
    case 'weak_password':
      return 'Senha muito curta. Use ao menos 8 caracteres.';
    case 'validation':
      return 'Verifique os campos e tente novamente.';
    default:
      return detail || 'Não foi possível concluir o cadastro.';
  }
}
