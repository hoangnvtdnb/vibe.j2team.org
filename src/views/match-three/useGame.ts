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

export function useGame() {
  const board = ref<Tile[]>([])
  const score = ref(0)
  const isLocked = ref(false)

  // State hỗ trợ vuốt (swipe)
  const activeTile = ref<Tile | null>(null)
  const startPos = ref({ x: 0, y: 0 })

  let tileIdCounter = 0

  const initGame = () => {
    board.value = []
    score.value = 0
    activeTile.value = null
    isLocked.value = false

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

  const getTile = (row: number, col: number) => {
    return board.value.find(t => t.row === row && t.col === col && !t.isMatched)
  }

  // Bắt đầu vuốt
  const onPointerDown = (e: PointerEvent, tile: Tile) => {
    if (isLocked.value || tile.isMatched) return
    activeTile.value = tile
    startPos.value = { x: e.clientX, y: e.clientY }
  }

  // Kết thúc vuốt
  const onPointerUp = (e: PointerEvent) => {
    if (!activeTile.value || isLocked.value) return

    const deltaX = e.clientX - startPos.value.x
    const deltaY = e.clientY - startPos.value.y
    const SWIPE_THRESHOLD = 30 // Khoảng cách tối thiểu để ghi nhận 1 cú vuốt (pixel)

    // Nếu người dùng có vuốt đủ dài
    if (Math.abs(deltaX) > SWIPE_THRESHOLD || Math.abs(deltaY) > SWIPE_THRESHOLD) {
      let targetRow = activeTile.value.row
      let targetCol = activeTile.value.col

      // Tính toán hướng vuốt (ưu tiên trục có khoảng cách di chuyển dài hơn)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        targetCol += deltaX > 0 ? 1 : -1 // Vuốt ngang
      } else {
        targetRow += deltaY > 0 ? 1 : -1 // Vuốt dọc
      }

      const targetTile = getTile(targetRow, targetCol)
      if (targetTile) {
        attemptSwap(activeTile.value, targetTile)
      }
    }

    activeTile.value = null // Reset trạng thái
  }

  // Gắn sự kiện global để bắt thao tác thả chuột/tay ngay cả khi vuốt ra ngoài màn hình
  if (typeof window !== 'undefined') {
    useEventListener(window, 'pointerup', onPointerUp)
  }

  const attemptSwap = async (t1: Tile, t2: Tile) => {
    isLocked.value = true

    // Đổi vị trí tạm thời
    swapTiles(t1, t2)
    await delay(ANIMATION_DURATION)

    const matches = findMatches()
    if (matches.length > 0) {
      await processMatches(matches)
    } else {
      // Không có match -> đổi ngược lại
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

    // Check hàng ngang
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS - 2; c++) {
        const t1 = getTile(r, c)
        const t2 = getTile(r, c + 1)
        const t3 = getTile(r, c + 2)
        if (t1 && t2 && t3 && t1.typeId === t2.typeId && t1.typeId === t3.typeId) {
          matches.add(t1).add(t2).add(t3)
        }
      }
    }

    // Check hàng dọc
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS - 2; r++) {
        const t1 = getTile(r, c)
        const t2 = getTile(r + 1, c)
        const t3 = getTile(r + 2, c)
        if (t1 && t2 && t3 && t1.typeId === t2.typeId && t1.typeId === t3.typeId) {
          matches.add(t1).add(t2).add(t3)
        }
      }
    }

    return Array.from(matches)
  }

  const processMatches = async (matches: Tile[]) => {
    matches.forEach(m => m.isMatched = true)
    score.value += matches.length * 10
    await delay(ANIMATION_DURATION)

    board.value = board.value.filter(t => !t.isMatched)

    for (let c = 0; c < GRID_COLS; c++) {
      let emptySpaces = 0
      for (let r = GRID_ROWS - 1; r >= 0; r--) {
        const tile = getTile(r, c)
        if (!tile) {
          emptySpaces++
        } else if (emptySpaces > 0) {
          tile.row += emptySpaces
        }
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
      await processMatches(newMatches)
    } else {
      isLocked.value = false
    }
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  return {
    board,
    score,
    initGame,
    onPointerDown
  }
}
