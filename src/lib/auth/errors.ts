// Erros semânticos — handlers podem converter para HTTP status apropriado.
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = 'Não autenticado') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = 'Acesso negado') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function toErrorResponse(err: unknown, status?: number): NextResponse {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: 'validation', details: err.flatten() }, { status: 400 });
  }

  const finalStatus = status || 500;
  console.error('[route] unexpected error', err);
  return NextResponse.json({ error: 'internal' }, { status: finalStatus });
}
