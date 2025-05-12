// /features/users/types.ts
import { users, company, roles, attendance_list, speakers } from "@prisma/client"

// Tipos derivados do Prisma
export type UserWithDetails = users & {
  company: company;
  roles: roles[];
  speakers?: speakers | null;
  attendance_list?: (attendance_list & {
    events: {
      id: string;
      title: string;
      date: Date;
      format: string;
    }
  })[];
}

// Tipo para listagem básica de usuários
export type UserBasic = {
  id: string;
  name: string;
  username: string;
  email: string;
  active: boolean;
  rg: string;
  cpf: string;
  cnpj: string;
  mobile_phone: string;
  position: string;
  city: string;
  state: string;
  image_url: string;
  thumb_url: string;
  created_at: Date;
  company: {
    name: string;
    segment: string;
  };
  roles: {
    id: string;
    name: string;
  }[];
}

// Métricas do dashboard de usuários
export type UserDashboardMetrics = {
  userStats: {
    active: number;
    inactive: number;
    total: number;
  };
  roleDistribution: {
    roleId: string;
    roleName: string;
    userCount: number;
  }[];
}

// Props para componentes
export interface UserCardProps {
  user: UserBasic;
  onStatusChange?: () => void;
}

export interface UserDetailProps {
  user: UserWithDetails;
}

export interface UserGridProps {
  initialUsers: {
    users: UserBasic[],
    metadata: {
      count: number,
      hasNextPage: boolean,
      cursor: string | undefined
    }
  },
  initialSearch?: string,
  initialStatus?: string,
}

export interface UserUpsertFormProps {
  user?: UserWithDetails;
  companies?: { id: string; name: string; cnpj: string }[];
  roles?: { id: string; name: string }[];
}

// Parâmetros de busca
export type ParsedSearchParams = {
  readonly search: string;
  readonly status: string;
}