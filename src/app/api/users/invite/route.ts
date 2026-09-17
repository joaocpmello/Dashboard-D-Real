import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('MANAGER');
    const organizationId = session.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'no_organization' }, { status: 400 });
    }

    const body = await req.json();
    const input = InviteSchema.parse(body);

    // In a real app, we would generate a secure token and send an email.
    // For the MVP, we simulate the invitation by creating the user (or marking them as invited).
    // Since we use Supabase auth, we typically send an invite through their API.

    // Simulation:
    const inviteToken = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // We would store this in an 'invitations' table.
    // For now, we just return the "link".
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/join?token=${inviteToken}`;

    return NextResponse.json({
      ok: true,
      inviteLink,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
