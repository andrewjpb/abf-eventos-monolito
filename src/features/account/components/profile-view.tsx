"use client"

import { UserWithDetails } from "@/features/users/types"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  User, Mail, Phone, MapPin, Building, Briefcase, Calendar, 
  Edit2, Camera, Shield, CreditCard, Activity, ChevronRight,
  Globe, Linkedin, Instagram, Twitter
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ProfileEditModal } from "./profile-edit-modal"
import { ProfileAvatarUpload } from "./profile-avatar-upload"
import { cn } from "@/lib/utils"
import { formatEventType, getEventTypeVariant } from "../utils/format-event-type"

type ProfileViewProps = {
  user: UserWithDetails
  currentUserId: string
}

export function ProfileView({ user, currentUserId }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <>
      <div className="relative">
        {/* Hero Section com Gradiente */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        {/* Conteúdo Principal */}
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32 relative z-10">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={stagger}
            className="space-y-6"
          >
            {/* Card do Perfil */}
            <motion.div variants={fadeIn}>
              <Card className="overflow-hidden border-0 shadow-xl bg-card/95 backdrop-blur">
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Avatar e Info Básica */}
                    <div className="flex flex-col items-center md:items-start gap-4">
                      <ProfileAvatarUpload 
                        user={{ 
                          id: user.id, 
                          name: user.name, 
                          image_url: user.image_url 
                        }} 
                        size="lg"
                      />
                    </div>

                    {/* Informações do Usuário */}
                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                          {user.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">@{user.username}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {user.position && (
                          <Badge variant="secondary" className="gap-1">
                            <Briefcase className="h-3 w-3" />
                            {user.position}
                          </Badge>
                        )}
                        {user.company && (
                          <Badge variant="secondary" className="gap-1">
                            <Building className="h-3 w-3" />
                            {user.company.name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          Desde {format(user.created_at, "MMM yyyy", { locale: ptBR })}
                        </Badge>
                      </div>

                      <Button
                        onClick={() => setIsEditing(true)}
                        className="w-full md:w-auto"
                        size="lg"
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar Perfil
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Tabs de Navegação */}
            <motion.div variants={fadeIn}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="overview" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Visão Geral</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Eventos Participados</span>
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* Tab: Visão Geral */}
                    <TabsContent value="overview" className="space-y-6 mt-6">
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Card de Contato */}
                        <motion.div variants={fadeIn}>
                          <Card className="h-full hover:shadow-lg transition-shadow">
                            <div className="p-6 space-y-4">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Phone className="h-5 w-5 text-primary" />
                                Contato
                              </h3>
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{user.mobile_phone || "Não informado"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {user.city && user.state ? `${user.city}, ${user.state}` : "Não informado"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>

                        {/* Card de Empresa */}
                        <motion.div variants={fadeIn}>
                          <Card className="h-full hover:shadow-lg transition-shadow">
                            <div className="p-6 space-y-4">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Building className="h-5 w-5 text-primary" />
                                Empresa
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-muted-foreground">Nome</p>
                                  <p className="font-medium">{user.company?.name || "Não informado"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Segmento</p>
                                  <p className="font-medium">{user.company?.segment || "Não informado"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">CNPJ</p>
                                  <p className="font-medium font-mono text-sm">{user.cnpj || "Não informado"}</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>

                        {/* Card de Documentos */}
                        <motion.div variants={fadeIn}>
                          <Card className="h-full hover:shadow-lg transition-shadow">
                            <div className="p-6 space-y-4">
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Documentos
                              </h3>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-muted-foreground">CPF</p>
                                  <p className="font-medium font-mono">{user.cpf || "Não informado"}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">RG</p>
                                  <p className="font-medium font-mono">{user.rg || "Não informado"}</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      </div>
                    </TabsContent>

                    {/* Tab: Eventos Participados */}
                    <TabsContent value="activity" className="space-y-6 mt-6">
                      <Card>
                        <div className="p-6">
                          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Eventos Participados
                          </h3>
                          
                          {!user.attendance_list || user.attendance_list.length === 0 ? (
                            <div className="text-center py-12">
                              <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                              <p className="text-muted-foreground">Você ainda não participou de nenhum evento</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {user.attendance_list.map((attendance) => (
                                <div
                                  key={attendance.id}
                                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "h-2 w-2 rounded-full",
                                      attendance.checked_in ? "bg-green-500" : "bg-muted-foreground"
                                    )} />
                                    <div>
                                      <p className="font-medium">{attendance.events.title}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(attendance.events.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={getEventTypeVariant(attendance.events.format)}>
                                      {formatEventType(attendance.events.format)}
                                    </Badge>
                                    {attendance.checked_in && (
                                      <Badge variant="outline" className="text-green-600">
                                        Check-in realizado
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Modal de Edição */}
      <ProfileEditModal
        user={user}
        open={isEditing}
        onClose={() => setIsEditing(false)}
      />
    </>
  )
}