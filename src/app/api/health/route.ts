import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export async function GET() {
  const diagnostics: Record<string, { status: 'ok' | 'error'; detail?: string }> = {};

  try {
    // 1. Database Connection (Prisma)
    try {
      await prisma.$queryRaw`SELECT 1`;
      diagnostics.database = { status: 'ok' };
    } catch (err: any) {
      diagnostics.database = { status: 'error', detail: err.message };
    }

    // 2. Infrastructure Secrets (Encryption Key)
    const encryptionKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
    if (encryptionKey && encryptionKey.length >= 32) {
      diagnostics.secrets = { status: 'ok' };
    } else {
      diagnostics.secrets = { status: 'error', detail: 'Encryption key is missing or too short' };
    }

    // 3. Supabase / Auth Connectivity check
    // Since we don't have a direct health endpoint for Supabase,
    // we check if the required env vars are present.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      diagnostics.auth = { status: 'ok' };
    } else {
      diagnostics.auth = { status: 'error', detail: 'Supabase configuration is incomplete' };
    }

    const hasErrors = Object.values(diagnostics).some(d => d.status === 'error');

    return NextResponse.json(
      {
        status: hasErrors ? 'unhealthy' : 'ok',
        timestamp: new Date().toISOString(),
        diagnostics
      },
      { status: hasErrors ? 503 : 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', detail: err.message },
      { status: 500 }
    );
  }
}
