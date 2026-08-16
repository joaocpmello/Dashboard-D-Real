import { Badge } from './Badge';

export type Role = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';

const labelByRole: Record<Role, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  OPERATOR: 'Operador',
  VIEWER: 'Visualizador',
};

const toneByRole: Record<Role, 'brand' | 'info' | 'neutral' | 'success'> = {
  ADMIN: 'brand',
  MANAGER: 'info',
  OPERATOR: 'neutral',
  VIEWER: 'success',
};

export function RoleBadge({ role, className = '' }: { role: Role; className?: string }) {
  return (
    <Badge tone={toneByRole[role]} className={className}>
      {labelByRole[role]}
    </Badge>
  );
}
