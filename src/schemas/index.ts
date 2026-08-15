import { z } from 'zod';

export const organizationCreateSchema = z.object({
  name: z.string().min(1).max(120),
  document: z.string().min(11).max(20), // CNPJ/CPF — sem formatar antes de salvar
});

export const organizationMemberRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']),
});

export const ifoodSyncRequestSchema = z.object({
  organizationId: z.string().uuid(),
  environment: z.enum(['sandbox', 'production']).optional(),
});
