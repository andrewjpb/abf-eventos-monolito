import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@/features/auth/queries/get-auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const user = await getAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventId = params.eventId

    // Buscar as ordens dos patrocinadores para o evento
    const sponsorOrders = await prisma.event_sponsor_order.findMany({
      where: { eventId },
      select: {
        sponsorId: true,
        order: true
      }
    })

    // Converter para um objeto com sponsorId como chave
    const ordersMap = sponsorOrders.reduce((acc, item) => {
      acc[item.sponsorId] = item.order
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json(ordersMap)

  } catch (error) {
    console.error("Erro ao buscar ordens dos patrocinadores:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}