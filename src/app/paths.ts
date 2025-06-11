// app/paths.ts

// Rotas de autenticação
export const homePath = () => "/";                                      // Página inicial (listagem de eventos)
export const signInPath = () => "/sign-in";                             // Login
export const signUpPath = () => "/sign-up";                             // Cadastro
export const passwordForgotPath = () => "/password-forgot";             // Esqueci minha senha
export const passwordResetPath = (token: string) => `/password-reset/${token}`; // Redefinir senha

// Rotas de conta de usuário
export const accountProfilePath = () => "/account/profile";             // Perfil do usuário
export const accountPasswordPath = () => "/account/password";           // Alterar senha
export const accountSecurityPath = () => "/account/security";           // Configurações de segurança 
export const accountNotificationsPath = () => "/account/notifications"; // Configurações de notificações
export const accountBillingPath = () => "/account/billing";             // Informações de cobrança

// Rotas de eventos (visíveis para todos os usuários)
export const eventsPath = () => "/";                                    // Listagem de eventos (página inicial)
export const eventPath = (id: string) => `/eventos/${id}`;              // Detalhes do evento específico
export const eventAttendancePath = (id: string) => `/eventos/${id}/presenca`; // Lista de presença

// Rotas administrativas
export const adminDashboardPath = () => "/admin";                       // Dashboard administrativa
export const usersPath = () => "/admin/users";                          // Listagem de usuários
export const userPath = (id: string) => `/admin/users/${id}`;           // Detalhes do usuário
export const userEditPath = (id: string) => `/admin/users/${id}/edit`;  // Edição de usuário
export const userCreatePath = () => "/admin/users/create";              // Criação de usuário

export const companiesPath = () => "/admin/companies";                  // Listagem de empresas
export const companyPath = (id: string) => `/admin/companies/${id}`;    // Detalhes da empresa
export const companyEditPath = (id: string) => `/admin/companies/${id}/edit`; // Edição de empresa
export const companyCreatePath = () => "/admin/companies/create";       // Criação de empresa

export const eventsAdminPath = () => "/admin/events";                   // Listagem de eventos (admin)
export const eventAdminPath = (id: string) => `/admin/events/${id}`;    // Detalhes do evento (admin)
export const eventEditPath = (id: string) => `/admin/events/${id}/edit`; // Edição de evento
export const eventCreatePath = () => "/admin/events/create";            // Criação de evento
export const eventAttendeesPath = (id: string) => `/admin/events/${id}/attendees`; // Participantes do evento

export const supportersPath = () => "/admin/supporters";                // Listagem de apoiadores
export const supporterPath = (id: string) => `/admin/supporters/${id}`; // Detalhes do apoiador
export const supporterEditPath = (id: string) => `/admin/supporters/${id}/edit`; // Edição de apoiador
export const supporterCreatePath = () => "/admin/supporters/create";    // Criação de apoiador

export const sponsorsPath = () => "/admin/sponsors";                    // Listagem de patrocinadores
export const sponsorPath = (id: string) => `/admin/sponsors/${id}`;     // Detalhes do patrocinador
export const sponsorEditPath = (id: string) => `/admin/sponsors/${id}/edit`; // Edição de patrocinador
export const sponsorCreatePath = () => "/admin/sponsors/create";        // Criação de patrocinador

export const speakersPath = () => "/admin/speakers";                    // Listagem de palestrantes
export const speakerPath = (id: string) => `/admin/speakers/${id}`;     // Detalhes do palestrante
export const speakerEditPath = (id: string) => `/admin/speakers/${id}/edit`; // Edição de palestrante
export const speakerCreatePath = () => "/admin/speakers/create";        // Criação de palestrante

export const externalEventsPath = () => "/admin/external-events";       // Listagem de eventos externos
export const externalEventPath = (id: string) => `/admin/external-events/${id}`; // Detalhes do evento externo
export const externalEventEditPath = (id: string) => `/admin/external-events/${id}/edit`; // Edição de evento externo
export const externalEventCreatePath = () => "/admin/external-events/create"; // Criação de evento externo

export const highlightCardsPath = () => "/admin/highlights";            // Listagem de destaques
export const highlightCardPath = (id: string) => `/admin/highlights/${id}`; // Detalhes do destaque
export const highlightCardEditPath = (id: string) => `/admin/highlights/${id}/edit`; // Edição de destaque
export const highlightCardCreatePath = () => "/admin/highlights/create"; // Criação de destaque

export const logsPath = () => "/admin/logs";                            // Logs do sistema

// Banners
export const bannersPath = () => "/admin/banners";
export const bannerPath = (id: string) => `/admin/banners/${id}`;
export const bannerCreatePath = () => "/admin/banners/create";
export const bannerEditPath = (id: string) => `/admin/banners/${id}/edit`;


// Rotas de Roles e Permissions
export const rolesPath = () => "/admin/roles";                          // Listagem de roles
export const rolePath = (id: string) => `/admin/roles/${id}`;           // Detalhes da role
export const roleEditPath = (id: string) => `/admin/roles/${id}/edit`;  // Edição de role
export const roleCreatePath = () => "/admin/roles/create";              // Criação de role

export const permissionsPath = () => "/admin/permissions";              // Listagem de permissions
export const permissionPath = (id: string) => `/admin/permissions/${id}`; // Detalhes da permission
export const permissionEditPath = (id: string) => `/admin/permissions/${id}/edit`; // Edição de permission
export const permissionCreatePath = () => "/admin/permissions/create";  // Criação de permission



export const enrollmentsPath = () => "/admin/enrollments";                    // Dashboard de inscrições
export const enrollmentsByEventPath = (eventId: string) => `/admin/enrollments/event/${eventId}`; // Inscrições por evento
export const enrollmentsStatsPath = () => "/admin/enrollments/stats";        // Estatísticas gerais
export const enrollmentsExportPath = () => "/admin/enrollments/export";      // Exportar dados// Rotas para inscrições
export const enrollmentsDashboardPath = () => `/admin/enrollments/dashboard`
export const enrollmentsListPath = () => `/admin/enrollments`
