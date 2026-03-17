import { ref, onUnmounted } from 'vue'
import { useStorage, useEventListener } from '@vueuse/core'
import { FRUIT_TYPES, BOARD_WIDTH, BOARD_HEIGHT, GRAVITY, BOUNCE, FRICTION, ENGINE_ITERATIONS } from './config'

export interface Fruit {
  id: number
  typeId: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  icon: string
  colorClass: string
  isMerged: boolean
  spawnTime: number // Thêm dòng này
}

export type GameStatus = 'idle' | 'playing' | 'gameover'

export function useGame() {
  const fruits = ref<Fruit[]>([])
  const score = ref(0)
  const highScore = useStorage('quantum_mergers_highscore', 0)
  const gameStatus = ref<GameStatus>('idle')

  // Trái cây đang chờ thả
  const currentFruitType = ref(FRUIT_TYPES[0])
  const nextFruitType = ref(FRUIT_TYPES[1])
  const dropX = ref(BOARD_WIDTH / 2) // Vị trí chuột/cảm ứng để thả

  let fruitIdCounter = 0
  let animationFrameId: number

  const getRandomBaseFruit = () => {
    // Chỉ random 4 loại trái cây nhỏ nhất cho viên thả xuống
    const maxIndex = Math.min(3, FRUIT_TYPES.length - 1)
    return FRUIT_TYPES[Math.floor(Math.random() * (maxIndex + 1))]!
  }

  const startGame = () => {
    fruits.value = []
    score.value = 0
    gameStatus.value = 'playing'
    currentFruitType.value = getRandomBaseFruit()
    nextFruitType.value = getRandomBaseFruit()
    if (!animationFrameId) gameLoop()
  }

  const dropFruit = () => {
    if (gameStatus.value !== 'playing') return

    const safeX = Math.max(currentFruitType.value.radius, Math.min(BOARD_WIDTH - currentFruitType.value.radius, dropX.value))

    fruits.value.push({
      id: fruitIdCounter++,
      typeId: currentFruitType.value.id,
      x: safeX,
      y: currentFruitType.value.radius,
      vx: 0,
      vy: 0,
      radius: currentFruitType.value.radius,
      icon: currentFruitType.value.icon,
      colorClass: currentFruitType.value.color,
      isMerged: false,
      spawnTime: Date.now() // Ghi nhận thời gian thả
    })

    currentFruitType.value = nextFruitType.value
    nextFruitType.value = getRandomBaseFruit()
  }

  // Cập nhật vị trí thả theo con trỏ chuột/cảm ứng
  const updateDropPosition = (e: PointerEvent, containerBounds: DOMRect) => {
    if (gameStatus.value !== 'playing') return
    const relativeX = e.clientX - containerBounds.left
    const scale = BOARD_WIDTH / containerBounds.width
    dropX.value = relativeX * scale
  }

  // --- PHYSICS ENGINE TỐI GIẢN ---
  const gameLoop = () => {
    if (gameStatus.value === 'playing') {
      updatePhysics()
      checkGameOver()
    }
    animationFrameId = requestAnimationFrame(gameLoop)
  }

  const updatePhysics = () => {
    const currentFruits = fruits.value

    // 1. Áp dụng trọng lực & Di chuyển
    currentFruits.forEach(f => {
      if (f.isMerged) return
      f.vy += GRAVITY
      f.vy *= 0.99 // Cản không khí nhẹ
      f.x += f.vx
      f.y += f.vy
    })

    // 2. Xử lý va chạm nhiều vòng (Iterations) để chống lỗi xuyên thấu
    for (let iter = 0; iter < ENGINE_ITERATIONS; iter++) {
      // Va chạm tường & đáy
      currentFruits.forEach(f => {
        if (f.isMerged) return

        // Đáy
        if (f.y + f.radius > BOARD_HEIGHT) {
          f.y = BOARD_HEIGHT - f.radius
          f.vy *= -BOUNCE
          f.vx *= FRICTION
        }
        // Tường trái
        if (f.x - f.radius < 0) {
          f.x = f.radius
          f.vx *= -BOUNCE
        }
        // Tường phải
        if (f.x + f.radius > BOARD_WIDTH) {
          f.x = BOARD_WIDTH - f.radius
          f.vx *= -BOUNCE
        }
      })

      // Va chạm giữa các trái cây (Circle Collision)
      for (let i = 0; i < currentFruits.length; i++) {
        for (let j = i + 1; j < currentFruits.length; j++) {
          const f1 = currentFruits[i]
          const f2 = currentFruits[j]

          if (f1.isMerged || f2.isMerged) continue

          const dx = f2.x - f1.x
          const dy = f2.y - f1.y
          const distSq = dx * dx + dy * dy
          const minDist = f1.radius + f2.radius

          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq) || 0.1

            // Xử lý Merge nếu cùng loại
            if (f1.typeId === f2.typeId) {
              handleMerge(f1, f2)
              continue
            }

            // Đẩy ra xa nhau (Resolve Overlap)
            const overlap = minDist - dist
            const nx = dx / dist
            const ny = dy / dist

            const massRatio = 0.5
            f1.x -= nx * overlap * massRatio
            f1.y -= ny * overlap * massRatio
            f2.x += nx * overlap * massRatio
            f2.y += ny * overlap * massRatio

            // Trao đổi lực (Velocity) có giảm xóc
            const relVx = f2.vx - f1.vx
            const relVy = f2.vy - f1.vy
            const damping = 0.5 // Độ hấp thụ lực

            f1.vx += nx * relVx * damping
            f1.vy += ny * relVy * damping
            f2.vx -= nx * relVx * damping
            f2.vy -= ny * relVy * damping
          }
        }
      }
    }

    // Dọn dẹp trái cây đã merge
    fruits.value = currentFruits.filter(f => !f.isMerged)
  }

  const handleMerge = (f1: Fruit, f2: Fruit) => {
    f1.isMerged = true
    f2.isMerged = true

    // Sinh trái cây cấp cao hơn
    const nextTypeIndex = FRUIT_TYPES.findIndex(t => t.id === f1.typeId) + 1
    if (nextTypeIndex < FRUIT_TYPES.length) {
      const nextType = FRUIT_TYPES[nextTypeIndex]!

      score.value += nextType.score
      if (score.value > highScore.value) {
        highScore.value = score.value
      }

      // Đẩy lực nổ nhẹ khi merge
      // Trong hàm handleMerge, đoạn push trái cây mới:
      fruits.value.push({
        id: fruitIdCounter++,
        typeId: nextType.id,
        x: (f1.x + f2.x) / 2,
        y: (f1.y + f2.y) / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: -2, // Lực nẩy nhẹ lên khi merge
        radius: nextType.radius,
        icon: nextType.icon,
        colorClass: nextType.color,
        isMerged: false,
        spawnTime: Date.now() // Ghi nhận thời gian sinh ra do merge
      })
    }
  }

  // --- GAME OVER ---
  const checkGameOver = () => {
    const now = Date.now()
    // Chỉ kiểm tra game over với những trái đã tồn tại ít nhất 1.5s
    const isOver = fruits.value.some(
      f => (now - f.spawnTime > 1500) && (f.y - f.radius < 50) && (Math.abs(f.vy) < 1)
    )
    if (isOver) {
      gameStatus.value = 'gameover'
    }
  }

  onUnmounted(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
  })

  return {
    fruits,
    score,
    highScore,
    gameStatus,
    currentFruitType,
    nextFruitType,
    dropX,
    startGame,
    dropFruit,
    updateDropPosition
  }
}
