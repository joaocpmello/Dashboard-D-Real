/**
 * Teste do helper toErrorResponse: mapeia erros semânticos em HTTP status
 * e nunca vaza stack/detalhes ao cliente.
 */
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { toErrorResponse, UnauthorizedError, ForbiddenError } from '@/lib/auth/errors';

describe('toErrorResponse', () => {
  it('UnauthorizedError -> 401', async () => {
    const res = toErrorResponse(new UnauthorizedError('x'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'unauthorized' });
  });

  it('ForbiddenError -> 403', async () => {
    const res = toErrorResponse(new ForbiddenError('x'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: 'forbidden' });
  });

  it('ZodError -> 400 com details flatten()', async () => {
    let zerr: ZodError | null = null;
    try {
      // importa dinamicamente a schema real para gerar um ZodError
      const { organizationCreateSchema } = await import('@/schemas');
      organizationCreateSchema.parse({ name: '', document: '' });
    } catch (e) {
      zerr = e as ZodError;
    }
    const res = toErrorResponse(zerr!);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('validation');
    expect(body.details).toBeDefined();
  });

  it('erro genérico -> 500 sem detalhes', async () => {
    const res = toErrorResponse(new Error('segredo-interno'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'internal' });
    expect(JSON.stringify(body)).not.toContain('segredo-interno');
  });
});
