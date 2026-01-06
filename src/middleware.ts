import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rotas que requerem autenticação
const protectedRoutes = ["/admin", "/account"]

// Padrões de bots e requisições maliciosas
const botPatterns = [
  /^\/wp-/,              // WordPress
  /^\/wordpress/i,       // WordPress
  /\.php$/,              // Arquivos PHP
  /\.php\//,             // PHP com path
  /^\/xmlrpc/,           // WordPress XMLRPC
  /^\/\.env/,            // Tentativa de ler .env
  /^\/config\./,         // Arquivos de config
  /^\/admin\.php/,       // Admin PHP
  /^\/wp-login/,         // WordPress login
  /^\/wp-content/,       // WordPress content
  /^\/wp-includes/,      // WordPress includes
  /^\/\.well-known\/.*\.php/, // PHP em .well-known
]

// Padrões de spam SEO (slugs de produtos)
const spamPatterns = [
  /slug=.*shoe/i,
  /slug=.*nike/i,
  /slug=.*adidas/i,
  /slug=.*asics/i,
  /slug=.*puma/i,
  /slug=.*shirt/i,
  /slug=.*pants/i,
]

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const fullPath = pathname + search

  // Bloquear bots e requisições maliciosas (silenciosamente)
  if (botPatterns.some(pattern => pattern.test(pathname))) {
    return new Response('Not Found', { status: 404 })
  }

  // Bloquear spam SEO
  if (spamPatterns.some(pattern => pattern.test(fullPath))) {
    return new Response('Not Found', { status: 404 })
  }

  // Bloquear Server Actions inválidas (IDs muito curtos ou suspeitos)
  const actionId = request.headers.get('Next-Action')
  if (actionId) {
    // IDs válidos do Next.js são hashes longos (40+ caracteres)
    // Se for muito curto (como "x") ou padrão suspeito, bloqueia
    if (actionId.length < 10 || /^[a-z]$/i.test(actionId)) {
      console.log("[middleware] Bloqueado: Server Action inválida, ID:", actionId)
      return new Response('Bad Request', { status: 400 })
    }
  }

  console.log("[middleware] Request:", request.method, pathname)

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Se não for rota protegida, permite acesso
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  console.log("[middleware] Rota protegida detectada:", pathname)

  // Verificar se existe o cookie de sessão do Lucia
  const sessionCookie = request.cookies.get("auth_session")

  console.log("[middleware] Cookie auth_session:", sessionCookie?.value ? "PRESENTE (***" + sessionCookie.value.slice(-8) + ")" : "AUSENTE")

  // Se não tem cookie de sessão, redireciona para login
  if (!sessionCookie?.value) {
    console.log("[middleware] Redirecionando para /sign-in")
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  console.log("[middleware] Acesso permitido")
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Aplicar middleware em todas as rotas exceto assets estáticos
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.webp$).*)",
  ],
}
