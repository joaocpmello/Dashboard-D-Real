// Mocks realistas para demonstração enquanto o Supabase real não está
// provisionado. São consumidos APENAS quando a flag de demo está ativa.
//
// Estes dados são seguros — não carregam tokens, segredos ou PII real.
import type {
  MerchantSummary,
  OrganizationSummary,
  UserSummary,
} from '@/lib/data/types';

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();

export const DEMO_ORG: OrganizationSummary = {
  id: 'demo-org-0000-0000-0000-000000000000',
  name: 'MarmitaOS Consultoria',
  document: '12.345.678/0001-90',
  createdAt: daysAgo(120),
  ifoodConnected: true,
  ifoodLastSyncAt: hoursAgo(2),
};

export const DEMO_MERCHANTS: MerchantSummary[] = [
  {
    id: 'demo-merch-1',
    organizationId: DEMO_ORG.id,
    ifoodMerchantId: 'IFOOD-102934',
    name: 'Marmitaria Sabor Caseiro',
    corporateName: 'Sabor Caseiro Marmitas LTDA',
    city: 'São Paulo - SP',
    status: 'OPEN',
    lastSyncedAt: hoursAgo(2),
  },
  {
    id: 'demo-merch-2',
    organizationId: DEMO_ORG.id,
    ifoodMerchantId: 'IFOOD-203481',
    name: 'Fit & Pronto',
    corporateName: 'Fit & Pronto Alimentação Saudável LTDA',
    city: 'Rio de Janeiro - RJ',
    status: 'OPEN',
    lastSyncedAt: hoursAgo(5),
  },
  {
    id: 'demo-merch-3',
    organizationId: DEMO_ORG.id,
    ifoodMerchantId: 'IFOOD-309123',
    name: 'Panela da Vó',
    corporateName: 'Panela da Vó Marmitas ME',
    city: 'Belo Horizonte - MG',
    status: 'PAUSED',
    lastSyncedAt: hoursAgo(28),
  },
  {
    id: 'demo-merch-4',
    organizationId: DEMO_ORG.id,
    ifoodMerchantId: 'IFOOD-412098',
    name: 'Tempero da Casa',
    corporateName: 'Tempero da Casa Comida Caseira LTDA',
    city: 'Curitiba - PR',
    status: 'OPEN',
    lastSyncedAt: hoursAgo(8),
  },
  {
    id: 'demo-merch-5',
    organizationId: DEMO_ORG.id,
    ifoodMerchantId: 'IFOOD-509201',
    name: 'Chef do Bairro',
    corporateName: 'Chef do Bairro Marmitas LTDA',
    city: 'Porto Alegre - RS',
    status: 'INTEGRATION_PROBLEM',
    lastSyncedAt: hoursAgo(72),
  },
  {
    id: 'demo-merch-6',
    organizationId: DEMO_ORG.id,
    ifoodMerchantId: 'IFOOD-608732',
    name: 'Marmita Express',
    corporateName: 'Marmita Express Delivery LTDA',
    city: 'Salvador - BA',
    status: 'CLOSED',
    lastSyncedAt: daysAgo(3),
  },
];

export const DEMO_USERS: UserSummary[] = [
  {
    id: 'demo-user-1',
    email: 'admin@marmitaos.com.br',
    fullName: 'Carla Mendes',
    role: 'ADMIN',
    isSuperAdmin: false,
    active: true,
    lastSignInAt: hoursAgo(1),
  },
  {
    id: 'demo-user-2',
    email: 'gerente@marmitaos.com.br',
    fullName: 'Rafael Souza',
    role: 'MANAGER',
    isSuperAdmin: false,
    active: true,
    lastSignInAt: hoursAgo(3),
  },
  {
    id: 'demo-user-3',
    email: 'operador@marmitaos.com.br',
    fullName: 'Beatriz Lima',
    role: 'OPERATOR',
    isSuperAdmin: false,
    active: true,
    lastSignInAt: hoursAgo(7),
  },
  {
    id: 'demo-user-4',
    email: 'visualizador@marmitaos.com.br',
    fullName: 'Diego Oliveira',
    role: 'VIEWER',
    isSuperAdmin: false,
    active: true,
    lastSignInAt: daysAgo(1),
  },
  {
    id: 'demo-user-5',
    email: 'ana.nunes@marmitaos.com.br',
    fullName: 'Ana Nunes',
    role: 'MANAGER',
    isSuperAdmin: false,
    active: false,
    lastSignInAt: daysAgo(12),
  },
];
