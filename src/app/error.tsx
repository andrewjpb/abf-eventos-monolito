"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log detalhado do erro para o console
    console.error("[ERROR BOUNDARY] Erro capturado:")
    console.error("[ERROR BOUNDARY] Message:", error.message)
    console.error("[ERROR BOUNDARY] Name:", error.name)
    console.error("[ERROR BOUNDARY] Stack:", error.stack)
    console.error("[ERROR BOUNDARY] Digest:", error.digest)
    console.error("[ERROR BOUNDARY] Erro completo:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="max-w-2xl w-full bg-destructive/10 border border-destructive rounded-lg p-6">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          Erro na Aplicação
        </h2>

        <div className="bg-background rounded p-4 mb-4 overflow-auto">
          <p className="font-mono text-sm mb-2">
            <strong>Mensagem:</strong> {error.message}
          </p>
          {error.digest && (
            <p className="font-mono text-sm mb-2">
              <strong>Digest:</strong> {error.digest}
            </p>
          )}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Ver detalhes técnicos
            </summary>
            <pre className="mt-2 text-xs overflow-auto max-h-48 bg-muted p-2 rounded">
              {error.stack}
            </pre>
          </details>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Por favor, abra o console do navegador (F12) para ver os logs detalhados.
        </p>

        <div className="flex gap-4">
          <Button onClick={() => reset()} variant="default">
            Tentar novamente
          </Button>
          <Button onClick={() => window.location.href = "/"} variant="outline">
            Ir para Home
          </Button>
          <Button
            onClick={() => {
              // Limpar cookies e cache
              document.cookie.split(";").forEach((c) => {
                document.cookie = c
                  .replace(/^ +/, "")
                  .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
              })
              window.location.href = "/sign-in"
            }}
            variant="destructive"
          >
            Limpar sessão e fazer login
          </Button>
        </div>
      </div>
    </div>
  )
}
