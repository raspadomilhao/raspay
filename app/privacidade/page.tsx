"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Shield,
  Database,
  Eye,
  Lock,
  Users,
  Cookie,
  AlertTriangle,
  FileText,
  Settings,
  Phone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Footer } from "@/components/footer"

export default function PrivacidadePage() {
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
                <Shield className="h-6 w-6 text-green-400" />
                <h1 className="text-2xl font-bold text-white">Política de Privacidade</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert className="mb-8 border-green-500/20 bg-green-500/10">
            <Shield className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              <strong>Última atualização:</strong> 12 de janeiro de 2025. Esta política está em conformidade com a LGPD
              (Lei Geral de Proteção de Dados).
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {/* 1. Introdução */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <span>1. Introdução</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  A RasPay valoriza e respeita a privacidade de seus usuários. Esta Política de Privacidade descreve
                  como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
                </p>
                <p>
                  Estamos comprometidos com a transparência e conformidade com a Lei Geral de Proteção de Dados (LGPD) e
                  outras regulamentações aplicáveis.
                </p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-300 font-semibold">🛡️ Seus dados estão seguros conosco</p>
                  <p className="text-blue-200 text-sm mt-1">
                    Utilizamos as melhores práticas de segurança para proteger suas informações.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Informações que Coletamos */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Database className="h-5 w-5 text-purple-400" />
                  <span>2. Informações que Coletamos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  <strong>Informações fornecidas por você:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Nome completo</li>
                  <li>Endereço de email</li>
                  <li>Número de telefone</li>
                  <li>Nome de usuário</li>
                  <li>Informações de pagamento (dados bancários para PIX)</li>
                  <li>Documentos de identificação (quando necessário)</li>
                </ul>
                <p>
                  <strong>Informações coletadas automaticamente:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Endereço IP</li>
                  <li>Tipo de dispositivo e navegador</li>
                  <li>Dados de localização (quando permitido)</li>
                  <li>Histórico de jogos e transações</li>
                  <li>Cookies e tecnologias similares</li>
                </ul>
              </CardContent>
            </Card>

            {/* 3. Como Usamos suas Informações */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Settings className="h-5 w-5 text-cyan-400" />
                  <span>3. Como Usamos suas Informações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>Utilizamos suas informações para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Criar e gerenciar sua conta</li>
                  <li>Processar pagamentos e saques</li>
                  <li>Fornecer suporte ao cliente</li>
                  <li>Verificar sua identidade e prevenir fraudes</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                  <li>Melhorar nossos serviços e experiência do usuário</li>
                  <li>Enviar comunicações importantes sobre sua conta</li>
                  <li>Personalizar conteúdo e ofertas (com seu consentimento)</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Base Legal para Processamento */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Lock className="h-5 w-5 text-green-400" />
                  <span>4. Base Legal para Processamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>Processamos seus dados com base em:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Execução de contrato:</strong> Para fornecer nossos serviços
                  </li>
                  <li>
                    <strong>Obrigação legal:</strong> Para cumprir leis e regulamentações
                  </li>
                  <li>
                    <strong>Interesse legítimo:</strong> Para prevenir fraudes e melhorar serviços
                  </li>
                  <li>
                    <strong>Consentimento:</strong> Para marketing e comunicações opcionais
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 5. Compartilhamento de Informações */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Users className="h-5 w-5 text-orange-400" />
                  <span>5. Compartilhamento de Informações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-300 font-semibold">🚫 Nunca vendemos seus dados pessoais</p>
                </div>
                <p>Podemos compartilhar informações apenas com:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Processadores de pagamento:</strong> Para processar transações
                  </li>
                  <li>
                    <strong>Autoridades legais:</strong> Quando exigido por lei
                  </li>
                  <li>
                    <strong>Prestadores de serviços:</strong> Que nos ajudam a operar a plataforma
                  </li>
                  <li>
                    <strong>Auditores e consultores:</strong> Para conformidade e segurança
                  </li>
                </ul>
                <p>Todos os terceiros são obrigados a manter a confidencialidade de suas informações.</p>
              </CardContent>
            </Card>

            {/* 6. Cookies e Tecnologias */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Cookie className="h-5 w-5 text-yellow-400" />
                  <span>6. Cookies e Tecnologias</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>Utilizamos cookies para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Manter você logado em sua conta</li>
                  <li>Lembrar suas preferências</li>
                  <li>Analisar o uso da plataforma</li>
                  <li>Melhorar a segurança</li>
                  <li>Personalizar sua experiência</li>
                </ul>
                <p>
                  Você pode gerenciar cookies através das configurações do seu navegador, mas isso pode afetar a
                  funcionalidade da plataforma.
                </p>
              </CardContent>
            </Card>

            {/* 7. Segurança dos Dados */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Shield className="h-5 w-5 text-green-400" />
                  <span>7. Segurança dos Dados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>Implementamos medidas de segurança robustas:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Criptografia SSL/TLS para todas as transmissões</li>
                  <li>Armazenamento seguro em servidores protegidos</li>
                  <li>Autenticação de dois fatores disponível</li>
                  <li>Monitoramento contínuo de atividades suspeitas</li>
                  <li>Acesso restrito aos dados por funcionários autorizados</li>
                  <li>Auditorias regulares de segurança</li>
                </ul>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <p className="text-green-300 font-semibold">
                    🔒 Seus dados financeiros são protegidos com criptografia de nível bancário
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 8. Retenção de Dados */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Eye className="h-5 w-5 text-indigo-400" />
                  <span>8. Retenção de Dados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>Mantemos suas informações pelo tempo necessário para:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Fornecer nossos serviços</li>
                  <li>Cumprir obrigações legais</li>
                  <li>Resolver disputas</li>
                  <li>Prevenir fraudes</li>
                </ul>
                <p>
                  <strong>Períodos de retenção típicos:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Dados da conta: Enquanto a conta estiver ativa + 5 anos</li>
                  <li>Transações financeiras: 10 anos (conforme legislação)</li>
                  <li>Logs de acesso: 6 meses</li>
                  <li>Dados de marketing: Até a retirada do consentimento</li>
                </ul>
              </CardContent>
            </Card>

            {/* 9. Seus Direitos */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Users className="h-5 w-5 text-cyan-400" />
                  <span>9. Seus Direitos (LGPD)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>Você tem o direito de:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Acesso:</strong> Saber quais dados temos sobre você
                  </li>
                  <li>
                    <strong>Correção:</strong> Corrigir dados incorretos ou incompletos
                  </li>
                  <li>
                    <strong>Exclusão:</strong> Solicitar a remoção de seus dados
                  </li>
                  <li>
                    <strong>Portabilidade:</strong> Receber seus dados em formato estruturado
                  </li>
                  <li>
                    <strong>Oposição:</strong> Se opor ao processamento de seus dados
                  </li>
                  <li>
                    <strong>Limitação:</strong> Restringir o processamento
                  </li>
                  <li>
                    <strong>Revogação:</strong> Retirar consentimento a qualquer momento
                  </li>
                </ul>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <p className="text-cyan-300 font-semibold">
                    📧 Para exercer seus direitos, entre em contato: privacidade@raspay.com
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 10. Transferências Internacionais */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <span>10. Transferências Internacionais</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>
                  Seus dados são processados principalmente no Brasil. Em casos específicos, podemos transferir dados
                  para outros países com nível adequado de proteção ou com salvaguardas apropriadas.
                </p>
                <p>Sempre garantimos que suas informações recebam proteção equivalente à oferecida no Brasil.</p>
              </CardContent>
            </Card>

            {/* 11. Contato e DPO */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Phone className="h-5 w-5 text-green-400" />
                  <span>11. Contato e Encarregado de Dados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-3">
                <p>Para questões sobre privacidade e proteção de dados:</p>
                <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                  <p>
                    <strong>Encarregado de Dados (DPO):</strong> João Silva
                  </p>
                  <p>
                    <strong>Email:</strong> privacidade@raspay.com
                  </p>
                  <p>
                    <strong>Telefone:</strong> (11) 9999-9999
                  </p>
                  <p>
                    <strong>Endereço:</strong> São Paulo, SP - Brasil
                  </p>
                </div>
                <p>Responderemos às suas solicitações em até 15 dias úteis, conforme a LGPD.</p>
              </CardContent>
            </Card>
          </div>

          {/* Botão de Voltar */}
          <div className="mt-8 text-center">
            <Link href="/">
              <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600">
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
