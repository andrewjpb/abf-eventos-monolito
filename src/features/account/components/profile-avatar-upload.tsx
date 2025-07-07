"use client"

import { useState, useRef, useTransition } from "react"
import { Camera, Upload, X, Check, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { updateProfileImage } from "../actions/update-profile-image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

type ProfileAvatarUploadProps = {
  user: {
    id: string
    name: string
    image_url?: string | null
  }
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ProfileAvatarUpload({ user, size = "lg", className }: ProfileAvatarUploadProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.image_url)
  const [isPending, startTransition] = useTransition()

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24", 
    lg: "h-32 w-32 md:h-40 md:w-40"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-4 w-4"
  }

  const buttonSizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação
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
    
    // Criar preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append("image_file", selectedFile)

    startTransition(async () => {
      try {
        const result = await updateProfileImage(null, formData)
        if (result && result.status === "SUCCESS") {
          toast.success("Foto atualizada!")
          router.refresh()
          setSelectedFile(null)
        } else if (result && result.status === "ERROR") {
          toast.error(result.message || "Erro ao atualizar foto")
          // Reverter preview
          setPreviewUrl(user.image_url)
          setSelectedFile(null)
        }
      } catch (error) {
        toast.error("Erro ao atualizar foto")
        setPreviewUrl(user.image_url)
        setSelectedFile(null)
      }
    })
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(user.image_url)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Avatar with hover effect */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
        <Avatar className={cn(sizeClasses[size], "relative ring-4 ring-background")}>
          <AvatarImage src={previewUrl || undefined} alt={user.name} />
          <AvatarFallback className={cn(
            "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
            size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-4xl"
          )}>
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Camera button - always visible on hover */}
        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "absolute bottom-0 right-0 rounded-full shadow-lg transition-opacity",
            buttonSizes[size],
            selectedFile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          <Camera className={iconSizes[size]} />
        </Button>
      </div>

      {/* Upload controls - appear when file is selected */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 flex items-center gap-2 bg-background/95 backdrop-blur border rounded-lg p-2 shadow-lg z-10"
          >
            <span className="text-xs text-muted-foreground px-2 max-w-32 truncate">
              {selectedFile.name}
            </span>
            
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isPending}
              className="h-8 px-3"
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="h-8 px-3"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}