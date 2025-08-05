const crypto = require("crypto")

function urlBase64Encode(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function generateVapidKeys() {
  // Gerar par de chaves ECDSA P-256
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    publicKeyEncoding: {
      type: "spki",
      format: "der",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "der",
    },
  })

  // Extrair a chave pública (remover os primeiros 26 bytes do cabeçalho DER)
  const publicKeyBuffer = publicKey.slice(26)

  // Extrair a chave privada (remover os primeiros 36 bytes do cabeçalho DER)
  const privateKeyBuffer = privateKey.slice(36)

  // Codificar em base64url
  const publicKeyBase64 = urlBase64Encode(publicKeyBuffer)
  const privateKeyBase64 = urlBase64Encode(privateKeyBuffer)

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64,
  }
}

// Gerar as chaves
const vapidKeys = generateVapidKeys()

console.log("=======================================")
console.log("🔑 CHAVES VAPID GERADAS COM SUCESSO!")
console.log("=======================================")
console.log("")
console.log("📋 COPIE ESTAS CHAVES PARA SUAS VARIÁVEIS DE AMBIENTE:")
console.log("")
console.log("VAPID_PUBLIC_KEY:")
console.log(vapidKeys.publicKey)
console.log("")
console.log("VAPID_PRIVATE_KEY:")
console.log(vapidKeys.privateKey)
console.log("")
console.log("=======================================")
console.log("⚠️  IMPORTANTE:")
console.log("- Mantenha a chave privada segura")
console.log("- Nunca exponha a chave privada publicamente")
console.log("- Use essas chaves apenas neste projeto")
console.log("=======================================")

// Também salvar em um arquivo .env.example para referência
const fs = require("fs")
const envContent = `# Chaves VAPID para Web Push Notifications
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`

try {
  fs.writeFileSync(".env.vapid", envContent)
  console.log("✅ Chaves salvas em .env.vapid para referência")
} catch (error) {
  console.log("⚠️  Não foi possível salvar o arquivo .env.vapid")
}

console.log("")
console.log("🚀 Agora você pode adicionar essas chaves nas variáveis de ambiente do Vercel!")
