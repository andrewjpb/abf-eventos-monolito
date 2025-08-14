"use client"

import { useState } from "react"
import { User, Building, Briefcase, Printer, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatNameForPrint } from "./printer-management"
import { useClientPrinter, type PrinterData } from "../utils/client-printer"

type ManualPrintModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activePrinter: any
}

export function ManualPrintModal({ open, onOpenChange, activePrinter }: ManualPrintModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    position: ""
  })
  const [isPrinting, setIsPrinting] = useState(false)
  
  const { printBadges } = useClientPrinter()

  const handleClearFields = () => {
    setFormData({
      name: "",
      company: "",
      position: ""
    })
    toast.info("Campos limpos")
  }

  const handlePrint = async () => {
    // Validações
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    if (!formData.company.trim()) {
      toast.error("Empresa é obrigatória")
      return
    }

    if (!activePrinter) {
      toast.error("Nenhuma impressora ativa configurada")
      return
    }

    setIsPrinting(true)

    try {
      // Preparar dados para impressão
      // Gerar um QR code genérico para impressão manual
      const qrContent = `MANUAL|NAME:${formData.name}|COMPANY:${formData.company}|DATE:${new Date().toISOString()}`
      
      const printData: PrinterData[] = [{
        qr: qrContent,
        name: formatNameForPrint(formData.name),
        company: formData.company,
        position: formData.position || "Não informado"
      }]

      console.log('===== IMPRESSÃO MANUAL =====')
      console.log('Dados do formulário:', formData)
      console.log('Dados formatados:', printData)

      // Enviar para impressão
      const success = await printBadges(activePrinter, printData)
      
      if (success) {
        toast.success(`Crachá de ${formatNameForPrint(formData.name)} enviado para impressão`)
        
        // Limpar campos após sucesso
        handleClearFields()
        
        // Fechar modal após pequeno delay
        setTimeout(() => {
          onOpenChange(false)
        }, 1000)
      } else {
        toast.error(`Falha na comunicação com ${activePrinter.ip}:${activePrinter.port}`)
      }
    } catch (error) {
      console.error("Erro ao imprimir crachá manual:", error)
      toast.error("Erro ao imprimir crachá")
    } finally {
      setIsPrinting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPrinting) {
      handlePrint()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Impressão Manual de Crachá
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para imprimir um crachá manualmente.
            {activePrinter ? (
              <span className="block mt-2 text-green-600 dark:text-green-400 font-medium">
                Impressora ativa: {activePrinter.name} ({activePrinter.ip}:{activePrinter.port})
              </span>
            ) : (
              <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                Nenhuma impressora ativa configurada
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campo Nome */}
          <div className="space-y-2">
            <Label htmlFor="manual-name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome Completo
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="manual-name"
              placeholder="Ex: João da Silva"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              onKeyPress={handleKeyPress}
              disabled={isPrinting}
              autoFocus
            />
          </div>

          {/* Campo Empresa */}
          <div className="space-y-2">
            <Label htmlFor="manual-company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Empresa
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="manual-company"
              placeholder="Ex: Empresa ABC Ltda"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              onKeyPress={handleKeyPress}
              disabled={isPrinting}
            />
          </div>

          {/* Campo Cargo (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="manual-position" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Cargo
              <span className="text-muted-foreground text-sm ml-1">(Opcional)</span>
            </Label>
            <Input
              id="manual-position"
              placeholder="Ex: Diretor Comercial"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              onKeyPress={handleKeyPress}
              disabled={isPrinting}
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleClearFields}
            disabled={isPrinting}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar Campos
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPrinting}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handlePrint}
              disabled={isPrinting || !activePrinter || !formData.name.trim() || !formData.company.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {isPrinting ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border border-white border-t-transparent" />
                  Imprimindo...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Enviar para Impressão
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}