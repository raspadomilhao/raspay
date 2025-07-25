export const scratchOverlayImages = [
  "/images/overlay-ferias.png",
  "/images/overlay-premios.png",
  "/images/overlay-moto.png",
]

export function getRandomOverlayImage(): string {
  const randomIndex = Math.floor(Math.random() * scratchOverlayImages.length)
  return scratchOverlayImages[randomIndex]
}
