import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/db/prisma';
import { organizationRepo } from '@/repositories/organizations';
import { auditRepo } from '@/repositories/audit';

// Schema de entrada do cadastro público.
// Cria: auth.users + public.users (espelho) + Organization + OrganizationUser (ADMIN).
const cadastroSchema = z.object({
  fullName: z.string().min(1, 'Nome obrigatório').max(120),
  email: z.string().email().max(255),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres').max(128),
  orgName: z.string().min(1, 'Nome da organização obrigatório').max(120),
  orgDocument: z
    .string()
    .regex(/^\d{11}$|^\d{14}$/, 'CNPJ/CPF inválido (apenas números)'),
});

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeDocument(doc: string): string {
  return doc.replace(/\D/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = cadastroSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      // Mapeia o primeiro erro para um código legível pelo front.
      let code = 'validation';
      if (first?.path?.[0] === 'orgDocument') code = 'invalid_document';
      else if (first?.path?.[0] === 'password') code = 'weak_password';
      return Response.json(
        { error: code, detail: first?.message, details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const orgDocument = normalizeDocument(parsed.data.orgDocument);

    // 1) Verifica se o email já está em uso antes de chamar o Supabase.
    //    (admin.createUser não falha deterministicamente em duplicatas; usar listUsers
    //    é mais barato e explícito.)
    const supabase = createSupabaseAdminClient();
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) {
      return Response.json(
        { error: 'internal', detail: 'listUsers failed' },
        { status: 500 },
      );
    }
    const existing = list.users.find(
      (u) => (u.email || '').toLowerCase() === email,
    );
    if (existing) {
      return Response.json({ error: 'email_in_use' }, { status: 409 });
    }

    // 2) Verifica unicidade de documento no Prisma.
    const orgByDoc = await prisma.organization.findUnique({
      where: { document: orgDocument },
    });
    if (orgByDoc) {
      return Response.json(
        { error: 'document_in_use', detail: 'CNPJ/CPF já cadastrado' },
        { status: 409 },
      );
    }

    // 3) Cria o usuário no Supabase Auth (email_confirm = true para fluxo demo/MVP;
    //    sem confirmação de e-mail neste momento — pode ser endurecido em FASE 4).
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName },
    });
    if (createErr || !created?.user) {
      // Se o Supabase reclamar duplicata (race), normaliza para email_in_use.
      const msg = createErr?.message?.toLowerCase() || '';
      if (msg.includes('already') || msg.includes('duplicate')) {
        return Response.json({ error: 'email_in_use' }, { status: 409 });
      }
      return Response.json(
        { error: 'auth_create_failed', detail: createErr?.message },
        { status: 400 },
      );
    }
    const userId = created.user.id;

    // 4) Espelha em public.users.
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email,
        fullName: parsed.data.fullName,
        isSuperAdmin: false,
      },
      update: { email, fullName: parsed.data.fullName },
    });

    // 5) Cria a Organization + membership ADMIN em uma transação.
    const org = await organizationRepo.create({
      name: parsed.data.orgName,
      document: orgDocument,
    });
    await organizationRepo.addMember({
      organizationId: org.id,
      userId,
      role: 'ADMIN',
    });

    // 6) Audit log (evento cross-tenant permitido: orgId setado).
    await auditRepo.log({
      organizationId: org.id,
      userId,
      action: 'organization.create',
      entity: 'Organization',
      entityId: org.id,
      metadata: { source: 'self_signup', name: org.name },
    });
    await auditRepo.log({
      organizationId: org.id,
      userId,
      action: 'organization.member.add',
      entity: 'OrganizationUser',
      metadata: { targetEmail: email, role: 'ADMIN', source: 'self_signup' },
    });

    return Response.json(
      { ok: true, organizationId: org.id, userId },
      { status: 201 },
    );
  } catch (err) {
    console.error('[cadastro] unexpected error', err);
    return Response.json({ error: 'internal' }, { status: 500 });
  }
}
