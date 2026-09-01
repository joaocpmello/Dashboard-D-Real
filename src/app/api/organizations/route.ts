import { NextRequest } from 'next/server';
import { z } from 'zod';
import { organizationCreateSchema } from '@/schemas';
import { organizationRepo } from '@/repositories/organizations';
import { auditRepo } from '@/repositories/audit';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { prisma } from '@/lib/db/prisma';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Listagem só para SUPER_ADMIN.
    const session = await RBACService.requireSuperAdmin();
    const orgs = await organizationRepo.listAll();
    await auditRepo.log({
      organizationId: null,
      userId: session.id,
      action: 'organizations.list',
      metadata: { count: orgs.length },
    });
    return Response.json({ organizations: orgs });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await RBACService.requireSuperAdmin();
    const body = organizationCreateSchema.parse(await req.json());

    const org = await organizationRepo.create(body);

    await auditRepo.log({
      organizationId: org.id,
      userId: session.id,
      action: 'organization.create',
      entity: 'Organization',
      entityId: org.id,
      metadata: { name: org.name },
    });

    return Response.json({ organization: org }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

// Bonus: convidar ADMIN inicial via Supabase Auth + membership.
// Apenas SUPER_ADMIN usa.
const inviteSchema = z.object({
  organizationId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await RBACService.requireSuperAdmin();
    const input = inviteSchema.parse(await req.json());

    // 1) cria ou obtém o usuário no Supabase Auth.
    const supabase = createSupabaseAdminClient();
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    let authUser = list.data.users.find(
      (u) => u.email?.toLowerCase() === input.email.toLowerCase(),
    );
    if (!authUser) {
      const created = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: input.email,
      });
      if (created.error || !created.data.user) {
        return Response.json(
          { error: 'failed_to_create_user', detail: created.error?.message },
          { status: 400 },
        );
      }
      authUser = created.data.user;
    }

    // 2) espelha no nosso banco.
    await prisma.user.upsert({
      where: { id: authUser.id },
      create: { id: authUser.id, email: input.email },
      update: { email: input.email },
    });

    // 3) cria membership.
    await organizationRepo.addMember({
      organizationId: input.organizationId,
      userId: authUser.id,
      role: input.role,
    });

    await auditRepo.log({
      organizationId: input.organizationId,
      userId: session.id,
      action: 'organization.member.add',
      entity: 'OrganizationUser',
      metadata: { targetEmail: input.email, role: input.role },
    });

    return Response.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
