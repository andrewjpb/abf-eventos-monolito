"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { LucideLoaderCircle, Upload, Camera, RefreshCw, XCircle, AlertCircle } from "lucide-react"
import { updateSpeakerImage } from "../actions/update-speaker-image"
import Image from "next/image"
import { useActionState } from "react"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Form } from "@/components/form/form"
import { FieldError } from "@/components/form/field-error"
import { useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
import { toast } from "sonner"

// Definindo o limite de tamanho da imagem (1MB)
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB em bytes

interface SpeakerImageUploadProps {
  speakerId: string
  currentImageUrl: string | null
  userName: string
}

export function SpeakerImageUpload({ speakerId, currentImageUrl, userName }: SpeakerImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFileTooLarge, setIsFileTooLarge] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [actionState, action, pending] = useActionState(
    updateSpeakerImage.bind(null, speakerId),
    EMPTY_ACTION_STATE
  )
  const queryClient = useQueryClient()

  // Lidar com a seleção de arquivo com validação básica
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação client-side para evitar envio desnecessário
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato de arquivo inválido. Apenas JPG, PNG, GIF e WEBP são aceitos.")
      return
    }

    // Verificar o tamanho do arquivo
    const isTooLarge = file.size > MAX_FILE_SIZE
    setIsFileTooLarge(isTooLarge)

    // Configurar o arquivo selecionado
    setSelectedFile(file)

    // Criar preview independentemente do tamanho
    // (assim o usuário vê a imagem que tentou selecionar)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)

    // Exibir toast se o arquivo for grande demais
    if (isTooLarge) {
      toast.error("Arquivo muito grande. O tamanho máximo permitido é 1MB.")
    }
  }

  // Abrir o seletor de arquivo
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Cancelar seleção
  const handleCancel = () => {
    setPreviewUrl(currentImageUrl)
    setSelectedFile(null)
    setIsFileTooLarge(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Manipular submissão com tratamento de erros aprimorado
  const handleSubmit = async (formData: FormData) => {
    if (!selectedFile || isFileTooLarge) return

    try {
      setIsSubmitting(true)

      // Certifique-se de que o FormData tenha o arquivo correto
      formData.delete("image_file")
      formData.append("image_file", selectedFile)

      // A action é chamada pelo Form automaticamente
      const result = await action(formData)

      return result
    } catch (error) {
      console.error("Erro ao enviar imagem:", error)
      // Usar toast diretamente em caso de erro no try/catch
      toast.error("Erro ao enviar a imagem. Por favor, tente novamente.")
      return EMPTY_ACTION_STATE
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handler para erros graves
  const handleFormError = (errorState: any) => {
    console.error("Erro no formulário:", errorState)
  }

  // Formatar o tamanho do arquivo de forma legível
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Imagem do Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form
          action={handleSubmit}
          actionState={actionState}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["speakers"] })
            setSelectedFile(null)
            setIsFileTooLarge(false)
          }}
          onError={handleFormError}
        >
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="hidden"
              id="image-upload"
            />

            {/* Visualização da imagem */}
            <div className="flex flex-col items-center justify-center p-2">
              <div className={clsx(
                "relative w-32 h-32 mb-3 rounded-full overflow-hidden border-2",
                isFileTooLarge
                  ? "border-destructive/60"
                  : "border-primary/30"
              )}>
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={userName}
                    width={128}
                    height={128}
                    className={clsx(
                      "object-cover w-full h-full",
                      isFileTooLarge && "opacity-70"
                    )}
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Camera className="h-12 w-12 text-muted-foreground opacity-40" />
                  </div>
                )}

                {/* Indicador visual para imagens grandes demais */}
                {isFileTooLarge && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground text-center mb-2">
                {selectedFile
                  ? `Arquivo selecionado: ${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                  : "Selecione uma imagem para o perfil do usuário"}
              </p>

              {/* Botões de ação */}
              <div className="flex gap-2 justify-center mt-2">
                <Button
                  type="button"
                  onClick={triggerFileInput}
                  variant="outline"
                  size="sm"
                  disabled={pending || isSubmitting}
                >
                  {selectedFile ? (
                    <>
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Trocar
                    </>
                  ) : (
                    <>
                      <Camera className="mr-1 h-4 w-4" />
                      Selecionar
                    </>
                  )}
                </Button>

                {selectedFile && (
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                    disabled={pending || isSubmitting}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            {/* Mostrar erros de campo */}
            <FieldError actionState={actionState} name="image_file" />

            {/* Alerta de tamanho máximo excedido */}
            {isFileTooLarge && selectedFile && (
              <div className="w-full p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Imagem maior que o permitido (1MB)</p>
                  <p className="text-xs">Tamanho atual: {formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            )}

            {/* Botão de atualizar somente se o arquivo não for grande demais */}
            {selectedFile && !isFileTooLarge && (
              <Button
                type="submit"
                className="w-full"
                disabled={pending || isSubmitting || !selectedFile}
              >
                {(pending || isSubmitting) && (
                  <LucideLoaderCircle className={clsx("w-4 h-4 mr-2 animate-spin")} />
                )}
                <Upload className="mr-2 h-4 w-4" />
                Atualizar Imagem
              </Button>
            )}
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}