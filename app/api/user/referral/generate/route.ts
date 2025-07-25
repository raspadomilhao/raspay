import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getUserById, sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    console.log("🔗 Gerando link de indicação...")

    const auth = await verifyAuth(request)
    if (!auth) {
      console.log("❌ Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const user = await getUserById(auth.userId)
    if (!user) {
      console.log("❌ Usuário não encontrado")
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Se o usuário não tem código de indicação, gerar um
    let referralCode = user.referral_code
    if (!referralCode) {
      console.log("🔄 Gerando novo código de indicação...")

      // Gerar código único
      const [result] = await sql`
        SELECT generate_user_referral_code(${auth.userId}) as code
      `
      referralCode = result.code

      // Atualizar usuário com o código
      await sql`
        UPDATE users 
        SET referral_code = ${referralCode}
        WHERE id = ${auth.userId}
      `

      console.log(`✅ Código gerado: ${referralCode}`)
    }

    // Gerar URL completa
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://raspay.vercel.app"
    const referralUrl = `${baseUrl}/auth?ref=${referralCode}`

    console.log(`🔗 Link de indicação gerado: ${referralUrl}`)

    return NextResponse.json({
      success: true,
      referral_code: referralCode,
      referral_url: referralUrl,
      bonus_amount: 5.0,
      message: "Link de indicação gerado com sucesso!",
    })
  } catch (error) {
    console.error("❌ Erro ao gerar link de indicação:", error)
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
