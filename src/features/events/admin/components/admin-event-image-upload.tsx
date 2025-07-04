"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { updateEventImage } from "../actions/update-event-image"

interface AdminEventImageUploadProps {
  eventId: string
  currentImageUrl?: string
  onImageUpdated?: (newImageUrl: string) => void
}

export function AdminEventImageUpload({ 
  eventId, 
  currentImageUrl, 
  onImageUpdated 
}: AdminEventImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validações
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.')
        return
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('Arquivo muito grande. O tamanho máximo permitido é 10MB.')
        return
      }

      setSelectedFile(file)
      
      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('image_file', selectedFile)

      await updateEventImage(eventId, {} as any, formData)
      
      setSelectedFile(null)
      setPreviewUrl(null)
      if (onImageUpdated && previewUrl) {
        onImageUpdated(previewUrl)
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const displayImageUrl = previewUrl || currentImageUrl

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Imagem do Evento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview da imagem */}
        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted border">
          {displayImageUrl ? (
            <Image
              src={displayImageUrl}
              alt="Preview da imagem do evento"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma imagem selecionada
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload de arquivo */}
        <div className="space-y-2">
          <Label htmlFor="image-upload">Selecionar nova imagem</Label>
          <div className="flex gap-2">
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="flex-1"
            />
            {selectedFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: JPG, PNG, GIF, WEBP. Tamanho máximo: 10MB.
          </p>
        </div>

        {/* Informações do arquivo selecionado */}
        {selectedFile && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                onClick={handleUpload}
                disabled={isLoading}
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isLoading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        )}

        {/* Informações sobre a imagem atual */}
        {currentImageUrl && !selectedFile && (
          <div className="text-xs text-muted-foreground">
            <p>Imagem atual carregada. Selecione uma nova imagem para substituir.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}