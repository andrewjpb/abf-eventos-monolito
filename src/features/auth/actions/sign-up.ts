"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state";
import { lucia } from "@/lib/lucia";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { hash } from "@node-rs/argon2"
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { logInfo } from "@/features/logs/queries/add-log";
import { checkCnpjExists } from "@/features/company/queries/check-cnpj-exists";

const signUpSchema = z
  .object({
    username: z
      .string()
      .min(1, { message: "Nome de usuário é obrigatório" })
      .max(191)
      .refine(
        (value) => !value.includes(" "),
        "Nome de usuário não pode conter espaços"
      ),
    name: z.string().min(1, { message: "Nome completo é obrigatório" }).max(191),
    email: z.string().min(1, { message: "E-mail é obrigatório" }).max(191).email({ message: "E-mail inválido" }),
    password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }).max(191),
    confirmPassword: z.string().min(6).max(191),
    rg: z.string().min(1, { message: "RG é obrigatório" }).max(20),
    cpf: z.string().min(11, { message: "CPF é obrigatório" }).max(14),
    cnpj: z.string().min(14, { message: "CNPJ é obrigatório" }).max(18),
    mobile_phone: z.string()
      .min(1, { message: "Telefone é obrigatório" })
      .max(20)
      .refine((phone) => {
        // Remover formatação
        const cleanPhone = phone.replace(/\D/g, '')
        // Validar: deve ter 10 dígitos (DDD + 8 fixo) ou 11 dígitos (DDD + 9 celular)
        return cleanPhone.length === 10 || cleanPhone.length === 11
      }, { message: "Telefone deve ter DDD + 8 dígitos (fixo) ou DDD + 9 dígitos (celular)" }),
    position: z.string().min(1, { message: "Cargo é obrigatório" }).max(100),
    city: z.string().min(1, { message: "Cidade é obrigatória" }).max(100),
    state: z.string().min(1, { message: "Estado é obrigatório" }).max(50),
    company_segment: z.string().optional(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
      });
    }
  });

export const signUp = async (prevState: ActionState, formData: FormData) => {
  const cookieStore = await cookies()

  try {
    const userData = signUpSchema.parse(
      Object.fromEntries(formData)
    );
    
    // Limpar formatação dos campos
    const cleanCpf = userData.cpf.replace(/\D/g, '')
    const cleanCnpj = userData.cnpj.replace(/\D/g, '')
    const cleanPhone = userData.mobile_phone.replace(/\D/g, '')

    // Check if email already exists
    const existingEmail = await prisma.users.findUnique({
      where: { email: userData.email }
    });

    if (existingEmail) {
      return toActionState("ERROR", "E-mail já está em uso", formData);
    }

    // Check if username already exists
    const existingUsername = await prisma.users.findUnique({
      where: { username: userData.username }
    });

    if (existingUsername) {
      return toActionState("ERROR", "Nome de usuário já está em uso", formData);
    }

    // Check if RG already exists
    const existingRG = await prisma.users.findUnique({
      where: { rg: userData.rg }
    });

    if (existingRG) {
      return toActionState("ERROR", "RG já está cadastrado", formData);
    }

    // Check if CPF already exists
    const existingCPF = await prisma.users.findUnique({
      where: { cpf: cleanCpf }
    });

    if (existingCPF) {
      return toActionState("ERROR", "CPF já está cadastrado", formData);
    }

    // Check if mobile phone already exists
    const existingPhone = await prisma.users.findUnique({
      where: { mobile_phone: cleanPhone }
    });

    if (existingPhone) {
      return toActionState("ERROR", "Telefone já está em uso", formData);
    }

    // Verificar se empresa existe ou criar nova
    let company = await checkCnpjExists(cleanCnpj);
    
    if (!company && userData.company_segment) {
      // Criar nova empresa se CNPJ não existe e segmento foi fornecido
      const companyId = uuidv4();
      company = await prisma.company.create({
        data: {
          id: companyId,
          name: "Empresa não associada", // Nome padrão para empresas não associadas
          cnpj: cleanCnpj,
          segment: userData.company_segment,
          active: true
        }
      });
    } else if (!company) {
      return toActionState("ERROR", "CNPJ não encontrado. Selecione um segmento para cadastrar a empresa.", formData);
    }

    const passwordHash = await hash(userData.password);
    const userId = uuidv4();

    const user = await prisma.users.create({
      data: {
        id: userId,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        password: passwordHash,
        rg: userData.rg,
        cpf: cleanCpf,
        cnpj: cleanCnpj,
        mobile_phone: cleanPhone,
        position: userData.position,
        city: userData.city,
        state: userData.state.toUpperCase(),
        image_url: "",
        thumb_url: "",
        image_path: "",
        thumb_path: "",
        active: true,
        // Add a default role (e.g., "user")
        roles: {
          connect: {
            name: "user" // Assuming you have a "user" role created in your database
          }
        }
      }
    });

    // Log the registration
    await logInfo(
      "Auth",
      `Usuário cadastrado: ${userData.username}`,
      userId,
      {
        email: userData.email,
        company: cleanCnpj,
        newCompany: !userData.company_segment ? false : true
      }
    );

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  } catch (error) {
    console.log(error);
    return fromErrorToActionState(error, formData);
  }

  return toActionState("SUCCESS", "Cadastro realizado com sucesso!");
};