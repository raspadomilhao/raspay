"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Zap, Volume2, VolumeX, Sparkles } from "lucide-react"
import { AuthClient } from "@/lib/auth-client"
import { FloatingBalance } from "@/components/floating-balance"
import { getRandomOverlayImage } from "@/lib/game-overlays"

interface UserProfile {
  user: {
    id: number
    email: string
    name: string
    user_type?: string
  }
  wallet: {
    balance: string | number
  }
}

interface GameState {
  scratchCanvases: HTMLCanvasElement[]
  contexts: CanvasRenderingContext2D[]
  scratchedAreas: number[]
  isScratching: boolean
  lastX: number
  lastY: number
  revealedCellsCount: number
  gameEnded: boolean
  hasWonRealPrize: boolean
  realPrizeAmount: number
}

const NUM_CELLS = 9
const GAME_PRICE = 5.0
const MAX_REPETITIONS_FOR_NON_WINNING = 2
const MAX_REPETITIONS_FOR_NON_WINNING_IN_WINNING_CARD = 2

// Configurações para usuários regulares
const regularConfig = {
  winFrequency: 0.65,
  scratchThreshold: 0.7,
  prizeConfig: {
    small: { values: [2, 3, 5, 8], frequency: 0.94 },
    medium: { values: [10, 15], frequency: 0.05 },
    large: { values: [15], frequency: 0.01 },
  },
}

// Configurações para bloggers
const bloggerConfig = {
  winFrequency: 0.75,
  scratchThreshold: 0.7,
  prizeConfig: {
    small: { values: [2, 3, 5, 8], frequency: 0.6 },
    medium: { values: [10, 25, 150], frequency: 0.3 },
    large: { values: [500, 1000], frequency: 0.1 },
  },
}

const winningSymbols = [
  ...regularConfig.prizeConfig.small.values,
  ...regularConfig.prizeConfig.medium.values,
  ...regularConfig.prizeConfig.large.values,
  ...bloggerConfig.prizeConfig.small.values,
  ...bloggerConfig.prizeConfig.medium.values,
  ...bloggerConfig.prizeConfig.large.values,
].map((val) => `R$${val}`)
const nonWinningSymbols = ["iPhone", "iPad", "Moto", "R$500", "R$1000", "R$5000", "R$10000"]
const allSymbols = [...winningSymbols, ...nonWinningSymbols]

const symbolImageMap = {
  Casa: { url: "https://i.imgur.com/jG8STSH.png", legend: "Casa 250 MIL" },
  Dinheiro: { url: "/images/Dinheiro.png", legendPrefix: "R$" },
  iPhone: { url: "/images/iphone.png", legend: "iPhone PRO MAX" },
  iPad: { url: "/images/ipad.png", legend: "iPad" },
  Moto: { url: "/images/moto.png", legend: "CG 160" },
  Carro: { url: "https://i.imgur.com/8xKjP2m.png", legend: "Carro 0KM" },
  Ouro: { url: "https://i.imgur.com/9mNvQ4r.png", legend: "Ouro" },
  Diamante: { url: "https://i.imgur.com/7kLmR3s.png", legend: "Diamante" },
}

const winMessages = [
  "Mega sorte! Ganhou R$@valor@!",
  "Parabéns! A mega sorte te premiou com R$@valor@!",
  "Que sorte incrível! R$@valor@ na sua conta!",
]

const loseMessages = [
  "Não foi desta vez, mas a mega sorte está chegando!",
  "Continue tentando, a sorte grande está próxima!",
  "A próxima pode ser a mega sorte da sua vida!",
]

const formatCurrency = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined) return "0.00"
  const numValue = typeof value === "string" ? Number.parseFloat(value) : value
  return isNaN(numValue) ? "0.00" : numValue.toFixed(2)
}

const isBlogger = (userProfile: UserProfile | null): boolean => {
  if (!userProfile) return false
  if (userProfile.user.user_type === "blogger") return true
  const bloggerEmails = [
    "blogueiro@teste.com",
    "influencer@demo.com",
    "streamer@content.com",
    "youtuber@test.com",
    "content@creator.com",
  ]
  return bloggerEmails.includes(userProfile.user.email.toLowerCase())
}

