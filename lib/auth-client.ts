import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

export class AuthClient {
  private static TOKEN_KEY = "auth-token"

  static setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.TOKEN_KEY, token)
      // Também definir como cookie para compatibilidade com APIs
      document.cookie = `${this.TOKEN_KEY}=${token}; path=/; max-age=86400; SameSite=Strict`
    }
  }

  static getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.TOKEN_KEY)
    }
    return null
  }

  static removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.TOKEN_KEY)
      // Remover cookie também
      document.cookie = `${this.TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  }

  static async logout(): Promise<void> {
    try {
      // Fazer chamada para o endpoint de logout
      await this.makeAuthenticatedRequest("/api/auth/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("Erro no logout:", error)
    } finally {
      // Sempre remover o token, mesmo se a chamada falhar
      this.removeToken()
      // Recarregar a página para limpar o estado
      if (typeof window !== "undefined") {
        window.location.reload()
      }
    }
  }

  static isLoggedIn(): boolean {
    return this.getToken() !== null
  }

  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken()

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    })
  }

  static async getUserFromToken(): Promise<any | null> {
    const token = this.getToken()
    if (!token) return null

    try {
      const { payload } = await jwtVerify(token, secret)
      return payload
    } catch (error) {
      console.error("Erro ao decodificar token:", error)
      return null
    }
  }

  static async getUserIdFromToken(): Promise<number | null> {
    const user = await this.getUserFromToken()
    return user?.userId || null
  }
}
