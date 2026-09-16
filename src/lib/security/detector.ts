import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { startOfHour, endOfHour } from 'date-fns';

export interface SecurityAnomaly {
  type: 'HIGH_FREQUENCY_ACTION' | 'PRIVILEGE_ESCALATION' | 'SENSITIVE_DATA_ACCESS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  userId: string | null;
  organizationId: string | null;
  timestamp: Date;
  metadata: any;
}

export const SecurityDetector = {
  /**
   * Detects anomalies in audit logs for a specific organization or globally.
   */
  async detectAnomalies(organizationId?: string) {
    const now = new Date();
    const hourStart = startOfHour(now);
    const hourEnd = endOfHour(now);

    const anomalies: SecurityAnomaly[] = [];

    // 1. High Frequency of Sensitive Actions (e.g., many credential updates)
    const sensitiveActions = ['credential.update', 'role.update', 'organization.delete'];
    const highFreqEvents = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        action: { in: sensitiveActions },
        createdAt: { gte: hourStart, lte: hourEnd },
        ...(organizationId && { organizationId }),
      },
      _count: { _all: true },
    });

    for (const event of highFreqEvents) {
      if ((event._count as any)._all > 5) {
        anomalies.push({
          type: 'HIGH_FREQUENCY_ACTION',
          severity: 'MEDIUM',
          description: `User ${event.userId} performed sensitive actions ${ (event._count as any)._all } times in the last hour.`,
          userId: event.userId,
          organizationId: organizationId ?? null,
          timestamp: now,
          metadata: { count: (event._count as any)._all },
        });
      }
    }

    // 2. Potential Privilege Escalation
    // Look for role updates to ADMIN or SUPER_ADMIN
    const escalationEvents = await prisma.auditLog.findMany({
      where: {
        action: 'role.update',
        createdAt: { gte: hourStart, lte: hourEnd },
        ...(organizationId && { organizationId }),
      },
    });

    // Prisma JSON filtering is tricky, let's filter in JS
    const actualEscalations = escalationEvents.filter(e => {
      const meta = e.metadata as any;
      return meta?.role === 'ADMIN' || meta?.role === 'SUPER_ADMIN';
    });

    for (const event of actualEscalations) {
      anomalies.push({
        type: 'PRIVILEGE_ESCALATION',
        severity: 'HIGH',
        description: `User ${event.userId} promoted another user to a privileged role.`,
        userId: event.userId,
        organizationId: event.organizationId,
        timestamp: now,
        metadata: event.metadata,
      });
    }

    return anomalies;
  },
};
