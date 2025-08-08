import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { SignJWT } from "jose"
import bcrypt from "bcryptjs"
import { getAffiliateByCode } from "@/lib/database"

const sql = neon(process.env.DATABASE_URL!)
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "horsepay-secret-key")

// Função para determinar tipo de usuário baseado no email
function getUserTypeFromEmail(email: string): string {
  const bloggerDomains = ["@blogger", "@influencer"]
  const isBlogger = bloggerDomains.some((domain) => email.includes(domain))
  return isBlogger ? "blogger" : "regular"
}

// Função para gerar username único baseado no nome e email
function generateUsername(name: string, email: string): string {
  // Pegar primeira parte do nome (sem espaços e caracteres especiais)
  const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  
  // Pegar parte antes do @ do email
  const emailPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
  
  // Gerar timestamp único
  const timestamp = Date.now().toString().slice(-4)
  
  // Combinar: primeira parte do nome + parte do email + timestamp
  const username = `${firstName}${emailPart}${timestamp}`.substring(0, 20)
  
  return username
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 Iniciando processo de registro...")

    // Parse do body da requisição
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ Erro ao fazer parse do JSON:", error)
      return NextResponse.json({ success: false, error: "Dados inválidos enviados" }, { status: 400 })
    }

    const { name, phone, email, password } = body

    console.log("📋 Dados recebidos:", { name, email, phone })

    // Verificar código de afiliado no cookie
    const affiliateCode = request.cookies.get("affiliate_ref")?.value
    let affiliateId: number | undefined = undefined

    if (affiliateCode) {
      console.log(`🤝 Código de afiliado encontrado: ${affiliateCode}`)
      const affiliate = await getAffiliateByCode(affiliateCode)
      if (affiliate && affiliate.status === "active") {
        affiliateId = affiliate.id
        console.log(`✅ Afiliado válido encontrado: ${affiliate.name} (ID: ${affiliate.id})`)
      } else {
        console.log(`❌ Código de afiliado inválido ou inativo: ${affiliateCode}`)
      }
    }

    // 🔗 VERIFICAR CÓDIGO DE INDICAÇÃO DE USUÁRIO
    const userReferralCode = request.cookies.get("user_ref")?.value || new URL(request.url).searchParams.get("ref")
    let referrerUserId: number | undefined = undefined

    if (userReferralCode && !affiliateId) {
      // Só processar indicação se não for afiliado
      console.log(`👥 Código de indicação de usuário encontrado: ${userReferralCode}`)

      const [referrerUser] = await sql`
        SELECT id, name FROM users WHERE referral_code = ${userReferralCode}
      `

      if (referrerUser) {
        referrerUserId = referrerUser.id
        console.log(`✅ Usuário indicador válido encontrado: ${referrerUser.name} (ID: ${referrerUser.id})`)
      } else {
        console.log(`❌ Código de indicação inválido: ${userReferralCode}`)
      }
    }

    // Validações básicas
    if (!name || !phone || !email || !password) {
      console.log("❌ Campos obrigatórios faltando")
      return NextResponse.json({ success: false, error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("❌ Senha muito curta")
      return NextResponse.json({ success: false, error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    // Verificar se email já existe
    try {
      console.log("🔍 Verificando se email já existe...")
      const existingUserByEmail = await sql`
        SELECT id FROM users WHERE email = ${email} LIMIT 1
      `

      if (existingUserByEmail.length > 0) {
        console.log("❌ Email já existe")
        return NextResponse.json({ success: false, error: "Este email já está em uso" }, { status: 400 })
      }
    } catch (error) {
      console.error("❌ Erro ao verificar email:", error)
      return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
    }

    // Gerar username único
    let username = generateUsername(name, email)
    let usernameAttempts = 0
    const maxAttempts = 10

    // Verificar se username gerado já existe e gerar alternativas se necessário
    while (usernameAttempts < maxAttempts) {
      try {
        console.log(`🔍 Verificando username: ${username}`)
        const existingUserByUsername = await sql`
          SELECT id FROM users WHERE username = ${username} LIMIT 1
        `

        if (existingUserByUsername.length === 0) {
          console.log(`✅ Username disponível: ${username}`)
          break
        } else {
          // Gerar nova variação
          usernameAttempts++
          const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
          username = `${generateUsername(name, email)}${randomSuffix}`.substring(0, 20)
          console.log(`⚠️ Username já existe, tentando: ${username}`)
        }
      } catch (error) {
        console.error("❌ Erro ao verificar username:", error)
        return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
      }
    }

    if (usernameAttempts >= maxAttempts) {
      console.error("❌ Não foi possível gerar username único")
      return NextResponse.json({ success: false, error: "Erro ao gerar nome de usuário único" }, { status: 500 })
    }

    // Determinar tipo de usuário
    const userType = getUserTypeFromEmail(email)
    console.log(`✅ Tipo de usuário determinado: ${userType} para email: ${email}`)
    console.log(`✅ Username gerado: ${username}`)

    // Hash da senha
    let passwordHash
    try {
      console.log("🔐 Gerando hash da senha...")
      passwordHash = await bcrypt.hash(password, 12)
    } catch (error) {
      console.error("❌ Erro ao gerar hash da senha:", error)
      return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
    }

    // Gerar código de indicação para o novo usuário
    const [referralCodeResult] = await sql`
      SELECT 'USER' || nextval('users_id_seq') || '_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)) as code
    `
    const newUserReferralCode = referralCodeResult.code

    // Criar usuário
    let newUser
    try {
      console.log("👤 Criando usuário no banco...")
      const userResult = await sql`
        INSERT INTO users (email, name, username, phone, password_hash, user_type, affiliate_id, referred_by_user_id, referral_code, created_at)
        VALUES (${email}, ${name}, ${username}, ${phone}, ${passwordHash}, ${userType}, ${affiliateId || null}, ${referrerUserId || null}, ${newUserReferralCode}, NOW())
        RETURNING id, email, name, username, user_type, affiliate_id, referred_by_user_id, referral_code, created_at
      `

      if (userResult.length === 0) {
        throw new Error("Falha ao criar usuário")
      }

      newUser = userResult[0]
      console.log("✅ Usuário criado:", newUser.id, "Tipo:", newUser.user_type, "Username:", newUser.username)

      // 🔗 CRIAR REGISTRO DE INDICAÇÃO SE HOUVER
      if (referrerUserId) {
        console.log(`👥 Criando registro de indicação...`)

        await sql`
          INSERT INTO user_referrals (referrer_id, referred_id, referral_code, created_at)
          VALUES (${referrerUserId}, ${newUser.id}, ${userReferralCode}, NOW())
        `

        console.log(`✅ Indicação registrada: usuário ${referrerUserId} indicou usuário ${newUser.id}`)
      }

      if (affiliateId) {
        console.log(`🤝 Usuário vinculado ao afiliado ID: ${affiliateId}`)

        // Incrementar contador de referrals do afiliado
        await sql`
          UPDATE affiliates 
          SET total_referrals = total_referrals + 1,
              updated_at = NOW()
          WHERE id = ${affiliateId}
        `
      }
    } catch (error) {
      console.error("❌ Erro ao criar usuário:", error)
      return NextResponse.json({ success: false, error: "Erro ao criar usuário" }, { status: 500 })
    }

    // Criar carteira do usuário
    try {
      console.log("💰 Criando carteira do usuário...")
      const initialBalance = 0.0 // Todas as contas começam com saldo zero

      await sql`
        INSERT INTO wallets (user_id, balance, created_at, updated_at)
        VALUES (${newUser.id}, ${initialBalance}, NOW(), NOW())
      `

      console.log(`✅ Carteira criada com saldo inicial: R$ ${initialBalance}`)
    } catch (error) {
      console.error("❌ Erro ao criar carteira:", error)
      // Não retornar erro aqui, pois o usuário já foi criado
      console.log("⚠️ Continuando sem carteira...")
    }

    // Criar JWT token
    let token
    try {
      console.log("🎫 Criando token JWT...")
      token = await new SignJWT({
        userId: newUser.id,
        email: newUser.email,
        userType: newUser.user_type || "regular",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("24h")
        .setIssuedAt()
        .sign(secret)

      console.log("✅ Token criado com sucesso")
    } catch (error) {
      console.error("❌ Erro ao criar token:", error)
      return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
    }

    // Preparar resposta
    const response = NextResponse.json({
      success: true,
      message: "Usuário criado com sucesso",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
        user_type: newUser.user_type,
        affiliate_id: newUser.affiliate_id,
        referred_by_user_id: newUser.referred_by_user_id,
        referral_code: newUser.referral_code,
      },
      token,
    })

    // Definir cookie com o token
    try {
      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 86400, // 24 horas
        path: "/",
      })

      // Limpar cookies de referência após uso
      if (affiliateCode) {
        response.cookies.delete("affiliate_ref")
      }
      if (userReferralCode) {
        response.cookies.delete("user_ref")
      }

      console.log("✅ Cookie definido com sucesso")
    } catch (error) {
      console.error("❌ Erro ao definir cookie:", error)
      // Não retornar erro, pois o token ainda está na resposta
    }

    console.log("🎉 Registro concluído com sucesso!")
    return response
  } catch (error) {
    console.error("❌ Erro geral no registro:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
