import type { NextRequest } from "next/server"

interface SSEConnection {
  id: string
  writer: WritableStreamDefaultWriter
  send: (data: string) => Promise<void>
}

// Store para manter as conexões ativas
const activeConnections = new Set<SSEConnection>()

// Export the connections so other endpoints can use it
export { activeConnections }

export async function GET(request: NextRequest) {
  console.log("🔌 Nova conexão SSE para notificações")

  // Create a TransformStream for SSE
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  // Create connection object
  const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const connection: SSEConnection = {
    id: connectionId,
    writer: writer,
    send: async (data: string) => {
      try {
        await writer.write(encoder.encode(`data: ${data}\n\n`))
      } catch (error) {
        console.error("Erro ao enviar para conexão:", error)
        activeConnections.delete(connection)
        throw error
      }
    },
  }

  activeConnections.add(connection)
  console.log(`📊 Total de conexões ativas: ${activeConnections.size}`)

  // Send connection event
  try {
    await connection.send(
      JSON.stringify({
        type: "CONNECTED",
        message: "Conectado ao sistema de notificações",
        timestamp: Date.now(),
        connectionId: connectionId,
      }),
    )
  } catch (error) {
    console.error("Erro ao enviar evento de conexão:", error)
    activeConnections.delete(connection)
  }

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(async () => {
    try {
      await connection.send(
        JSON.stringify({
          type: "HEARTBEAT",
          timestamp: Date.now(),
        }),
      )
    } catch (error) {
      console.log("Conexão SSE fechada no heartbeat")
      clearInterval(heartbeat)
      activeConnections.delete(connection)
    }
  }, 30000) // 30 seconds

  // Cleanup when connection closes
  const cleanup = () => {
    console.log("🔌 Limpando conexão SSE:", connectionId)
    clearInterval(heartbeat)
    activeConnections.delete(connection)
    try {
      writer.close()
    } catch (error) {
      // Writer might already be closed
    }
  }

  request.signal.addEventListener("abort", cleanup)

  // Also cleanup on stream error
  stream.readable.addEventListener("error", cleanup)

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  })
}
