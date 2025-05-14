// /scripts/seed-permissions-and-roles.ts
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de permissões e papéis...");

  // ======= CADASTRO DE PERMISSÕES =======
  const permissions = [
    { name: "panel.access", description: "Acesso geral ao painel administrativo" },

    // Usuários
    { name: "users.view", description: "Visualizar lista de usuários" },
    { name: "users.create", description: "Criar novos usuários" },
    { name: "users.update", description: "Atualizar usuários existentes" },
    { name: "users.delete", description: "Excluir usuários" },

    // Empresas
    { name: "companies.view", description: "Visualizar lista de empresas" },
    { name: "companies.create", description: "Criar novas empresas" },
    { name: "companies.update", description: "Atualizar empresas existentes" },
    { name: "companies.delete", description: "Excluir empresas" },

    // Eventos
    { name: "events.view", description: "Visualizar lista de eventos" },
    { name: "events.create", description: "Criar novos eventos" },
    { name: "events.update", description: "Atualizar eventos existentes" },
    { name: "events.delete", description: "Excluir eventos" },
    { name: "events.publish", description: "Publicar ou despublicar eventos" },

    // Eventos Externos
    { name: "external_events.view", description: "Visualizar lista de eventos externos" },
    { name: "external_events.create", description: "Criar novos eventos externos" },
    { name: "external_events.update", description: "Atualizar eventos externos existentes" },
    { name: "external_events.delete", description: "Excluir eventos externos" },

    // Palestrantes
    { name: "speakers.view", description: "Visualizar lista de palestrantes" },
    { name: "speakers.create", description: "Cadastrar novos palestrantes" },
    { name: "speakers.update", description: "Atualizar palestrantes existentes" },
    { name: "speakers.delete", description: "Excluir palestrantes" },

    // Patrocinadores
    { name: "sponsors.view", description: "Visualizar lista de patrocinadores" },
    { name: "sponsors.create", description: "Cadastrar novos patrocinadores" },
    { name: "sponsors.update", description: "Atualizar patrocinadores existentes" },
    { name: "sponsors.delete", description: "Excluir patrocinadores" },

    // Apoiadores
    { name: "supporters.view", description: "Visualizar lista de apoiadores" },
    { name: "supporters.create", description: "Cadastrar novos apoiadores" },
    { name: "supporters.update", description: "Atualizar apoiadores existentes" },
    { name: "supporters.delete", description: "Excluir apoiadores" },

    // Banners
    { name: "banners.view", description: "Visualizar lista de banners" },
    { name: "banners.create", description: "Criar novos banners" },
    { name: "banners.update", description: "Atualizar banners existentes" },
    { name: "banners.delete", description: "Excluir banners" },

    // Listas de presença
    { name: "attendance.view", description: "Visualizar listas de presença" },
    { name: "attendance.manage", description: "Gerenciar listas de presença" },
    { name: "attendance.register", description: "Registrar participantes em eventos" },
    { name: "attendance.checkin", description: "Realizar check-in de participantes" },

    // Funções/Grupos
    { name: "roles.view", description: "Visualizar grupos de usuários" },
    { name: "roles.create", description: "Criar novos grupos de usuários" },
    { name: "roles.update", description: "Atualizar grupos de usuários existentes" },
    { name: "roles.delete", description: "Excluir grupos de usuários" },
    { name: "roles.assign", description: "Atribuir usuários a grupos" },

    // Permissões
    { name: "permissions.view", description: "Visualizar permissões do sistema" },
    { name: "permissions.create", description: "Criar novas permissões" },
    { name: "permissions.update", description: "Atualizar permissões existentes" },
    { name: "permissions.delete", description: "Excluir permissões" },

    // Logs
    { name: "logs.view", description: "Visualizar logs do sistema" },

    // Configurações
    { name: "settings.view", description: "Visualizar configurações do sistema" },
    { name: "settings.update", description: "Atualizar configurações do sistema" }
  ];

  console.log(`Cadastrando ${permissions.length} permissões...`);

  // Cadastro das permissões
  for (const permission of permissions) {
    const existing = await prisma.permissions.findFirst({
      where: { name: permission.name }
    });

    if (!existing) {
      await prisma.permissions.create({
        data: {
          id: nanoid(),
          name: permission.name,
          description: permission.description,
          created_at: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`Permissão criada: ${permission.name}`);
    } else {
      console.log(`Permissão já existe: ${permission.name}`);
    }
  }

  // ======= CADASTRO DE PAPÉIS/GRUPOS =======
  const roles = [
    {
      name: "admin",
      description: "Administrador com acesso completo ao sistema",
      // Admin tem todas as permissões
      permissionNames: permissions.map(p => p.name)
    },
    {
      name: "event_manager",
      description: "Gerenciador de eventos e palestrantes",
      permissionNames: [
        "panel.access",
        "events.view", "events.create", "events.update", "events.publish",
        "external_events.view", "external_events.create", "external_events.update",
        "speakers.view", "speakers.create", "speakers.update",
        "attendance.view", "attendance.manage", "attendance.register", "attendance.checkin"
      ]
    },
    {
      name: "marketing",
      description: "Equipe de marketing e comunicação",
      permissionNames: [
        "panel.access",
        "events.view",
        "external_events.view",
        "sponsors.view", "sponsors.create", "sponsors.update",
        "supporters.view", "supporters.create", "supporters.update",
        "banners.view", "banners.create", "banners.update"
      ]
    },
    {
      name: "reception",
      description: "Equipe de recepção e check-in",
      permissionNames: [
        "panel.access",
        "events.view",
        "attendance.view", "attendance.register", "attendance.checkin"
      ]
    },
    {
      name: "viewer",
      description: "Visualizador com acesso somente leitura",
      permissionNames: [
        "panel.access",
        "events.view", "external_events.view",
        "speakers.view", "sponsors.view", "supporters.view",
        "banners.view", "attendance.view", "logs.view"
      ]
    }
  ];

  console.log(`Cadastrando ${roles.length} papéis/grupos...`);

  // Cadastro dos papéis/roles
  for (const role of roles) {
    // Verificar se o papel já existe
    let roleEntity = await prisma.roles.findFirst({
      where: { name: role.name }
    });

    // Se não existir, criar
    if (!roleEntity) {
      roleEntity = await prisma.roles.create({
        data: {
          id: nanoid(),
          name: role.name,
          description: role.description,
          created_at: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`Papel/grupo criado: ${role.name}`);
    } else {
      console.log(`Papel/grupo já existe: ${role.name}`);
    }

    // Buscar as permissões para este papel
    const permissions = await prisma.permissions.findMany({
      where: {
        name: {
          in: role.permissionNames
        }
      }
    });

    // Verificar quais permissões já estão associadas ao papel
    const existingPermissions = await prisma.roles.findUnique({
      where: { id: roleEntity.id },
      include: {
        permissions: true
      }
    });

    const existingPermissionIds = existingPermissions
      ? existingPermissions.permissions.map(p => p.id)
      : [];

    // Filtrar apenas as permissões que precisam ser adicionadas
    const permissionsToAdd = permissions.filter(
      p => !existingPermissionIds.includes(p.id)
    );

    if (permissionsToAdd.length > 0) {
      // Atualizar o papel com as novas permissões
      await prisma.roles.update({
        where: { id: roleEntity.id },
        data: {
          permissions: {
            connect: permissionsToAdd.map(p => ({ id: p.id }))
          }
        }
      });
      console.log(`${permissionsToAdd.length} permissões adicionadas ao papel ${role.name}`);
    } else {
      console.log(`Nenhuma nova permissão adicionada ao papel ${role.name}`);
    }
  }

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((error) => {
    console.error("Erro durante a execução do seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });