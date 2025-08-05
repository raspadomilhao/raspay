const webpush = require("web-push")

console.log("🔑 Gerando chaves VAPID...")

try {
  const vapidKeys = webpush.generateVAPIDKeys()

  console.log("✅ Chaves VAPID geradas com sucesso!")
  console.log("")
  console.log("📋 Adicione estas variáveis de ambiente no Vercel:")
  console.log("")
  console.log("VAPID_PUBLIC_KEY=" + vapidKeys.publicKey)
  console.log("VAPID_PRIVATE_KEY=" + vapidKeys.privateKey)
  console.log("")
  console.log("🔧 Também adicione a chave pública como variável pública:")
  console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY=" + vapidKeys.publicKey)
  console.log("")
  console.log("⚠️  IMPORTANTE: Mantenha a chave privada segura!")
} catch (error) {
  console.error("❌ Erro ao gerar chaves VAPID:", error)
  console.log("")
  console.log("💡 Certifique-se de que o web-push está instalado:")
  console.log("npm install web-push")
}
