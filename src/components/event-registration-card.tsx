"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, CheckCircle, AlertCircle, Calendar, X, Mail, ArrowLeft } from "lucide-react"
import { canUserRegister } from "@/features/attendance-list/actions/can-user-register"
import { registerAttendee } from "@/features/attendance-list/actions/register-attendee"
import { cancelRegistration } from "@/features/attendance-list/actions/cancel-registration"
import { sendOTPVerification } from "@/features/attendance-list/actions/send-otp-verification"
import { verifyOTP } from "@/features/attendance-list/actions/verify-otp"
import { toast } from "sonner"
import { EventWithDetails } from "@/features/events/types"
import Image from "next/image"
import { EMPTY_ACTION_STATE } from "./form/utils/to-action-state"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

interface EventRegistrationCardProps {
  event: EventWithDetails
  user?: any
  isRegistered?: boolean
  attendanceId?: string | null
  remainingVacancies: number
  companyRemainingVacancies?: number
  canRegister?: { canRegister: boolean; reason?: string } | null
}

type VerificationStep = 'initial' | 'otp-sent' | 'verified'

export function EventRegistrationCard({
  event,
  user,
  isRegistered = false,
  attendanceId,
  remainingVacancies,
  companyRemainingVacancies,
  canRegister = null
}: EventRegistrationCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isCanceling, setIsCanceling] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<{ canRegister: boolean; reason?: string } | null>(canRegister)
  const [mounted, setMounted] = useState(false)
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('initial')
  const [otpValue, setOtpValue] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingOTP, setIsSendingOTP] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSendOTP = async () => {
    if (!user) return
    
    setIsSendingOTP(true)
    try {
      const result = await sendOTPVerification()
      
      if (result.status === 'SUCCESS') {
        if (result.emailVerified) {
          // Email já verificado, pode prosseguir com a inscrição
          await proceedWithRegistration()
        } else {
          setVerificationStep('otp-sent')
          toast.success(result.message)
        }
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Erro ao enviar código de verificação')
    } finally {
      setIsSendingOTP(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length !== 6) {
      toast.error('Digite o código completo')
      return
    }
    
    setIsVerifying(true)
    try {
      const result = await verifyOTP(otpValue)
      
      if (result.status === 'SUCCESS') {
        setVerificationStep('verified')
        toast.success(result.message)
        // Prosseguir com a inscrição após verificação
        setTimeout(() => {
          proceedWithRegistration()
        }, 1000)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Erro ao verificar código')
    } finally {
      setIsVerifying(false)
    }
  }

  const proceedWithRegistration = async () => {

    startTransition(async () => {
      try {
        // Verificar se pode se inscrever antes de tentar
        if (!registrationStatus) {
          const result = await canUserRegister(event.id)
          const canRegisterResult = {
            canRegister: result.canRegister,
            reason: result.message
          }
          setRegistrationStatus(canRegisterResult)

          if (!canRegisterResult.canRegister) {
            if (typeof window !== 'undefined') {
              toast.error(canRegisterResult.reason || "Não é possível se inscrever neste evento")
            }
            return
          }
        }

        // Remover formatação do CPF (manter CNPJ com formatação)
        const cleanCPF = user.cpf ? user.cpf.replace(/[.-]/g, '') : ''
        const companyCNPJ = user.companyId || ''

        // Buscar o segmento da empresa
        const companySegment = user.company?.segment || "Não informado"

        const formData = new FormData()
        formData.append("eventId", event.id)
        formData.append("userId", user.id)
        formData.append("company_cnpj", companyCNPJ)
        formData.append("company_segment", companySegment)
        formData.append("attendee_full_name", user.username || "")
        formData.append("attendee_email", user.email || "")
        formData.append("attendee_position", user.position || "")
        formData.append("attendee_rg", user.rg || "")
        formData.append("attendee_cpf", cleanCPF)
        formData.append("mobile_phone", user.mobilePhone || "")
        formData.append("attendee_type", "REGISTERED")

        const result = await registerAttendee(EMPTY_ACTION_STATE, formData)

        if (result.status === "SUCCESS") {
          if (typeof window !== 'undefined') {
            toast.success("Presença confirmada com sucesso!")
            // Recarregar a página para atualizar o status
            window.location.reload()
          }
        } else {
          if (typeof window !== 'undefined') {
            toast.error(result.message || "Erro ao confirmar presença")
          }
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          toast.error("Erro interno do servidor")
        }
      }
    })
  }

  const handleRegister = () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        toast.error("Você precisa estar logado para se inscrever")
      }
      return
    }

    console.log("User data:", user)
    console.log("Email verified:", user.email_verified)

    // Verificar se o email está verificado
    if (user.email_verified === false) {
      console.log("Email not verified, sending OTP")
      handleSendOTP()
    } else {
      console.log("Email verified, proceeding with registration")
      proceedWithRegistration()
    }
  }

  const handleCancel = () => {
    if (!attendanceId) {
      if (typeof window !== 'undefined') {
        toast.error("ID da inscrição não encontrado")
      }
      return
    }

    setIsCanceling(true)
    
    startTransition(async () => {
      try {
        const result = await cancelRegistration(attendanceId)

        if (result.status === "SUCCESS") {
          if (typeof window !== 'undefined') {
            toast.success(result.message || "Inscrição cancelada com sucesso!")
            // Recarregar a página para atualizar o status
            window.location.reload()
          }
        } else {
          if (typeof window !== 'undefined') {
            toast.error(result.message || "Erro ao cancelar inscrição")
          }
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          toast.error("Erro interno do servidor")
        }
      } finally {
        setIsCanceling(false)
      }
    })
  }

  // Evitar renderização no servidor
  if (!mounted) {
    return (
      <Card className="w-full border-0 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se o usuário não está logado
  if (!user) {
    return (
      <Card className="w-full border-0 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Confirme sua presença
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Faça login para participar
              </p>
            </div>
          </div>
          <Button
            className="w-full mt-3 h-9 text-sm"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/sign-in'
              }
            }}
          >
            Fazer Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Se já está registrado
  if (isRegistered) {
    return (
      <Card className="w-full border-0 shadow-sm bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Foto do usuário */}
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {user?.picture ? (
                <Image
                  src={user.picture}
                  alt={user.username || "Usuário"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <span className="text-green-700 dark:text-green-300 font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </div>

            {/* Nome e empresa */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                {user?.username || "Usuário"}
              </h3>
              {user?.company && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user.company.name}
                </p>
              )}
            </div>

            {/* Status */}
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Inscrito
            </Badge>
          </div>

          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Sua presença já está confirmada
              </p>
              {mounted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isCanceling || isPending}
                  className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                >
                  {isCanceling ? (
                    <>
                      <div className="w-3 h-3 border-2 border-red-700 border-t-transparent rounded-full animate-spin mr-1" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se não pode se inscrever
  if (registrationStatus && !registrationStatus.canRegister) {
    return (
      <Card className="w-full border-0 shadow-sm bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Inscrições indisponíveis
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {registrationStatus.reason || "Não é possível se inscrever"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Pode se inscrever
  const displayVacancies = companyRemainingVacancies !== undefined ? companyRemainingVacancies : remainingVacancies

  // Se está no processo de verificação OTP
  if (verificationStep === 'otp-sent') {
    return (
      <Card className="w-full border-0 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header com ícone e título */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  Verificação de Email
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Digite o código enviado para {user?.email}
                </p>
              </div>
            </div>

            {/* Input OTP */}
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={(value) => setOtpValue(value)}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVerificationStep('initial')
                  setOtpValue('')
                }}
                disabled={isVerifying}
                className="flex-1"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Voltar
              </Button>
              <Button
                size="sm"
                onClick={handleVerifyOTP}
                disabled={isVerifying || otpValue.length !== 6}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                onClick={handleSendOTP}
                disabled={isSendingOTP}
                className="text-xs"
              >
                {isSendingOTP ? 'Enviando...' : 'Reenviar código'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se o email foi verificado com sucesso
  if (verificationStep === 'verified') {
    return (
      <Card className="w-full border-0 shadow-sm bg-green-50 dark:bg-green-900/20 dark:border dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Email verificado!
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Confirmando sua presença...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full border-0 shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header com foto e informações do usuário */}
          <div className="flex items-center gap-3">
            {/* Foto do usuário */}
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {user?.picture ? (
                <Image
                  src={user.picture}
                  alt={user.username || "Usuário"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </div>

            {/* Nome e empresa */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight">
                {user?.username || "Usuário"}
              </h3>
              {user?.company && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user.company.name}
                </p>
              )}
            </div>

            {/* Badge de vagas */}
            <div className="text-right">
              <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs">
                {displayVacancies} {displayVacancies === 1 ? 'vaga' : 'vagas'}
              </Badge>
            </div>
          </div>

          {/* Botão de confirmação */}
          <Button
            className="w-full h-9 text-sm"
            onClick={handleRegister}
            disabled={isPending || isSendingOTP}
          >
            {isPending || isSendingOTP ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isSendingOTP ? 'Enviando código...' : 'Confirmando...'}
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Confirmar Presença
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}