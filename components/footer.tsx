import Link from "next/link"
import { Shield, FileText, Home, Gamepad2, Trophy, CreditCard, Zap } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4 col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-r from-primary to-blue-500 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">RasPay</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              A plataforma líder em jogos de raspadinha online. Jogue com segurança, divirta-se com responsabilidade e
              ganhe prêmios incríveis.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Navegação</h3>
            <nav className="space-y-2">
              <Link
                href="/home"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <Home className="h-4 w-4" />
                <span>Início</span>
              </Link>
              <Link
                href="/jogos"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <Gamepad2 className="h-4 w-4" />
                <span>Jogos</span>
              </Link>
              <Link
                href="/vencedores"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <Trophy className="h-4 w-4" />
                <span>Vencedores</span>
              </Link>
              <Link
                href="/deposito"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <CreditCard className="h-4 w-4" />
                <span>Depósito</span>
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Legal</h3>
            <nav className="space-y-2">
              <Link
                href="/termos"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <FileText className="h-4 w-4" />
                <span>Termos de Uso</span>
              </Link>
              <Link
                href="/privacidade"
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                <Shield className="h-4 w-4" />
                <span>Política de Privacidade</span>
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-muted-foreground text-xs">
          <p className="mb-2">
            ⚠️ Jogue com Responsabilidade. Conteúdo para maiores de 18 anos. O jogo pode ser viciante.
          </p>
          <p>&copy; {new Date().getFullYear()} RasPay. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
