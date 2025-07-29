"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TempleRunGame() {
  const mountRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Carregar Three.js dinamicamente
    const loadThreeJS = async () => {
      const THREE = await import("three")

      if (!mountRef.current || gameRef.current) return

      // Configuração da cena
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
      const renderer = new THREE.WebGLRenderer({ antialias: true })

      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x87ceeb) // Cor do céu
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.fog = new THREE.Fog(0x87ceeb, 50, 200)

      mountRef.current.appendChild(renderer.domElement)

      // Criar skybox
      const skyboxGeometry = new THREE.SphereGeometry(500, 32, 32)
      const skyboxMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        side: THREE.BackSide,
      })
      const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial)
      scene.add(skybox)

      // Iluminação melhorada
      const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
      directionalLight.position.set(10, 20, 5)
      directionalLight.castShadow = true
      directionalLight.shadow.mapSize.width = 4096
      directionalLight.shadow.mapSize.height = 4096
      directionalLight.shadow.camera.near = 0.1
      directionalLight.shadow.camera.far = 100
      directionalLight.shadow.camera.left = -50
      directionalLight.shadow.camera.right = 50
      directionalLight.shadow.camera.top = 50
      directionalLight.shadow.camera.bottom = -50
      scene.add(directionalLight)

      // Luz pontual para efeitos
      const pointLight = new THREE.PointLight(0xffd700, 0.5, 100)
      pointLight.position.set(0, 10, -10)
      scene.add(pointLight)

      // Variáveis do jogo
      let gameState = {
        running: false,
        speed: 0.2,
        score: 0,
        playerLane: 0,
        playerY: 0,
        jumping: false,
        sliding: false,
        gameOver: false,
      }

      // Criar texturas
      const textureLoader = new THREE.TextureLoader()

      // Textura do chão (padrão de pedra)
      const groundTexture = new THREE.CanvasTexture(createGroundTexture())
      groundTexture.wrapS = THREE.RepeatWrapping
      groundTexture.wrapT = THREE.RepeatWrapping
      groundTexture.repeat.set(2, 10)

      // Textura de madeira para obstáculos
      const woodTexture = new THREE.CanvasTexture(createWoodTexture())

      // Textura de metal para moedas
      const metalTexture = new THREE.CanvasTexture(createMetalTexture())

      // Função para criar textura do chão
      function createGroundTexture() {
        const canvas = document.createElement("canvas")
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext("2d")!

        // Base de pedra
        ctx.fillStyle = "#8B4513"
        ctx.fillRect(0, 0, 256, 256)

        // Adicionar detalhes de pedra
        for (let i = 0; i < 50; i++) {
          ctx.fillStyle = `hsl(${25 + Math.random() * 10}, 60%, ${30 + Math.random() * 20}%)`
          ctx.fillRect(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 4 + Math.random() * 8)
        }

        return canvas
      }

      // Função para criar textura de madeira
      function createWoodTexture() {
        const canvas = document.createElement("canvas")
        canvas.width = 256
        canvas.height = 256
        const ctx = canvas.getContext("2d")!

        // Base de madeira
        ctx.fillStyle = "#8B4513"
        ctx.fillRect(0, 0, 256, 256)

        // Linhas de madeira
        for (let i = 0; i < 20; i++) {
          ctx.strokeStyle = `hsl(${25 + Math.random() * 10}, 40%, ${20 + Math.random() * 15}%)`
          ctx.lineWidth = 2 + Math.random() * 3
          ctx.beginPath()
          ctx.moveTo(0, i * 12)
          ctx.lineTo(256, i * 12 + Math.random() * 20 - 10)
          ctx.stroke()
        }

        return canvas
      }

      // Função para criar textura metálica
      function createMetalTexture() {
        const canvas = document.createElement("canvas")
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext("2d")!

        // Gradiente dourado
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
        gradient.addColorStop(0, "#FFD700")
        gradient.addColorStop(0.5, "#FFA500")
        gradient.addColorStop(1, "#FF8C00")

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 128, 128)

        return canvas
      }

      // Sistema de partículas
      const particleSystems: THREE.Points[] = []

      function createParticleSystem(position: THREE.Vector3, color: number, count = 20) {
        const particles = new THREE.BufferGeometry()
        const positions = new Float32Array(count * 3)
        const velocities = new Float32Array(count * 3)

        for (let i = 0; i < count; i++) {
          positions[i * 3] = position.x + (Math.random() - 0.5) * 2
          positions[i * 3 + 1] = position.y + Math.random() * 2
          positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 2

          velocities[i * 3] = (Math.random() - 0.5) * 0.2
          velocities[i * 3 + 1] = Math.random() * 0.3
          velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2
        }

        particles.setAttribute("position", new THREE.BufferAttribute(positions, 3))
        particles.setAttribute("velocity", new THREE.BufferAttribute(velocities, 3))

        const particleMaterial = new THREE.PointsMaterial({
          color: color,
          size: 0.1,
          transparent: true,
          opacity: 0.8,
        })

        const particleSystem = new THREE.Points(particles, particleMaterial)
        scene.add(particleSystem)
        particleSystems.push(particleSystem)

        // Remover após 2 segundos
        setTimeout(() => {
          scene.remove(particleSystem)
          const index = particleSystems.indexOf(particleSystem)
          if (index > -1) particleSystems.splice(index, 1)
        }, 2000)
      }

      // Criar jogador mais detalhado
      const playerGroup = new THREE.Group()

      // Corpo do jogador
      const bodyGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.3)
      const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 })
      const playerBody = new THREE.Mesh(bodyGeometry, bodyMaterial)
      playerBody.position.y = 0.4
      playerBody.castShadow = true
      playerGroup.add(playerBody)

      // Cabeça do jogador
      const headGeometry = new THREE.SphereGeometry(0.15, 16, 16)
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac })
      const playerHead = new THREE.Mesh(headGeometry, headMaterial)
      playerHead.position.y = 0.95
      playerHead.castShadow = true
      playerGroup.add(playerHead)

      // Braços
      const armGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1)
      const armMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 })

      const leftArm = new THREE.Mesh(armGeometry, armMaterial)
      leftArm.position.set(-0.3, 0.5, 0)
      leftArm.castShadow = true
      playerGroup.add(leftArm)

      const rightArm = new THREE.Mesh(armGeometry, armMaterial)
      rightArm.position.set(0.3, 0.5, 0)
      rightArm.castShadow = true
      playerGroup.add(rightArm)

      // Pernas
      const legGeometry = new THREE.BoxGeometry(0.12, 0.4, 0.12)
      const legMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc })

      const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
      leftLeg.position.set(-0.1, -0.2, 0)
      leftLeg.castShadow = true
      playerGroup.add(leftLeg)

      const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
      rightLeg.position.set(0.1, -0.2, 0)
      rightLeg.castShadow = true
      playerGroup.add(rightLeg)

      playerGroup.position.set(0, 0.5, 0)
      scene.add(playerGroup)

      // Arrays para elementos do jogo
      const trackSegments: THREE.Mesh[] = []
      const obstacles: THREE.Group[] = []
      const coins: THREE.Group[] = []
      const decorations: THREE.Group[] = []

      // Função para criar árvore decorativa
      function createTree(x: number, z: number) {
        const treeGroup = new THREE.Group()

        // Tronco
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 2, 8)
        const trunkMaterial = new THREE.MeshLambertMaterial({
          map: woodTexture,
          color: 0x8b4513,
        })
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
        trunk.position.y = 1
        trunk.castShadow = true
        treeGroup.add(trunk)

        // Copa da árvore
        const leavesGeometry = new THREE.SphereGeometry(0.8, 12, 12)
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 })
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial)
        leaves.position.y = 2.5
        leaves.castShadow = true
        treeGroup.add(leaves)

        treeGroup.position.set(x, 0, z)
        scene.add(treeGroup)
        decorations.push(treeGroup)
      }

      // Função para criar rocha decorativa
      function createRock(x: number, z: number) {
        const rockGroup = new THREE.Group()

        const rockGeometry = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 0)
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
        const rock = new THREE.Mesh(rockGeometry, rockMaterial)
        rock.castShadow = true
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
        rockGroup.add(rock)

        rockGroup.position.set(x, 0.2, z)
        scene.add(rockGroup)
        decorations.push(rockGroup)
      }

      // Função para criar segmento da pista melhorado
      function createTrackSegment(z: number) {
        const trackGeometry = new THREE.PlaneGeometry(6, 20)
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

        // Adicionar linhas da pista com brilho
        for (let lane = -1; lane <= 1; lane++) {
          if (lane !== 0) {
            const lineGeometry = new THREE.BoxGeometry(0.1, 0.1, 20)
            const lineMaterial = new THREE.MeshLambertMaterial({
              color: 0xffffff,
              emissive: 0x222222,
            })
            const line = new THREE.Mesh(lineGeometry, lineMaterial)
            line.position.set(lane * 1.5, 0.05, z)
            scene.add(line)
            trackSegments.push(line)
          }
        }

        // Adicionar decorações nas laterais
        if (Math.random() < 0.3) {
          const side = Math.random() < 0.5 ? -4 : 4
          if (Math.random() < 0.7) {
            createTree(side, z + Math.random() * 15 - 7.5)
          } else {
            createRock(side, z + Math.random() * 15 - 7.5)
          }
        }
      }

      // Função para criar obstáculo melhorado
      function createObstacle(lane: number, z: number) {
        const obstacleGroup = new THREE.Group()

        // Base do obstáculo
        const baseGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.8)
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
        const base = new THREE.Mesh(baseGeometry, baseMaterial)
        base.position.y = 0.1
        base.castShadow = true
        obstacleGroup.add(base)

        // Pilar principal
        const pillarGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6)
        const pillarMaterial = new THREE.MeshLambertMaterial({
          map: woodTexture,
          color: 0x8b4513,
        })
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial)
        pillar.position.y = 0.8
        pillar.castShadow = true
        obstacleGroup.add(pillar)

        // Topo decorativo
        const topGeometry = new THREE.ConeGeometry(0.4, 0.3, 8)
        const topMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 })
        const top = new THREE.Mesh(topGeometry, topMaterial)
        top.position.y = 1.55
        top.castShadow = true
        obstacleGroup.add(top)

        obstacleGroup.position.set(lane * 1.5, 0, z)
        scene.add(obstacleGroup)
        obstacles.push(obstacleGroup)
      }

      // Função para criar moeda melhorada
      function createCoin(lane: number, z: number) {
        const coinGroup = new THREE.Group()

        // Moeda principal
        const coinGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16)
        const coinMaterial = new THREE.MeshLambertMaterial({
          map: metalTexture,
          color: 0xffd700,
          emissive: 0x332200,
        })
        const coin = new THREE.Mesh(coinGeometry, coinMaterial)
        coin.castShadow = true
        coinGroup.add(coin)

        // Anel de brilho
        const ringGeometry = new THREE.RingGeometry(0.25, 0.35, 16)
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        })
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.rotation.x = -Math.PI / 2
        coinGroup.add(ring)

        coinGroup.position.set(lane * 1.5, 1, z)
        scene.add(coinGroup)
        coins.push(coinGroup)
      }

      // Inicializar pista
      for (let i = 0; i < 15; i++) {
        createTrackSegment(-i * 20)

        // Adicionar obstáculos
        if (i > 2 && Math.random() < 0.4) {
          const lane = Math.floor(Math.random() * 3) - 1
          createObstacle(lane, -i * 20 + Math.random() * 15)
        }

        // Adicionar moedas
        if (Math.random() < 0.6) {
          const lane = Math.floor(Math.random() * 3) - 1
          createCoin(lane, -i * 20 + Math.random() * 15)
        }
      }

      // Posicionar câmera
      camera.position.set(0, 4, 6)
      camera.lookAt(0, 1, -5)

      // Controles (mesmo código anterior)
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

      // Função de animação melhorada
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

          // Pulo
          if (keys.up && !gameState.jumping && !gameState.sliding) {
            gameState.jumping = true
            keys.up = false
          }

          // Deslizar
          if (keys.down && !gameState.jumping && !gameState.sliding) {
            gameState.sliding = true
            keys.down = false
          }

          // Atualizar posição do jogador
          playerGroup.position.x = THREE.MathUtils.lerp(playerGroup.position.x, gameState.playerLane * 1.5, 0.1)

          // Animação de corrida
          const runTime = Date.now() * 0.01
          const leftArm = playerGroup.children[2]
          const rightArm = playerGroup.children[3]
          const leftLeg = playerGroup.children[4]
          const rightLeg = playerGroup.children[5]

          leftArm.rotation.x = Math.sin(runTime) * 0.5
          rightArm.rotation.x = -Math.sin(runTime) * 0.5
          leftLeg.rotation.x = -Math.sin(runTime) * 0.3
          rightLeg.rotation.x = Math.sin(runTime) * 0.3

          // Lógica do pulo
          if (gameState.jumping) {
            gameState.playerY += 0.3
            if (gameState.playerY > 2) {
              gameState.jumping = false
            }
          } else if (gameState.playerY > 0) {
            gameState.playerY -= 0.3
            if (gameState.playerY < 0) gameState.playerY = 0
          }

          // Lógica do deslizar
          if (gameState.sliding) {
            gameState.playerY = -0.3
            playerGroup.scale.y = 0.5
            setTimeout(() => {
              gameState.sliding = false
              playerGroup.scale.y = 1
            }, 500)
          }

          playerGroup.position.y = 0.5 + gameState.playerY

          // Mover mundo
          trackSegments.forEach((segment) => {
            segment.position.z += gameState.speed
            if (segment.position.z > 20) {
              segment.position.z -= 300
            }
          })

          // Mover decorações
          decorations.forEach((decoration, index) => {
            decoration.position.z += gameState.speed
            if (decoration.position.z > 20) {
              scene.remove(decoration)
              decorations.splice(index, 1)

              // Criar nova decoração
              const side = Math.random() < 0.5 ? -4 : 4
              if (Math.random() < 0.7) {
                createTree(side, -280 + Math.random() * 15)
              } else {
                createRock(side, -280 + Math.random() * 15)
              }
            }
          })

          // Atualizar partículas
          particleSystems.forEach((system) => {
            const positions = system.geometry.attributes.position.array as Float32Array
            const velocities = system.geometry.attributes.velocity.array as Float32Array

            for (let i = 0; i < positions.length; i += 3) {
              positions[i] += velocities[i]
              positions[i + 1] += velocities[i + 1]
              positions[i + 2] += velocities[i + 2]

              velocities[i + 1] -= 0.01 // Gravidade
            }

            system.geometry.attributes.position.needsUpdate = true

            // Fade out
            const material = system.material as THREE.PointsMaterial
            material.opacity *= 0.98
          })

          obstacles.forEach((obstacle, index) => {
            obstacle.position.z += gameState.speed

            // Verificar colisão
            const distance = Math.sqrt(
              Math.pow(playerGroup.position.x - obstacle.position.x, 2) +
                Math.pow(playerGroup.position.z - obstacle.position.z, 2),
            )

            if (distance < 0.8 && playerGroup.position.y < 1.5) {
              // Efeito de explosão
              createParticleSystem(playerGroup.position, 0xff0000, 30)
              gameState.gameOver = true
              setGameOver(true)
              setGameStarted(false)
            }

            if (obstacle.position.z > 20) {
              scene.remove(obstacle)
              obstacles.splice(index, 1)

              // Criar novo obstáculo
              const lane = Math.floor(Math.random() * 3) - 1
              createObstacle(lane, -280 + Math.random() * 15)
            }
          })

          coins.forEach((coin, index) => {
            coin.position.z += gameState.speed
            coin.rotation.y += 0.1

            // Efeito de brilho
            coin.children[1].rotation.z += 0.05

            // Verificar coleta
            const distance = Math.sqrt(
              Math.pow(playerGroup.position.x - coin.position.x, 2) +
                Math.pow(playerGroup.position.z - coin.position.z, 2),
            )

            if (distance < 0.8) {
              // Efeito de coleta
              createParticleSystem(coin.position, 0xffd700, 15)
              scene.remove(coin)
              coins.splice(index, 1)
              gameState.score += 10
              setScore(gameState.score)
            }

            if (coin.position.z > 20) {
              scene.remove(coin)
              coins.splice(index, 1)

              // Criar nova moeda
              const lane = Math.floor(Math.random() * 3) - 1
              createCoin(lane, -280 + Math.random() * 15)
            }
          })

          // Aumentar velocidade gradualmente
          gameState.speed += 0.0001

          // Aumentar pontuação por distância
          gameState.score += 0.1
          setScore(Math.floor(gameState.score))

          // Atualizar câmera com movimento suave
          camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerGroup.position.x * 0.3, 0.05)

          // Efeito de balanço da câmera
          camera.position.y = 4 + Math.sin(runTime * 0.5) * 0.1
        }

        renderer.render(scene, camera)
      }

      // Função para iniciar o jogo
      function startGame() {
        gameState = {
          running: true,
          speed: 0.2,
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

      // Função para parar o jogo
      function stopGame() {
        gameState.running = false
        if (gameState.score > highScore) {
          setHighScore(gameState.score)
        }
      }

      // Redimensionar
      function handleResize() {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      window.addEventListener("resize", handleResize)

      // Salvar referências
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

  const stopGame = () => {
    if (gameRef.current) {
      gameRef.current.stopGame()
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Container do jogo 3D */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Interface do usuário melhorada */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="p-4 bg-gradient-to-br from-black/80 to-gray-900/80 text-white border-yellow-500/30 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-yellow-400 drop-shadow-lg">💰 {score}</div>
            <div className="text-sm text-gray-300">🏆 Recorde: {highScore}</div>
          </div>
        </Card>
      </div>

      {/* Controles melhorados */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="p-4 bg-gradient-to-br from-black/80 to-gray-900/80 text-white border-blue-500/30 backdrop-blur-sm">
          <div className="text-sm space-y-1">
            <div className="text-blue-400 font-semibold">🎮 Controles:</div>
            <div>← → ou A/D: Mover</div>
            <div>↑ ou W/Space: Pular</div>
            <div>↓ ou S: Deslizar</div>
            <div className="text-green-400">📱 Touch: Deslize na tela</div>
          </div>
        </Card>
      </div>

      {/* Tela inicial melhorada */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-purple-900/50 to-black/90 flex items-center justify-center z-20 backdrop-blur-sm">
          <Card className="p-8 text-center bg-gradient-to-b from-orange-600 via-red-600 to-red-800 text-white border-0 shadow-2xl transform hover:scale-105 transition-transform">
            <h1 className="text-5xl font-bold mb-4 text-yellow-300 drop-shadow-lg">🏃‍♂️ Temple Run 3D</h1>
            <p className="text-xl mb-2 text-orange-200">Corra pela selva antiga!</p>
            <p className="text-lg mb-6 text-orange-300">Colete moedas e evite obstáculos</p>
            <Button
              onClick={startGame}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold px-10 py-4 text-xl shadow-lg transform hover:scale-110 transition-all"
            >
              ⚡ Começar Aventura
            </Button>
          </Card>
        </div>
      )}

      {/* Tela de game over melhorada */}
      {gameOver && (
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/90 via-black/80 to-red-900/90 flex items-center justify-center z-20 backdrop-blur-sm">
          <Card className="p-8 text-center bg-gradient-to-b from-red-700 via-red-800 to-red-900 text-white border-0 shadow-2xl">
            <h2 className="text-4xl font-bold mb-4 text-red-300">💥 Game Over!</h2>
            <div className="space-y-3 mb-6">
              <div className="text-2xl text-yellow-400">💰 Pontuação: {score}</div>
              <div className="text-xl text-orange-300">🏆 Recorde: {highScore}</div>
              {score > highScore && <div className="text-lg text-green-400 animate-pulse">🎉 Novo Recorde!</div>}
            </div>
            <div className="space-x-4">
              <Button
                onClick={startGame}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-8 py-3 shadow-lg transform hover:scale-110 transition-all"
              >
                🔄 Tentar Novamente
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black px-8 py-3 shadow-lg transform hover:scale-110 transition-all"
              >
                🏠 Voltar ao Menu
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
