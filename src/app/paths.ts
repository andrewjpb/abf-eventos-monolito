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