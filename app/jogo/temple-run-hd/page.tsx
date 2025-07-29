"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export default function TempleRunHDGame() {
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

      // Configuração da cena HD
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200)
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        precision: "highp",
        powerPreference: "high-performance",
      })

      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearColor(0x87ceeb)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2

      // Fog atmosférico
      scene.fog = new THREE.Fog(0xd4a574, 30, 120)

      mountRef.current.appendChild(renderer.domElement)

      // Sistema de iluminação avançado
      const ambientLight = new THREE.AmbientLight(0x8b7355, 0.4)
      scene.add(ambientLight)

      const sunLight = new THREE.DirectionalLight(0xffd4a3, 1.2)
      sunLight.position.set(20, 30, 10)
      sunLight.castShadow = true
      sunLight.shadow.mapSize.width = 4096
      sunLight.shadow.mapSize.height = 4096
      sunLight.shadow.camera.near = 0.1
      sunLight.shadow.camera.far = 100
      sunLight.shadow.camera.left = -50
      sunLight.shadow.camera.right = 50
      sunLight.shadow.camera.top = 50
      sunLight.shadow.camera.bottom = -50
      sunLight.shadow.bias = -0.0001
      scene.add(sunLight)

      // Luz de preenchimento
      const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3)
      fillLight.position.set(-10, 10, -10)
      scene.add(fillLight)

      // Luz pontual para atmosfera
      const atmosphereLight = new THREE.PointLight(0xffa500, 0.5, 50)
      atmosphereLight.position.set(0, 15, -20)
      scene.add(atmosphereLight)

      // Sistema de física avançado
      class PhysicsEngine {
        gravity = -0.025
        friction = 0.92
        airResistance = 0.98
        bounceThreshold = 0.1

        applyGravity(object: any) {
          if (object.physics) {
            object.physics.velocity.y += this.gravity
            object.position.y += object.physics.velocity.y

            // Aplicar resistência do ar
            object.physics.velocity.y *= this.airResistance

            // Verificar colisão com o chão
            if (object.position.y <= object.physics.groundLevel) {
              object.position.y = object.physics.groundLevel

              // Bounce realístico
              if (Math.abs(object.physics.velocity.y) > this.bounceThreshold) {
                object.physics.velocity.y = -object.physics.velocity.y * object.physics.bounciness
              } else {
                object.physics.velocity.y = 0
                object.physics.grounded = true
              }
            } else {
              object.physics.grounded = false
            }
          }
        }

        applyFriction(object: any) {
          if (object.physics && object.physics.grounded) {
            object.physics.velocity.x *= this.friction
            object.physics.velocity.z *= this.friction
          }
        }

        applyMomentum(object: any) {
          if (object.physics) {
            object.position.x += object.physics.velocity.x
            object.position.z += object.physics.velocity.z
          }
        }

        // Sistema de colisão avançado com bounding boxes
        checkCollision(obj1: any, obj2: any) {
          if (!obj1.physics || !obj2.physics) return false

          const box1 = obj1.physics.boundingBox
          const box2 = obj2.physics.boundingBox

          return (
            obj1.position.x - box1.x / 2 < obj2.position.x + box2.x / 2 &&
            obj1.position.x + box1.x / 2 > obj2.position.x - box2.x / 2 &&
            obj1.position.y - box1.y / 2 < obj2.position.y + box2.y / 2 &&
            obj1.position.y + box1.y / 2 > obj2.position.y - box2.y / 2 &&
            obj1.position.z - box1.z / 2 < obj2.position.z + box2.z / 2 &&
            obj1.position.z + box1.z / 2 > obj2.position.z - box2.z / 2
          )
        }

        // Colisão esférica para objetos redondos
        checkSphereCollision(obj1: any, obj2: any) {
          if (!obj1.physics || !obj2.physics) return false

          const distance = obj1.position.distanceTo(obj2.position)
          return distance < obj1.physics.radius + obj2.physics.radius
        }

        // Resposta à colisão com impulso
        resolveCollision(obj1: any, obj2: any, type: string) {
          if (type === "obstacle") {
            // Colisão com obstáculo - parar movimento
            obj1.physics.velocity.x *= -0.5
            obj1.physics.velocity.z *= -0.5

            // Adicionar impulso para trás
            const pushDirection = new THREE.Vector3()
            pushDirection.subVectors(obj1.position, obj2.position).normalize()
            obj1.physics.velocity.x += pushDirection.x * 0.1
            obj1.physics.velocity.z += pushDirection.z * 0.1

            return "collision"
          } else if (type === "coin") {
            // Colisão com moeda - efeito de atração
            const attractDirection = new THREE.Vector3()
            attractDirection.subVectors(obj2.position, obj1.position).normalize()
            obj2.physics.velocity.x += attractDirection.x * 0.05
            obj2.physics.velocity.y += attractDirection.y * 0.05
            obj2.physics.velocity.z += attractDirection.z * 0.05

            return "collect"
          }
          return "none"
        }
      }

      const physics = new PhysicsEngine()

      // Variáveis do jogo com física
      let gameState = {
        running: false,
        speed: 0.25,
        score: 0,
        playerLane: 0,
        targetLane: 0,
        gameOver: false,
        cameraShake: { x: 0, y: 0, intensity: 0 },
        slowMotion: 1.0,
      }

      // Função para criar textura de pedra ornamentada
      function createStoneTexture(width: number, height: number) {
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")!

        // Base de pedra
        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, "#d4a574")
        gradient.addColorStop(0.5, "#c19a6b")
        gradient.addColorStop(1, "#a0845c")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        // Padrões maias/astecas
        ctx.strokeStyle = "#8b7355"
        ctx.lineWidth = 2
        ctx.fillStyle = "#8b7355"

        // Desenhar padrões geométricos
        for (let i = 0; i < width; i += 32) {
          for (let j = 0; j < height; j += 32) {
            // Padrão de losango
            ctx.beginPath()
            ctx.moveTo(i + 16, j + 4)
            ctx.lineTo(i + 28, j + 16)
            ctx.lineTo(i + 16, j + 28)
            ctx.lineTo(i + 4, j + 16)
            ctx.closePath()
            ctx.stroke()

            // Detalhes internos
            ctx.beginPath()
            ctx.arc(i + 16, j + 16, 4, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        // Adicionar desgaste e sujeira
        for (let i = 0; i < 200; i++) {
          ctx.fillStyle = `rgba(139, 115, 85, ${0.1 + Math.random() * 0.2})`
          ctx.fillRect(Math.random() * width, Math.random() * height, 2 + Math.random() * 4, 2 + Math.random() * 4)
        }

        const texture = new THREE.CanvasTexture(canvas)
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        return texture
      }

      // Função para criar textura de madeira envelhecida
      function createWoodTexture(width: number, height: number) {
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")!

        // Base de madeira
        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, "#8b4513")
        gradient.addColorStop(0.3, "#a0522d")
        gradient.addColorStop(0.7, "#8b4513")
        gradient.addColorStop(1, "#654321")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        // Veios da madeira
        for (let i = 0; i < 15; i++) {
          ctx.strokeStyle = `rgba(101, 67, 33, ${0.3 + Math.random() * 0.4})`
          ctx.lineWidth = 1 + Math.random() * 2
          ctx.beginPath()
          ctx.moveTo(0, i * (height / 15) + Math.random() * 10 - 5)
          ctx.quadraticCurveTo(
            width / 2,
            i * (height / 15) + Math.random() * 20 - 10,
            width,
            i * (height / 15) + Math.random() * 10 - 5,
          )
          ctx.stroke()
        }

        const texture = new THREE.CanvasTexture(canvas)
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        return texture
      }

      // Função para criar textura de folhagem
      function createLeafTexture(width: number, height: number, baseColor: string) {
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")!

        ctx.fillStyle = baseColor
        ctx.fillRect(0, 0, width, height)

        // Desenhar folhas individuais
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * width
          const y = Math.random() * height
          const size = 3 + Math.random() * 5

          ctx.fillStyle = `hsl(${120 + Math.random() * 60}, ${50 + Math.random() * 30}%, ${30 + Math.random() * 20}%)`
          ctx.beginPath()
          ctx.ellipse(x, y, size, size * 1.5, Math.random() * Math.PI, 0, Math.PI * 2)
          ctx.fill()
        }

        const texture = new THREE.CanvasTexture(canvas)
        return texture
      }

      // Texturas HD
      const stoneTexture = createStoneTexture(512, 512)
      const wallTexture = createStoneTexture(256, 256)
      const woodTexture = createWoodTexture(256, 256)
      const leafTexture = createLeafTexture(128, 128, "#228b22")
      const autumnLeafTexture = createLeafTexture(128, 128, "#ff6347")

      // Criar personagem detalhado com física
      const playerGroup = new THREE.Group()

      // Adicionar propriedades de física ao jogador
      playerGroup.physics = {
        velocity: new THREE.Vector3(0, 0, 0),
        groundLevel: 0.5,
        bounciness: 0.3,
        grounded: true,
        boundingBox: { x: 0.4, y: 1.2, z: 0.3 },
        mass: 1.0,
        jumpForce: 0.45,
        slideTime: 0,
        maxSlideTime: 500,
      }

      // Corpo principal
      const torsoGeometry = new THREE.BoxGeometry(0.35, 0.5, 0.2)
      const torsoMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 })
      const torso = new THREE.Mesh(torsoGeometry, torsoMaterial)
      torso.position.y = 0.25
      torso.castShadow = true
      playerGroup.add(torso)

      // Cabeça
      const headGeometry = new THREE.SphereGeometry(0.12, 16, 16)
      const headMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 })
      const head = new THREE.Mesh(headGeometry, headMaterial)
      head.position.y = 0.62
      head.castShadow = true
      playerGroup.add(head)

      // Cabelo
      const hairGeometry = new THREE.SphereGeometry(0.13, 16, 16)
      const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
      const hair = new THREE.Mesh(hairGeometry, hairMaterial)
      hair.position.y = 0.68
      hair.scale.set(1, 0.8, 1)
      hair.castShadow = true
      playerGroup.add(hair)

      // Mochila
      const backpackGeometry = new THREE.BoxGeometry(0.25, 0.35, 0.15)
      const backpackMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
      const backpack = new THREE.Mesh(backpackGeometry, backpackMaterial)
      backpack.position.set(0, 0.3, -0.18)
      backpack.castShadow = true
      playerGroup.add(backpack)

      // Braços
      const armGeometry = new THREE.CapsuleGeometry(0.05, 0.25, 4, 8)
      const armMaterial = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 })

      const leftArm = new THREE.Mesh(armGeometry, armMaterial)
      leftArm.position.set(-0.22, 0.35, 0)
      leftArm.castShadow = true
      playerGroup.add(leftArm)

      const rightArm = new THREE.Mesh(armGeometry, armMaterial)
      rightArm.position.set(0.22, 0.35, 0)
      rightArm.castShadow = true
      playerGroup.add(rightArm)

      // Antebraços (mangas)
      const forearmGeometry = new THREE.CapsuleGeometry(0.06, 0.2, 4, 8)
      const forearmMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 })

      const leftForearm = new THREE.Mesh(forearmGeometry, forearmMaterial)
      leftForearm.position.set(-0.22, 0.15, 0)
      leftForearm.castShadow = true
      playerGroup.add(leftForearm)

      const rightForearm = new THREE.Mesh(forearmGeometry, forearmMaterial)
      rightForearm.position.set(0.22, 0.15, 0)
      rightForearm.castShadow = true
      playerGroup.add(rightForearm)

      // Pernas (calças)
      const legGeometry = new THREE.CapsuleGeometry(0.08, 0.35, 4, 8)
      const legMaterial = new THREE.MeshLambertMaterial({ color: 0x4169e1 })

      const leftLeg = new THREE.Mesh(legGeometry, legMaterial)
      leftLeg.position.set(-0.08, -0.15, 0)
      leftLeg.castShadow = true
      playerGroup.add(leftLeg)

      const rightLeg = new THREE.Mesh(legGeometry, legMaterial)
      rightLeg.position.set(0.08, -0.15, 0)
      rightLeg.castShadow = true
      playerGroup.add(rightLeg)

      // Botas
      const bootGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.2)
      const bootMaterial = new THREE.MeshLambertMaterial({ color: 0x2f1b14 })

      const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial)
      leftBoot.position.set(-0.08, -0.36, 0.05)
      leftBoot.castShadow = true
      playerGroup.add(leftBoot)

      const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial)
      rightBoot.position.set(0.08, -0.36, 0.05)
      rightBoot.castShadow = true
      playerGroup.add(rightBoot)

      // Cinto
      const beltGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.22)
      const beltMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
      const belt = new THREE.Mesh(beltGeometry, beltMaterial)
      belt.position.y = 0.02
      belt.castShadow = true
      playerGroup.add(belt)

      playerGroup.position.set(0, 0.5, 0)
      scene.add(playerGroup)

      // Arrays para elementos do jogo
      const trackSegments: THREE.Mesh[] = []
      const obstacles: THREE.Group[] = []
      const coins: THREE.Group[] = []
      const decorations: THREE.Group[] = []
      const vegetation: THREE.Group[] = []

      // Função para criar árvore detalhada com física
      function createDetailedTree(x: number, z: number, isAutumn = false) {
        const treeGroup = new THREE.Group()

        // Adicionar física à árvore
        treeGroup.physics = {
          boundingBox: { x: 0.4, y: 3, z: 0.4 },
          type: "static",
        }

        // Tronco com textura
        const trunkGeometry = new THREE.CylinderGeometry(0.15, 0.2, 3, 12)
        const trunkMaterial = new THREE.MeshLambertMaterial({
          map: woodTexture,
          color: 0x8b4513,
        })
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
        trunk.position.y = 1.5
        trunk.castShadow = true
        trunk.receiveShadow = true
        treeGroup.add(trunk)

        // Copa da árvore com múltiplas esferas
        const leafMaterial = new THREE.MeshLambertMaterial({
          map: isAutumn ? autumnLeafTexture : leafTexture,
          color: isAutumn ? 0xff6347 : 0x228b22,
        })

        // Múltiplas esferas para copa mais densa
        for (let i = 0; i < 5; i++) {
          const leavesGeometry = new THREE.SphereGeometry(0.6 + Math.random() * 0.3, 12, 12)
          const leaves = new THREE.Mesh(leavesGeometry, leafMaterial)
          leaves.position.set(
            (Math.random() - 0.5) * 0.8,
            2.5 + (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.8,
          )
          leaves.castShadow = true
          leaves.receiveShadow = true
          treeGroup.add(leaves)
        }

        // Galhos com física de balanço
        for (let i = 0; i < 3; i++) {
          const branchGeometry = new THREE.CylinderGeometry(0.03, 0.05, 0.8, 6)
          const branchMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 })
          const branch = new THREE.Mesh(branchGeometry, branchMaterial)
          branch.position.set((Math.random() - 0.5) * 0.6, 2 + Math.random() * 0.5, (Math.random() - 0.5) * 0.6)
          branch.rotation.z = (Math.random() - 0.5) * 0.8
          branch.castShadow = true

          // Adicionar propriedades de balanço
          branch.userData = {
            originalRotation: branch.rotation.z,
            swaySpeed: 0.5 + Math.random() * 0.5,
            swayAmount: 0.1 + Math.random() * 0.1,
          }

          treeGroup.add(branch)
        }

        treeGroup.position.set(x, 0, z)
        scene.add(treeGroup)
        vegetation.push(treeGroup)
      }

      // Função para criar coluna ornamentada com física
      function createOrnateColumn(x: number, z: number) {
        const columnGroup = new THREE.Group()

        // Adicionar física à coluna
        columnGroup.physics = {
          boundingBox: { x: 0.9, y: 3.5, z: 0.9 },
          type: "static",
        }

        // Base da coluna
        const baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 12)
        const baseMaterial = new THREE.MeshLambertMaterial({
          map: stoneTexture,
          color: 0xd4a574,
        })
        const base = new THREE.Mesh(baseGeometry, baseMaterial)
        base.position.y = 0.15
        base.castShadow = true
        base.receiveShadow = true
        columnGroup.add(base)

        // Corpo da coluna
        const shaftGeometry = new THREE.CylinderGeometry(0.3, 0.35, 2.5, 12)
        const shaftMaterial = new THREE.MeshLambertMaterial({
          map: wallTexture,
          color: 0xc19a6b,
        })
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial)
        shaft.position.y = 1.55
        shaft.castShadow = true
        shaft.receiveShadow = true
        columnGroup.add(shaft)

        // Capitel
        const capitalGeometry = new THREE.CylinderGeometry(0.45, 0.3, 0.4, 12)
        const capitalMaterial = new THREE.MeshLambertMaterial({
          map: stoneTexture,
          color: 0xd4a574,
        })
        const capital = new THREE.Mesh(capitalGeometry, capitalMaterial)
        capital.position.y = 3
        capital.castShadow = true
        capital.receiveShadow = true
        columnGroup.add(capital)

        // Detalhes ornamentais
        for (let i = 0; i < 8; i++) {
          const ornamentGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05)
          const ornamentMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 })
          const ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial)
          const angle = (i / 8) * Math.PI * 2
          ornament.position.set(Math.cos(angle) * 0.32, 1.5 + i * 0.2, Math.sin(angle) * 0.32)
          ornament.castShadow = true
          columnGroup.add(ornament)
        }

        columnGroup.position.set(x, 0, z)
        scene.add(columnGroup)
        decorations.push(columnGroup)
      }

      // Função para criar segmento de corredor ornamentado
      function createTempleCorridorSegment(z: number) {
        // Chão principal com textura de pedra
        const floorGeometry = new THREE.PlaneGeometry(8, 20, 4, 4)
        const floorMaterial = new THREE.MeshLambertMaterial({
          map: stoneTexture,
          color: 0xffffff,
        })
        const floor = new THREE.Mesh(floorGeometry, floorMaterial)
        floor.rotation.x = -Math.PI / 2
        floor.position.set(0, 0, z)
        floor.receiveShadow = true
        scene.add(floor)
        trackSegments.push(floor)

        // Faixas laterais decorativas
        for (let side = -1; side <= 1; side += 2) {
          const sideStripGeometry = new THREE.PlaneGeometry(1.5, 20)
          const sideStripMaterial = new THREE.MeshLambertMaterial({
            map: wallTexture,
            color: 0xe6d3b7,
          })
          const sideStrip = new THREE.Mesh(sideStripGeometry, sideStripMaterial)
          sideStrip.rotation.x = -Math.PI / 2
          sideStrip.position.set(side * 3.25, 0.01, z)
          sideStrip.receiveShadow = true
          scene.add(sideStrip)
          trackSegments.push(sideStrip)
        }

        // Paredes laterais com detalhes
        for (let side = -1; side <= 1; side += 2) {
          const wallGeometry = new THREE.BoxGeometry(0.5, 4, 20)
          const wallMaterial = new THREE.MeshLambertMaterial({
            map: wallTexture,
            color: 0xc19a6b,
          })
          const wall = new THREE.Mesh(wallGeometry, wallMaterial)
          wall.position.set(side * 4.5, 2, z)
          wall.castShadow = true
          wall.receiveShadow = true
          scene.add(wall)
          trackSegments.push(wall)

          // Detalhes ornamentais na parede
          for (let i = 0; i < 3; i++) {
            const ornamentGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.8)
            const ornamentMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 })
            const ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial)
            ornament.position.set(side * 4.3, 1.5 + i * 0.8, z - 6 + i * 6)
            ornament.castShadow = true
            scene.add(ornament)
            trackSegments.push(ornament)
          }
        }

        // Teto com vigas
        const ceilingGeometry = new THREE.PlaneGeometry(9, 20)
        const ceilingMaterial = new THREE.MeshLambertMaterial({
          map: stoneTexture,
          color: 0xa0845c,
        })
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
        ceiling.rotation.x = Math.PI / 2
        ceiling.position.set(0, 4.5, z)
        ceiling.receiveShadow = true
        scene.add(ceiling)
        trackSegments.push(ceiling)

        // Vigas do teto
        for (let i = 0; i < 4; i++) {
          const beamGeometry = new THREE.BoxGeometry(0.3, 0.3, 20)
          const beamMaterial = new THREE.MeshLambertMaterial({
            map: woodTexture,
            color: 0x654321,
          })
          const beam = new THREE.Mesh(beamGeometry, beamMaterial)
          beam.position.set(-3 + i * 2, 4.3, z)
          beam.castShadow = true
          scene.add(beam)
          trackSegments.push(beam)
        }

        // Adicionar colunas ocasionalmente
        if (Math.random() < 0.3) {
          const side = Math.random() < 0.5 ? -6 : 6
          createOrnateColumn(side, z + Math.random() * 15 - 7.5)
        }

        // Adicionar vegetação nas laterais
        if (Math.random() < 0.4) {
          const side = Math.random() < 0.5 ? -7 : 7
          const isAutumn = Math.random() < 0.3
          createDetailedTree(side, z + Math.random() * 15 - 7.5, isAutumn)
        }
      }

      // Função para criar obstáculo de templo com física
      function createTempleObstacle(lane: number, z: number) {
        const obstacleGroup = new THREE.Group()

        // Adicionar física ao obstáculo
        obstacleGroup.physics = {
          boundingBox: { x: 0.8, y: 2.3, z: 0.8 },
          type: "obstacle",
          mass: 10.0,
          velocity: new THREE.Vector3(0, 0, 0),
        }

        // Pedestal
        const pedestalGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 12)
        const pedestalMaterial = new THREE.MeshLambertMaterial({
          map: stoneTexture,
          color: 0xd4a574,
        })
        const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
        pedestal.position.y = 0.15
        pedestal.castShadow = true
        pedestal.receiveShadow = true
        obstacleGroup.add(pedestal)

        // Estátua/Totem
        const totemGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.6)
        const totemMaterial = new THREE.MeshLambertMaterial({
          map: wallTexture,
          color: 0xa0845c,
        })
        const totem = new THREE.Mesh(totemGeometry, totemMaterial)
        totem.position.y = 1.05
        totem.castShadow = true
        totem.receiveShadow = true
        obstacleGroup.add(totem)

        // Topo decorativo
        const topGeometry = new THREE.ConeGeometry(0.4, 0.5, 8)
        const topMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 })
        const top = new THREE.Mesh(topGeometry, topMaterial)
        top.position.y = 2.05
        top.castShadow = true
        obstacleGroup.add(top)

        // Detalhes ornamentais
        for (let i = 0; i < 4; i++) {
          const detailGeometry = new THREE.SphereGeometry(0.05, 8, 8)
          const detailMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 })
          const detail = new THREE.Mesh(detailGeometry, detailMaterial)
          const angle = (i / 4) * Math.PI * 2
          detail.position.set(Math.cos(angle) * 0.32, 1, Math.sin(angle) * 0.32)
          detail.castShadow = true
          obstacleGroup.add(detail)
        }

        obstacleGroup.position.set(lane * 1.5, 0, z)
        scene.add(obstacleGroup)
        obstacles.push(obstacleGroup)
      }

      // Função para criar moeda dourada detalhada com física
      function createGoldenCoin(lane: number, z: number) {
        const coinGroup = new THREE.Group()

        // Adicionar física à moeda
        coinGroup.physics = {
          radius: 0.25,
          type: "coin",
          velocity: new THREE.Vector3(0, 0, 0),
          magnetism: 0.02,
          collected: false,
        }

        // Moeda principal
        const coinGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16)
        const coinMaterial = new THREE.MeshLambertMaterial({
          color: 0xffd700,
          emissive: 0x332200,
        })
        const coin = new THREE.Mesh(coinGeometry, coinMaterial)
        coin.castShadow = true
        coinGroup.add(coin)

        // Anel de energia
        const ringGeometry = new THREE.RingGeometry(0.22, 0.28, 16)
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        })
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.rotation.x = -Math.PI / 2
        coinGroup.add(ring)

        // Partículas de brilho
        for (let i = 0; i < 6; i++) {
          const sparkleGeometry = new THREE.SphereGeometry(0.02, 6, 6)
          const sparkleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8,
          })
          const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial)
          const angle = (i / 6) * Math.PI * 2
          sparkle.position.set(Math.cos(angle) * 0.3, Math.sin(angle * 2) * 0.1, Math.sin(angle) * 0.3)
          coinGroup.add(sparkle)
        }

        coinGroup.position.set(lane * 1.5, 1.2, z)
        scene.add(coinGroup)
        coins.push(coinGroup)
      }

      // Sistema de partículas físicas avançado
      function createPhysicsParticles(position: THREE.Vector3, color: number, type: string, force?: THREE.Vector3) {
        const particleCount = type === "coin" ? 20 : 30
        const particles = []

        for (let i = 0; i < particleCount; i++) {
          const particleGeometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 6, 6)
          const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
          })
          const particle = new THREE.Mesh(particleGeometry, particleMaterial)

          // Posição inicial
          particle.position.copy(position)
          particle.position.add(
            new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.3, (Math.random() - 0.5) * 0.5),
          )

          // Física da partícula
          particle.physics = {
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 0.3,
              0.1 + Math.random() * 0.2,
              (Math.random() - 0.5) * 0.3,
            ),
            gravity: -0.015,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.01,
          }

          // Aplicar força externa se fornecida
          if (force) {
            particle.physics.velocity.add(force)
          }

          scene.add(particle)
          particles.push(particle)
        }

        // Animar partículas com física
        const animatePhysicsParticles = () => {
          particles.forEach((particle, index) => {
            if (particle.physics.life <= 0) {
              scene.remove(particle)
              particles.splice(index, 1)
              return
            }

            // Aplicar física
            particle.physics.velocity.y += particle.physics.gravity
            particle.position.add(particle.physics.velocity)

            // Aplicar resistência do ar
            particle.physics.velocity.multiplyScalar(0.98)

            // Reduzir vida e opacidade
            particle.physics.life -= particle.physics.decay
            particle.material.opacity = particle.physics.life

            // Rotação aleatória
            particle.rotation.x += 0.1
            particle.rotation.y += 0.1
          })

          if (particles.length > 0) {
            requestAnimationFrame(animatePhysicsParticles)
          }
        }
        animatePhysicsParticles()
      }

      // Função para criar efeito de câmera shake
      function addCameraShake(intensity: number, duration: number) {
        gameState.cameraShake.intensity = intensity
        setTimeout(() => {
          gameState.cameraShake.intensity *= 0.5
        }, duration / 2)
        setTimeout(() => {
          gameState.cameraShake.intensity = 0
        }, duration)
      }

      // Função para slow motion
      function activateSlowMotion(duration: number) {
        gameState.slowMotion = 0.3
        setTimeout(() => {
          gameState.slowMotion = 1.0
        }, duration)
      }

      // Inicializar corredor do templo
      for (let i = 0; i < 12; i++) {
        createTempleCorridorSegment(-i * 20)

        if (i > 2 && Math.random() < 0.4) {
          const lane = Math.floor(Math.random() * 3) - 1
          createTempleObstacle(lane, -i * 20 + Math.random() * 15)
        }

        if (Math.random() < 0.6) {
          const lane = Math.floor(Math.random() * 3) - 1
          createGoldenCoin(lane, -i * 20 + Math.random() * 15)
        }
      }

      // Posicionar câmera estilo Temple Run
      camera.position.set(0, 3.5, 5)
      camera.lookAt(0, 1.5, -5)

      // Controles com física
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

      // Loop de animação com física avançada
      function animate() {
        requestAnimationFrame(animate)

        const deltaTime = gameState.slowMotion

        if (gameState.running && !gameState.gameOver) {
          // Movimento do jogador com física
          if (keys.left && gameState.targetLane > -1) {
            gameState.targetLane--
            keys.left = false
          }
          if (keys.right && gameState.targetLane < 1) {
            gameState.targetLane++
            keys.right = false
          }

          // Pulo com física realística
          if (keys.up && playerGroup.physics.grounded) {
            playerGroup.physics.velocity.y = playerGroup.physics.jumpForce
            playerGroup.physics.grounded = false
            keys.up = false
          }

          // Deslizar com física
          if (keys.down && playerGroup.physics.grounded && playerGroup.physics.slideTime <= 0) {
            playerGroup.physics.slideTime = playerGroup.physics.maxSlideTime
            playerGroup.scale.y = 0.5
            playerGroup.position.y = 0.25
            keys.down = false
          }

          // Aplicar física ao jogador
          physics.applyGravity(playerGroup)
          physics.applyFriction(playerGroup)
          physics.applyMomentum(playerGroup)

          // Movimento lateral suave com inércia
          const targetX = gameState.targetLane * 1.5
          const currentX = playerGroup.position.x
          const lerpSpeed = 0.15 * deltaTime
          playerGroup.position.x = THREE.MathUtils.lerp(currentX, targetX, lerpSpeed)

          // Gerenciar tempo de deslizamento
          if (playerGroup.physics.slideTime > 0) {
            playerGroup.physics.slideTime -= 16 // Assumindo 60fps
            if (playerGroup.physics.slideTime <= 0) {
              playerGroup.scale.y = 1
              playerGroup.position.y = playerGroup.physics.groundLevel
            }
          }

          // Animações detalhadas do personagem com física
          const runTime = Date.now() * 0.01 * deltaTime
          const leftArm = playerGroup.children[4]
          const rightArm = playerGroup.children[5]
          const leftForearm = playerGroup.children[6]
          const rightForearm = playerGroup.children[7]
          const leftLeg = playerGroup.children[8]
          const rightLeg = playerGroup.children[9]

          // Animação de corrida mais realística
          const runSpeed = gameState.speed * 20
          leftArm.rotation.x = Math.sin(runTime * runSpeed) * 0.8
          rightArm.rotation.x = -Math.sin(runTime * runSpeed) * 0.8
          leftForearm.rotation.x = Math.sin(runTime * runSpeed + 0.3) * 0.6
          rightForearm.rotation.x = -Math.sin(runTime * runSpeed + 0.3) * 0.6
          leftLeg.rotation.x = -Math.sin(runTime * runSpeed) * 0.6
          rightLeg.rotation.x = Math.sin(runTime * runSpeed) * 0.6

          // Movimento sutil do torso com física
          const torso = playerGroup.children[0]
          torso.rotation.z = Math.sin(runTime * runSpeed * 2) * 0.08
          torso.rotation.x = playerGroup.physics.velocity.y * 0.1

          // Balanço da mochila com inércia
          const backpack = playerGroup.children[3]
          backpack.rotation.x = Math.sin(runTime * runSpeed) * 0.15 - playerGroup.physics.velocity.y * 0.2

          // Mover mundo
          trackSegments.forEach((segment) => {
            segment.position.z += gameState.speed * deltaTime
            if (segment.position.z > 20) {
              segment.position.z -= 240
            }
          })

          // Mover vegetação com balanço físico
          vegetation.forEach((plant, index) => {
            plant.position.z += gameState.speed * deltaTime

            // Aplicar balanço aos galhos
            plant.children.forEach((child) => {
              if (child.userData && child.userData.swaySpeed) {
                child.rotation.z =
                  child.userData.originalRotation +
                  Math.sin(Date.now() * 0.001 * child.userData.swaySpeed) * child.userData.swayAmount
              }
            })

            if (plant.position.z > 20) {
              scene.remove(plant)
              vegetation.splice(index, 1)

              const side = Math.random() < 0.5 ? -7 : 7
              const isAutumn = Math.random() < 0.3
              createDetailedTree(side, -220 + Math.random() * 15, isAutumn)
            }
          })

          // Mover decorações
          decorations.forEach((decoration, index) => {
            decoration.position.z += gameState.speed * deltaTime
            if (decoration.position.z > 20) {
              scene.remove(decoration)
              decorations.splice(index, 1)

              const side = Math.random() < 0.5 ? -6 : 6
              createOrnateColumn(side, -220 + Math.random() * 15)
            }
          })

          // Obstáculos com física de colisão avançada
          obstacles.forEach((obstacle, index) => {
            obstacle.position.z += gameState.speed * deltaTime

            // Verificar colisão com física precisa
            if (physics.checkCollision(playerGroup, obstacle)) {
              const collisionResult = physics.resolveCollision(playerGroup, obstacle, "obstacle")

              if (collisionResult === "collision") {
                // Efeitos de colisão
                const impactForce = new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.1, -0.1)
                createPhysicsParticles(playerGroup.position, 0xff4444, "explosion", impactForce)
                addCameraShake(0.3, 500)
                activateSlowMotion(1000)

                gameState.gameOver = true
                setGameOver(true)
                setGameStarted(false)
              }
            }

            if (obstacle.position.z > 20) {
              scene.remove(obstacle)
              obstacles.splice(index, 1)

              const lane = Math.floor(Math.random() * 3) - 1
              createTempleObstacle(lane, -220 + Math.random() * 15)
            }
          })

          // Moedas com física de magnetismo
          coins.forEach((coin, index) => {
            coin.position.z += gameState.speed * deltaTime
            coin.rotation.y += 0.12 * deltaTime

            // Animação de flutuação com física
            coin.position.y = 1.2 + Math.sin(Date.now() * 0.005 + index) * 0.15

            // Efeito de magnetismo
            const distanceToPlayer = coin.position.distanceTo(playerGroup.position)
            if (distanceToPlayer < 2.0 && !coin.physics.collected) {
              const magnetDirection = new THREE.Vector3()
              magnetDirection.subVectors(playerGroup.position, coin.position).normalize()
              coin.physics.velocity.add(magnetDirection.multiplyScalar(coin.physics.magnetism))
              coin.position.add(coin.physics.velocity)
            }

            // Animação dos sparkles com física
            coin.children.forEach((child, childIndex) => {
              if (childIndex > 1) {
                const angle = (childIndex / 6) * Math.PI * 2 + Date.now() * 0.003
                child.position.x = Math.cos(angle) * (0.3 + Math.sin(Date.now() * 0.01) * 0.1)
                child.position.z = Math.sin(angle) * (0.3 + Math.sin(Date.now() * 0.01) * 0.1)
                child.position.y = Math.sin(angle * 3 + Date.now() * 0.005) * 0.15
              }
            })

            // Verificar colisão com física esférica
            if (physics.checkSphereCollision(playerGroup, coin)) {
              const collectionForce = new THREE.Vector3(0, 0.15, 0)
              createPhysicsParticles(coin.position, 0xffd700, "coin", collectionForce)
              scene.remove(coin)
              coins.splice(index, 1)
              gameState.score += 10
              setScore(gameState.score)
            }

            if (coin.position.z > 20) {
              scene.remove(coin)
              coins.splice(index, 1)

              const lane = Math.floor(Math.random() * 3) - 1
              createGoldenCoin(lane, -220 + Math.random() * 15)
            }
          })

          gameState.speed += 0.0008 * deltaTime
          gameState.score += 0.15 * deltaTime
          setScore(Math.floor(gameState.score))

          // Câmera dinâmica com shake físico
          const baseX = playerGroup.position.x * 0.3
          const baseY = 3.5 + Math.sin(runTime * 0.5) * 0.05

          // Aplicar shake da câmera
          gameState.cameraShake.x = (Math.random() - 0.5) * gameState.cameraShake.intensity
          gameState.cameraShake.y = (Math.random() - 0.5) * gameState.cameraShake.intensity

          camera.position.x = THREE.MathUtils.lerp(camera.position.x, baseX + gameState.cameraShake.x, 0.08)
          camera.position.y = baseY + gameState.cameraShake.y

          // Reduzir shake gradualmente
          gameState.cameraShake.intensity *= 0.95
        }

        renderer.render(scene, camera)
      }

      function startGame() {
        gameState = {
          running: true,
          speed: 0.25,
          score: 0,
          targetLane: 0,
          gameOver: false,
          cameraShake: { x: 0, y: 0, intensity: 0 },
          slowMotion: 1.0,
        }

        // Resetar física do jogador
        playerGroup.position.set(0, 0.5, 0)
        playerGroup.scale.set(1, 1, 1)
        playerGroup.physics.velocity.set(0, 0, 0)
        playerGroup.physics.grounded = true
        playerGroup.physics.slideTime = 0

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

      {/* Interface temática do templo */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className="p-4 rounded-lg border-2 text-white shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(139, 115, 85, 0.9), rgba(101, 67, 33, 0.9))",
            borderColor: "#d4a574",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="space-y-2">
            <div className="text-3xl font-bold text-yellow-300 drop-shadow-lg" style={{ fontFamily: "serif" }}>
              ⚱️ {score.toLocaleString()}
            </div>
            <div className="text-sm text-orange-200">🏆 Recorde: {highScore.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Controles temáticos */}
      <div className="absolute bottom-4 right-4 z-10">
        <div
          className="p-3 rounded-lg border-2 text-white shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(101, 67, 33, 0.9), rgba(139, 115, 85, 0.9))",
            borderColor: "#8b7355",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="text-sm space-y-1" style={{ fontFamily: "serif" }}>
            <div className="text-yellow-300 font-semibold">🏛️ Controles:</div>
            <div>← → : Mover entre colunas</div>
            <div>↑ Space: Pular obstáculos</div>
            <div>↓ : Deslizar por baixo</div>
            <div className="text-orange-300">📱 Touch: Deslizar na tela</div>
          </div>
        </div>
      </div>

      {/* Tela inicial temática */}
      {!gameStarted && !gameOver && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{
            background: "linear-gradient(45deg, rgba(139, 115, 85, 0.95), rgba(212, 165, 116, 0.95))",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            className="p-10 text-center rounded-xl border-4 text-white shadow-2xl transform hover:scale-105 transition-transform"
            style={{
              background: "linear-gradient(135deg, rgba(101, 67, 33, 0.95), rgba(139, 115, 85, 0.95))",
              borderColor: "#d4a574",
              fontFamily: "serif",
            }}
          >
            <h1 className="text-6xl font-bold mb-4 text-yellow-300 drop-shadow-lg">🏛️ TEMPLE RUN</h1>
            <h2 className="text-3xl mb-2 text-orange-200">PHYSICS EDITION</h2>
            <p className="text-xl mb-2 text-yellow-200">Física Realística • Colisões Avançadas</p>
            <p className="text-lg mb-8 text-orange-300">Magnetismo • Inércia • Gravidade Real!</p>
            <Button
              onClick={startGame}
              className="text-2xl px-12 py-4 font-bold shadow-lg transform hover:scale-110 transition-all"
              style={{
                background: "linear-gradient(45deg, #ffd700, #ffa500)",
                color: "#654321",
                border: "3px solid #d4a574",
              }}
            >
              ⚡ INICIAR AVENTURA
            </Button>
          </div>
        </div>
      )}

      {/* Tela de game over temática */}
      {gameOver && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{
            background: "linear-gradient(45deg, rgba(139, 69, 19, 0.95), rgba(160, 82, 45, 0.95))",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            className="p-10 text-center rounded-xl border-4 text-white shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(101, 67, 33, 0.95), rgba(139, 69, 19, 0.95))",
              borderColor: "#cd853f",
              fontFamily: "serif",
            }}
          >
            <h2 className="text-5xl font-bold mb-4 text-red-300">💀 CAPTURADO!</h2>
            <p className="text-2xl mb-6 text-orange-200">A física te traiu...</p>
            <div className="space-y-3 mb-8">
              <div className="text-3xl text-yellow-400">⚱️ Tesouros: {score.toLocaleString()}</div>
              <div className="text-2xl text-orange-300">🏆 Recorde: {highScore.toLocaleString()}</div>
              {score > highScore && (
                <div className="text-xl text-green-400 animate-pulse">🎉 Novo Recorde Alcançado!</div>
              )}
            </div>
            <div className="space-x-6">
              <Button
                onClick={startGame}
                className="text-xl px-8 py-3 font-bold shadow-lg transform hover:scale-110 transition-all"
                style={{
                  background: "linear-gradient(45deg, #32cd32, #228b22)",
                  color: "white",
                  border: "2px solid #90ee90",
                }}
              >
                🔄 Tentar Novamente
              </Button>
              <Button
                onClick={() => window.history.back()}
                className="text-xl px-8 py-3 font-bold shadow-lg transform hover:scale-110 transition-all"
                style={{
                  background: "linear-gradient(45deg, #696969, #2f4f4f)",
                  color: "white",
                  border: "2px solid #a9a9a9",
                }}
              >
                🏠 Voltar ao Menu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Efeito de vinheta atmosférica */}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          background: "radial-gradient(circle at center, transparent 60%, rgba(139, 115, 85, 0.3) 100%)",
        }}
      />
    </div>
  )
}
