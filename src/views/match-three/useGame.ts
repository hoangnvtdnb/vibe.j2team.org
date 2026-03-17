import { ref } from 'vue'
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
  const isLocked = ref(false) // Khoá thao tác khi đang có hiệu ứng
  const selectedTile = ref<Tile | null>(null)

  let tileIdCounter = 0

  // Khởi tạo bảng không có sẵn match
  const initGame = () => {
    board.value = []
    score.value = 0
    selectedTile.value = null
    isLocked.value = false

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        // Gán giá trị mặc định ban đầu để chiều lòng TypeScript
        let randomType = TILE_TYPES[0]!

        // Tránh tạo ra match 3 ngay từ đầu
        do {
          // Thêm dấu ! ở cuối để khẳng định với TS rằng chắc chắn sẽ lấy được phần tử
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

  const handleTileClick = async (tile: Tile) => {
    if (isLocked.value || tile.isMatched) return

    if (!selectedTile.value) {
      selectedTile.value = tile
      return
    }

    const t1 = selectedTile.value
    const t2 = tile

    // Nếu bấm lại chính nó thì huỷ chọn
    if (t1.id === t2.id) {
      selectedTile.value = null
      return
    }

    // Kiểm tra xem có kề nhau không
    const isAdjacent = (Math.abs(t1.row - t2.row) === 1 && t1.col === t2.col) ||
                       (Math.abs(t1.col - t2.col) === 1 && t1.row === t2.row)

    if (isAdjacent) {
      isLocked.value = true
      selectedTile.value = null

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
    } else {
      // Chọn viên mới nếu bấm viên không kề cạnh
      selectedTile.value = tile
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
    // 1. Đánh dấu xóa và cộng điểm
    matches.forEach(m => m.isMatched = true)
    score.value += matches.length * 10
    await delay(ANIMATION_DURATION) // Chờ animation vỡ vụn (fade out)

    // Xoá hẳn khỏi mảng
    board.value = board.value.filter(t => !t.isMatched)

    // 2. Kéo các viên bên trên xuống
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

      // 3. Tạo viên mới rơi từ trên xuống
      for (let i = 0; i < emptySpaces; i++) {
        const randomType = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]!
        board.value.push({
          id: tileIdCounter++,
          typeId: randomType.id,
          icon: randomType.icon,
          colorClass: randomType.color,
          row: i,        // Rơi tới vị trí trống
          col: c,
          isMatched: false
        })
      }
    }

    await delay(ANIMATION_DURATION) // Chờ tile mới rơi xuống

    // 4. Kiểm tra combo liên tiếp
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
    selectedTile,
    initGame,
    handleTileClick
  }
}
