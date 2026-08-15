// Pequeno helper pra padronizar respostas HTTP a partir de erros semânticos.
import { NextResponse } from 'next/server';
import { ForbiddenError, UnauthorizedError } from '@/lib/auth/errors';
import { ZodError } from 'zod';

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: 'validation', details: err.flatten() }, { status: 400 });
  }
  // Log interno para diagnóstico, sem expor detalhes ao cliente.
  console.error('[route] unexpected error', err);
  return NextResponse.json({ error: 'internal' }, { status: 500 });
}
