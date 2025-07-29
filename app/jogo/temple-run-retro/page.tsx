"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TempleRunRetroGame() {
  const mountRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadThreeJS = async () => {
      const THREE = await import("three")

      if (!mountRef.current || gameRef.current) return

      // Configuração da cena estilo PS2
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
      const renderer = new THREE.WebGLRenderer({
        antialias: false, // Desabilitar antialiasing para visual pixelado
        precision: "lowp", // Baixa precisão para performance PS2
      })

      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x8b4b8b) // Cor roxa/magenta típica do PS2
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.BasicShadowMap // Sombras simples

      // Fog denso estilo PS2 para esconder pop-in
      scene.fog = new THREE.Fog(0x8b4b8b, 10, 40)

      mountRef.current.appendChild(renderer.domElement)

      // Iluminação básica estilo console antigo
      const ambientLight = new THREE.AmbientLight(0x404040, 0.8)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
      directionalLight.position.set(5, 10, 5)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 512 // Baixa resolução de sombra
      directionalLight.shadow.mapSize.height = 512
      scene.add(directionalLight)

      // Variáveis do jogo
      let gameState = {
        running: false,
        speed: 0.15,
        score: 0,
        playerLane: 0,
        playerY: 0,
        jumping: false,
        sliding: false,
        gameOver: false,
      }

      // Função para criar textura pixelada estilo PS2
      function createPixelTexture(width: number, height: number, colors: string[]) {
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")!

        const pixelSize = 4
        for (let x = 0; x < width; x += pixelSize) {
          for (let y = 0; y < height; y += pixelSize) {
            const color = colors[Math.floor(Math.random() * colors.length)]
            ctx.fillStyle = color
            ctx.fillRect(x, y, pixelSize, pixelSize)
          }
        }

        const texture = new THREE.CanvasTexture(canvas)
        texture.magFilter = THREE.NearestFilter // Filtro pixelado
        texture.minFilter = THREE.NearestFilter
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        return texture
      }

      // Texturas estilo PS2 com paleta limitada
      const groundTexture = createPixelTexture(64, 64, ["#8B4513", "#A0522D", "#CD853F", "#D2691E", "#654321"])
      groundTexture.repeat.set(4, 4)

      const wallTexture = createPixelTexture(32, 32, ["#696969", "#808080", "#A9A9A9", "#778899", "#2F4F4F"])

      const coinTexture = createPixelTexture(16, 16, ["#FFD700", "#FFA500", "#FF8C00", "#DAA520"])

      // Criar jogador estilo low-poly PS2
      const playerGroup = new THREE.Group()

      // Corpo blocky
      const bodyGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3)
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: 0xff4444,
        flatShading: true, // Shading plano estilo PS2
      })
      const playerBody = new THREE.Mesh(bodyGeometry, bodyMaterial)
      playerBody.position.y = 0.3
      playerBody.castShadow = true
      playerGroup.add(playerBody)

      // Cabeça cúbica
      const headGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25)
      const headMaterial = new THREE.MeshLambertMaterial({
        color: 0xffdbb5,
        flatShading: true,
      })
      const playerHead = new THREE.Mesh(headGeometry, headMaterial)
      playerHead.position.y = 0.75
      playerHead.castShadow = true
      playerGroup.add(playerHead)

      // Braços blocky
      const armGeometry = new THREE.BoxGeometry(0.08, 0.3, 0.08)
      const armMaterial = new THREE.MeshLambertMaterial({
        color: 0xff4444,
        flatShading: true,
      })

      const leftArm = new THREE.Mesh(armGeometry, armMaterial)
      leftArm.position.set(-0.25, 0.4, 0)
      leftArm.castShadow = true
      playerGroup.add(leftArm)

      const rightArm = new THREE.Mesh(armGeometry, armMaterial)
      rightArm.position.set(0.25, 0.4, 0)
      rightArm.castShadow = true
      playerGroup.add(rightArm)

      // Pernas blocky
      const legGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1)
      const legMaterial = new THREE.MeshLambertMaterial({
        color: 0x0066cc,
        flatShading: true,
      })

      const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
      leftLeg.position.set(-0.08, -0.05, 0)
      leftLeg.castShadow = true
      playerGroup.add(leftLeg)

      const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
      rightLeg.position.set(0.08, -0.05, 0)
      rightLeg.castShadow = true
      playerGroup.add(rightLeg)

      playerGroup.position.set(0, 0.5, 0)
      scene.add(playerGroup)

      // Arrays para elementos do jogo
      const trackSegments: THREE.Mesh[] = []
      const obstacles: THREE.Group[] = []
      const coins: THREE.Group[] = []
      const decorations: THREE.Group[] = []

      // Função para criar árvore low-poly
      function createRetroTree(x: number, z: number) {
        const treeGroup = new THREE.Group()

        // Tronco simples
        const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1.5, 6) // Poucos segmentos
        const trunkMaterial = new THREE.MeshLambertMaterial({
          color: 0x8b4513,
          flatShading: true,
        })
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
        trunk.position.y = 0.75
        trunk.castShadow = true
        treeGroup.add(trunk)

        // Copa triangular low-poly
        const leavesGeometry = new THREE.ConeGeometry(0.6, 1.2, 6) // Cone simples
        const leavesMaterial = new THREE.MeshLambertMaterial({
          color: 0x228b22,
          flatShading: true,
        })
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial)
        leaves.position.y = 2
        leaves.castShadow = true
        treeGroup.add(leaves)

        treeGroup.position.set(x, 0, z)
        scene.add(treeGroup)
        decorations.push(treeGroup)
      }

      // Função para criar rocha low-poly
      function createRetroRock(x: number, z: number) {
        const rockGroup = new THREE.Group()

        // Rocha como octaedro simples
        const rockGeometry = new THREE.OctahedronGeometry(0.3, 0) // Sem subdivisões
        const rockMaterial = new THREE.MeshLambertMaterial({
          color: 0x696969,
          flatShading: true,
        })
        const rock = new THREE.Mesh(rockGeometry, rockMaterial)
        rock.castShadow = true
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
        rockGroup.add(rock)

        rockGroup.position.set(x, 0.3, z)
        scene.add(rockGroup)
        decorations.push(rockGroup)
      }

      // Função para criar segmento da pista estilo PS2
      function createRetroTrackSegment(z: number) {
        const trackGeometry = new THREE.PlaneGeometry(6, 20, 1, 1) // Sem subdivisões
        const trackMaterial = new THREE.MeshLambertMaterial({
          map: groundTexture,
          color: 0xffffff,
        })
        const track = new THREE.Mesh(trackGeometry, trackMaterial)
        track.rotation.x = -Math.PI / 2
        track.position.set(0, 0, z)
        track.receiveShadow = true
        scene.add(track)
        trackSegments.push(track)

        // Linhas da pista com cores chapadas
        for (let lane = -1; lane <= 1; lane++) {
          if (lane !== 0) {
            const lineGeometry = new THREE.BoxGeometry(0.1, 0.05, 20)
            const lineMaterial = new THREE.MeshLambertMaterial({
              color: 0xffff00, // Amarelo vibrante
              emissive: 0x111100,
            })
            const line = new THREE.Mesh(lineGeometry, lineMaterial)
            line.position.set(lane * 1.5, 0.025, z)
            scene.add(line)
            trackSegments.push(line)
          }
        }

        // Paredes laterais estilo corredor
        for (let side = -1; side <= 1; side += 2) {
          const wallGeometry = new THREE.BoxGeometry(0.5, 3, 20)
          const wallMaterial = new THREE.MeshLambertMaterial({
            map: wallTexture,
            color: 0xcccccc,
          })
          const wall = new THREE.Mesh(wallGeometry, wallMaterial)
          wall.position.set(side * 3.5, 1.5, z)
          wall.castShadow = true
          wall.receiveShadow = true
          scene.add(wall)
          trackSegments.push(wall)
        }

        // Adicionar decorações
        if (Math.random() < 0.4) {
          const side = Math.random() < 0.5 ? -5 : 5
          if (Math.random() < 0.6) {
            createRetroTree(side, z + Math.random() * 15 - 7.5)
          } else {
            createRetroRock(side, z + Math.random() * 15 - 7.5)
          }
        }
      }

      // Função para criar obstáculo estilo PS2
      function createRetroObstacle(lane: number, z: number) {
        const obstacleGroup = new THREE.Group()

        // Obstáculo como prisma simples
        const obstacleGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6)
        const obstacleMaterial = new THREE.MeshLambertMaterial({
          map: wallTexture,
          color: 0x8b4513,
          flatShading: true,
        })
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial)
        obstacle.position.y = 0.6
        obstacle.castShadow = true
        obstacleGroup.add(obstacle)

        // Topo piramidal
        const topGeometry = new THREE.ConeGeometry(0.4, 0.4, 4) // Pirâmide de 4 lados
        const topMaterial = new THREE.MeshLambertMaterial({
          color: 0xff0000,
          flatShading: true,
        })
        const top = new THREE.Mesh(topGeometry, topMaterial)
        top.position.y = 1.4
        top.castShadow = true
        obstacleGroup.add(top)

        obstacleGroup.position.set(lane * 1.5, 0, z)
        scene.add(obstacleGroup)
        obstacles.push(obstacleGroup)
      }

      // Função para criar moeda estilo PS2
      function createRetroCoin(lane: number, z: number) {
        const coinGroup = new THREE.Group()

        // Moeda como octógono simples
        const coinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8) // 8 lados
        const coinMaterial = new THREE.MeshLambertMaterial({
          map: coinTexture,
          color: 0xffd700,
          emissive: 0x332200,
          flatShading: true,
        })
        const coin = new THREE.Mesh(coinGeometry, coinMaterial)
        coin.castShadow = true
        coinGroup.add(coin)

        coinGroup.position.set(lane * 1.5, 1, z)
        scene.add(coinGroup)
        coins.push(coinGroup)
      }

      // Sistema de partículas estilo PS2 (sprites quadrados)
      function createRetroParticles(position: THREE.Vector3, color: number) {
        for (let i = 0; i < 8; i++) {
          const particleGeometry = new THREE.PlaneGeometry(0.1, 0.1)
          const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
          })
          const particle = new THREE.Mesh(particleGeometry, particleMaterial)

          particle.position.copy(position)
          particle.position.add(
            new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2),
          )

          scene.add(particle)

          // Animar partícula
          const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.3,
            (Math.random() - 0.5) * 0.2,
          )

          const animateParticle = () => {
            particle.position.add(velocity)
            velocity.y -= 0.01 // Gravidade
            particleMaterial.opacity *= 0.95

            if (particleMaterial.opacity > 0.1) {
              requestAnimationFrame(animateParticle)
            } else {
              scene.remove(particle)
            }
          }
          animateParticle()
        }
      }

      // Inicializar pista
      for (let i = 0; i < 8; i++) {
        createRetroTrackSegment(-i * 20)

        if (i > 1 && Math.random() < 0.5) {
          const lane = Math.floor(Math.random() * 3) - 1
          createRetroObstacle(lane, -i * 20 + Math.random() * 15)
        }

        if (Math.random() < 0.7) {
          const lane = Math.floor(Math.random() * 3) - 1
          createRetroCoin(lane, -i * 20 + Math.random() * 15)
        }
      }

      // Posicionar câmera estilo PS2
      camera.position.set(0, 3, 4)
      camera.lookAt(0, 1, -3)

      // Controles
      const keys = {
        left: false,
        right: false,
        up: false,
        down: false,
      }

      function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
          case "ArrowLeft":
          case "KeyA":
            keys.left = true
            break
          case "ArrowRight":
          case "KeyD":
            keys.right = true
            break
          case "ArrowUp":
          case "KeyW":
          case "Space":
            keys.up = true
            break
          case "ArrowDown":
          case "KeyS":
            keys.down = true
            break
        }
      }

      function handleKeyUp(event: KeyboardEvent) {
        switch (event.code) {
          case "ArrowLeft":
          case "KeyA":
            keys.left = false
            break
          case "ArrowRight":
          case "KeyD":
            keys.right = false
            break
          case "ArrowUp":
          case "KeyW":
          case "Space":
            keys.up = false
            break
          case "ArrowDown":
          case "KeyS":
            keys.down = false
            break
        }
      }

      // Controles touch
      let touchStartX = 0
      let touchStartY = 0

      function handleTouchStart(event: TouchEvent) {
        touchStartX = event.touches[0].clientX
        touchStartY = event.touches[0].clientY
      }

      function handleTouchEnd(event: TouchEvent) {
        if (!gameState.running) return

        const touchEndX = event.changedTouches[0].clientX
        const touchEndY = event.changedTouches[0].clientY

        const deltaX = touchEndX - touchStartX
        const deltaY = touchEndY - touchStartY

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 50) {
            keys.right = true
            setTimeout(() => (keys.right = false), 100)
          } else if (deltaX < -50) {
            keys.left = true
            setTimeout(() => (keys.left = false), 100)
          }
        } else {
          if (deltaY < -50) {
            keys.up = true
            setTimeout(() => (keys.up = false), 100)
          } else if (deltaY > 50) {
            keys.down = true
            setTimeout(() => (keys.down = false), 100)
          }
        }
      }

      document.addEventListener("keydown", handleKeyDown)
      document.addEventListener("keyup", handleKeyUp)
      document.addEventListener("touchstart", handleTouchStart)
      document.addEventListener("touchend", handleTouchEnd)

      // Loop de animação estilo PS2
      function animate() {
        requestAnimationFrame(animate)

        if (gameState.running && !gameState.gameOver) {
          // Movimento do jogador
          if (keys.left && gameState.playerLane > -1) {
            gameState.playerLane--
            keys.left = false
          }
          if (keys.right && gameState.playerLane < 1) {
            gameState.playerLane++
            keys.right = false
          }

          if (keys.up && !gameState.jumping && !gameState.sliding) {
            gameState.jumping = true
            keys.up = false
          }

          if (keys.down && !gameState.jumping && !gameState.sliding) {
            gameState.sliding = true
            keys.down = false
          }

          // Atualizar posição do jogador (movimento menos suave, mais robótico)
          const targetX = gameState.playerLane * 1.5
          playerGroup.position.x += (targetX - playerGroup.position.x) * 0.2

          // Animação de corrida blocky
          const runTime = Date.now() * 0.008
          const leftArm = playerGroup.children[2]
          const rightArm = playerGroup.children[3]
          const leftLeg = playerGroup.children[4]
          const rightLeg = playerGroup.children[5]

          // Animações mais rígidas estilo PS2
          leftArm.rotation.x = Math.sin(runTime) * 0.8
          rightArm.rotation.x = -Math.sin(runTime) * 0.8
          leftLeg.rotation.x = -Math.sin(runTime) * 0.5
          rightLeg.rotation.x = Math.sin(runTime) * 0.5

          // Lógica do pulo
          if (gameState.jumping) {
            gameState.playerY += 0.25
            if (gameState.playerY > 1.5) {
              gameState.jumping = false
            }
          } else if (gameState.playerY > 0) {
            gameState.playerY -= 0.25
            if (gameState.playerY < 0) gameState.playerY = 0
          }

          // Lógica do deslizar
          if (gameState.sliding) {
            gameState.playerY = -0.2
            playerGroup.scale.y = 0.6
            setTimeout(() => {
              gameState.sliding = false
              playerGroup.scale.y = 1
            }, 400)
          }

          playerGroup.position.y = 0.5 + gameState.playerY

          // Mover mundo
          trackSegments.forEach((segment) => {
            segment.position.z += gameState.speed
            if (segment.position.z > 15) {
              segment.position.z -= 160
            }
          })

          decorations.forEach((decoration, index) => {
            decoration.position.z += gameState.speed
            if (decoration.position.z > 15) {
              scene.remove(decoration)
              decorations.splice(index, 1)

              const side = Math.random() < 0.5 ? -5 : 5
              if (Math.random() < 0.6) {
                createRetroTree(side, -145 + Math.random() * 15)
              } else {
                createRetroRock(side, -145 + Math.random() * 15)
              }
            }
          })

          obstacles.forEach((obstacle, index) => {
            obstacle.position.z += gameState.speed

            const distance = Math.sqrt(
              Math.pow(playerGroup.position.x - obstacle.position.x, 2) +
                Math.pow(playerGroup.position.z - obstacle.position.z, 2),
            )

            if (distance < 0.7 && playerGroup.position.y < 1.2) {
              createRetroParticles(playerGroup.position, 0xff0000)
              gameState.gameOver = true
              setGameOver(true)
              setGameStarted(false)
            }

            if (obstacle.position.z > 15) {
              scene.remove(obstacle)
              obstacles.splice(index, 1)

              const lane = Math.floor(Math.random() * 3) - 1
              createRetroObstacle(lane, -145 + Math.random() * 15)
            }
          })

          coins.forEach((coin, index) => {
            coin.position.z += gameState.speed
            coin.rotation.y += 0.15 // Rotação mais rápida e menos suave

            const distance = Math.sqrt(
              Math.pow(playerGroup.position.x - coin.position.x, 2) +
                Math.pow(playerGroup.position.z - coin.position.z, 2),
            )

            if (distance < 0.7) {
              createRetroParticles(coin.position, 0xffd700)
              scene.remove(coin)
              coins.splice(index, 1)
              gameState.score += 10
              setScore(gameState.score)
            }

            if (coin.position.z > 15) {
              scene.remove(coin)
              coins.splice(index, 1)

              const lane = Math.floor(Math.random() * 3) - 1
              createRetroCoin(lane, -145 + Math.random() * 15)
            }
          })

          gameState.speed += 0.0005
          gameState.score += 0.1
          setScore(Math.floor(gameState.score))

          // Câmera com movimento menos suave
          camera.position.x += (playerGroup.position.x * 0.2 - camera.position.x) * 0.1
        }

        renderer.render(scene, camera)
      }

      function startGame() {
        gameState = {
          running: true,
          speed: 0.15,
          score: 0,
          playerLane: 0,
          playerY: 0,
          jumping: false,
          sliding: false,
          gameOver: false,
        }

        playerGroup.position.set(0, 0.5, 0)
        playerGroup.scale.set(1, 1, 1)
        setScore(0)
        setGameStarted(true)
        setGameOver(false)
      }

      function stopGame() {
        gameState.running = false
        if (gameState.score > highScore) {
          setHighScore(gameState.score)
        }
      }

      function handleResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener("resize", handleResize)

      gameRef.current = {
        scene,
        camera,
        renderer,
        startGame,
        stopGame,
        cleanup: () => {
          document.removeEventListener("keydown", handleKeyDown)
          document.removeEventListener("keyup", handleKeyUp)
          document.removeEventListener("touchstart", handleTouchStart)
          document.removeEventListener("touchend", handleTouchEnd)
          window.removeEventListener("resize", handleResize)
          if (mountRef.current && renderer.domElement) {
            mountRef.current.removeChild(renderer.domElement)
          }
          renderer.dispose()
        },
      }

      animate()
    }

    loadThreeJS()

    return () => {
      if (gameRef.current) {
        gameRef.current.cleanup()
        gameRef.current = null
      }
    }
  }, [])

  const startGame = () => {
    if (gameRef.current) {
      gameRef.current.startGame()
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Container do jogo 3D */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Interface estilo PS2 */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="p-3 bg-gradient-to-br from-purple-900/90 to-black/90 text-green-400 border-green-500/50 font-mono">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-yellow-400">SCORE: {score.toString().padStart(6, "0")}</div>
            <div className="text-sm text-green-300">HI-SCORE: {highScore.toString().padStart(6, "0")}</div>
          </div>
        </Card>
      </div>

      {/* Controles estilo retro */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="p-3 bg-gradient-to-br from-blue-900/90 to-black/90 text-cyan-400 border-cyan-500/50 font-mono text-xs">
          <div className="space-y-1">
            <div className="text-cyan-300 font-bold">CONTROLS:</div>
            <div>← → : MOVE</div>
            <div>↑ SPC: JUMP</div>
            <div>↓ : SLIDE</div>
            <div className="text-yellow-400">TOUCH: SWIPE</div>
          </div>
        </Card>
      </div>

      {/* Tela inicial estilo PS2 */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/95 via-black/90 to-purple-900/95 flex items-center justify-center z-20">
          <Card className="p-8 text-center bg-gradient-to-b from-gray-800 via-gray-900 to-black text-green-400 border-2 border-green-500 font-mono shadow-2xl">
            <div className="mb-4">
              <div className="text-4xl font-bold text-yellow-400 mb-2">TEMPLE RUN</div>
              <div className="text-2xl text-cyan-400">RETRO EDITION</div>
              <div className="text-sm text-gray-400 mt-2">PS2 STYLE GRAPHICS</div>
            </div>
            <div className="space-y-2 mb-6 text-sm">
              <div className="text-green-300">RUN THROUGH THE ANCIENT TEMPLE</div>
              <div className="text-cyan-300">COLLECT COINS • AVOID OBSTACLES</div>
              <div className="text-yellow-300">LOW-POLY RETRO GRAPHICS</div>
            </div>
            <Button
              onClick={startGame}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-black font-bold px-8 py-3 text-lg font-mono border-2 border-green-400"
            >
              ► START GAME
            </Button>
          </Card>
        </div>
      )}

      {/* Tela de game over estilo PS2 */}
      {gameOver && (
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/95 via-black/90 to-red-900/95 flex items-center justify-center z-20">
          <Card className="p-8 text-center bg-gradient-to-b from-gray-800 via-gray-900 to-black text-red-400 border-2 border-red-500 font-mono shadow-2xl">
            <div className="mb-4">
              <div className="text-3xl font-bold text-red-300 mb-2">GAME OVER</div>
              <div className="text-lg text-yellow-400">MISSION FAILED</div>
            </div>
            <div className="space-y-2 mb-6">
              <div className="text-xl text-yellow-400">FINAL SCORE: {score.toString().padStart(6, "0")}</div>
              <div className="text-lg text-green-400">HI-SCORE: {highScore.toString().padStart(6, "0")}</div>
              {score > highScore && <div className="text-lg text-cyan-400 animate-pulse">NEW RECORD!</div>}
            </div>
            <div className="space-x-4">
              <Button
                onClick={startGame}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-black font-bold px-6 py-2 font-mono border-2 border-green-400"
              >
                ► RETRY
              </Button>
              <Button
                onClick={() => window.history.back()}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold px-6 py-2 font-mono border-2 border-gray-400"
              >
                ◄ EXIT
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Efeito de scan lines estilo CRT */}
      <div
        className="absolute inset-0 pointer-events-none z-30 opacity-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 0, 0.1) 2px,
            rgba(0, 255, 0, 0.1) 4px
          )`,
        }}
      />
    </div>
  )
}
