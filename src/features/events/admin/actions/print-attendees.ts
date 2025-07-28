"use server"

import { ActionState } from "@/components/form/utils/to-action-state"
import { getAuthWithPermissionOrRedirect } from "@/features/auth/queries/get-auth-with-permission-or-redirect"
import { addLog } from "@/features/logs/queries/add-log"
import * as net from "net"

type PrintData = {
  qr: string
  name: string
  company: string
  position: string
}

type PrintRequest = {
  printerIp: string
  printerPort: number
  printerName: string
  attendees: PrintData[]
  eventId: string
}

export async function printAttendees(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    // Verificar permissões
    const user = await getAuthWithPermissionOrRedirect("events.create")

    const printerIp = formData.get("printerIp") as string
    const printerPort = parseInt(formData.get("printerPort") as string)
    const printerName = formData.get("printerName") as string
    const eventId = formData.get("eventId") as string
    const attendeesData = formData.get("attendees") as string

    if (!printerIp || !printerPort || !attendeesData) {
      return {
        status: "ERROR",
        message: "Dados incompletos para impressão"
      }
    }

    const attendees: PrintData[] = JSON.parse(attendeesData)

    if (attendees.length === 0) {
      return {
        status: "ERROR",
        message: "Nenhum participante selecionado para impressão"
      }
    }

    // Enviar dados para a impressora via TCP
    console.log(`Tentando imprimir ${attendees.length} crachás na impressora ${printerName} (${printerIp}:${printerPort})`)
    
    const success = await sendToPrinter(printerIp, printerPort, attendees)

    console.log(`Resultado da impressão: ${success ? 'sucesso' : 'falha'}`)

    if (!success) {
      // Log mais detalhado para debug
      console.warn(`Impressão falhou - mas pode ter sido enviada. Impressora: ${printerName} (${printerIp}:${printerPort})`)
      
      return {
        status: "WARNING",
        message: `Dados enviados para ${printerName}, mas conexão pode ter falhado. Verifique se a impressão foi realizada.`
      }
    }

    // Registrar log da ação
    await addLog({
      user_id: user.id,
      action: "print_attendees",
      entity_type: "event",
      entity_id: eventId,
      details: {
        printer: {
          name: printerName,
          ip: printerIp,
          port: printerPort
        },
        attendees_count: attendees.length,
        attendees_names: attendees.map(a => a.name)
      }
    })

    return {
      status: "SUCCESS",
      message: `${attendees.length} crachá(s) enviado(s) para impressão em ${printerName}`
    }
  } catch (error) {
    console.error("Erro ao imprimir crachás:", error)
    return {
      status: "ERROR",
      message: "Erro interno do servidor ao imprimir crachás"
    }
  }
}

async function sendToPrinter(
  ip: string, 
  port: number, 
  attendees: PrintData[]
): Promise<boolean> {
  return new Promise((resolve) => {
    const client = new net.Socket()
    let dataWasSent = false

    // Timeout de 10 segundos
    const timeout = setTimeout(() => {
      client.destroy()
      // Se os dados foram enviados, considerar sucesso mesmo com timeout
      resolve(dataWasSent)
    }, 10000)

    client.connect(port, ip, () => {
      try {
        // Enviar dados JSON para a impressora (como no seu exemplo PowerShell)
        const jsonData = JSON.stringify(attendees, null, 2)
        client.write(jsonData)
        dataWasSent = true
        
        // Dar um tempo para os dados serem enviados antes de fechar
        setTimeout(() => {
          client.end()
        }, 100)
      } catch (error) {
        console.error("Erro ao enviar dados:", error)
        client.destroy()
      }
    })

    client.on('close', () => {
      clearTimeout(timeout)
      resolve(dataWasSent)
    })

    client.on('error', (error) => {
      console.error("Erro de conexão TCP:", error)
      clearTimeout(timeout)
      client.destroy()
      // Se os dados foram enviados antes do erro, ainda considerar sucesso
      resolve(dataWasSent)
    })

    client.on('drain', () => {
      // Dados foram completamente enviados
      dataWasSent = true
    })
  })
}

// Função auxiliar para testar conexão com a impressora
export async function testPrinterConnection(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    const printerIp = formData.get("printerIp") as string
    const printerPort = parseInt(formData.get("printerPort") as string)
    const printerName = formData.get("printerName") as string

    if (!printerIp || !printerPort) {
      return {
        status: "ERROR",
        message: "IP e porta são obrigatórios"
      }
    }

    const success = await testConnection(printerIp, printerPort)

    if (success) {
      return {
        status: "SUCCESS",
        message: `Conexão com ${printerName} testada com sucesso!`
      }
    } else {
      return {
        status: "ERROR",
        message: `Falha ao conectar com ${printerName} (${printerIp}:${printerPort})`
      }
    }
  } catch (error) {
    console.error("Erro ao testar conexão:", error)
    return {
      status: "ERROR",
      message: "Erro interno do servidor ao testar conexão"
    }
  }
}

async function testConnection(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const client = new net.Socket()
    let connected = false

    // Timeout de 5 segundos para teste
    const timeout = setTimeout(() => {
      if (!connected) {
        client.destroy()
        resolve(false)
      }
    }, 5000)

    client.connect(port, ip, () => {
      connected = true
      clearTimeout(timeout)
      
      // Fechar conexão imediatamente após sucesso
      setTimeout(() => {
        client.end()
        resolve(true)
      }, 50)
    })

    client.on('close', () => {
      if (!connected) {
        clearTimeout(timeout)
        resolve(false)
      }
    })

    client.on('error', (error) => {
      connected = false
      clearTimeout(timeout)
      client.destroy()
      resolve(false)
    })
  })
}