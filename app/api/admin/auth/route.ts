import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    console.log("🔐 Tentativa de autenticação administrativa")

    if (!password) {
      console.log("❌ Senha não fornecida")
      return NextResponse.json({ success: false, error: "Senha é obrigatória" }, { status: 400 })
    }

    // Verificação de senha com acesso completo
    if (password === "Psicodelia12@") {
      console.log("✅ Senha de acesso completo - autorizado")
      return NextResponse.json({
        success: true,
        message: "Acesso autorizado",
        accessLevel: "full",
        token: "admin-full-access",
      })
    }

    // Verificação de senha com acesso limitado (apenas gerentes)
    if (password === "Z6XElQ57}LX8") {
      console.log("✅ Senha de acesso limitado - autorizado apenas para gerentes")
      return NextResponse.json({
        success: true,
        message: "Acesso autorizado (Gerentes)",
        accessLevel: "managers_only",
        token: "admin-managers-only",
      })
    }

    // Buscar senha administrativa no banco
    console.log("🔍 Buscando senha no banco de dados...")
    const adminPasswords = await sql`
      SELECT password_hash FROM admin_passwords 
      WHERE description = 'Admin Config Access'
      ORDER BY created_at DESC 
      LIMIT 1
    `

    console.log("📊 Registros encontrados:", adminPasswords.length)

    if (adminPasswords.length === 0) {
      console.log("❌ Nenhuma senha administrativa encontrada no banco")
      return NextResponse.json({ success: false, error: "Configuração administrativa não encontrada" }, { status: 500 })
    }

    const adminPassword = adminPasswords[0]
    console.log("🔑 Hash encontrado no banco:", adminPassword.password_hash.substring(0, 20) + "...")

    // Verificação adicional com bcrypt (se disponível)
    try {
      const bcrypt = require("bcryptjs")
      const passwordMatch = await bcrypt.compare(password, adminPassword.password_hash)

      if (passwordMatch) {
        console.log("✅ Senha verificada com bcrypt - acesso completo autorizado")
        return NextResponse.json({
          success: true,
          message: "Acesso autorizado",
          accessLevel: "full",
          token: "admin-full-access",
        })
      } else {
        console.log("❌ Senha incorreta (bcrypt)")
        return NextResponse.json({ success: false, error: "Senha incorreta" }, { status: 401 })
      }
    } catch (bcryptError) {
      console.log("⚠️ Erro com bcrypt, usando verificação simples:", bcryptError)

      // Fallback: verificação simples
      if (password === "Psicodelia12@") {
        console.log("✅ Senha correta (verificação simples)")
        return NextResponse.json({
          success: true,
          message: "Acesso autorizado",
          accessLevel: "full",
          token: "admin-full-access",
        })
      }
    }

    console.log("❌ Senha incorreta")
    return NextResponse.json({ success: false, error: "Senha incorreta" }, { status: 401 })
  } catch (error) {
    console.error("❌ Erro na autenticação administrativa:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
