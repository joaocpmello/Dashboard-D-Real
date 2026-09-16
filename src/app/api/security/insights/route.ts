import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { SecurityDetector } from '@/lib/security/detector';

export async function GET(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('VIEWER');

    if (!session.isSuperAdmin) {
      return toErrorResponse(new Error('Forbidden: Only Super Admins can access security insights.'), 403);
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    const anomalies = await SecurityDetector.detectAnomalies(organizationId || undefined);

    return NextResponse.json({
      ok: true,
      data: anomalies,
    });
  } catch (error: any) {
    return toErrorResponse(error, error.status || 500);
  }
}
