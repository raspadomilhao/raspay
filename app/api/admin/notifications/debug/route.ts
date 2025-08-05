import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  try {
    if (action === "info") {
      return NextResponse.json({
        success: true,
        info: {
          environment: process.env.NODE_ENV,
          hasVapidPublic: !!process.env.VAPID_PUBLIC_KEY,
          hasVapidPrivate: !!process.env.VAPID_PRIVATE_KEY,
          hasNextPublicVapid: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get("user-agent"),
          protocol: request.headers.get("x-forwarded-proto") || "unknown",
        },
      })
    }

    if (action === "test") {
      // Simular envio de notificação de teste
      const testResponse = await fetch(`${request.nextUrl.origin}/api/admin/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "send",
          notification: {
            title: "🐛 Debug Test - Raspay",
            body: "Esta é uma notificação de teste do sistema de debug",
            icon: "/icon-192.png",
            tag: "debug-test",
            data: {
              url: "/adminconfig",
              type: "debug",
              timestamp: Date.now(),
            },
          },
        }),
      })

      const testData = await testResponse.json()

      return NextResponse.json({
        success: true,
        testResult: testData,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: false,
      error: "Ação inválida. Use ?action=info ou ?action=test",
    })
  } catch (error) {
    console.error("❌ Erro na API de debug:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    })
  }
}
