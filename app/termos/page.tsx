"use client"

import Link from "next/link"
import {
  ArrowLeft,
  FileText,
  Shield,
  AlertTriangle,
  Scale,
  Users,
  CreditCard,
  Gamepad2,
  Ban,
  Gavel,
  Phone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Footer } from "@/components/footer"

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <div className="flex-1">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-cyan-400" />
                <h1 className="text-2xl font-bold text-white">Termos de Uso</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert className="mb-8 border-cyan-500/20 bg-cyan-500/10">
            <AlertTriangle className="h-4 w-4 text-cyan-400" />
            <AlertDescription className="text-cyan-300">
              <strong>Última atualização:</strong> 12 de janeiro de 2025. Ao usar nossos serviços, você concorda com
              estes termos.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {/* 1. Aceitação dos Termos */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Scale className="h-5 w-5 text-green-400" />
                  <span>1. Aceitação dos Termos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  Ao acessar e usar a plataforma RasPay, você concorda em cumprir e estar vinculado a estes Termos de
                  Uso. Se você não concordar com qualquer parte destes termos, não deve usar nossos serviços.
                </p>
                <p>
                  Estes termos constituem um acordo legal entre você e a RasPay, e são aplicáveis a todos os usuários da
                  plataforma.
                </p>
              </CardContent>
            </Card>

            {/* 2. Elegibilidade */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span>2. Elegibilidade</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-300 font-semibold">
                    ⚠️ Você deve ter pelo menos 18 anos de idade para usar nossos serviços.
                  </p>
                </div>
                <p>Ao se registrar, você declara e garante que:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tem pelo menos 18 anos de idade</li>
                  <li>Tem capacidade legal para celebrar contratos</li>
                  <li>Não está localizado em jurisdição onde jogos online são proibidos</li>
                  <li>Todas as informações fornecidas são verdadeiras e precisas</li>
                </ul>
              </CardContent>
            </Card>

            {/* 3. Conta de Usuário */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <span>3. Conta de Usuário</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  Para usar nossos serviços, você deve criar uma conta fornecendo informações precisas e completas. Você
                  é responsável por:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Manter a confidencialidade de suas credenciais de login</li>
                  <li>Todas as atividades que ocorrem em sua conta</li>
                  <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                  <li>Manter suas informações atualizadas</li>
                </ul>
                <p className="text-amber-300">
                  <strong>Importante:</strong> Apenas uma conta por pessoa é permitida. Contas duplicadas serão
                  suspensas.
                </p>
              </CardContent>
            </Card>

            {/* 4. Jogos e Apostas */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Gamepad2 className="h-5 w-5 text-cyan-400" />
                  <span>4. Jogos e Apostas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-amber-300 font-semibold">🎮 Jogue com Responsabilidade</p>
                  <p className="text-amber-200 text-sm mt-1">
                    Nossos jogos são baseados em sorte. Nunca aposte mais do que você pode perder.
                  </p>
                </div>
                <p>Regras dos jogos:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Todos os jogos são baseados em algoritmos de sorte certificados</li>
                  <li>Os resultados são determinados no momento da compra</li>
                  <li>Não é possível cancelar ou alterar apostas após confirmação</li>
                  <li>Prêmios são creditados automaticamente na conta</li>
                  <li>Limites de aposta podem ser aplicados</li>
                </ul>
              </CardContent>
            </Card>

            {/* 5. Pagamentos e Saques */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <CreditCard className="h-5 w-5 text-green-400" />
                  <span>5. Pagamentos e Saques</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  <strong>Depósitos:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Aceitamos pagamentos via PIX</li>
                  <li>Depósito mínimo: R$ 10,00</li>
                  <li>Créditos são processados instantaneamente</li>
                </ul>
                <p>
                  <strong>Saques:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Saque mínimo: R$ 20,00</li>
                  <li>Processamento em até 24 horas úteis</li>
                  <li>Verificação de identidade pode ser necessária</li>
                  <li>Taxas podem ser aplicadas conforme política</li>
                </ul>
              </CardContent>
            </Card>

            {/* 6. Conduta do Usuário */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Ban className="h-5 w-5 text-red-400" />
                  <span>6. Conduta Proibida</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>É estritamente proibido:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Usar bots, scripts ou software automatizado</li>
                  <li>Tentar hackear ou comprometer a segurança da plataforma</li>
                  <li>Criar múltiplas contas</li>
                  <li>Usar informações falsas ou de terceiros</li>
                  <li>Participar de atividades fraudulentas</li>
                  <li>Violar leis locais ou internacionais</li>
                </ul>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-300 font-semibold">
                    ⚠️ Violações podem resultar em suspensão permanente da conta e perda de fundos.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 7. Propriedade Intelectual */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <span>7. Propriedade Intelectual</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  Todos os conteúdos da plataforma RasPay, incluindo mas não limitado a textos, gráficos, logos, ícones,
                  imagens, clipes de áudio, downloads digitais e software, são propriedade da RasPay ou de seus
                  fornecedores de conteúdo.
                </p>
                <p>É proibido copiar, reproduzir, distribuir ou criar obras derivadas sem autorização expressa.</p>
              </CardContent>
            </Card>

            {/* 8. Limitação de Responsabilidade */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <span>8. Limitação de Responsabilidade</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>A RasPay não será responsável por:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Perdas financeiras decorrentes do uso da plataforma</li>
                  <li>Interrupções temporárias do serviço</li>
                  <li>Problemas técnicos ou falhas de sistema</li>
                  <li>Ações de terceiros ou força maior</li>
                </ul>
                <p>Nossa responsabilidade máxima é limitada ao valor depositado em sua conta nos últimos 30 dias.</p>
              </CardContent>
            </Card>

            {/* 9. Modificações */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Gavel className="h-5 w-5 text-orange-400" />
                  <span>9. Modificações dos Termos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  Reservamos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor
                  imediatamente após a publicação na plataforma.
                </p>
                <p>
                  É sua responsabilidade revisar periodicamente estes termos. O uso continuado da plataforma após as
                  modificações constitui aceitação dos novos termos.
                </p>
              </CardContent>
            </Card>

            {/* 10. Contato */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Phone className="h-5 w-5 text-cyan-400" />
                  <span>10. Contato</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>Para dúvidas sobre estes termos, entre em contato conosco:</p>
                <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                  <p>
                    <strong>Email:</strong> legal@raspay.com
                  </p>
                  <p>
                    <strong>Telefone:</strong> (11) 9999-9999
                  </p>
                  <p>
                    <strong>Endereço:</strong> São Paulo, SP - Brasil
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botão de Voltar */}
          <div className="mt-8 text-center">
            <Link href="/">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
