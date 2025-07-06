import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t bg-background mt-10 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo ABF - Esquerda no desktop */}
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="ABF - Associação Brasileira de Franchising"
              width={100}
              height={16}
              className="filter dark:contrast-0 opacity-60"
            />
          </div>

          {/* Informações centrais */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            {/* Política de Privacidade */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Seus dados estão protegidos</span>
              <span className="text-muted-foreground/40">|</span>
              <Link
                href="https://www.abf.com.br/politica-de-privacidade/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Política de Privacidade
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ABF - Associação Brasileira de Franchising. Todos os direitos reservados.
            </p>
          </div>

          {/* Desenvolvido por - Direita no desktop */}
          <div className="text-xs text-muted-foreground/60">
            Desenvolvido por{" "}
            <Link
              href="https://rgctecnologia.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-muted-foreground transition-colors"
            >
              RGC Tecnologia
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}