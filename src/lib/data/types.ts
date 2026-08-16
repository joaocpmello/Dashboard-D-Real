// Tipos de domínio compartilhados entre server components e mocks.
// Não dependem do Prisma Client — evita "vazar" o modelo para o bundle do cliente.

export type Role = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';

export type MerchantSummary = {
  id: string;
  organizationId: string;
  ifoodMerchantId: string;
  name: string;
  corporateName: string | null;
  city: string | null;
  status: string | null;
  lastSyncedAt: string | null; // ISO
};

export type OrganizationSummary = {
  id: string;
  name: string;
  document: string;
  createdAt: string;
  ifoodConnected: boolean;
  ifoodLastSyncAt: string | null;
};

export type UserSummary = {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  isSuperAdmin: boolean;
  active: boolean;
  lastSignInAt: string | null;
};

export type SessionContext = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    isSuperAdmin: boolean;
  };
  organization: OrganizationSummary | null;
  role: Role | null;
};
