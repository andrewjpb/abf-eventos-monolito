// /features/banners/components/banner-uploader.tsx
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, X, LucideLoaderCircle } from "lucide-react"
import { uploadBannerImage } from "./upload-banner-image"

interface BannerUploaderProps {
  onImageUploaded?: (imageUrl: string) => void
}

export function BannerUploader({ onImageUploaded }: BannerUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validar tipo de arquivo (imagens apenas)
    if (!selectedFile.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem")
      return
    }

    // Validar tamanho (5MB máximo)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB")
      return
    }

    setFile(selectedFile)

    // Criar URL de pré-visualização
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
  }

  const handleRemoveFile = () => {
    setFile(null)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione uma imagem para fazer upload")
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadBannerImage(formData)

      if (result.success) {
        toast.success("Imagem enviada com sucesso")

        // Se houver callback, chamar com a URL da imagem
        if (onImageUploaded) {
          onImageUploaded(result.fileUrl || "")
        }

        // Limpar após upload bem-sucedido
        handleRemoveFile()
      } else {
        toast.error(result.error || "Erro ao fazer upload da imagem")
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error)
      toast.error("Ocorreu um erro ao fazer upload da imagem")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Imagem
              </Button>

              {file && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isLoading}
                    className="text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>

                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={isLoading}
                    size="sm"
                  >
                    {isLoading ? (
                      <LucideLoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Fazer Upload
                  </Button>
                </>
              )}
            </div>

            {file && (
              <div className="text-sm text-muted-foreground">
                {file.name} ({Math.round(file.size / 1024)} KB)
              </div>
            )}
          </div>

          {/* Pré-visualização da imagem */}
          {previewUrl && (
            <div className="mt-2 p-2 border rounded">
              <p className="text-xs text-muted-foreground mb-2">
                Pré-visualização:
              </p>
              <div className="relative w-full aspect-[16/9] max-h-[200px]">
                <img
                  src={previewUrl}
                  alt="Pré-visualização"
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}