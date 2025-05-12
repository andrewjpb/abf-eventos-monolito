// /features/users/queries/get-user-dashboard-metrics.ts
"use server"

import { prisma } from "@/lib/prisma"
import { cache } from "react"
import { UserDashboardMetrics } from "../types";

// Query combinada para dashboard
export const getUserDashboardMetrics = cache(async (): Promise<UserDashboardMetrics> => {
  // Obtendo estatísticas gerais de usuários
  const userStats = await getUsersStatusMetrics();

  // Obtendo métricas de funções/papéis
  const roleDistribution = await getRoleDistribution();

  return {
    userStats,
    roleDistribution
  };
});

// Query para obter contagem de usuários ativos e inativos
const getUsersStatusMetrics = cache(async () => {
  const activeUsers = await prisma.users.count({
    where: {
      active: true
    }
  });

  const inactiveUsers = await prisma.users.count({
    where: {
      active: false
    }
  });

  return {
    active: activeUsers,
    inactive: inactiveUsers,
    total: activeUsers + inactiveUsers
  };
});

// Query para obter distribuição de usuários por funções/papéis
const getRoleDistribution = cache(async () => {
  // Usando SQL bruto para contar usuários por role (necessário devido à tabela pivô)
  const roleCountsRaw = await prisma.$queryRaw`
    SELECT 
      r.id as "roleId", 
      r.name as "roleName", 
      COUNT(ru."B") as "userCount" 
    FROM "roles" r
    LEFT JOIN "_RoleToUser" ru ON r.id = ru."A"
    GROUP BY r.id, r.name
    ORDER BY "userCount" DESC, r.name ASC
  `;

  // Formatar a resposta
  return (roleCountsRaw as any[]).map(role => ({
    roleId: role.roleId,
    roleName: role.roleName,
    userCount: Number(role.userCount) // Converte para número
  }));
});