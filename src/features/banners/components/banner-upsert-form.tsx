// /features/banners/components/banner-upsert-form.tsx
"use client"

import { FieldError } from "@/components/form/field-error"
import { Form } from "@/components/form/form"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useActionState } from "react"
import { upsertBanner } from "../actions/upsert-banner"
import { BannerWithDetails } from "../types"
import { useQueryClient } from "@tanstack/react-query"
import { LucideLoaderCircle, Save, Link as LinkIcon, Image as ImageIcon, Upload, X } from "lucide-react"
import clsx from "clsx"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"
import { useState, useRef } from "react"
import { toast } from "sonner"

type BannerUpsertFormProps = {
  banner?: BannerWithDetails
}

const BannerUpsertForm = ({ banner }: BannerUpsertFormProps) => {
  const [actionState, action, pending] = useActionState(
    upsertBanner.bind(null, banner?.id),
    EMPTY_ACTION_STATE
  )
  const queryClient = useQueryClient()

  // Estado para controlar a seleção do arquivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(banner?.image_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Função para lidar com a seleção de imagem
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validação do tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione um arquivo de imagem válido")
      return
    }

    // Validação do tamanho do arquivo (limite de 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB")
      return
    }

    // Salvar o arquivo no estado
    setSelectedFile(file)

    // Criar URL de previsualização
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Limpar URL de previsualização quando o componente for desmontado
    return () => URL.revokeObjectURL(objectUrl)
  }

  // Função para remover o arquivo selecionado
  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl && !banner?.image_url) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    } else {
      // Se tiver um banner existente, voltar para a imagem original
      setPreviewUrl(banner?.image_url || null)
    }

    // Limpar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Função para disparar o clique no input de arquivo
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Função para lidar com o submit do formulário
  const handleFormAction = async (formData: FormData) => {
    // Se tiver um arquivo selecionado, adicionar ao FormData
    if (selectedFile) {
      formData.append("image_file", selectedFile)
    }

    // Chamar a action original
    return action(formData)
  }

  return (
    <Form
      action={handleFormAction}
      actionState={actionState}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: ["banners"] })
      }}
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações do Banner</h3>
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Banner</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Título do banner"
                  defaultValue={banner?.title || ""}
                />
                <FieldError actionState={actionState} name="title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_link" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Link Externo
                </Label>
                <Input
                  id="external_link"
                  name="external_link"
                  placeholder="https://site-destino.com"
                  defaultValue={banner?.external_link || ""}
                />
                <FieldError actionState={actionState} name="external_link" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Ativo</Label>
                  <Switch
                    id="active"
                    name="active"
                    defaultChecked={banner ? banner.active : true}
                    value="true"
                  />
                </div>
                <FieldError actionState={actionState} name="active" />
                <p className="text-xs text-muted-foreground">
                  Banners inativos não serão exibidos no site.
                </p>
              </div>

              {/* Área de seleção de imagem */}
              <div className="space-y-2">
                <Label htmlFor="image_file">Imagem do Banner</Label>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="image_file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerFileInput}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {selectedFile ? 'Trocar Imagem' : 'Selecionar Imagem'}
                    </Button>

                    {selectedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remover
                      </Button>
                    )}

                    {selectedFile && (
                      <span className="text-sm text-muted-foreground">
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Campo oculto para a URL da imagem caso venha da edição */}
              <input
                type="hidden"
                name="image_url"
                defaultValue={banner?.image_url || ""}
              />
            </div>

            {/* Previsualização da imagem */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Pré-visualização
              </Label>
              <div className="overflow-hidden border rounded-md p-4 bg-muted/10">
                {previewUrl ? (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={previewUrl}
                      alt="Pré-visualização do banner"
                      fill
                      className="object-contain"
                      onError={() => setPreviewUrl(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center aspect-[16/9] w-full bg-muted/30">
                    <p className="text-muted-foreground text-center p-6">
                      Selecione uma imagem para visualizar
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Esta é uma prévia de como o banner será exibido.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-full"
        >
          {pending && (
            <LucideLoaderCircle className={clsx("w-4 h-4 mr-2 animate-spin")} />
          )}
          <Save className="mr-2 h-4 w-4" />
          {banner ? "Atualizar Banner" : "Cadastrar Banner"}
        </Button>
      </div>
    </Form>
  )
}

export { BannerUpsertForm }