export default function MegaSortePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [gameLoading, setGameLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"win" | "lose">("lose")
  const [modalTitle, setModalTitle] = useState("")
  const [modalMessage, setModalMessage] = useState("")
  const [message, setMessage] = useState("Clique ou arraste para raspar!")
  const [canPlay, setCanPlay] = useState(false)
  const [gameActive, setGameActive] = useState(false)

  const router = useRouter()
  const scratchGridRef = useRef<HTMLDivElement>(null)
  const gameStateRef = useRef<GameState>({
    scratchCanvases: [],
    contexts: [],
    scratchedAreas: [],
    isScratching: false,
    lastX: 0,
    lastY: 0,
    revealedCellsCount: 0,
    gameEnded: false,
    hasWonRealPrize: false,
    realPrizeAmount: 0,
  })

  const audioScratchRef = useRef<HTMLAudioElement>(null)
  const audioWinRef = useRef<HTMLAudioElement>(null)
  const audioLoseRef = useRef<HTMLAudioElement>(null)
  const audioCoinRef = useRef<HTMLAudioElement>(null)
  const audioAmbientRef = useRef<HTMLAudioElement>(null)

  const getGameConfig = () => {
    return isBlogger(userProfile) ? bloggerConfig : regularConfig
  }

  const handleCloseModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setShowModal(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal(e)
    }
  }

  useEffect(() => {
    const token = AuthClient.getToken()
    if (token) {
      setIsLoggedIn(true)
      fetchUserProfile()
      setTimeout(() => {
        if (soundEnabled && audioAmbientRef.current) {
          audioAmbientRef.current.volume = 0.1
          audioAmbientRef.current.loop = true
          audioAmbientRef.current.play().catch(() => {})
        }
      }, 1000)
    } else {
      router.push("/auth")
    }
    return () => {
      if (audioAmbientRef.current) {
        audioAmbientRef.current.pause()
        audioAmbientRef.current.currentTime = 0
      }
    }
  }, [router, soundEnabled])

  const fetchUserProfile = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/user/profile")
      if (response.ok) {
        const profile = await response.json()
        setUserProfile(profile)
        const currentBalance = Number.parseFloat(profile.wallet.balance?.toString() || "0")
        setCanPlay(currentBalance >= GAME_PRICE)
      } else if (response.status === 401) {
        router.push("/auth")
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBalanceUpdate = (newBalance: number) => {
    setCanPlay(newBalance >= GAME_PRICE)
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        wallet: { ...userProfile.wallet, balance: newBalance },
      })
    }
  }

  const playSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  const toggleAmbientSound = () => {
    if (audioAmbientRef.current) {
      if (soundEnabled) {
        audioAmbientRef.current.volume = 0.1
        audioAmbientRef.current.loop = true
        audioAmbientRef.current.play().catch(() => {})
      } else {
        audioAmbientRef.current.pause()
      }
    }
  }

  const gerarPremioReal = () => {
    const config = getGameConfig()
    const random = Math.random()
    if (random < config.prizeConfig.small.frequency) {
      return config.prizeConfig.small.values[Math.floor(Math.random() * config.prizeConfig.small.values.length)]
    } else if (random < config.prizeConfig.small.frequency + config.prizeConfig.medium.frequency) {
      return config.prizeConfig.medium.values[Math.floor(Math.random() * config.prizeConfig.medium.values.length)]
    } else {
      return config.prizeConfig.large.values[Math.floor(Math.random() * config.prizeConfig.large.values.length)]
    }
  }

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  const createSymbolHtml = (symbolId: string) => {
    let imageUrl = ""
    let legendText = ""
    if (symbolId.startsWith("R$")) {
      imageUrl = symbolImageMap["Dinheiro"].url
      legendText = symbolId
    } else if (symbolImageMap[symbolId as keyof typeof symbolImageMap]) {
      const symbol = symbolImageMap[symbolId as keyof typeof symbolImageMap]
      imageUrl = symbol.url
      legendText = symbol.legend
    } else {
      return { imageUrl: "", legendText: symbolId }
    }
    return { imageUrl, legendText }
  }

  const generateScratchCardSymbols = () => {
    let finalSymbolIds = Array(NUM_CELLS).fill(null)
    const config = getGameConfig()
    gameStateRef.current.hasWonRealPrize = Math.random() < config.winFrequency
    gameStateRef.current.realPrizeAmount = 0
    if (gameStateRef.current.hasWonRealPrize) {
      const winningPrizeAmount = gerarPremioReal()
      const winningSymbolId = `R$${winningPrizeAmount}`
      gameStateRef.current.realPrizeAmount = winningPrizeAmount
      const prizePositions = new Set()
      while (prizePositions.size < 3) {
        prizePositions.add(Math.floor(Math.random() * NUM_CELLS))
      }
      prizePositions.forEach((pos) => {
        finalSymbolIds[pos] = winningSymbolId
      })
      const nonWinningFillPool: string[] = []
      nonWinningSymbols.forEach((symbolId) => {
        for (let k = 0; k < MAX_REPETITIONS_FOR_NON_WINNING_IN_WINNING_CARD; k++) {
          nonWinningFillPool.push(symbolId)
        }
      })
      shuffleArray(nonWinningFillPool)
      let currentFillIndex = 0
      for (let i = 0; i < NUM_CELLS; i++) {
        if (finalSymbolIds[i] === null) {
          finalSymbolIds[i] = nonWinningFillPool[currentFillIndex]
          currentFillIndex++
        }
      }
      shuffleArray(finalSymbolIds)
    } else {
      let generatedValid = false
      while (!generatedValid) {
        let tempSymbolIds = []
        const counts: { [key: string]: number } = {}
        const symbolPoolForNonWinning: string[] = []
        allSymbols.forEach((symbolId) => {
          for (let k = 0; k < MAX_REPETITIONS_FOR_NON_WINNING; k++) {
            symbolPoolForNonWinning.push(symbolId)
          }
        })
        shuffleArray(symbolPoolForNonWinning)
        tempSymbolIds = symbolPoolForNonWinning.slice(0, NUM_CELLS)
        generatedValid = true
        tempSymbolIds.forEach((sym) => {
          counts[sym] = (counts[sym] || 0) + 1
        })
        if (winningSymbols.some((ws) => counts[ws] === 3)) {
          generatedValid = false
        }
        for (const sym in counts) {
          if (counts[sym] > MAX_REPETITIONS_FOR_NON_WINNING) {
            generatedValid = false
            break
          }
        }
        if (generatedValid) {
          finalSymbolIds = tempSymbolIds
        }
      }
      shuffleArray(finalSymbolIds)
    }
    return finalSymbolIds
  }

  const drawScratchLayer = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (width === 0 || height === 0) return
    const overlayImageSrc = getRandomOverlayImage()
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = overlayImageSrc
    img.onload = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      ctx.globalCompositeOperation = "destination-out"
    }
    img.onerror = () => {
      ctx.fillStyle = "#4338CA"
      ctx.fillRect(0, 0, width, height)
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, "#6366F1")
      gradient.addColorStop(0.5, "#4F46E5")
      gradient.addColorStop(1, "#4338CA")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = "destination-out"
    }
  }

  const getEventPos = (canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent) => {
    const rect = canvas.getBoundingClientRect()
    let clientX, clientY
    if ("touches" in event) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const checkScratchProgress = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    if (canvas.width === 0 || canvas.height === 0) return
    const config = getGameConfig()
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparentPixels = 0
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) {
        transparentPixels++
      }
    }
    const totalPixels = canvas.width * canvas.height
    const percentageScratched = (transparentPixels / totalPixels) * 100
    if (percentageScratched > config.scratchThreshold * 100 && !gameStateRef.current.gameEnded) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < NUM_CELLS; i++) {
        if (gameStateRef.current.scratchedAreas[i] === 0) {
          gameStateRef.current.scratchedAreas[i] = 1
          revealSymbol(i)
        }
      }
    }
  }

  const revealSymbol = (index: number) => {
    const symbolElement = document.getElementById(`symbol-${index}`)
    if (symbolElement) {
      symbolElement.classList.remove("opacity-0", "scale-75")
      symbolElement.classList.add("opacity-100", "scale-100")
      gameStateRef.current.revealedCellsCount++
      checkGameEnd()
    }
  }

  const highlightWinningCells = () => {
    const winningSymbol = `R$${gameStateRef.current.realPrizeAmount}`
    for (let i = 0; i < NUM_CELLS; i++) {
      const symbolElement = document.getElementById(`symbol-${i}`)
      if (symbolElement) {
        const symbolSpan = symbolElement.querySelector("span")
        const symbolText = symbolSpan?.textContent || symbolElement.textContent
        if (symbolText === winningSymbol) {
          symbolElement.style.animation = "pulse 1.5s ease-in-out infinite"
          symbolElement.style.boxShadow = "0 0 25px rgba(99, 102, 241, 0.8), inset 0 0 25px rgba(99, 102, 241, 0.3)"
          symbolElement.style.border = "3px solid #6366F1"
          symbolElement.style.backgroundColor = "rgba(99, 102, 241, 0.15)"
          symbolElement.style.transform = "scale(1.05)"
          symbolElement.style.zIndex = "10"
          const img = symbolElement.querySelector("img")
          if (img) {
            img.style.filter = "brightness(1.3) drop-shadow(0 0 10px rgba(99, 102, 241, 0.8))"
          }
        }
      }
    }
  }

  const processGameResult = async () => {
    try {
      const response = await AuthClient.makeAuthenticatedRequest("/api/games/mega-sorte/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameResult: {
            hasWon: gameStateRef.current.hasWonRealPrize,
            prizeAmount: gameStateRef.current.realPrizeAmount,
          },
        }),
      })
      if (response.ok) {
        const result = await response.json()
        if (userProfile) {
          setUserProfile({
            ...userProfile,
            wallet: { ...userProfile.wallet, balance: result.newBalance },
          })
          setCanPlay(Number.parseFloat(result.newBalance) >= GAME_PRICE)
        }
      }
    } catch (error) {
      console.error("Erro ao processar resultado do jogo:", error)
    }
  }

  const checkGameEnd = () => {
    if (gameStateRef.current.revealedCellsCount === NUM_CELLS && !gameStateRef.current.gameEnded) {
      gameStateRef.current.gameEnded = true
      setGameActive(false)
      processGameResult()
      if (gameStateRef.current.hasWonRealPrize) {
        setTimeout(highlightWinningCells, 500)
        const messageText = winMessages[Math.floor(Math.random() * winMessages.length)].replace(
          "@valor@",
          `${gameStateRef.current.realPrizeAmount}`,
        )
        setMessage(messageText)
        playSound(audioWinRef)
        playSound(audioCoinRef)
        setModalType("win")
        setModalTitle("Mega Sorte!")
        setModalMessage(messageText)
        setShowModal(true)
      } else {
        const messageText = loseMessages[Math.floor(Math.random() * loseMessages.length)]
        setMessage(messageText)
        playSound(audioLoseRef)
        setModalType("lose")
        setModalTitle("Continue Tentando!")
        setModalMessage(messageText)
        setShowModal(true)
      }
    }
  }

  const handleStartScratch = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    if (gameStateRef.current.gameEnded) return
    gameStateRef.current.isScratching = true
    const pos = getEventPos(canvas, e)
    gameStateRef.current.lastX = pos.x
    gameStateRef.current.lastY = pos.y
    playSound(audioScratchRef)
  }

  const handleScratch = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    if (!gameStateRef.current.isScratching || gameStateRef.current.gameEnded) return
    e.preventDefault()
    const pos = getEventPos(canvas, e)
    ctx.beginPath()
    ctx.moveTo(gameStateRef.current.lastX, gameStateRef.current.lastY)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = "rgba(0,0,0,1)"
    ctx.lineWidth = 40
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
    gameStateRef.current.lastX = pos.x
    gameStateRef.current.lastY = pos.y
    checkScratchProgress(canvas, ctx)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    const regionWidth = canvas.width / 3
    const regionHeight = canvas.height / 3
    for (let region = 0; region < NUM_CELLS; region++) {
      const row = Math.floor(region / 3)
      const col = region % 3
      const startX = Math.floor(col * regionWidth)
      const startY = Math.floor(row * regionHeight)
      const endX = Math.floor((col + 1) * regionWidth)
      const endY = Math.floor((row + 1) * regionHeight)
      let hasTransparentPixels = false
      for (let y = startY; y < endY && !hasTransparentPixels; y++) {
        for (let x = startX; x < endX && !hasTransparentPixels; x++) {
          const pixelIndex = (y * canvas.width + x) * 4
          if (pixelIndex < pixels.length && pixels[pixelIndex + 3] === 0) {
            hasTransparentPixels = true
          }
        }
      }
      if (hasTransparentPixels) {
        const symbolElement = document.getElementById(`symbol-${region}`)
        if (symbolElement && !symbolElement.classList.contains("opacity-100")) {
          symbolElement.classList.remove("opacity-0", "scale-75")
          symbolElement.classList.add("opacity-100", "scale-100")
        }
      }
    }
  }

  const handleEndScratch = () => {
    if (gameStateRef.current.isScratching) {
      gameStateRef.current.isScratching = false
      if (audioScratchRef.current && !audioScratchRef.current.paused) {
        audioScratchRef.current.pause()
        audioScratchRef.current.currentTime = 0
      }
    }
  }

  const scratchAllCells = () => {
    if (gameStateRef.current.gameEnded) return
    const canvas = gameStateRef.current.scratchCanvases[0]
    const ctx = gameStateRef.current.contexts[0]
    canvas.style.pointerEvents = "none"
    const animationDuration = 2000
    const startTime = Date.now()
    const scratchRadius = 30
    const scratchPoints: { x: number; y: number; revealed: boolean }[] = []
    const numPoints = 150
    for (let i = 0; i < numPoints; i++) {
      scratchPoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        revealed: false,
      })
    }
    const animateScratch = () => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / animationDuration, 1)
      const pointsToReveal = Math.floor(progress * scratchPoints.length)
      for (let i = 0; i < pointsToReveal; i++) {
        if (!scratchPoints[i].revealed) {
          scratchPoints[i].revealed = true
          ctx.globalCompositeOperation = "destination-out"
          ctx.beginPath()
          ctx.arc(scratchPoints[i].x, scratchPoints[i].y, scratchRadius, 0, Math.PI * 2)
          ctx.fill()
          if (i % 10 === 0) {
            playSound(audioScratchRef)
          }
        }
      }
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data
      const regionWidth = canvas.width / 3
      const regionHeight = canvas.height / 3
      for (let region = 0; region < NUM_CELLS; region++) {
        if (gameStateRef.current.scratchedAreas[region] === 0) {
          const row = Math.floor(region / 3)
          const col = region % 3
          const startX = Math.floor(col * regionWidth)
          const startY = Math.floor(row * regionHeight)
          const endX = Math.floor((col + 1) * regionWidth)
          const endY = Math.floor((row + 1) * regionHeight)
          let transparentPixels = 0
          let totalPixels = 0
          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const pixelIndex = (y * canvas.width + x) * 4
              if (pixelIndex < pixels.length) {
                totalPixels++
                if (pixels[pixelIndex + 3] === 0) {
                  transparentPixels++
                }
              }
            }
          }
          const regionProgress = transparentPixels / totalPixels
          if (regionProgress > 0.3) {
            gameStateRef.current.scratchedAreas[region] = 1
            revealSymbol(region)
          }
        }
      }
      if (progress < 1) {
        requestAnimationFrame(animateScratch)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        for (let i = 0; i < NUM_CELLS; i++) {
          if (gameStateRef.current.scratchedAreas[i] === 0) {
            gameStateRef.current.scratchedAreas[i] = 1
            revealSymbol(i)
          }
        }
      }
    }
    animateScratch()
  }

  const initGame = async () => {
    if (!canPlay) {
      router.push("/deposito")
      return
    }
    setGameLoading(true)
    setGameActive(true)
    try {
      gameStateRef.current = {
        scratchCanvases: [],
        contexts: [],
        scratchedAreas: [],
        isScratching: false,
        lastX: 0,
        lastY: 0,
        revealedCellsCount: 0,
        gameEnded: false,
        hasWonRealPrize: false,
        realPrizeAmount: 0,
      }
      setMessage("Clique ou arraste para raspar a mega sorte!")
      setShowModal(false)
      if (scratchGridRef.current) {
        scratchGridRef.current.innerHTML = ""
      }
      const symbolIds = generateScratchCardSymbols()
      const gameContainer = document.createElement("div")
      gameContainer.className =
        "relative w-full aspect-square bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-blue-400/30 shadow-2xl shadow-blue-500/10"
      const symbolsGrid = document.createElement("div")
      symbolsGrid.className = "absolute inset-0 grid grid-cols-3 gap-2 p-3"
      for (let i = 0; i < NUM_CELLS; i++) {
        const cellContent = document.createElement("div")
        cellContent.className =
          "flex flex-col justify-center items-center text-blue-300 font-bold bg-gray-800/70 rounded-lg p-2 opacity-0 scale-75 transition-all duration-300"
        cellContent.id = `symbol-${i}`
        const symbol = createSymbolHtml(symbolIds[i])
        if (symbol.imageUrl) {
          const img = document.createElement("img")
          img.src = symbol.imageUrl
          img.alt = symbol.legendText
          img.className = "w-full h-auto max-w-[40px] max-h-[40px] object-contain mb-1"
          img.onerror = () => {
            img.src = `https://placehold.co/40x40/4338CA/6366F1?text=${encodeURIComponent(symbolIds[i])}`
          }
          cellContent.appendChild(img)
          const legend = document.createElement("span")
          legend.textContent = symbol.legendText
          legend.className = "text-xs text-gray-300"
          cellContent.appendChild(legend)
        } else {
          cellContent.textContent = symbol.legendText
        }
        symbolsGrid.appendChild(cellContent)
      }
      gameContainer.appendChild(symbolsGrid)
      const canvas = document.createElement("canvas")
      canvas.className = "absolute inset-0 w-full h-full cursor-crosshair touch-none z-10"
      gameContainer.appendChild(canvas)
      if (scratchGridRef.current) {
        scratchGridRef.current.innerHTML = ""
        scratchGridRef.current.appendChild(gameContainer)
      }
      const ctx = canvas.getContext("2d")!
      gameStateRef.current.contexts = [ctx]
      gameStateRef.current.scratchCanvases = [canvas]
      gameStateRef.current.scratchedAreas = Array(NUM_CELLS).fill(0)
      setTimeout(() => {
        const canvas = gameStateRef.current.scratchCanvases[0]
        const container = canvas.parentElement!
        canvas.width = container.offsetWidth
        canvas.height = container.offsetHeight
        const ctx = gameStateRef.current.contexts[0]
        drawScratchLayer(ctx, canvas.width, canvas.height)
        const handleMouseDown = (e: MouseEvent) => handleStartScratch(e, canvas, ctx)
        const handleMouseMove = (e: MouseEvent) => handleScratch(e, canvas, ctx)
        const handleTouchStart = (e: TouchEvent) => handleStartScratch(e, canvas, ctx)
        const handleTouchMove = (e: TouchEvent) => handleScratch(e, canvas, ctx)
        canvas.addEventListener("mousedown", handleMouseDown)
        canvas.addEventListener("mousemove", handleMouseMove)
        canvas.addEventListener("mouseup", handleEndScratch)
        canvas.addEventListener("mouseleave", handleEndScratch)
        canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
        canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
        canvas.addEventListener("touchend", handleEndScratch)
        canvas.addEventListener("touchcancel", handleEndScratch)
      }, 200)
    } catch (error) {
      console.error("Erro ao iniciar jogo:", error)
    } finally {
      setGameLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Carregando Jogo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <FloatingBalance userProfile={userProfile} onBalanceUpdate={handleBalanceUpdate} />

      <audio ref={audioScratchRef} src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/scracht-DVz6L8r3qW5VR8v5gAeOqiJFGY4up1.mp3" preload="auto" />
      <audio ref={audioWinRef} src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SOM%20DE%20MOEDAS-UziNdUZNUfuCiRBbXABOrHUSaT2CcP.mp3" preload="auto" />
      <audio ref={audioLoseRef} src="/sounds/lose.mp3" preload="auto" />
      <audio ref={audioCoinRef} src="/sounds/coin.mp3" preload="auto" />
      <audio ref={audioAmbientRef} src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fantasy%20Dream%20Music%20-%20Dessert%20Land%20%E2%98%85924%20_%20Soothing%2C%20Beautiful%20%282%29-FxmO0t8tSiZUth7OsRAv6ykMhrRHQX.mp3" preload="auto" loop />

      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 opacity-70"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.1)_0,_transparent_60%)]"></div>

      <main className="relative z-10 max-w-md mx-auto px-4 py-8 min-h-screen flex flex-col justify-center">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Mega Sorte
          </h1>
          <p className="text-blue-200/80 mt-1">Encontre 3 símbolos iguais para ganhar!</p>
        </div>

        <div ref={scratchGridRef} className="mb-6" />

        <div className="flex flex-col space-y-4">
          {gameActive && !gameStateRef.current.gameEnded && gameStateRef.current.scratchCanvases.length > 0 && (
            <Button
              onClick={scratchAllCells}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg border border-white/20 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Raspar Tudo
            </Button>
          )}

          {!gameActive && (
            <Button
              onClick={initGame}
              disabled={gameLoading || !canPlay}
              className="w-full font-bold py-3 text-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg shadow-lg shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
              {gameLoading
                ? "Preparando..."
                : gameStateRef.current.scratchCanvases.length > 0
                  ? "Jogar Novamente"
                  : "Iniciar Jogo"}
              <span className="ml-2 opacity-80 text-sm font-normal">(R$ {GAME_PRICE.toFixed(2)})</span>
            </Button>
          )}

          {!canPlay && !loading && (
            <div className="text-center p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">Saldo insuficiente.</p>
              <Button onClick={() => router.push("/deposito")} variant="link" className="text-red-300 h-auto p-0 mt-1">
                Depositar agora
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm mt-8 text-gray-400">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-blue-400" />
            <span>Preço por Jogo: R$ {GAME_PRICE.toFixed(2)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              toggleAmbientSound()
            }}
            className="text-gray-400 hover:text-blue-400 h-8 w-8 rounded-full"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          <Card
            className={`bg-gray-800/80 border-2 p-6 w-full max-w-xs text-center transform transition-all duration-300 ${showModal ? "scale-100 opacity-100" : "scale-95 opacity-0"} ${modalType === "win" ? "border-green-500 shadow-2xl shadow-green-500/30" : "border-red-500 shadow-2xl shadow-red-500/30"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={`text-2xl font-bold mb-2 ${modalType === "win" ? "text-green-400" : "text-red-400"}`}>
              {modalTitle}
            </h2>
            <p className="text-gray-300 mb-6">{modalMessage}</p>
            <Button
              type="button"
              onClick={handleCloseModal}
              className={`w-full font-bold py-2 text-sm rounded-lg ${modalType === "win" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} text-white`}
            >
              {modalType === "win" ? "Coletar Prêmio!" : "Tentar Novamente"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
