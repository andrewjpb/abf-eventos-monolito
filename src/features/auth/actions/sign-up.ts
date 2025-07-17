"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state";
import { prisma } from "@/lib/prisma";
import { hash } from "@node-rs/argon2"
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { logInfo, logError, logWarn } from "@/features/logs/queries/add-log";
import { checkCnpjExists } from "@/features/company/queries/check-cnpj-exists";
import { redirect } from "next/navigation";
import { homePath } from "@/app/paths";
import { lucia } from "@/lib/lucia";
import { cookies } from "next/headers";

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
  const formEntries = Object.fromEntries(formData);
  
  // Garantir que username seja igual ao email
  formEntries.username = formEntries.email;
  
  // Log do início do processo de cadastro
  await logInfo(
    "Auth",
    `Iniciando cadastro de usuário: ${formEntries.email}`,
    undefined,
    {
      email: formEntries.email,
      cnpj: formEntries.cnpj
    }
  );
  
  let userData;
  let userId;
  
  try {
    try {
      userData = signUpSchema.parse(formEntries);
    } catch (validationError) {
      await logWarn(
        "Auth",
        `Erro de validação no cadastro: ${formEntries.email}`,
        undefined,
        {
          email: formEntries.email,
          validationErrors: (validationError as any).errors || (validationError as any).issues,
          formData: Object.fromEntries(formData)
        }
      );
      throw validationError; // Re-throw para que seja tratado pelo fromErrorToActionState
    }
    
    // Limpar formatação dos campos
    const cleanCpf = userData.cpf.replace(/\D/g, '')
    const cleanCnpj = userData.cnpj.replace(/\D/g, '')
    const cleanPhone = userData.mobile_phone.replace(/\D/g, '')

    // Check if email already exists
    const existingEmail = await prisma.users.findUnique({
      where: { email: userData.email }
    });

    if (existingEmail) {
      await logWarn(
        "Auth",
        `Tentativa de cadastro com e-mail já existente: ${userData.email}`,
        undefined,
        { email: userData.email }
      );
      return toActionState("ERROR", "E-mail já está em uso", formData);
    }

    // Username é igual ao email, então não precisa verificar separadamente

    // Check if RG already exists
    const existingRG = await prisma.users.findUnique({
      where: { rg: userData.rg }
    });

    if (existingRG) {
      await logWarn(
        "Auth",
        `Tentativa de cadastro com RG já existente: ${userData.rg}`,
        undefined,
        { rg: userData.rg, email: userData.email }
      );
      return toActionState("ERROR", "RG já está cadastrado", formData);
    }

    // Check if CPF already exists
    const existingCPF = await prisma.users.findUnique({
      where: { cpf: cleanCpf }
    });

    if (existingCPF) {
      await logWarn(
        "Auth",
        `Tentativa de cadastro com CPF já existente: ${cleanCpf}`,
        undefined,
        { cpf: cleanCpf, email: userData.email }
      );
      return toActionState("ERROR", "CPF já está cadastrado", formData);
    }

    // Check if mobile phone already exists
    const existingPhone = await prisma.users.findUnique({
      where: { mobile_phone: cleanPhone }
    });

    if (existingPhone) {
      await logWarn(
        "Auth",
        `Tentativa de cadastro com telefone já existente: ${cleanPhone}`,
        undefined,
        { phone: cleanPhone, email: userData.email }
      );
      return toActionState("ERROR", "Telefone já está em uso", formData);
    }

    // Verificar se empresa existe ou criar nova
    let company = await checkCnpjExists(cleanCnpj);
    let isNewCompany = false;
    
    if (!company) {
      await logInfo(
        "Auth", 
        `CNPJ não encontrado, verificando se deve criar empresa: ${cleanCnpj}`,
        undefined,
        { cnpj: cleanCnpj, email: userData.email, hasSegment: !!userData.company_segment }
      );
      
      if (!userData.company_segment) {
        await logWarn(
          "Auth",
          `Tentativa de cadastro com CNPJ inexistente sem segmento: ${cleanCnpj}`,
          undefined,
          { cnpj: cleanCnpj, email: userData.email }
        );
        return toActionState("ERROR", "CNPJ não encontrado. Selecione um segmento para cadastrar a empresa.", formData);
      }
      
      // Criar nova empresa apenas se CNPJ não existe e segmento foi fornecido
      const companyId = uuidv4();
      try {
        await logInfo(
          "Auth",
          `Criando nova empresa com CNPJ: ${cleanCnpj}`,
          undefined,
          { cnpj: cleanCnpj, segment: userData.company_segment, email: userData.email }
        );
        
        company = await prisma.company.create({
          data: {
            id: companyId,
            name: "Empresa não associada", // Nome padrão para empresas não associadas
            cnpj: cleanCnpj,
            segment: userData.company_segment,
            active: false
          }
        });
        
        isNewCompany = true;
        
        await logInfo(
          "Auth",
          `Nova empresa criada com sucesso: ${cleanCnpj}`,
          undefined,
          { cnpj: cleanCnpj, companyId: company.id, email: userData.email }
        );
        
        // Verificar se a empresa foi criada com sucesso
        if (!company) {
          await logError(
            "Auth",
            `Falha ao criar empresa - objeto company está vazio: ${cleanCnpj}`,
            undefined,
            { cnpj: cleanCnpj, email: userData.email }
          );
          return toActionState("ERROR", "Erro ao criar empresa. Tente novamente.", formData);
        }
      } catch (error) {
        await logError(
          "Auth",
          `Erro ao criar empresa: ${cleanCnpj}`,
          undefined,
          { cnpj: cleanCnpj, email: userData.email, error: (error as any).message }
        );
        
        // Se falhar, pode ser porque o CNPJ já existe (condição de corrida)
        // Tentar buscar novamente
        company = await checkCnpjExists(cleanCnpj);
        if (!company) {
          await logError(
            "Auth",
            `Empresa não encontrada após falha na criação: ${cleanCnpj}`,
            undefined,
            { cnpj: cleanCnpj, email: userData.email }
          );
          return toActionState("ERROR", "Erro ao criar empresa. Tente novamente.", formData);
        }
        isNewCompany = false;
        
        await logInfo(
          "Auth",
          `Empresa encontrada após falha na criação (condição de corrida): ${cleanCnpj}`,
          undefined,
          { cnpj: cleanCnpj, email: userData.email }
        );
      }
    } else {
      await logInfo(
        "Auth",
        `Empresa existente encontrada: ${cleanCnpj}`,
        undefined,
        { cnpj: cleanCnpj, companyName: company.name, email: userData.email }
      );
    }
    
    // Garantir que temos uma empresa válida antes de criar o usuário
    if (!company || !company.cnpj) {
      await logError(
        "Auth",
        `Empresa inválida antes de criar usuário: ${cleanCnpj}`,
        undefined,
        { cnpj: cleanCnpj, email: userData.email, company: company }
      );
      return toActionState("ERROR", "Erro ao processar empresa. Tente novamente.", formData);
    }

    // Normalizar CNPJ da empresa (remover formatação para comparação)
    const normalizedCompanyCnpj = company.cnpj.replace(/\D/g, '');
    
    // Verificar se o CNPJ da empresa corresponde ao CNPJ limpo
    if (normalizedCompanyCnpj !== cleanCnpj) {
      await logError(
        "Auth",
        `CNPJ da empresa não corresponde ao CNPJ do usuário: ${cleanCnpj}`,
        undefined,
        { 
          cnpj: cleanCnpj, 
          email: userData.email, 
          companyCnpj: company.cnpj,
          normalizedCompanyCnpj: normalizedCompanyCnpj,
          mismatch: true 
        }
      );
      return toActionState("ERROR", "Erro de integridade: CNPJ não corresponde. Tente novamente.", formData);
    }
    
    await logInfo(
      "Auth",
      `CNPJ validado com sucesso: ${company.cnpj}`,
      undefined,
      { 
        cnpj: cleanCnpj, 
        email: userData.email, 
        companyCnpj: company.cnpj,
        normalizedCompanyCnpj: normalizedCompanyCnpj
      }
    );

    const passwordHash = await hash(userData.password);
    userId = uuidv4();

    try {
      await logInfo(
        "Auth",
        `Iniciando criação de usuário: ${userData.email}`,
        undefined,
        {
          email: userData.email,
          cnpj: cleanCnpj,
          userId: userId,
          companyId: company.id,
          companyCnpj: company.cnpj,
          cnpjMatch: company.cnpj === cleanCnpj
        }
      );
      
      // Verificar se a empresa realmente existe no banco antes de criar o usuário
      const companyExists = await prisma.company.findUnique({
        where: { cnpj: company.cnpj }, // Usar o CNPJ da empresa como está no banco
        select: { id: true, cnpj: true, name: true }
      });
      
      if (!companyExists) {
        await logError(
          "Auth",
          `Empresa não encontrada no banco ao criar usuário: ${company.cnpj}`,
          undefined,
          {
            email: userData.email,
            cnpj: company.cnpj,
            cleanCnpj: cleanCnpj,
            userId: userId,
            companyId: company.id
          }
        );
        return toActionState("ERROR", "Erro: empresa não encontrada no banco de dados.", formData);
      }

      await logInfo(
        "Auth",
        `Empresa confirmada no banco: ${company.cnpj}`,
        undefined,
        {
          email: userData.email,
          cnpj: company.cnpj,
          foundCompany: companyExists
        }
      );
      
      const user = await prisma.users.create({
        data: {
          id: userId,
          username: userData.username,
          name: userData.name,
          email: userData.email,
          password: passwordHash,
          rg: userData.rg,
          cpf: cleanCpf,
          cnpj: company.cnpj, // Usar o CNPJ da empresa como está no banco
          mobile_phone: cleanPhone,
          position: userData.position,
          city: userData.city,
          state: userData.state.toUpperCase(),
          image_url: "",
          thumb_url: "",
          image_path: "",
          thumb_path: "",
          active: true
        }
      });

      // Log the successful registration
      await logInfo(
        "Auth",
        `Usuário cadastrado com sucesso: ${userData.username}`,
        userId,
        {
          email: userData.email,
          company: company.cnpj, // Usar o CNPJ da empresa como está no banco
          newCompany: isNewCompany,
          userId: userId
        }
      );

      // Criar sessão automaticamente após cadastro bem-sucedido
      try {
        const cookieStore = await cookies();
        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        
        cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        
        // Log do login automático
        await logInfo(
          "Auth",
          `Login automático realizado após cadastro: ${userData.username}`,
          userId,
          {
            email: userData.email,
            sessionId: session.id,
            autoLogin: true
          }
        );
      } catch (sessionError) {
        // Se falhar ao criar sessão, logar mas continuar (usuário foi criado)
        await logError(
          "Auth",
          `Erro ao criar sessão automática após cadastro: ${userData.email}`,
          userId,
          {
            email: userData.email,
            error: (sessionError as any).message
          }
        );
      }
    } catch (error) {
      await logError(
        "Auth",
        `Erro ao criar usuário: ${userData.email}`,
        undefined,
        {
          email: userData.email,
          cnpj: company.cnpj, // Usar o CNPJ da empresa como está no banco
          cleanCnpj: cleanCnpj,
          error: (error as any).message,
          errorCode: (error as any).code,
          errorMeta: (error as any).meta
        }
      );
      
      // Verificar se é erro de foreign key constraint
      if ((error as any).code === 'P2003') {
        return toActionState("ERROR", "Erro de integridade: CNPJ da empresa não foi encontrado. Tente novamente.", formData);
      }
      
      return toActionState("ERROR", "Erro ao cadastrar usuário. Verifique se os dados estão corretos.", formData);
    }

  } catch (error) {
    // Log do erro geral
    await logError(
      "Auth",
      `Erro geral no processo de cadastro`,
      undefined,
      {
        email: Object.fromEntries(formData).email,
        error: (error as any).message,
        stack: (error as any).stack,
        name: (error as any).name
      }
    );
    
    console.log(error);
    return fromErrorToActionState(error, formData);
  }

  // Log do sucesso completo antes do redirect
  if (userData && userId) {
    await logInfo(
      "Auth",
      `Processo de cadastro concluído com sucesso para: ${userData.email}`,
      userId,
      {
        email: userData.email,
        redirectTo: homePath()
      }
    );
  }
  
  // Redirecionar para a tela inicial após cadastro bem-sucedido (usuário já está logado)
  redirect(homePath());
};