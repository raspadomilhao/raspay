import type React from "react"
import type { Metadata } from "next"
import { Inter, Orbitron } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" })

export const metadata: Metadata = {
  title: "RasPay - Jogos de Raspadinha Online",
  description: "Jogue raspadinhas online e ganhe prêmios incríveis! Depósitos via PIX, jogos seguros e saques rápidos.",
  keywords: "raspadinha, jogos online, PIX, prêmios, apostas, sorte, RasPay",
  authors: [{ name: "RasPay" }],
  creator: "RasPay",
  publisher: "RasPay",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "RasPay - Jogos de Raspadinha Online",
    description:
      "Jogue raspadinhas online e ganhe prêmios incríveis! Depósitos via PIX, jogos seguros e saques rápidos.",
    type: "website",
    locale: "pt_BR",
    siteName: "RasPay",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "RasPay - Mascote Coelho",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RasPay - Jogos de Raspadinha Online",
    description:
      "Jogue raspadinhas online e ganhe prêmios incríveis! Depósitos via PIX, jogos seguros e saques rápidos.",
    images: ["/icon-512.png"],
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#000000",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${orbitron.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/icon-512.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
