import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando criação de afiliado pelo gerente...")

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL não configurada")
      return NextResponse.json(
        { success: false, error: "Configuração do banco de dados não encontrada" },
        { status: 500 },
      )
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET não configurada")
      return NextResponse.json({ success: false, error: "Configuração de segurança não encontrada" }, { status: 500 })
    }

    // Verificar autenticação do gerente
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      console.log("❌ Token de acesso não fornecido")
      return NextResponse.json({ success: false, error: "Token de acesso necessário" }, { status: 401 })
    }

    let managerId: number
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
      managerId = decoded.managerId
      console.log("✅ Token válido para gerente ID:", managerId)
    } catch (error) {
      console.log("❌ Token inválido:", error)
      return NextResponse.json({ success: false, error: "Token inválido" }, { status: 401 })
    }

    // Verificar se o gerente existe
    try {
      const managerResult = await sql`
        SELECT id, name, email FROM managers WHERE id = ${managerId} LIMIT 1
      `

      if (!managerResult[0]) {
        console.log("❌ Gerente não encontrado:", managerId)
        return NextResponse.json({ success: false, error: "Gerente não encontrado" }, { status: 404 })
      }

      console.log("✅ Gerente encontrado:", managerResult[0].name)
    } catch (error) {
      console.error("❌ Erro ao buscar gerente:", error)
      return NextResponse.json({ success: false, error: "Erro ao verificar gerente" }, { status: 500 })
    }

    // Parse do body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ Erro ao parsear JSON:", error)
      return NextResponse.json({ success: false, error: "Dados inválidos" }, { status: 400 })
    }

    const { name, email, username, loss_commission_rate, password } = body

    console.log("📝 Dados recebidos:", { name, email, username, loss_commission_rate })

    // Validações básicas
    if (!name || !email || !username || !password) {
      console.log("❌ Campos obrigatórios faltando")
      return NextResponse.json({ success: false, error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("❌ Senha muito curta")
      return NextResponse.json({ success: false, error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Validar comissão por ganhos/perdas
    const lossCommission = Number(loss_commission_rate) || 0.0

    console.log("💰 Comissão por ganhos/perdas:", lossCommission)

    if (lossCommission < 0 || lossCommission > 70) {
      console.log("❌ Comissão por jogos inválida:", lossCommission)
      return NextResponse.json(
        { success: false, error: "Comissão por ganhos/perdas deve estar entre 0% e 70%" },
        { status: 400 },
      )
    }

    // Verificar se email já existe
    try {
      console.log("🔍 Verificando se email já existe...")
      const existingEmail = await sql`
        SELECT id, email FROM affiliates WHERE email = ${email} LIMIT 1
      `

      if (existingEmail[0]) {
        console.log("❌ Email já existe:", email)
        return NextResponse.json({ success: false, error: "Este email já está em uso" }, { status: 400 })
      }
    } catch (error) {
      console.error("❌ Erro ao verificar email:", error)
      return NextResponse.json({ success: false, error: "Erro ao verificar email" }, { status: 500 })
    }

    // Gerar código único de afiliado
    let affiliateCode
    try {
      console.log("🔧 Gerando código de afiliado...")
      affiliateCode = username
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 8)

      // Verificar se código já existe e gerar um único
      let codeExists = true
      let counter = 1

      while (codeExists && counter <= 99) {
        const currentCode =
          counter === 1 ? affiliateCode : `${affiliateCode.substring(0, 6)}${counter.toString().padStart(2, "0")}`

        const existingCode = await sql`
          SELECT id, affiliate_code FROM affiliates WHERE affiliate_code = ${currentCode} LIMIT 1
        `

        if (!existingCode[0]) {
          affiliateCode = currentCode
          codeExists = false
        } else {
          counter++
        }
      }

      if (codeExists) {
        throw new Error("Não foi possível gerar código único")
      }

      console.log("✅ Código de afiliado gerado:", affiliateCode)
    } catch (error) {
      console.error("❌ Erro ao gerar código:", error)
      return NextResponse.json({ success: false, error: "Erro ao gerar código de afiliado" }, { status: 500 })
    }

    // Hash da senha
    let passwordHash
    try {
      console.log("🔐 Gerando hash da senha...")
      passwordHash = await bcrypt.hash(password, 12)
    } catch (error) {
      console.error("❌ Erro ao gerar hash:", error)
      return NextResponse.json({ success: false, error: "Erro ao processar senha" }, { status: 500 })
    }

    // Criar afiliado (APENAS com comissão por ganhos/perdas)
    let affiliate
    try {
      console.log("👤 Criando afiliado...")
      const result = await sql`
        INSERT INTO affiliates (
          name, 
          email, 
          username, 
          affiliate_code, 
          password_hash, 
          commission_rate, 
          loss_commission_rate,
          status,
          created_at,
          manager_id
        ) VALUES (
          ${name},
          ${email},
          ${username},
          ${affiliateCode},
          ${passwordHash},
          0.00,
          ${lossCommission},
          'active',
          NOW(),
          ${managerId}
        )
        RETURNING id, name, email, username, affiliate_code, commission_rate, loss_commission_rate, status, manager_id
      `

      affiliate = result[0]
      console.log("✅ Afiliado criado:", affiliate.id)
    } catch (error) {
      console.error("❌ Erro ao criar afiliado:", error)

      // Verificar se é erro de constraint (email ou código duplicado)
      if (error instanceof Error && error.message.includes("duplicate key")) {
        if (error.message.includes("email")) {
          return NextResponse.json({ success: false, error: "Este email já está em uso" }, { status: 400 })
        }
        if (error.message.includes("affiliate_code")) {
          return NextResponse.json({ success: false, error: "Código de afiliado já existe" }, { status: 400 })
        }
      }

      return NextResponse.json({ success: false, error: "Erro ao criar afiliado no banco de dados" }, { status: 500 })
    }

    console.log(`✅ Afiliado ${affiliate.name} criado pelo gerente`)
    console.log(`💰 Comissão por depósito: R$ 0,00 (desabilitada para gerentes)`)
    console.log(`📊 Comissão por jogos: ${lossCommission}%`)

    return NextResponse.json({
      success: true,
      message: "Afiliado criado com sucesso",
      affiliate: {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email,
        username: affiliate.username,
        affiliate_code: affiliate.affiliate_code,
        commission_rate: affiliate.commission_rate,
        loss_commission_rate: affiliate.loss_commission_rate,
        status: affiliate.status,
        manager_id: affiliate.manager_id,
      },
    })
  } catch (error) {
    console.error("❌ Erro geral na API:", error)

    // Garantir que sempre retornamos JSON válido
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
