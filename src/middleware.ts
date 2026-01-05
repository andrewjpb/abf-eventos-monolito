import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rotas que requerem autenticação
const protectedRoutes = ["/admin", "/account"]

// Rotas públicas (não requerem autenticação)
const publicRoutes = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Se não for rota protegida, permite acesso
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Verificar se existe o cookie de sessão do Lucia
  // O nome padrão do cookie do Lucia é "auth_session"
  const sessionCookie = request.cookies.get("auth_session")

  // Se não tem cookie de sessão, redireciona para login
  if (!sessionCookie?.value) {
    const signInUrl = new URL("/sign-in", request.url)
    // Adiciona a URL original como parâmetro para redirect após login
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Se tem cookie, permite acesso (a validação completa é feita no servidor)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Proteger rotas admin e account
    "/admin/:path*",
    "/account/:path*",
  ],
}
