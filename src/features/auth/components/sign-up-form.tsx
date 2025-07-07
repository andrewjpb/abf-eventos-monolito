"use client"

import { useActionState, useState, useEffect } from "react"
import { FieldError } from "@/components/form/field-error"
import { Form } from "@/components/form/form"
import { SubmitButton } from "@/components/form/submit-button"
import { EMPTY_ACTION_STATE } from "@/components/form/utils/to-action-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Building, User, MapPin, FileText, Eye, EyeOff, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { checkCnpjExists } from "@/features/company/queries/check-cnpj-exists"
import { getCompanySegments } from "@/features/companies/queries/get-company-segments"
import { signUp } from "../actions/sign-up"
import Link from "next/link"

const SignUpForm = () => {
  const [actionState, formAction] = useActionState(signUp, EMPTY_ACTION_STATE)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [cnpjValue, setCnpjValue] = useState("")
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const [availableSegments, setAvailableSegments] = useState<string[]>([])
  const [isCheckingCnpj, setIsCheckingCnpj] = useState(false)
  const [showNewCompanyFields, setShowNewCompanyFields] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // Carregar segmentos disponíveis
  useEffect(() => {
    const loadSegments = async () => {
      try {
        const segments = await getCompanySegments()
        setAvailableSegments(segments)
      } catch (error) {
        console.error('Erro ao carregar segmentos:', error)
      }
    }
    loadSegments()
  }, [])

  // Verificar CNPJ quando o usuário parar de digitar
  useEffect(() => {
    const checkCnpj = async () => {
      if (cnpjValue.length >= 14) {
        setIsCheckingCnpj(true)
        try {
          const company = await checkCnpjExists(cnpjValue)
          setCompanyInfo(company)
          setShowNewCompanyFields(!company)
        } catch (error) {
          console.error('Erro ao verificar CNPJ:', error)
          setCompanyInfo(null)
          setShowNewCompanyFields(true)
        } finally {
          setIsCheckingCnpj(false)
        }
      } else {
        setCompanyInfo(null)
        setShowNewCompanyFields(false)
      }
    }

    const timeoutId = setTimeout(checkCnpj, 500)
    return () => clearTimeout(timeoutId)
  }, [cnpjValue])

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Criar Conta</h1>
        <p className="text-muted-foreground mt-2">Preencha todos os campos para se cadastrar</p>
      </div>

      <Form action={formAction} actionState={actionState}>
        <div className="space-y-8">
          {/* Dados Pessoais */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Dados Pessoais</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input id="name" name="name" placeholder="Seu nome completo" required />
                <FieldError actionState={actionState} name="name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário *</Label>
                <Input id="username" name="username" placeholder="username" required />
                <FieldError actionState={actionState} name="username" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
                <FieldError actionState={actionState} name="email" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile_phone">Telefone *</Label>
                <Input 
                  id="mobile_phone" 
                  name="mobile_phone" 
                  placeholder="(00) 00000-0000" 
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    e.target.value = formatted.slice(0, 15)
                  }}
                  required 
                />
                <FieldError actionState={actionState} name="mobile_phone" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input 
                  id="cpf" 
                  name="cpf" 
                  placeholder="000.000.000-00" 
                  onChange={(e) => {
                    const formatted = formatCpf(e.target.value)
                    e.target.value = formatted.slice(0, 14)
                  }}
                  required 
                />
                <FieldError actionState={actionState} name="cpf" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rg">RG *</Label>
                <Input id="rg" name="rg" placeholder="00.000.000-0" required />
                <FieldError actionState={actionState} name="rg" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Cargo *</Label>
                <Input id="position" name="position" placeholder="Seu cargo na empresa" required />
                <FieldError actionState={actionState} name="position" />
              </div>
            </div>
          </Card>

          {/* Dados de Endereço */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Endereço</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input id="city" name="city" placeholder="Sua cidade" required />
                <FieldError actionState={actionState} name="city" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input id="state" name="state" placeholder="UF" maxLength={2} required />
                <FieldError actionState={actionState} name="state" />
              </div>
            </div>
          </Card>

          {/* Dados da Empresa */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Dados da Empresa</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input 
                  id="cnpj" 
                  name="cnpj" 
                  placeholder="00.000.000/0000-00" 
                  value={cnpjValue}
                  onChange={(e) => {
                    const formatted = formatCnpj(e.target.value)
                    setCnpjValue(formatted.slice(0, 18))
                  }}
                  required 
                />
                <FieldError actionState={actionState} name="cnpj" />
                
                {isCheckingCnpj && (
                  <p className="text-sm text-muted-foreground">Verificando CNPJ...</p>
                )}
                
                {companyInfo && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">Empresa encontrada:</p>
                    <p className="text-sm text-green-700">{companyInfo.name}</p>
                    <p className="text-sm text-green-600">Segmento: {companyInfo.segment}</p>
                    <Badge variant="secondary" className="mt-1">Empresa cadastrada</Badge>
                  </div>
                )}
                
                {showNewCompanyFields && cnpjValue.length >= 14 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm font-medium text-yellow-800 mb-3">CNPJ não encontrado. Selecione o segmento da empresa:</p>
                    <div className="space-y-2">
                      <Label htmlFor="company_segment">Segmento da Empresa *</Label>
                      <Select name="company_segment" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o segmento" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSegments.map((segment) => (
                            <SelectItem key={segment} value={segment}>
                              {segment}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError actionState={actionState} name="company_segment" />
                    </div>
                    <Badge variant="outline" className="mt-2">Não associado</Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Dados de Acesso */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Dados de Acesso</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Sua senha" 
                    required 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <FieldError actionState={actionState} name="password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirme sua senha" 
                    required 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <FieldError actionState={actionState} name="confirmPassword" />
              </div>
            </div>
          </Card>

          {/* Termos e Condições */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Termos e Condições</h2>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aceito os termos e condições
                </label>
                <p className="text-xs text-muted-foreground">
                  Concordo com os{" "}
                  <Link href="/termos" className="underline hover:text-primary">
                    Termos de Uso
                  </Link>{" "}
                  e{" "}
                  <Link href="/privacidade" className="underline hover:text-primary">
                    Política de Privacidade
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Card>

          <Button 
            type="submit"
            size="lg" 
            className="w-full" 
            disabled={!acceptedTerms}
          >
            Criar Conta
          </Button>
        </div>
      </Form>
    </div>
  );
}

export { SignUpForm }
