import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const requestBody = {
      client_key: process.env.HORSEPAY_CLIENT_KEY || "9a65f43615f29a41f878554c1f12d89063238d611217b29898be7385b6b7c141",
      client_secret:
        process.env.HORSEPAY_CLIENT_SECRET || "744e4cc40b849734ba2849f96c87b016feac05e84a5566e9517d028e1ffddc60",
    }

    const response = await fetch("https://api.horsepay.io/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    const responseText = await response.text()

    if (response.ok) {
      const data = JSON.parse(responseText)
      return NextResponse.json({ success: true, access_token: data.access_token })
    } else {
      return NextResponse.json(
        { success: false, error: `HTTP ${response.status}: ${responseText}` },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Erro na autenticação HorsePay:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
