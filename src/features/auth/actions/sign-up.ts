"use server"

import { ActionState, fromErrorToActionState, toActionState } from "@/components/form/utils/to-action-state";
import { lucia } from "@/lib/lucia";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { hash } from "@node-rs/argon2"
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { logInfo } from "@/features/logs/queries/add-log";

const signUpSchema = z
  .object({
    username: z
      .string()
      .min(1)
      .max(191)
      .refine(
        (value) => !value.includes(" "),
        "Username cannot contain spaces"
      ),
    name: z.string().min(1, { message: "Full name is required" }).max(191),
    email: z.string().min(1, { message: "Email is required" }).max(191).email(),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(191),
    confirmPassword: z.string().min(6).max(191),
    rg: z.string().min(1, { message: "RG is required" }).max(20),
    cpf: z.string().min(11, { message: "CPF is required" }).max(14),
    cnpj: z.string().min(14, { message: "Company CNPJ is required" }).max(18),
    mobile_phone: z.string().min(1, { message: "Mobile phone is required" }).max(20),
    position: z.string().min(1, { message: "Position is required" }).max(100),
    city: z.string().min(1, { message: "City is required" }).max(100),
    state: z.string().min(1, { message: "State is required" }).max(50),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
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

    // Check if email already exists
    const existingEmail = await prisma.users.findUnique({
      where: { email: userData.email }
    });

    if (existingEmail) {
      return toActionState("ERROR", "Email already in use", formData);
    }

    // Check if username already exists
    const existingUsername = await prisma.users.findUnique({
      where: { username: userData.username }
    });

    if (existingUsername) {
      return toActionState("ERROR", "Username already in use", formData);
    }

    // Check if RG already exists
    const existingRG = await prisma.users.findUnique({
      where: { rg: userData.rg }
    });

    if (existingRG) {
      return toActionState("ERROR", "RG already registered", formData);
    }

    // Check if CPF already exists
    const existingCPF = await prisma.users.findUnique({
      where: { cpf: userData.cpf }
    });

    if (existingCPF) {
      return toActionState("ERROR", "CPF already registered", formData);
    }

    // Check if mobile phone already exists
    const existingPhone = await prisma.users.findUnique({
      where: { mobile_phone: userData.mobile_phone }
    });

    if (existingPhone) {
      return toActionState("ERROR", "Phone number already in use", formData);
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { cnpj: userData.cnpj }
    });

    if (!company) {
      return toActionState("ERROR", "Company CNPJ not found in our database", formData);
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
        cpf: userData.cpf,
        cnpj: userData.cnpj,
        mobile_phone: userData.mobile_phone,
        position: userData.position,
        city: userData.city,
        state: userData.state,
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
      `User registered: ${userData.username}`,
      userId,
      {
        email: userData.email,
        company: userData.cnpj
      }
    );

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  } catch (error) {
    console.log(error);
    return fromErrorToActionState(error, formData);
  }

  return toActionState("SUCCESS", "Sign up successful");
};