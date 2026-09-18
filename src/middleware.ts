import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { checkRateLimit } from '@/lib/security/rate-limit';

// Rotas públicas que não exigem sessão
const PUBLIC_ROUTES = new Set(['/login', '/cadastro', '/auth/callback', '/auth/confirm']);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Geração de Nonce para CSP
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');

  // 2. Identificação do Cliente para Rate Limiting
  // Priorizamos User ID se estiver autenticado, caso contrário usamos o IP.
  const ip = request.ip ?? '127.0.0.1';
  let identifier = ip;

  // --- Setup Supabase ---
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);
  requestHeaders.set('x-nonce', nonce); // Passamos o nonce via header para RSCs

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!url || !anon) {
    return response;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    identifier = user.id;
  }

  // 3. Verificação de Rate Limiting
  const rateLimit = await checkRateLimit(pathname, identifier);
  if (!rateLimit.success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': rateLimit.reset?.toString() || '3600' }
    });
  }

  // 4. Controle de Acesso (Auth)
  const isPublic = PUBLIC_ROUTES.has(pathname);

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === '/login' || pathname === '/cadastro')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.delete('next');
    return NextResponse.redirect(redirectUrl);
  }

  // 5. Aplicação de Headers de Segurança e CSP
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `connect-src 'self' *.supabase.co`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
