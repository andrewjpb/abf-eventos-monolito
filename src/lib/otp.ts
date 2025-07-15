import { prisma } from "@/lib/prisma"
import { resend } from "@/lib/resend"
import { randomInt } from "crypto"

export class OTPManager {
  private static readonly OTP_LENGTH = 6
  private static readonly DEFAULT_EXPIRY_MINUTES = 10

  /**
   * Gera um código OTP de 6 dígitos
   */
  private static generateCode(): string {
    return randomInt(100000, 999999).toString()
  }

  /**
   * Cria e salva um código OTP
   */
  static async createOTP(params: {
    identifier: string
    purpose: string
    userId?: string
    expiryMinutes?: number
  }): Promise<{ code: string; id: string }> {
    const { identifier, purpose, userId, expiryMinutes = this.DEFAULT_EXPIRY_MINUTES } = params

    // Invalidar códigos anteriores para o mesmo identificador e propósito
    await prisma.otp_codes.updateMany({
      where: {
        identifier,
        purpose,
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: { used: true }
    })

    // Gerar novo código
    const code = this.generateCode()
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

    const otpRecord = await prisma.otp_codes.create({
      data: {
        code,
        identifier,
        purpose,
        userId,
        expiresAt
      }
    })

    return { code, id: otpRecord.id }
  }

  /**
   * Verifica um código OTP
   */
  static async verifyOTP(params: {
    identifier: string
    purpose: string
    code: string
  }): Promise<{ valid: boolean; message: string; otpId?: string }> {
    const { identifier, purpose, code } = params

    const otpRecord = await prisma.otp_codes.findFirst({
      where: {
        identifier,
        purpose,
        code,
        used: false
      }
    })

    if (!otpRecord) {
      return { valid: false, message: "Código inválido" }
    }

    if (new Date() > otpRecord.expiresAt) {
      // Marcar como usado mesmo se expirado
      await prisma.otp_codes.update({
        where: { id: otpRecord.id },
        data: { used: true }
      })
      return { valid: false, message: "Código expirado" }
    }

    // Marcar como usado
    await prisma.otp_codes.update({
      where: { id: otpRecord.id },
      data: { used: true }
    })

    return { valid: true, message: "Código verificado com sucesso", otpId: otpRecord.id }
  }

  /**
   * Limpa códigos expirados
   */
  static async cleanupExpiredCodes(): Promise<number> {
    const result = await prisma.otp_codes.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true }
        ]
      }
    })

    return result.count
  }

  /**
   * Envia código OTP por email
   */
  static async sendEmailOTP(params: {
    email: string
    purpose: string
    userId?: string
    subject?: string
    template?: (code: string) => string
  }): Promise<{ success: boolean; message: string; code?: string }> {
    const { email, purpose, userId, subject, template } = params

    try {
      // Criar código OTP
      const { code } = await this.createOTP({
        identifier: email,
        purpose,
        userId
      })

      // Template padrão
      const defaultTemplate = (code: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Código de Verificação</h2>
          <p>Use o código abaixo para continuar:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1a73e8; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">Este código expira em ${this.DEFAULT_EXPIRY_MINUTES} minutos.</p>
          <p style="color: #666; font-size: 14px;">Se você não solicitou este código, ignore este email.</p>
        </div>
      `

      // Enviar email
      await resend.emails.send({
        from: "ABF Eventos <noreply@abf.com.br>",
        to: email,
        subject: subject || "Código de Verificação - ABF Eventos",
        html: template ? template(code) : defaultTemplate(code)
      })

      return { success: true, message: "Código enviado com sucesso" }
    } catch (error) {
      console.error("Erro ao enviar OTP por email:", error)
      return { success: false, message: "Erro ao enviar código" }
    }
  }

  /**
   * Verifica se existe um código válido para o identificador e propósito
   */
  static async hasValidOTP(params: {
    identifier: string
    purpose: string
  }): Promise<boolean> {
    const { identifier, purpose } = params

    const count = await prisma.otp_codes.count({
      where: {
        identifier,
        purpose,
        used: false,
        expiresAt: { gt: new Date() }
      }
    })

    return count > 0
  }

  /**
   * Obtém informações sobre o último código OTP
   */
  static async getLastOTP(params: {
    identifier: string
    purpose: string
  }) {
    const { identifier, purpose } = params

    return await prisma.otp_codes.findFirst({
      where: {
        identifier,
        purpose
      },
      orderBy: { created_at: 'desc' }
    })
  }
}