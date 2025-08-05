"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Eye, EyeOff, LogIn, Shield } from "lucide-react"

export default function ManagerLogin() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("🔐 Iniciando login do gerente:", formData.email)

      const response = await fetch("/api/manager/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para cookies
        body: JSON.stringify(formData),
      })

      console.log("📡 Status da resposta:", response.status)

      // Verificar se a resposta é JSON válida
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Resposta não é JSON:", contentType)
        const textResponse = await response.text()
        console.error("❌ Conteúdo da resposta:", textResponse.substring(0, 200))
        toast.error("Erro interno do servidor - resposta inválida")
        return
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("❌ Erro ao fazer parse do JSON:", jsonError)
        toast.error("Erro ao processar resposta do servidor")
        return
      }

      if (response.ok && data.success) {
        console.log("✅ Login bem-sucedido:", data.message)

        // Salvar token no localStorage como backup
        if (data.token) {
          localStorage.setItem("manager_token", data.token)
          console.log("💾 Token salvo no localStorage")
        }

        // Salvar dados do gerente
        if (data.manager) {
          localStorage.setItem("manager_data", JSON.stringify(data.manager))
          console.log("👤 Dados do gerente salvos")
        }

        toast.success("Login realizado com sucesso!")
        console.log("🎉 Redirecionando para dashboard...")
        router.push("/manager/dashboard")
      } else {
        console.error("❌ Erro no login:", data)
        toast.error(data.message || "Erro ao fazer login")
      }
    } catch (error) {
      console.error("❌ Erro na requisição:", error)
      toast.error("Erro de conexão com o servidor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Login do Gerente</CardTitle>
          <CardDescription className="text-gray-400">Acesse o painel de gerenciamento de afiliados</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-400"
                placeholder="Digite seu email"
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-400 pr-10"
                  placeholder="Digite sua senha"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>Entrar</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Credenciais de teste:
              <br />
              <span className="text-gray-300">kelvinj@raspay.com</span>
              <br />
              <span className="text-gray-300">password</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
