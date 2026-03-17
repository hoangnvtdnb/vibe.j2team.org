<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useGame } from './useGame'
import { BOARD_WIDTH, BOARD_HEIGHT } from './config'

const boardRef = ref<HTMLElement | null>(null)

const {
  fruits, score, highScore, gameStatus, currentFruitType, nextFruitType, dropX,
  startGame, dropFruit, updateDropPosition
} = useGame()

onMounted(() => {
  startGame()
})

const handlePointerMove = (e: PointerEvent) => {
  if (boardRef.value) {
    updateDropPosition(e, boardRef.value.getBoundingClientRect())
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-10 px-4 relative overflow-hidden">
    <div class="max-w-5xl w-full mx-auto relative z-10">

      <div class="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 animate-fade-up">
        <div class="text-center lg:text-left">
          <h1 class="font-display text-4xl font-bold text-accent-coral tracking-tight uppercase">Quantum Mergers</h1>
          <div class="flex items-center justify-center lg:justify-start gap-2 mt-2">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            <span class="text-text-secondary text-sm tracking-wide">MÔ PHỎNG VẬT LÝ HẠT NHÂN</span>
          </div>
        </div>

        <div class="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
          <div class="border border-border-default bg-bg-surface px-6 py-3 min-w-[120px] text-center shadow-lg hover:border-accent-amber transition-colors">
            <p class="text-xs text-text-dim font-display tracking-widest mb-1">SCORE</p>
            <p class="font-display text-2xl font-bold text-accent-amber">{{ score }}</p>
          </div>
          <div class="border border-border-default bg-bg-surface px-6 py-3 min-w-[120px] text-center shadow-lg hover:border-accent-coral transition-colors">
            <p class="text-xs text-text-dim font-display tracking-widest mb-1">HIGH SCORE</p>
            <p class="font-display text-2xl font-bold text-accent-coral">{{ highScore }}</p>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-[1fr_300px] gap-8 items-start animate-fade-up animate-delay-2">

        <div class="flex justify-center w-full relative">
          <div
            ref="boardRef"
            class="relative border-2 border-border-default bg-bg-surface shadow-2xl overflow-hidden touch-none cursor-crosshair group hover:border-accent-sky/50 transition-colors"
            :style="{ width: '100%', maxWidth: `${BOARD_WIDTH}px`, aspectRatio: `${BOARD_WIDTH}/${BOARD_HEIGHT}` }"
            @pointermove.prevent="handlePointerMove"
            @pointerdown.prevent="dropFruit"
          >
            <div
              v-if="gameStatus === 'gameover'"
              class="absolute inset-0 z-50 bg-bg-deep/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 border-2 border-accent-coral animate-fade-up"
            >
              <h3 class="font-display text-3xl font-bold mb-2 tracking-tight uppercase text-accent-coral">
                Chống Thể Bị Đầy
              </h3>
              <p class="text-text-secondary font-body text-center mb-8 text-sm max-w-[250px]">
                Khu vực lưu trữ đã quá tải. Thu thập được {{ score }} năng lượng lượng tử.
              </p>
              <button
                @click="startGame"
                class="border border-accent-coral bg-accent-coral/10 text-accent-coral font-display font-semibold tracking-widest py-3 px-6 transition-all hover:bg-accent-coral hover:text-bg-deep active:scale-[0.98]"
              >
                KHỞI ĐỘNG LẠI CHU KỲ
              </button>
            </div>

            <div class="absolute top-[50px] left-0 right-0 border-t border-dashed border-accent-coral/30 z-0"></div>

            <div
              v-if="gameStatus === 'playing'"
              class="absolute z-20 flex items-center justify-center pointer-events-none transition-transform duration-75"
              :class="currentFruitType.color"
              :style="{
                left: `${(dropX / BOARD_WIDTH) * 100}%`,
                top: '0px',
                width: `${(currentFruitType.radius * 2 / BOARD_WIDTH) * 100}%`,
                height: `${(currentFruitType.radius * 2 / BOARD_HEIGHT) * 100}%`,
                transform: 'translate(-50%, 0)'
              }"
            >
              <svg viewBox="0 0 100 100" class="w-full h-full overflow-visible filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                <text x="50" y="50" dominant-baseline="central" text-anchor="middle" font-size="80">{{ currentFruitType.icon }}</text>
              </svg>
              <div class="absolute top-full left-1/2 w-[1px] h-[600px] bg-text-dim/20 -translate-x-1/2 hidden group-hover:block"></div>
            </div>

            <div
              v-for="fruit in fruits"
              :key="fruit.id"
              class="absolute flex items-center justify-center select-none rounded-full border border-current/20 bg-current/5 shadow-[inset_0_0_10px_currentColor]"
              :class="fruit.colorClass"
              :style="{
                left: `${(fruit.x / BOARD_WIDTH) * 100}%`,
                top: `${(fruit.y / BOARD_HEIGHT) * 100}%`,
                width: `${(fruit.radius * 2 / BOARD_WIDTH) * 100}%`,
                height: `${(fruit.radius * 2 / BOARD_HEIGHT) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }"
            >
              <svg viewBox="0 0 100 100" class="w-full h-full overflow-visible">
                <text x="50" y="54" dominant-baseline="central" text-anchor="middle" font-size="75">{{ fruit.icon }}</text>
              </svg>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6 w-full max-w-[500px] mx-auto lg:mx-0 animate-fade-up animate-delay-3">

          <div class="border border-border-default bg-bg-surface p-6 flex flex-col items-center justify-center hover:border-accent-sky transition-colors relative">
            <p class="absolute top-2 left-3 text-xs text-text-dim font-display tracking-widest">NEXT ITEM</p>
            <div class="mt-4 flex items-center justify-center w-24 h-24 border border-border-default/50 bg-bg-deep rounded-full shadow-inner">
              <span class="text-5xl filter drop-shadow-lg" :class="nextFruitType.color">{{ nextFruitType.icon }}</span>
            </div>
          </div>

          <div class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:border-accent-coral relative overflow-hidden group">
            <span class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-coral/5 select-none pointer-events-none transition-transform group-hover:scale-110">02</span>

            <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span class="text-accent-coral font-display text-sm tracking-widest">//</span>
              Giao thức nạp
            </h2>
            <ul class="text-sm font-body text-text-secondary space-y-3 leading-relaxed">
              <li class="flex gap-2"><span class="text-accent-amber">▸</span> Di chuyển con trỏ hoặc vuốt để chọn vị trí.</li>
              <li class="flex gap-2"><span class="text-accent-amber">▸</span> Click/Tap để thả hạt nhân nguyên tố.</li>
              <li class="flex gap-2"><span class="text-accent-amber">▸</span> 2 hạt nhân cùng loại chạm nhau sẽ hợp nhất thành nguyên tố to hơn.</li>
              <li class="flex gap-2"><span class="text-accent-coral font-bold">CẢNH BÁO:</span> Đừng để năng lượng tràn quá vạch giới hạn!</li>
            </ul>
          </div>

          <div class="flex flex-col gap-3">
            <button
              @click="startGame"
              class="w-full border border-border-default bg-transparent text-text-secondary font-display font-semibold tracking-wide py-3 px-4 transition-all hover:border-accent-amber hover:text-accent-amber active:scale-[0.98]"
            >
              HỦY VÀ CHƠI LẠI
            </button>
            <RouterLink
              to="/"
              class="w-full text-center border border-border-default bg-bg-surface text-text-secondary font-display font-semibold tracking-wide py-3 px-4 transition-all hover:border-accent-coral hover:text-text-primary active:scale-[0.98]"
            >
              &larr; QUAY LẠI TRANG CHỦ
            </RouterLink>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
