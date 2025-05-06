// lib/auth0.ts
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  appBaseUrl: process.env.APP_BASE_URL!,
  secret: process.env.AUTH0_SECRET!,

  authorizationParameters: {
    scope: process.env.AUTH0_SCOPE,
    audience: process.env.AUTH0_AUDIENCE,
  },

  // Esse hook roda depois de trocar code+state por tokens
  async onCallback(error) {
    if (error) {
      console.error("Erro no callback:", error);
      return NextResponse.redirect(new URL(`/error`, process.env.APP_BASE_URL));
    }
    // simplesmente redireciona para o endpoint de validação
    return NextResponse.redirect(new URL(`/auth/validate-login`, process.env.APP_BASE_URL));
  }
});
