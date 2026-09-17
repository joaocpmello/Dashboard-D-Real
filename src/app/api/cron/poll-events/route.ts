import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { IfoodEventService } from '@/lib/ifood/events';
import { toErrorResponse } from '@/lib/auth/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Validar CRON_SECRET para evitar chamadas externas não autorizadas
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Buscar todas as organizações com credenciais iFood
    const orgs = await prisma.organization.findMany({
      where: {
        creds: { some: {} },
      },
      select: { id: true },
    });

    const eventService = new IfoodEventService();
    const results: Record<string, any> = {};
    let totalProcessed = 0;

    // 3. Polling sequencial para evitar sobrecarga da API do iFood
    for (const org of orgs) {
      const res = await eventService.pollEvents(org.id);
      results[org.id] = res;
      totalProcessed += (res.processed ?? 0);
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      totalProcessed,
      details: results,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
