"use client"

import { useState, useEffect } from "react"
import { Printer, Plus, Trash2, Settings, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"

type Printer = {
  id: string
  name: string
  ip: string
  port: number
  isActive: boolean
}

type PrinterManagementProps = {
  onPrinterAdded?: (printer: Printer) => void
  selectedAttendees: any[]
  onPrintSelected?: (printer: Printer, attendees: any[]) => void
  onActivePrinterChange?: (printer: Printer | null) => void
}

const PRINTERS_STORAGE_KEY = "abf-event-printers"
const ACTIVE_PRINTER_STORAGE_KEY = "abf-active-printer"

// Função para formatar nome - primeiro e último nome com capitalização adequada
export const formatNameForPrint = (fullName: string): string => {
  if (!fullName) return ""
  
  const nameParts = fullName.trim().split(" ").filter(part => part.length > 0)
  
  if (nameParts.length === 0) return ""
  
  // Se tem apenas um nome, retorna ele formatado
  if (nameParts.length === 1) {
    const name = nameParts[0]
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
  }
  
  // Primeiro e último nome com capitalização adequada
  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]
  
  const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
  const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()
  
  return `${formattedFirstName} ${formattedLastName}`
}

export function PrinterManagement({ 
  onPrinterAdded, 
  selectedAttendees = [], 
  onPrintSelected,
  onActivePrinterChange
}: PrinterManagementProps) {
  const [printers, setPrinters] = useState<Printer[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    ip: "",
    port: "9100"
  })
  const [activePrinter, setActivePrinter] = useState<Printer | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState<string | null>(null)

  // Carregar impressoras do localStorage na inicialização
  useEffect(() => {
    const savedPrinters = localStorage.getItem(PRINTERS_STORAGE_KEY)
    const savedActivePrinter = localStorage.getItem(ACTIVE_PRINTER_STORAGE_KEY)
    
    if (savedPrinters) {
      try {
        const parsedPrinters = JSON.parse(savedPrinters)
        setPrinters(parsedPrinters)
      } catch (error) {
        console.error("Erro ao carregar impressoras do localStorage:", error)
      }
    }

    if (savedActivePrinter) {
      try {
        const parsedActivePrinter = JSON.parse(savedActivePrinter)
        setActivePrinter(parsedActivePrinter)
      } catch (error) {
        console.error("Erro ao carregar impressora ativa do localStorage:", error)
      }
    }
  }, [])

  // Salvar impressoras no localStorage sempre que a lista mudar
  useEffect(() => {
    if (printers.length > 0) {
      localStorage.setItem(PRINTERS_STORAGE_KEY, JSON.stringify(printers))
    } else {
      localStorage.removeItem(PRINTERS_STORAGE_KEY)
    }
  }, [printers])

  // Salvar impressora ativa no localStorage sempre que mudar
  useEffect(() => {
    if (activePrinter) {
      localStorage.setItem(ACTIVE_PRINTER_STORAGE_KEY, JSON.stringify(activePrinter))
    } else {
      localStorage.removeItem(ACTIVE_PRINTER_STORAGE_KEY)
    }
  }, [activePrinter])

  const validateIP = (ip: string) => {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    return ipRegex.test(ip) && ip.split('.').every(part => parseInt(part) <= 255)
  }

  const testPrinterConnection = async (printer: Printer) => {
    setIsTestingConnection(printer.id)
    
    try {
      // Simular teste de conexão (em produção, você faria uma chamada real)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Por enquanto, vamos considerar sempre bem-sucedido
      // Em produção, você faria uma requisição para o backend testar a conexão TCP
      toast.success(`Conexão com ${printer.name} testada com sucesso!`)
      return true
    } catch (error) {
      toast.error(`Falha ao conectar com ${printer.name}`)
      return false
    } finally {
      setIsTestingConnection(null)
    }
  }

  const addPrinter = () => {
    if (!formData.name.trim()) {
      toast.error("Nome da impressora é obrigatório")
      return
    }

    if (!validateIP(formData.ip)) {
      toast.error("IP inválido")
      return
    }

    const port = parseInt(formData.port)
    if (isNaN(port) || port < 1 || port > 65535) {
      toast.error("Porta deve estar entre 1 e 65535")
      return
    }

    // Verificar se IP/porta já existem
    const exists = printers.some(p => p.ip === formData.ip && p.port === port)
    if (exists) {
      toast.error("Já existe uma impressora com este IP e porta")
      return
    }

    const newPrinter: Printer = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      ip: formData.ip.trim(),
      port,
      isActive: false
    }

    setPrinters(prev => [...prev, newPrinter])
    setFormData({ name: "", ip: "", port: "9100" })
    setShowAddForm(false)
    onPrinterAdded?.(newPrinter)
    toast.success(`Impressora ${newPrinter.name} adicionada com sucesso!`)
  }

  const removePrinter = (printerId: string) => {
    const printerToRemove = printers.find(p => p.id === printerId)
    
    setPrinters(prev => {
      const updatedPrinters = prev.filter(p => p.id !== printerId)
      
      // Se não há mais impressoras, limpar localStorage
      if (updatedPrinters.length === 0) {
        localStorage.removeItem(PRINTERS_STORAGE_KEY)
      }
      
      return updatedPrinters
    })
    
    // Se a impressora removida era a ativa, limpar impressora ativa
    if (activePrinter?.id === printerId) {
      setActivePrinter(null)
      localStorage.removeItem(ACTIVE_PRINTER_STORAGE_KEY)
      onActivePrinterChange?.(null)
    }
    
    setShowRemoveDialog(null)
    toast.success(`Impressora ${printerToRemove?.name || 'removida'} foi removida com sucesso!`)
  }

  const setActivePrinterHandler = (printer: Printer) => {
    setActivePrinter(printer)
    setPrinters(prev => prev.map(p => ({
      ...p,
      isActive: p.id === printer.id
    })))
    onActivePrinterChange?.(printer)
    toast.success(`${printer.name} definida como impressora ativa`)
  }

  const handlePrintSelected = async () => {
    if (!activePrinter) {
      toast.error("Selecione uma impressora primeiro")
      return
    }

    if (selectedAttendees.length === 0) {
      toast.error("Selecione pelo menos um participante para imprimir")
      return
    }

    try {
      // Preparar dados para impressão no formato que você mostrou
      const printData = selectedAttendees.map(attendee => ({
        qr: `https://linkedin.com/in/${attendee.attendee_email.split('@')[0]}`, // Exemplo de QR
        name: formatNameForPrint(attendee.attendee_full_name),
        company: attendee.company?.name || "Não informado",
        position: attendee.attendee_position || "Não informado"
      }))

      // Aqui você faria a chamada para o backend que enviaria os dados via TCP
      // Por enquanto, vamos simular
      await onPrintSelected?.(activePrinter, printData)
      
      toast.success(`Enviando ${selectedAttendees.length} crachá(s) para impressão em ${activePrinter.name}`)
    } catch (error) {
      toast.error("Erro ao enviar para impressão")
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Gerenciar Impressoras</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {activePrinter && selectedAttendees.length > 0 && (
            <Button 
              onClick={handlePrintSelected}
              className="bg-green-600 hover:bg-green-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Selecionados ({selectedAttendees.length})
            </Button>
          )}
          
          {printers.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setPrinters([])
                setActivePrinter(null)
                localStorage.removeItem(PRINTERS_STORAGE_KEY)
                localStorage.removeItem(ACTIVE_PRINTER_STORAGE_KEY)
                onActivePrinterChange?.(null)
                toast.success("Todas as impressoras foram removidas!")
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Todas
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Impressora
          </Button>
        </div>
      </div>

      {/* Form para adicionar impressora */}
      {showAddForm && (
        <div className="mb-6 p-4 border rounded-lg bg-accent/50">
          <h4 className="font-medium mb-4">Nova Impressora</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="printer-name">Nome da Impressora</Label>
              <Input
                id="printer-name"
                placeholder="Ex: Impressora Recepção"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="printer-ip">Endereço IP</Label>
              <Input
                id="printer-ip"
                placeholder="Ex: 192.168.1.100"
                value={formData.ip}
                onChange={(e) => setFormData(prev => ({ ...prev, ip: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="printer-port">Porta</Label>
              <Input
                id="printer-port"
                placeholder="9100"
                value={formData.port}
                onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAddForm(false)}
            >
              Cancelar
            </Button>
            <Button onClick={addPrinter}>
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de impressoras */}
      {printers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma impressora configurada</p>
          <p className="text-sm">Adicione uma impressora para começar a imprimir crachás</p>
        </div>
      ) : (
        <div className="space-y-3">
          {printers.map((printer) => (
            <div
              key={printer.id}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                printer.isActive 
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
                  : "bg-background hover:bg-accent/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  printer.isActive 
                    ? "bg-green-100 dark:bg-green-900" 
                    : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  <Printer className={`h-5 w-5 ${
                    printer.isActive 
                      ? "text-green-600 dark:text-green-300" 
                      : "text-gray-600 dark:text-gray-300"
                  }`} />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{printer.name}</h4>
                    {printer.isActive && (
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativa
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {printer.ip}:{printer.port}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testPrinterConnection(printer)}
                  disabled={isTestingConnection === printer.id}
                >
                  {isTestingConnection === printer.id ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                      Testando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Testar
                    </div>
                  )}
                </Button>

                {!printer.isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActivePrinterHandler(printer)}
                  >
                    Ativar
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRemoveDialog(printer.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status da impressão */}
      {activePrinter && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">
              Impressora ativa: {activePrinter.name} ({activePrinter.ip}:{activePrinter.port})
            </span>
          </div>
          {selectedAttendees.length > 0 && (
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              {selectedAttendees.length} participante(s) selecionado(s) para impressão
            </p>
          )}
        </div>
      )}

      {/* Dialog de confirmação para remover */}
      <ConfirmDialog
        open={showRemoveDialog !== null}
        onOpenChange={() => setShowRemoveDialog(null)}
        title="Remover impressora"
        description={
          <>
            Tem certeza que deseja remover a impressora{" "}
            <strong>
              {showRemoveDialog ? printers.find(p => p.id === showRemoveDialog)?.name : ""}
            </strong>
            ?
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              Esta ação não pode ser desfeita e a impressora será removida permanentemente do localStorage.
            </span>
          </>
        }
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={() => showRemoveDialog && removePrinter(showRemoveDialog)}
        variant="destructive"
      />
    </Card>
  )
}