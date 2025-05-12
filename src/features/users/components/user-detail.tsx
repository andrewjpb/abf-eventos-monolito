// /features/users/components/user-detail.tsx
"use client"

import { UserWithDetails } from "../types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Power, Mail, Briefcase, CalendarDays, Shield, Building, Phone, MapPin, CreditCard } from "lucide-react"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { deleteUser } from "../actions/delete-user"
import { toggleUserStatus } from "../actions/toggle-user-status"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { userEditPath, usersPath } from "@/app/paths"
import { format } from "date-fns"

type UserDetailProps = {
  user: UserWithDetails
}

export function UserDetail({ user }: UserDetailProps) {
  const router = useRouter()

  // Verificar se o usuário tem uma role de admin
  const isAdmin = user.roles.some(role =>
    role.name.toLowerCase().includes('admin')
  )

  // Dialog para desativar/ativar usuário
  const [toggleButton, toggleDialog] = useConfirmDialog({
    action: toggleUserStatus.bind(null, user.id),
    title: user.active ? "Desativar Usuário" : "Ativar Usuário",
    description: user.active
      ? `Tem certeza que deseja desativar o usuário ${user.name}?`
      : `Tem certeza que deseja ativar o usuário ${user.name}?`,
    onSuccess: () => router.refresh(),
    trigger: (
      <Button variant={user.active ? "outline" : "default"} size="sm" className="h-9">
        <Power className="mr-2 h-4 w-4" />
        {user.active ? "Desativar" : "Ativar"}
      </Button>
    )
  })

  // Dialog para excluir usuário
  const [deleteButton, deleteDialog] = useConfirmDialog({
    action: deleteUser.bind(null, user.id),
    title: "Excluir Usuário",
    description: `Tem certeza que deseja excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`,
    onSuccess: () => router.push(usersPath()),
    trigger: (
      <Button variant="destructive" size="sm" className="h-9">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    )
  })

  return (
    <div className="space-y-8 mx-auto">
      {/* Cabeçalho do perfil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil e avatar */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src={user.image_url || undefined} alt={user.name} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {(!user.active || isAdmin) && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {!user.active && (
                      <Badge variant="destructive" className="h-6">Desativado</Badge>
                    )}
                    {isAdmin && (
                      <Badge className="h-6">Admin</Badge>
                    )}
                  </div>
                )}
              </div>

              <h1 className="text-xl font-bold mt-4">{user.name}</h1>

              {user.position && (
                <div className="flex items-center mt-1 text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 mr-1" />
                  <span>{user.position}</span>
                </div>
              )}

              <div className="flex items-center mt-1 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 mr-1" />
                <span>{user.email}</span>
              </div>

              <div className="flex items-center mt-1 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 mr-1" />
                <span>Desde {format(user.created_at, 'dd/MM/yyyy')}</span>
              </div>

              {/* Botões de ação */}
              <div className="grid grid-cols-3 gap-2 w-full mt-6">
                <Button asChild variant="default" size="sm" className="h-9 col-span-3">
                  <Link href={userEditPath(user.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar perfil
                  </Link>
                </Button>

                <div className="col-span-3 grid grid-cols-2 gap-2 w-full">
                  {toggleButton}
                  {deleteButton}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do usuário */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-primary" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">{user.company?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Segmento</p>
                  <p className="font-medium">{user.company?.segment}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{user.cnpj}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cargo</p>
                  <p className="font-medium">{user.position || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Permissões
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.roles && user.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map(role => (
                    <Badge key={role.id} variant="secondary" className="px-3 py-1.5 text-sm">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Este usuário não possui funções atribuídas.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-primary" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{user.cpf}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">RG</p>
                  <p className="font-medium">{user.rg}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-primary" />
                  <span className="mr-2">Contato</span>
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  <span>Localização</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{user.mobile_phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Localidade</p>
                  <p className="font-medium">{user.city} - {user.state}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs de detalhes */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="events" className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-2" />
            Eventos
          </TabsTrigger>
          {user.speakers && (
            <TabsTrigger value="speaker" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Perfil de Palestrante
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {!user.attendance_list || user.attendance_list.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">
                    Este usuário não participou de nenhum evento.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.attendance_list.map(attendance => (
                    <Card key={attendance.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between">
                          <div>
                            <h4 className="font-medium">{attendance.events.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(attendance.events.date), 'dd/MM/yyyy')}
                            </p>
                            <Badge variant="outline" className="mt-2">
                              {attendance.events.format}
                            </Badge>
                          </div>
                          <div className="mt-2 md:mt-0">
                            <Badge variant={attendance.checked_in ? "default" : "secondary"}>
                              {attendance.checked_in ? "Check-in realizado" : "Não compareceu"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user.speakers && (
          <TabsContent value="speaker" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Perfil de Palestrante</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Descrição</h3>
                    <p>{user.speakers.description || "Sem descrição disponível."}</p>
                  </div>

                  {/* Lista de eventos como palestrante poderia ser adicionada aqui */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Diálogos de confirmação */}
      {toggleDialog}
      {deleteDialog}
    </div>
  )
}