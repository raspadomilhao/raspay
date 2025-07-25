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
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { AuthClient } from "@/lib/auth-client"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [referralInfo, setReferralInfo] = useState<{ type: string; code: string } | null>(null)

  const formatPhoneNumber = (value: string) => {
    if (!value) return value
    const phoneNumber = value.replace(/\D/g, "") // Remove tudo que não é dígito
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

  // Estados do formulário de registro
  const [registerData, setRegisterData] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Verificar se já está logado e processar códigos de referência
  useEffect(() => {
    const token = AuthClient.getToken()
    if (token && AuthClient.isLoggedIn()) {
      console.log("✅ Usuário já logado, redirecionando...")
      router.push("/home")
      return
    }

    // Verificar códigos de referência na URL
    const refCode = searchParams.get("ref")
    const affiliateCode = searchParams.get("affiliate")

    if (refCode) {
      console.log(`🔗 Código de indicação detectado: ${refCode}`)

      // Verificar se é código de afiliado ou usuário
      if (refCode.startsWith("USER")) {
        setReferralInfo({ type: "user", code: refCode })
        // Salvar no cookie para usar no registro
        document.cookie = `user_ref=${refCode}; path=/; max-age=3600`
      } else {
        setReferralInfo({ type: "affiliate", code: refCode })
        // Salvar no cookie para usar no registro
        document.cookie = `affiliate_ref=${refCode}; path=/; max-age=3600`
      }
    }

    if (affiliateCode) {
      console.log(`🤝 Código de afiliado detectado: ${affiliateCode}`)
      setReferralInfo({ type: "affiliate", code: affiliateCode })
      document.cookie = `affiliate_ref=${affiliateCode}; path=/; max-age=3600`
    }
  }, [router, searchParams])

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

        // Salvar token no localStorage
        if (data.token) {
          AuthClient.setToken(data.token)
          console.log("💾 Token salvo no localStorage")
        }

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.user.name}!`,
        })

        // Aguardar um pouco antes de redirecionar
        setTimeout(() => {
          console.log("🔄 Redirecionando para home...")
          router.push("/home")
        }, 1000)
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

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem",
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

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: registerData.name,
          username: registerData.username,
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

        // Salvar token no localStorage
        if (data.token) {
          AuthClient.setToken(data.token)
          console.log("💾 Token salvo no localStorage")
        }

        const successMessage = `Bem-vindo, ${data.user.name}!`

        toast({
          title: "Cadastro realizado com sucesso!",
          description: successMessage,
        })

        // Aguardar um pouco antes de redirecionar
        setTimeout(() => {
          console.log("🔄 Redirecionando para home...")
          router.push("/home")
        }, 1000)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Zap className="absolute top-20 left-10 h-6 w-6 text-cyan-400/20 animate-pulse" />
          <Zap className="absolute top-32 right-20 h-8 w-8 text-blue-400/30 animate-pulse delay-1000" />
          <Zap className="absolute bottom-40 left-20 h-5 w-5 text-cyan-400/20 animate-pulse delay-2000" />
          <Zap className="absolute bottom-60 right-10 h-7 w-7 text-blue-400/25 animate-pulse delay-500" />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              RasPay
            </h1>
            <p className="text-gray-400 mt-2">Raspe, ganhe e divirta-se!</p>
          </div>

          <Card className="bg-slate-900/95 backdrop-blur-sm border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Acesse sua conta</CardTitle>
              <CardDescription className="text-gray-400">
                Entre ou crie uma nova conta para começar a jogar
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login" className="text-gray-300">
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
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-300">
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
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">
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
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-300">
                        Nome de usuário
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Digite um nome de usuário"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">
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
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">
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
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-gray-300">
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-gray-300">
                        Confirmar senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua senha"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          className="bg-slate-800 border-slate-600 text-white placeholder-gray-400 focus:border-cyan-400 pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-gray-300"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Checkbox de concordância com termos */}
                    <div className="flex items-start space-x-2 pt-2">
                      <Checkbox
                        id="terms"
                        checked={agreeToTerms}
                        onCheckedChange={setAgreeToTerms}
                        className="mt-1 border-slate-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed cursor-pointer">
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
      </div>

      <Footer />
    </div>
  )
}
