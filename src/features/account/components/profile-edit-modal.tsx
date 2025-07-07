"use client"

import { UserWithDetails } from "@/features/users/types"
import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, Save, User, Phone, Mail, MapPin, Building, 
  CreditCard, Camera, Loader2, Check
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRef, useState as useReactState } from "react"
import { updateProfile } from "../actions/update-profile"
import { updateProfileImage } from "../actions/update-profile-image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ProfileEditModalProps = {
  user: UserWithDetails
  open: boolean
  onClose: () => void
}

export function ProfileEditModal({ user, open, onClose }: ProfileEditModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("personal")
  const [isPending, startTransition] = useTransition()
  
  // Estado para gerenciar todos os valores do formulário
  const [formData, setFormData] = useState({
    name: user.name || "",
    position: user.position || "",
    mobile_phone: user.mobile_phone || "",
    city: user.city || "",
    state: user.state || "",
  })
  
  // Image upload states
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useReactState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useReactState<string | null>(user.image_url)
  const [isUploadingImage, setIsUploadingImage] = useReactState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação básica
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, GIF ou WEBP")
      return
    }

    if (file.size > 1024 * 1024) { // 1MB
      toast.error("Imagem muito grande. Máximo: 1MB")
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = async () => {
    if (!selectedFile) return

    setIsUploadingImage(true)
    const formData = new FormData()
    formData.append("image_file", selectedFile)

    startTransition(async () => {
      try {
        const result = await updateProfileImage(null, formData)
        if (result && result.status === "SUCCESS") {
          toast.success("Foto atualizada com sucesso!")
          router.refresh()
          setSelectedFile(null)
        } else if (result && result.status === "ERROR") {
          toast.error(result.message || "Erro ao atualizar foto")
        }
      } catch (error) {
        toast.error("Erro ao atualizar foto")
      } finally {
        setIsUploadingImage(false)
      }
    })
  }

  const handleProfileUpdate = (htmlFormData: FormData) => {
    // Criar FormData com todos os valores do estado
    const submitFormData = new FormData()
    submitFormData.append("name", formData.name)
    submitFormData.append("position", formData.position)
    submitFormData.append("mobile_phone", formData.mobile_phone)
    submitFormData.append("city", formData.city)
    submitFormData.append("state", formData.state)
    
    startTransition(async () => {
      try {
        const result = await updateProfile(null, submitFormData)
        
        if (result && result.status === "SUCCESS") {
          toast.success("Perfil atualizado com sucesso!")
          router.refresh()
          onClose()
        } else if (result && result.status === "ERROR") {
          toast.error(result.message || "Erro ao atualizar perfil")
        }
      } catch (error) {
        toast.error("Erro ao atualizar perfil")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-background">
                <AvatarImage src={previewUrl || undefined} alt={user.name} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2"
              >
                <span className="text-sm text-muted-foreground">
                  {selectedFile.name}
                </span>
                <Button
                  size="sm"
                  onClick={handleImageUpload}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Form Tabs */}
          <form action={handleProfileUpdate}>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">
                  <User className="h-4 w-4 mr-2" />
                  Pessoal
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <Phone className="h-4 w-4 mr-2" />
                  Contato
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Documentos
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-6">
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Seu nome completo"
                        className="bg-background"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={user.email}
                          readOnly
                          disabled
                          className="pl-10 bg-muted cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="position">Cargo</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="position"
                          name="position"
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Seu cargo na empresa"
                          className="pl-10 bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="mobile_phone">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="mobile_phone"
                          name="mobile_phone"
                          value={formData.mobile_phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, mobile_phone: e.target.value }))}
                          placeholder="(00) 00000-0000"
                          className="pl-10 bg-background"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Sua cidade"
                          className="bg-background"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                          placeholder="UF"
                          maxLength={2}
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        name="cpf"
                        value={user.cpf}
                        readOnly
                        disabled
                        className="bg-muted font-mono cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">CPF não pode ser alterado</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        id="rg"
                        name="rg"
                        value={user.rg}
                        readOnly
                        disabled
                        className="bg-muted font-mono cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">RG não pode ser alterado</p>
                    </div>
                  </div>
                </TabsContent>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </Tabs>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}