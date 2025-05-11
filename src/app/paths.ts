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
