import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'
import { GRID_ROWS, GRID_COLS, TILE_TYPES, ANIMATION_DURATION } from './config'

export interface Tile {
  id: number
  typeId: number
  icon: string
  colorClass: string
  row: number
  col: number
  isMatched: boolean
}

export type GameStatus = 'playing' | 'won' | 'lost'

export function useGame() {
  const board = ref<Tile[]>([])
  const isLocked = ref(false)

  // State cơ chế Level
  const level = ref(1)
  const moves = ref(0)
  const targetChips = ref(0)
  const collectedChips = ref(0)
  const gameStatus = ref<GameStatus>('playing')

  // State hỗ trợ vuốt
  const activeTile = ref<Tile | null>(null)
  const startPos = ref({ x: 0, y: 0 })

  let tileIdCounter = 0

  const initBoard = () => {
    board.value = []
    activeTile.value = null

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        let randomType = TILE_TYPES[0]!
        do {
          randomType = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]!
        } while (
          (c >= 2 && getTile(r, c - 1)?.typeId === randomType.id && getTile(r, c - 2)?.typeId === randomType.id) ||
          (r >= 2 && getTile(r - 1, c)?.typeId === randomType.id && getTile(r - 2, c)?.typeId === randomType.id)
        )

        board.value.push({
          id: tileIdCounter++,
          typeId: randomType.id,
          icon: randomType.icon,
          colorClass: randomType.color,
          row: r,
          col: c,
          isMatched: false
        })
      }
    }
  }

  // Khởi tạo level cụ thể
  const startLevel = (lvl: number) => {
    level.value = lvl
    // Random moves từ 20 đến 30
    moves.value = Math.floor(Math.random() * 11) + 20
    // Lượng chip cần thu thập ~4 chip / move
    targetChips.value = moves.value * 4
    collectedChips.value = 0
    gameStatus.value = 'playing'
    isLocked.value = false
    initBoard()
  }

  const restartGame = () => startLevel(1)
  const nextLevel = () => startLevel(level.value + 1)

  const getTile = (row: number, col: number) => {
    return board.value.find(t => t.row === row && t.col === col && !t.isMatched)
  }

  const onPointerDown = (e: PointerEvent, tile: Tile) => {
    if (isLocked.value || tile.isMatched || gameStatus.value !== 'playing') return
    activeTile.value = tile
    startPos.value = { x: e.clientX, y: e.clientY }
  }

  const onPointerUp = (e: PointerEvent) => {
    if (!activeTile.value || isLocked.value || gameStatus.value !== 'playing') return

    const deltaX = e.clientX - startPos.value.x
    const deltaY = e.clientY - startPos.value.y
    const SWIPE_THRESHOLD = 30

    if (Math.abs(deltaX) > SWIPE_THRESHOLD || Math.abs(deltaY) > SWIPE_THRESHOLD) {
      let targetRow = activeTile.value.row
      let targetCol = activeTile.value.col

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        targetCol += deltaX > 0 ? 1 : -1
      } else {
        targetRow += deltaY > 0 ? 1 : -1
      }

      const targetTile = getTile(targetRow, targetCol)
      if (targetTile) {
        attemptSwap(activeTile.value, targetTile)
      }
    }
    activeTile.value = null
  }

  if (typeof window !== 'undefined') {
    useEventListener(window, 'pointerup', onPointerUp)
  }

  const attemptSwap = async (t1: Tile, t2: Tile) => {
    isLocked.value = true
    swapTiles(t1, t2)
    await delay(ANIMATION_DURATION)

    const matches = findMatches()
    if (matches.length > 0) {
      moves.value-- // Trừ 1 move khi swap thành công sinh ra match
      await processMatches(matches)
    } else {
      swapTiles(t1, t2)
      await delay(ANIMATION_DURATION)
      isLocked.value = false
    }
  }

  const swapTiles = (t1: Tile, t2: Tile) => {
    const tempRow = t1.row
    const tempCol = t1.col
    t1.row = t2.row
    t1.col = t2.col
    t2.row = tempRow
    t2.col = tempCol
  }

  const findMatches = () => {
    const matches = new Set<Tile>()
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS - 2; c++) {
        const t1 = getTile(r, c), t2 = getTile(r, c + 1), t3 = getTile(r, c + 2)
        if (t1 && t2 && t3 && t1.typeId === t2.typeId && t1.typeId === t3.typeId) {
          matches.add(t1).add(t2).add(t3)
        }
      }
    }
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS - 2; r++) {
        const t1 = getTile(r, c), t2 = getTile(r + 1, c), t3 = getTile(r + 2, c)
        if (t1 && t2 && t3 && t1.typeId === t2.typeId && t1.typeId === t3.typeId) {
          matches.add(t1).add(t2).add(t3)
        }
      }
    }
    return Array.from(matches)
  }

  const processMatches = async (matches: Tile[]) => {
    matches.forEach(m => m.isMatched = true)

    // Mỗi viên đá nổ = 1 chip
    collectedChips.value += matches.length
    await delay(ANIMATION_DURATION)

    board.value = board.value.filter(t => !t.isMatched)

    for (let c = 0; c < GRID_COLS; c++) {
      let emptySpaces = 0
      for (let r = GRID_ROWS - 1; r >= 0; r--) {
        const tile = getTile(r, c)
        if (!tile) emptySpaces++
        else if (emptySpaces > 0) tile.row += emptySpaces
      }
      for (let i = 0; i < emptySpaces; i++) {
        const randomType = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]!
        board.value.push({
          id: tileIdCounter++,
          typeId: randomType.id,
          icon: randomType.icon,
          colorClass: randomType.color,
          row: i,
          col: c,
          isMatched: false
        })
      }
    }

    await delay(ANIMATION_DURATION)

    const newMatches = findMatches()
    if (newMatches.length > 0) {
      await processMatches(newMatches) // Đệ quy chuỗi combo
    } else {
      checkGameStatus() // Kiểm tra điều kiện thắng thua sau khi MỌI combo đã kết thúc
    }
  }

  const checkGameStatus = () => {
    if (collectedChips.value >= targetChips.value) {
      gameStatus.value = 'won'
      isLocked.value = true
    } else if (moves.value <= 0) {
      gameStatus.value = 'lost'
      isLocked.value = true
    } else {
      isLocked.value = false
    }
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  return {
    board,
    level,
    moves,
    targetChips,
    collectedChips,
    gameStatus,
    startLevel,
    restartGame,
    nextLevel,
    onPointerDown
  }
}
