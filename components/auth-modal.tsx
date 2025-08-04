"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Zap, Eye, EyeOff, Loader2, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { AuthClient } from "@/lib/auth-client"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [referralInfo, setReferralInfo] = useState<{ type: string; code: string } | null>(null)

  const formatPhoneNumber = (value: string) => {
    if (!value) return value
    const phoneNumber = value.replace(/\D/g, "")
    let formattedNumber = ""

    if (phoneNumber.length > 0) {
      formattedNumber = `(${phoneNumber.substring(0, 2)}`
    }
    if (phoneNumber.length > 2) {
      formattedNumber += `) ${phoneNumber.substring(2, 7)}`
    }
    if (phoneNumber.length > 7) {
      formattedNumber += `-${phoneNumber.substring(7, 11)}`
    }
    return formattedNumber
  }

  // Estados do formulário de login
  const [loginData, setLoginData] = useState({
    login: "",
    password: "",
  })

  // Estados do formulário de registro (simplificado)
  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  })

  // Função para gerar username automaticamente baseado no email
  const generateUsername = (email: string): string => {
    if (!email) return ""

    // Pegar a parte antes do @
    const emailPart = email.split("@")[0]

    // Sanitizar: remover caracteres especiais e substituir por underscore
    const sanitized = emailPart
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_") // Remover underscores duplos
      .replace(/^_|_$/g, "") // Remover underscores no início e fim

    return sanitized || "user"
  }

  // Função para calcular força da senha
  const calculatePasswordStrength = (password: string) => {
    let score = 0
    const feedback = []

    if (password.length >= 8) {
      score += 25
    } else {
      feedback.push("Pelo menos 8 caracteres")
    }

    if (/[a-z]/.test(password)) {
      score += 25
    } else {
      feedback.push("Letras minúsculas")
    }

    if (/[A-Z]/.test(password)) {
      score += 25
    } else {
      feedback.push("Letras maiúsculas")
    }

    if (/[0-9]/.test(password)) {
      score += 25
    } else {
      feedback.push("Números")
    }

    let strength = "Muito fraca"
    let color = "bg-red-500"
    let icon = ShieldAlert

    if (score >= 75) {
      strength = "Forte"
      color = "bg-green-500"
      icon = ShieldCheck
    } else if (score >= 50) {
      strength = "Média"
      color = "bg-yellow-500"
      icon = Shield
    } else if (score >= 25) {
      strength = "Fraca"
      color = "bg-orange-500"
      icon = ShieldAlert
    }

    return { score, strength, color, feedback, icon }
  }

  // Calcular força da senha em tempo real
  const passwordStrength = calculatePasswordStrength(registerData.password)

  // Verificar códigos de referência na URL
  useEffect(() => {
    if (!isOpen) return

    const refCode = searchParams.get("ref")
    const affiliateCode = searchParams.get("affiliate")

    if (refCode) {
      console.log(`🔗 Código de indicação detectado: ${refCode}`)

      if (refCode.startsWith("USER")) {
        setReferralInfo({ type: "user", code: refCode })
        document.cookie = `user_ref=${refCode}; path=/; max-age=3600`
      } else {
        setReferralInfo({ type: "affiliate", code: refCode })
        document.cookie = `affiliate_ref=${refCode}; path=/; max-age=3600`
      }
    }

    if (affiliateCode) {
      console.log(`🤝 Código de afiliado detectado: ${affiliateCode}`)
      setReferralInfo({ type: "affiliate", code: affiliateCode })
      document.cookie = `affiliate_ref=${affiliateCode}; path=/; max-age=3600`
    }
  }, [isOpen, searchParams])

  // Função de login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("🔐 Tentando fazer login...")

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(loginData),
      })

      console.log("📡 Status da resposta:", response.status)

      let data
      try {
        data = await response.json()
        console.log("📡 Resposta do login:", data)
      } catch (jsonError) {
        console.error("❌ Erro ao fazer parse da resposta JSON:", jsonError)
        throw new Error("Resposta inválida do servidor")
      }

      if (response.ok && data.success) {
        console.log("✅ Login realizado com sucesso")

        if (data.token) {
          AuthClient.setToken(data.token)
          console.log("💾 Token salvo no localStorage")
        }

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.user.name}!`,
        })

        onSuccess?.()
        onClose()

        // Aguardar um pouco antes de recarregar para atualizar o estado
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        console.log("❌ Erro no login:", data.error)
        toast({
          title: "Erro no login",
          description: data.error || "Credenciais inválidas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Erro na requisição de login:", error)
      toast({
        title: "Erro de conexão",
        description: "Verifique sua conexão com a internet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função de registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreeToTerms) {
      toast({
        title: "Erro no cadastro",
        description: "Você deve concordar com os Termos de Uso e Política de Privacidade",
        variant: "destructive",
      })
      return
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Erro no cadastro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("📝 Tentando fazer registro...")

      // Gerar username automaticamente baseado no email
      const generatedUsername = generateUsername(registerData.email)
      console.log(`🔧 Username gerado: ${generatedUsername}`)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: registerData.name,
          username: generatedUsername, // Username gerado automaticamente
          phone: registerData.phone,
          email: registerData.email,
          password: registerData.password,
        }),
      })

      console.log("📡 Status da resposta:", response.status)

      let data
      try {
        data = await response.json()
        console.log("📡 Resposta do registro:", data)
      } catch (jsonError) {
        console.error("❌ Erro ao fazer parse da resposta JSON:", jsonError)
        throw new Error("Resposta inválida do servidor")
      }

      if (response.ok && data.success) {
        console.log("✅ Registro realizado com sucesso")

        if (data.token) {
          AuthClient.setToken(data.token)
          console.log("💾 Token salvo no localStorage")
        }

        const successMessage = `Bem-vindo, ${data.user.name}!`

        toast({
          title: "Cadastro realizado com sucesso!",
          description: successMessage,
        })

        onSuccess?.()
        onClose()

        // Aguardar um pouco antes de recarregar para atualizar o estado
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        console.log("❌ Erro no registro:", data.error)
        toast({
          title: "Erro no cadastro",
          description: data.error || "Erro ao criar conta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Erro na requisição de registro:", error)
      toast({
        title: "Erro de conexão",
        description: "Verifique sua conexão com a internet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-slate-900/95 backdrop-blur-sm border-slate-700 p-0">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-white">Acesse sua conta</CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                Entre ou crie uma nova conta para começar a jogar
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800 border-slate-700">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-gray-300"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-gray-300"
                  >
                    Cadastrar
                  </TabsTrigger>
                </TabsList>

                {/* Formulário de Login */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="login" className="text-gray-300 text-sm">
                        Email ou usuário
                      </Label>
                      <Input
                        id="login"
                        type="text"
                        placeholder="Digite seu email ou usuário"
                        value={loginData.login}
                        onChange={(e) => setLoginData({ ...loginData, login: e.target.value })}
                        className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-gray-300 text-sm">
                        Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite sua senha"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-300"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Formulário de Registro */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-gray-300 text-sm">
                        Nome completo
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Digite seu nome completo"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-gray-300 text-sm">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: formatPhoneNumber(e.target.value) })}
                        className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-gray-300 text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Digite seu email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="register-password" className="text-gray-300 text-sm">
                        Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Digite uma senha (mín. 6 caracteres)"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400 pr-10"
                          required
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-300"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="mt-0.5 flex items-center space-x-2">
                        <Progress
                          value={passwordStrength.score}
                          className="w-full h-2 rounded-full"
                          color={passwordStrength.color}
                        />
                        <span className="text-xs text-gray-400">{passwordStrength.strength}</span>
                        {passwordStrength.icon && <passwordStrength.icon className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {/* Checkbox de concordância com termos */}
                    <div className="flex items-start space-x-2 pt-1">
                      <Checkbox
                        id="terms"
                        checked={agreeToTerms}
                        onCheckedChange={setAgreeToTerms}
                        className="mt-1 border-slate-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor="terms" className="text-xs text-gray-300 leading-relaxed cursor-pointer">
                          Eu concordo com os{" "}
                          <Link href="/termos" className="text-cyan-400 hover:text-cyan-300 underline" target="_blank">
                            Termos de Uso
                          </Link>{" "}
                          e{" "}
                          <Link
                            href="/privacidade"
                            className="text-cyan-400 hover:text-cyan-300 underline"
                            target="_blank"
                          >
                            Política de Privacidade
                          </Link>
                        </label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2"
                      disabled={isLoading || !agreeToTerms}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        "Criar conta"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
