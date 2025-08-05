const webpush = require("web-push")

console.log("🔑 Gerando chaves VAPID...")

const vapidKeys = webpush.generateVAPIDKeys()

console.log("\n✅ Chaves VAPID geradas com sucesso!")
console.log("\n📋 Adicione estas variáveis de ambiente no Vercel:")
console.log("\n🔑 VAPID_PUBLIC_KEY:")
console.log(vapidKeys.publicKey)
console.log("\n🔐 VAPID_PRIVATE_KEY:")
console.log(vapidKeys.privateKey)
console.log("\n📧 VAPID_EMAIL:")
console.log("admin@raspay.space")
console.log("\n🌐 NEXT_PUBLIC_VAPID_PUBLIC_KEY:")
console.log(vapidKeys.publicKey)

console.log("\n📝 Comandos para adicionar no Vercel CLI:")
console.log(`vercel env add VAPID_PUBLIC_KEY`)
console.log(`vercel env add VAPID_PRIVATE_KEY`)
console.log(`vercel env add VAPID_EMAIL`)
console.log(`vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY`)

console.log("\n🚀 Após configurar as variáveis, faça o deploy novamente!")
