import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = await getAuth()
    if (!auth.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 3) {
      return NextResponse.json([])
    }

    // Buscar usuários por nome, email ou empresa
    const users = await prisma.users.findMany({
      where: {
        AND: [
          { active: true },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { 
                company: {
                  name: { contains: query, mode: "insensitive" }
                }
              }
            ]
          }
        ]
      },
      include: {
        company: {
          select: {
            name: true,
            cnpj: true
          }
        }
      },
      take: 20, // Limitar resultados
      orderBy: {
        name: "asc"
      }
    })

    // Mapear para o formato esperado pelo frontend
    const mappedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position,
      company: {
        name: user.company.name,
        cnpj: user.company.cnpj
      }
    }))

    return NextResponse.json(mappedUsers)
  } catch (error) {
    console.error("Erro na busca de usuários:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}