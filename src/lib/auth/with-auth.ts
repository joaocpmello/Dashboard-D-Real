// Pequeno helper pra padronizar respostas HTTP a partir de erros semânticos.
import { NextResponse } from 'next/server';
import { ForbiddenError, UnauthorizedError } from '@/lib/auth/errors';
import { ZodError } from 'zod';

// toErrorResponse moved to @/lib/auth/errors.ts
