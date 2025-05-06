"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { z } from "zod"
import { compare } from "bcryptjs"
import { lucia } from "@/lib/lucia"
import { cookies } from "next/headers"
import { homePath } from "@/app/paths"

const signInSchema = z.object({
  email: z.string().min(1, { message: "Is required" }).max(191).email(),
  password: z.string().min(6, { message: "Is required" }).max(191),
})

export const signIn = async (
  _actionState: ActionState,
  formData: FormData
) => {
  const cookieStore = await cookies()

  try {
    const formEntries = Object.fromEntries(formData);

    const { email, password } = signInSchema.parse(formEntries);

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('Usuário não encontrado, retornando erro');
      return toActionState("ERROR", "Usuário não encontrado", formData);
    }

    try {
      const validPassword = await compare(password, user.password);

      if (!validPassword) {
        console.log('Senha inválida, retornando erro');
        return toActionState("ERROR", "Senha inválida", formData);
      }
    } catch (err) {
      console.error('Erro ao verificar senha:', err);
      return toActionState("ERROR", "Senha inválida", formData);
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  } catch (error) {
    return fromErrorToActionState(error);
  }

  redirect(homePath());
}