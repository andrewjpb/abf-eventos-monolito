import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rotas que requerem autenticação
const protectedRoutes = ["/admin", "/account"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
    // Proteger rotas admin e account
    "/admin/:path*",
    "/account/:path*",
  ],
}
