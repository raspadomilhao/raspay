import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const adminToken = request.headers.get("X-Admin-Token")
    if (!adminToken) {
      return NextResponse.json({ error: "Token de admin necessário" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File
    const imageId = formData.get("imageId") as string

    if (!file || !imageId) {
      return NextResponse.json({ error: "Arquivo e ID da imagem são obrigatórios" }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido. Use JPG, PNG ou WebP" }, { status: 400 })
    }

    // Validar tamanho (5MB máximo)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 5MB" }, { status: 400 })
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), "public", "images")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Gerar nome do arquivo
    const fileExtension = file.name.split(".").pop()
    const fileName = `carousel-banner-${imageId}.${fileExtension}`
    const filePath = join(uploadDir, fileName)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // URL da imagem
    const imageUrl = `/images/${fileName}?t=${Date.now()}` // Cache busting

    return NextResponse.json({
      success: true,
      url: imageUrl,
      message: "Imagem enviada com sucesso",
    })
  } catch (error) {
    console.error("Erro no upload da imagem:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
