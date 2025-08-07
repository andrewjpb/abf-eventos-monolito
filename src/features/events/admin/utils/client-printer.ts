"use client"

export type PrinterData = {
  qr: string
  name: string
  company: string
  position: string
}

export type PrinterConfig = {
  id: string
  name: string
  ip: string
  port: number
  isActive: boolean
}

/**
 * Envia dados de impressão diretamente para a impressora via fetch
 * Envia um POST direto para o IP:porta configurado com os dados JSON
 */
export class ClientPrinter {
  private static instance: ClientPrinter
  
  private constructor() {}
  
  static getInstance(): ClientPrinter {
    if (!ClientPrinter.instance) {
      ClientPrinter.instance = new ClientPrinter()
    }
    return ClientPrinter.instance
  }

  /**
   * Envia dados para impressão via fetch direto para o IP da impressora
   */
  async printViaTCP(printer: PrinterConfig, data: PrinterData[]): Promise<boolean> {
    const url = `http://${printer.ip}:${printer.port}`
    console.log(`Enviando dados para impressora em ${url}:`, data)
    
    // Fire-and-forget: envia o fetch mas não espera resposta
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify(data),
      mode: 'no-cors',
    }).catch(() => {}) // Ignora erros silenciosamente
    
    // Simula um pequeno delay e sempre retorna sucesso
    await new Promise(resolve => setTimeout(resolve, 300))
    console.log(`Dados enviados para impressora ${printer.name}`)
    return true
  }

  /**
   * Testa conectividade com a impressora
   */
  async testConnection(printer: PrinterConfig): Promise<boolean> {
    const url = `http://${printer.ip}:${printer.port}`
    const testData: PrinterData[] = [] // Array vazio para teste
    
    // Configurar timeout para teste
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 segundos para teste
    
    // Tentar primeiro com no-cors
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
        },
        body: JSON.stringify(testData),
        mode: 'no-cors',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      console.log(`Teste de conexão com ${printer.name} bem-sucedido (no-cors)`)
      return true
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Se foi timeout ou abort, não tentar CORS
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('Timeout no teste de conexão:', error)
        return false
      }
      
      console.warn('Teste no-cors falhou, tentando CORS:', error)
      
      // Fallback: tentar com CORS
      const controller2 = new AbortController()
      const timeoutId2 = setTimeout(() => controller2.abort(), 2000) // 2 segundos para CORS
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
          },
          body: JSON.stringify(testData),
          mode: 'cors',
          signal: controller2.signal,
        })
        
        clearTimeout(timeoutId2)
        console.log(`Teste de conexão com ${printer.name} bem-sucedido (CORS)`)
        return true
      } catch (corsError) {
        clearTimeout(timeoutId2)
        console.error('Ambos os testes falharam:', corsError)
        return false
      }
    }
  }
}

/**
 * Hook para usar o ClientPrinter
 */
export function useClientPrinter() {
  const printer = ClientPrinter.getInstance()

  const printBadges = async (printerConfig: PrinterConfig, data: PrinterData[]): Promise<boolean> => {
    return printer.printViaTCP(printerConfig, data)
  }

  const testPrinter = async (printerConfig: PrinterConfig): Promise<boolean> => {
    return printer.testConnection(printerConfig)
  }

  return {
    printBadges,
    testPrinter
  }
}