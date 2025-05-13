// /features/supporters/components/supporter-upsert-form.tsx
"use client"

import { FieldError } from "@/components/form/field-error"
import { Form } from "@/components/form/form"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useActionState } from "react"
import { upsertSupporter } from "../actions/upsert-supporter"
import { SupporterWithEvents } from "../types"
import { useQueryClient } from "@tanstack/react-query"
import { LucideLoaderCircle, Save, Upload, X } from "lucide-react"
import clsx from "clsx"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"
import { useState, useRef } from "react"
import { toast } from "sonner"

type SupporterUpsertFormProps = {
  supporter?: SupporterWithEvents
}

const SupporterUpsertForm = ({ supporter }: SupporterUpsertFormProps) => {
  const [actionState, action, pending] = useActionState(
    upsertSupporter.bind(null, supporter?.id),
    EMPTY_ACTION_STATE
  )
  const queryClient = useQueryClient()

  // Estado para controlar a seleção do arquivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(supporter?.image_url || null)
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
    if (previewUrl && !supporter?.image_url) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    } else {
      // Se tiver um apoiador existente, voltar para a imagem original
      setPreviewUrl(supporter?.image_url || null)
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
        queryClient.invalidateQueries({ queryKey: ["supporters"] })
      }}
    >
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Informações do Apoiador</h3>
        <Separator />

        <div className="space-y-2">
          <Label htmlFor="name">Nome do Apoiador</Label>
          <Input
            id="name"
            name="name"
            placeholder="Nome do apoiador"
            defaultValue={supporter?.name || ""}
          />
          <FieldError actionState={actionState} name="name" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Ativo</Label>
            <Switch
              id="active"
              name="active"
              defaultChecked={supporter ? supporter.active : true}
              value="true"
            />
          </div>
          <FieldError actionState={actionState} name="active" />
        </div>

        {/* Área de seleção de imagem */}
        <div className="space-y-2">
          <Label htmlFor="image_file">Imagem do Apoiador</Label>

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

            {/* Previsualização da imagem */}
            {previewUrl && (
              <div className="mt-2 p-2 border rounded">
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedFile ? 'Previsualização:' : 'Imagem atual:'}
                </p>
                <Image
                  src={previewUrl}
                  alt="Imagem do apoiador"
                  width={200}
                  height={100}
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Campos ocultos para manter compatibilidade com o banco de dados */}
        <input
          type="hidden"
          name="image_path"
          defaultValue={supporter?.image_path || ""}
        />
        <input
          type="hidden"
          name="thumb_path"
          defaultValue={supporter?.thumb_path || ""}
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full mt-6"
      >
        {pending && (
          <LucideLoaderCircle className={clsx("w-4 h-4 mr-2 animate-spin")} />
        )}
        <Save className="mr-2 h-4 w-4" />
        {supporter ? "Atualizar Apoiador" : "Cadastrar Apoiador"}
      </Button>
    </Form>
  )
}

export { SupporterUpsertForm }