"use client"

import { useEffect, useState } from "react"

interface TreasureChestAnimationProps {
  prizeAmount: number
  gameType: "esperanca" | "fortuna" | "mega"
  onComplete: () => void
}

export function TreasureChestAnimation({ prizeAmount, gameType, onComplete }: TreasureChestAnimationProps) {
  const [phase, setPhase] = useState<"appearing" | "opening" | "revealing" | "celebrating">("appearing")

  const themeColors = {
    esperanca: {
      primary: "#F59E0B", // amber
      secondary: "#D97706",
      accent: "#FCD34D",
      glow: "rgba(245, 158, 11, 0.6)",
      particles: ["#FCD34D", "#F59E0B", "#FBBF24"],
    },
    fortuna: {
      primary: "#EAB308", // yellow
      secondary: "#CA8A04",
      accent: "#FDE047",
      glow: "rgba(234, 179, 8, 0.6)",
      particles: ["#FDE047", "#EAB308", "#FACC15"],
    },
    mega: {
      primary: "#A855F7", // purple
      secondary: "#7C3AED",
      accent: "#C084FC",
      glow: "rgba(168, 85, 247, 0.6)",
      particles: ["#C084FC", "#A855F7", "#E879F9"],
    },
  }

  const theme = themeColors[gameType]

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("opening"), 800),
      setTimeout(() => setPhase("revealing"), 2000),
      setTimeout(() => setPhase("celebrating"), 2800),
      setTimeout(() => onComplete(), 4500),
    ]

    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative">
        {/* Background Glow */}
        <div
          className="absolute inset-0 rounded-full blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
            width: "400px",
            height: "400px",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Main Container */}
        <div className={`treasure-scene ${phase}`}>
          {/* 3D Treasure Chest */}
          <div className="chest-container">
            {/* Chest Base */}
            <div className="chest-base">
              <div
                className="chest-front"
                style={{
                  background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 50%, ${theme.secondary} 100%)`,
                }}
              >
                <div className="chest-lock">
                  <div className="lock-body" style={{ backgroundColor: theme.accent }}></div>
                  <div className="lock-shackle"></div>
                </div>
                <div className="chest-bands">
                  <div className="band" style={{ backgroundColor: theme.accent }}></div>
                  <div className="band" style={{ backgroundColor: theme.accent }}></div>
                </div>
              </div>
              <div
                className="chest-right"
                style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
              ></div>
              <div className="chest-bottom" style={{ backgroundColor: theme.secondary }}></div>
            </div>

            {/* Chest Lid */}
            <div className="chest-lid">
              <div
                className="lid-top"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 50%, ${theme.primary} 100%)`,
                }}
              >
                <div className="lid-handle" style={{ backgroundColor: theme.accent }}></div>
              </div>
              <div
                className="lid-front"
                style={{ background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 100%)` }}
              ></div>
              <div
                className="lid-right"
                style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}
              ></div>
            </div>

            {/* Golden Light Beam */}
            <div
              className="light-beam"
              style={{ background: `linear-gradient(to top, ${theme.glow}, ${theme.accent}40)` }}
            ></div>

            {/* Floating Coins */}
            <div className="floating-coins">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="coin"
                  style={
                    {
                      backgroundColor: theme.accent,
                      animationDelay: `${i * 0.2}s`,
                      left: `${20 + i * 10}%`,
                      "--coin-color": theme.accent,
                    } as any
                  }
                >
                  <div className="coin-inner" style={{ backgroundColor: theme.primary }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Prize Amount Display */}
          <div className="prize-display">
            <div className="prize-glow" style={{ color: theme.accent, textShadow: `0 0 20px ${theme.glow}` }}>
              R$ {prizeAmount.toFixed(2)}
            </div>
            <div className="prize-label" style={{ color: theme.accent }}>
              {gameType === "esperanca" && "Esperança Premiada!"}
              {gameType === "fortuna" && "Fortuna Dourada!"}
              {gameType === "mega" && "MEGA SORTE!"}
            </div>
          </div>

          {/* Particle System */}
          <div className="particles">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  backgroundColor: theme.particles[i % theme.particles.length],
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Magic Sparkles */}
          <div className="sparkles">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="sparkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  color: theme.accent,
                }}
              >
                ✨
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .treasure-scene {
          position: relative;
          width: 300px;
          height: 400px;
          perspective: 1000px;
          transform-style: preserve-3d;
        }

        .chest-container {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 150px;
          transform-style: preserve-3d;
        }

        /* Chest Base */
        .chest-base {
          position: absolute;
          width: 200px;
          height: 100px;
          bottom: 0;
          transform-style: preserve-3d;
        }

        .chest-front {
          position: absolute;
          width: 200px;
          height: 100px;
          border-radius: 10px 10px 5px 5px;
          border: 3px solid rgba(0,0,0,0.3);
          box-shadow: 
            inset 0 10px 20px rgba(255,255,255,0.3),
            inset 0 -10px 20px rgba(0,0,0,0.3),
            0 10px 30px rgba(0,0,0,0.5);
        }

        .chest-right {
          position: absolute;
          width: 80px;
          height: 100px;
          right: -80px;
          transform: rotateY(90deg);
          transform-origin: left;
          border-radius: 0 10px 5px 0;
          border: 3px solid rgba(0,0,0,0.3);
        }

        .chest-bottom {
          position: absolute;
          width: 200px;
          height: 80px;
          bottom: -80px;
          transform: rotateX(90deg);
          transform-origin: top;
          border-radius: 10px;
        }

        .chest-lock {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
        }

        .lock-body {
          width: 20px;
          height: 25px;
          border-radius: 5px;
          border: 2px solid rgba(0,0,0,0.3);
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .lock-shackle {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 15px;
          height: 15px;
          border: 3px solid #8B4513;
          border-bottom: none;
          border-radius: 15px 15px 0 0;
        }

        .chest-bands {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .band {
          position: absolute;
          width: 100%;
          height: 8px;
          border-radius: 4px;
          box-shadow: 
            inset 0 2px 4px rgba(255,255,255,0.5),
            0 2px 8px rgba(0,0,0,0.3);
        }

        .band:first-child {
          top: 20px;
        }

        .band:last-child {
          bottom: 20px;
        }

        /* Chest Lid */
        .chest-lid {
          position: absolute;
          width: 200px;
          height: 50px;
          top: 0;
          transform-style: preserve-3d;
          transform-origin: bottom;
          transition: transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .lid-top {
          position: absolute;
          width: 200px;
          height: 80px;
          border-radius: 10px;
          border: 3px solid rgba(0,0,0,0.3);
          box-shadow: 
            inset 0 5px 15px rgba(255,255,255,0.4),
            inset 0 -5px 15px rgba(0,0,0,0.2),
            0 5px 20px rgba(0,0,0,0.4);
        }

        .lid-handle {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 30px;
          height: 8px;
          border-radius: 4px;
          border: 2px solid rgba(0,0,0,0.3);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .lid-front {
          position: absolute;
          width: 200px;
          height: 50px;
          bottom: -50px;
          border-radius: 0 0 10px 10px;
          border: 3px solid rgba(0,0,0,0.3);
        }

        .lid-right {
          position: absolute;
          width: 80px;
          height: 50px;
          right: -80px;
          bottom: -50px;
          transform: rotateY(90deg);
          transform-origin: left;
          border-radius: 0 10px 10px 0;
          border: 3px solid rgba(0,0,0,0.3);
        }

        /* Light Beam */
        .light-beam {
          position: absolute;
          left: 50%;
          top: -100px;
          transform: translateX(-50%);
          width: 150px;
          height: 200px;
          clip-path: polygon(40% 100%, 60% 100%, 80% 0%, 20% 0%);
          opacity: 0;
          transition: opacity 0.8s ease-in-out;
        }

        /* Floating Coins */
        .floating-coins {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .coin {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.3);
          opacity: 0;
          transform: translateY(20px);
          box-shadow: 
            0 4px 8px rgba(0,0,0,0.3),
            inset 0 2px 4px rgba(255,255,255,0.5);
          animation: floatCoin 2s ease-out forwards;
        }

        .coin-inner {
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.2);
        }

        /* Prize Display */
        .prize-display {
          position: absolute;
          left: 50%;
          bottom: -80px;
          transform: translateX(-50%);
          text-align: center;
          opacity: 0;
          animation: prizeReveal 1s ease-out 2s forwards;
        }

        .prize-glow {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          animation: prizeGlow 2s ease-in-out infinite alternate;
        }

        .prize-label {
          font-size: 1.2rem;
          font-weight: 600;
          opacity: 0.9;
        }

        /* Particles */
        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          opacity: 0;
          animation: particleFloat 4s linear infinite;
        }

        /* Sparkles */
        .sparkles {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .sparkle {
          position: absolute;
          font-size: 1.5rem;
          opacity: 0;
          animation: sparkleAnimation 2s ease-in-out infinite;
        }

        /* Animation States */
        .treasure-scene.appearing .chest-container {
          animation: chestAppear 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .treasure-scene.opening .chest-lid {
          transform: rotateX(-120deg);
        }

        .treasure-scene.opening .light-beam {
          opacity: 1;
        }

        .treasure-scene.revealing .coin {
          animation: floatCoin 2s ease-out forwards;
        }

        .treasure-scene.celebrating .particles .particle {
          opacity: 1;
        }

        /* Keyframe Animations */
        @keyframes chestAppear {
          0% {
            transform: translate(-50%, -50%) scale(0.3) rotateY(-180deg);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1) rotateY(-90deg);
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotateY(0deg);
            opacity: 1;
          }
        }

        @keyframes floatCoin {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0);
          }
          20% {
            opacity: 1;
            transform: translateY(-10px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-80px) scale(0.5) rotateZ(720deg);
          }
        }

        @keyframes prizeReveal {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes prizeGlow {
          0% {
            transform: scale(1);
            filter: brightness(1);
          }
          100% {
            transform: scale(1.05);
            filter: brightness(1.2);
          }
        }

        @keyframes particleFloat {
          0% {
            opacity: 0;
            transform: translateY(100px) translateX(0) scale(0);
          }
          10% {
            opacity: 1;
            transform: translateY(80px) translateX(10px) scale(1);
          }
          90% {
            opacity: 1;
            transform: translateY(-100px) translateX(-10px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-120px) translateX(0) scale(0);
          }
        }

        @keyframes sparkleAnimation {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .treasure-scene {
            width: 250px;
            height: 350px;
          }
          
          .chest-container {
            width: 160px;
            height: 120px;
          }
          
          .chest-base, .chest-front, .lid-top, .lid-front {
            width: 160px;
          }
          
          .prize-glow {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  )
}
