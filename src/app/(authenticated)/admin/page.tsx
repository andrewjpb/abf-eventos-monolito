// app/admin/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";
import {
  Users,
  Calendar,
  Building,
  Award,
  Briefcase,
  ExternalLink,
  Mic,
  Settings,
  Shield
} from "lucide-react";
import Link from "next/link";
import {
  usersPath,
  eventsAdminPath,
  companiesPath,
  sponsorsPath,
  supportersPath,
  externalEventsPath,
  speakersPath,
  highlightCardsPath,
  logsPath
} from "@/app/paths";

export const metadata: Metadata = {
  title: "Dashboard | Painel Administrativo",
  description: "Painel de controle administrativo da plataforma",
};

export default function AdminPage() {
  return (
    <div className=" p-6">
      <h1 className="text-2xl font-bold mb-2">Painel Administrativo</h1>
      <p className="text-muted-foreground mb-6">Gerencie todos os aspectos da plataforma.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href={usersPath()}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gerencie os usuários da plataforma e suas permissões
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        {/* Eventos */}
        <Link href={eventsAdminPath()}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Crie e gerencie eventos, datas, locais e inscrições
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        {/* Empresas */}
        <Link href={companiesPath()}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Cadastre e administre empresas parceiras e participantes
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        {/* Patrocinadores */}
        <Link href={sponsorsPath()}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patrocinadores</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gerencie os patrocinadores e suas associações com eventos
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        {/* Apoiadores */}
        <Link href={supportersPath()}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Apoiadores</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Administre os apoiadores de eventos e iniciativas
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        {/* Eventos Externos */}
        <Link href={externalEventsPath()}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Externos</CardTitle>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Publicite eventos externos relevantes para os usuários
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        {/* Palestrantes */}
        <Link href={speakersPath()}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Palestrantes</CardTitle>
              <Mic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gerencie os palestrantes para eventos e conferências
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        {/* Destaques */}
        <Link href={highlightCardsPath()}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Destaques</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Configure os destaques e banners da página inicial
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        {/* Logs do Sistema */}
        <Link href={logsPath()}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logs do Sistema</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualize logs de atividades e alterações no sistema
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}