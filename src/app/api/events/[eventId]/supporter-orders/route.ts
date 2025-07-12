import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await params

    // Buscar as ordens dos apoiadores para o evento
    const supporterOrders = await prisma.event_supporter_order.findMany({
      where: { eventId },
      select: {
        supporterId: true,
        order: true
      }
    })

    // Converter para um objeto com supporterId como chave
    const ordersMap = supporterOrders.reduce((acc, item) => {
      acc[item.supporterId] = item.order
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json(ordersMap)

  } catch (error) {
    console.error("Erro ao buscar ordens dos apoiadores:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}