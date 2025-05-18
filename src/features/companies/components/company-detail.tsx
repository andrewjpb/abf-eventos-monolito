// /features/companies/components/company-detail.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, ExternalLink, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { companyEditPath, userPath } from "@/app/paths"
import { CompanyDetailProps } from "../types"
import { useConfirmDialog } from "@/components/confirm-dialog"
import { deleteCompany } from "../actions/delete-company"
import { toggleCompanyStatus } from "../actions/toggle-company-status"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"

// Função para formatar CNPJ com máscara
const formatarCNPJ = (cnpj: string) => {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function CompanyDetail({ company }: CompanyDetailProps) {
  const hasUsers = company.users && company.users.length > 0
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)

  // Dialog para excluir empresa
  const [deleteButton, deleteDialog] = useConfirmDialog({
    action: deleteCompany.bind(null, company.id),
    title: "Excluir Empresa",
    description: `Tem certeza que deseja excluir a empresa ${company.name}? Esta ação não pode ser desfeita.`,
    trigger: (
      <Button variant="destructive" size="sm">
        <Trash2 className="mr-2 h-4 w-4" />
        Excluir
      </Button>
    )
  })


  return (
    <div className="space-y-8">
      {/* Ações */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={companyEditPath(company.id)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Empresa
          </Link>
        </Button>

        <Button
          variant={company.active ? "default" : "secondary"}
          size="sm"
          onClick={() => toggleCompanyStatus(company.id)}
          disabled={isTogglingStatus}
        >
          {company.active ? (
            <>
              <ToggleLeft className="h-4 w-4 mr-2" />
              Desassociar
            </>
          ) : (
            <>
              <ToggleRight className="h-4 w-4 mr-2" />
              Associar
            </>
          )}
        </Button>

        {deleteButton}
      </div>

      {/* Informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Detalhes da Empresa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-primary" />
              Informações da empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">ID da Empresa</p>
                <p className="font-medium">{company.id}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{company.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="font-medium">{formatarCNPJ(company.cnpj)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Segmento</p>
                <p className="font-medium">{company.segment}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={company.active ? "default" : "outline"}
                    className={company.active ? "bg-primary/10 text-primary" : "bg-muted"}
                  >
                    {company.active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                <p className="font-medium">
                  {new Date(company.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usuários da Empresa */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Usuários da empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasUsers ? (
              <div className="space-y-4">
                {company?.users?.map((user) => (
                  <div key={user.id} className="border rounded-md p-3 hover:bg-muted/20 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        {user.position && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {user.position}
                          </p>
                        )}
                      </div>
                      <Link href={userPath(user.id)} className="flex-shrink-0">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Esta empresa não possui usuários
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação */}
      {deleteDialog}
    </div>
  )
}