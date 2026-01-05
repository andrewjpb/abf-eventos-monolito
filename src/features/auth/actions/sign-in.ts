"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { z } from "zod"
import { compare } from "bcryptjs"
import { lucia } from "@/lib/lucia"
import { cookies } from "next/headers"
import { homePath } from "@/app/paths"
import { logInfo, logError } from "@/features/logs/queries/add-log"

const signInSchema = z.object({
  email: z.string().min(1, { message: "Is required" }).max(191),
  password: z.string().min(6, { message: "Is required" }).max(191),
})

export const signIn = async (
  _actionState: ActionState,
  formData: FormData
) => {
  console.log("[signIn] Iniciando processo de login...")

  const cookieStore = await cookies()
  let userForLog: { id: string; email: string; username: string } | null = null

  try {
    console.log("[signIn] Parseando FormData...")
    const formEntries = Object.fromEntries(formData);
    console.log("[signIn] FormData entries:", Object.keys(formEntries))

    const { email, password } = signInSchema.parse(formEntries);
    console.log("[signIn] Email/Username:", email)

    // Converter para lowercase para busca case-insensitive
    const emailOrUsername = email.toLowerCase();

    // Buscar por email ou username (case-insensitive)
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { equals: emailOrUsername, mode: 'insensitive' } },
          { username: { equals: emailOrUsername, mode: 'insensitive' } }
        ]
      },
    });

    if (!user) {
      // Log tentativa de login com email/username inexistente
      await logError(
        "Auth",
        `Failed login attempt - User not found: ${emailOrUsername}`,
        undefined,
        {
          emailOrUsername,
          reason: "user_not_found",
          ip: "unknown" // Você pode capturar o IP se necessário
        }
      );

      console.log('Usuário não encontrado, retornando erro');
      return toActionState("ERROR", "Usuário não encontrado", formData);
    }

    // Armazenar dados do usuário para logs posteriores
    userForLog = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    try {
      const validPassword = await compare(password, user.password);

      if (!validPassword) {
        // Log tentativa de login com senha incorreta
        await logError(
          "Auth",
          `Failed login attempt - Invalid password for user: ${user.username}`,
          user.id,
          {
            email: user.email,
            username: user.username,
            reason: "invalid_password",
            ip: "unknown"
          }
        );

        console.log('Senha inválida, retornando erro');
        return toActionState("ERROR", "Senha inválida", formData);
      }
    } catch (err) {
      // Log erro na verificação de senha
      await logError(
        "Auth",
        `Password verification error for user: ${user.username}`,
        user.id,
        {
          email: user.email,
          username: user.username,
          error: err instanceof Error ? err.message : 'Unknown error',
          ip: "unknown"
        }
      );

      console.error('Erro ao verificar senha:', err);
      return toActionState("ERROR", "Senha inválida", formData);
    }

    // Criar sessão
    console.log("[signIn] Criando sessão para usuário:", user.id)
    const session = await lucia.createSession(user.id, {});
    console.log("[signIn] Sessão criada:", session.id)

    const sessionCookie = lucia.createSessionCookie(session.id);
    console.log("[signIn] Cookie criado:", sessionCookie.name, "| Atributos:", JSON.stringify(sessionCookie.attributes))

    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    console.log("[signIn] Cookie definido com sucesso")

    // Log login bem-sucedido
    await logInfo(
      "Auth",
      `User logged in successfully: ${user.username}`,
      user.id,
      {
        email: user.email,
        username: user.username,
        sessionId: session.id,
        ip: "unknown"
      }
    );

  } catch (error) {
    // Log erro geral no processo de login
    await logError(
      "Auth",
      `Sign-in process error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      userForLog?.id,
      {
        email: userForLog?.email,
        username: userForLog?.username,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    );

    return fromErrorToActionState(error);
  }

  redirect(homePath());
}