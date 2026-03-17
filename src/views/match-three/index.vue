<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useGame } from './useGame'
import { GRID_ROWS, GRID_COLS, ANIMATION_DURATION } from './config'

const { board, score, selectedTile, initGame, handleTileClick } = useGame()

onMounted(() => {
  initGame()
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-10 px-4 relative overflow-hidden">
    <div class="max-w-5xl w-full mx-auto relative z-10">

      <div class="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6 animate-fade-up">
        <div>
          <h1 class="font-display text-4xl font-bold text-accent-coral tracking-tight uppercase">
            Neo Gems
          </h1>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            <span class="text-text-secondary text-sm tracking-wide">HỆ THỐNG MATCH-3 NĂNG LƯỢNG</span>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="border border-border-default bg-bg-surface px-6 py-3 min-w-[150px] text-center shadow-lg shadow-accent-sky/5">
            <p class="text-xs text-text-dim font-display tracking-widest mb-1">ĐIỂM SỐ</p>
            <p class="font-display text-2xl font-bold text-accent-sky">{{ score }}</p>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-[1fr_300px] gap-8 items-start animate-fade-up animate-delay-2">

        <div class="flex justify-center w-full">
          <div
            class="relative border border-border-default bg-bg-surface p-2 shadow-2xl shadow-accent-coral/5"
            style="width: 100%; max-width: 500px; aspect-ratio: 1/1;"
          >
            <div class="w-full h-full relative overflow-hidden bg-bg-elevated/50">
              <div
                v-for="tile in board"
                :key="tile.id"
                @click="handleTileClick(tile)"
                class="absolute flex items-center justify-center cursor-pointer select-none transition-all"
                :class="[
                  tile.colorClass,
                  tile.isMatched ? 'opacity-0 scale-50' : 'opacity-100 scale-100',
                  selectedTile?.id === tile.id ? 'bg-bg-elevated border-2 border-accent-coral ring-4 ring-accent-coral/20' : 'border border-border-default/30 hover:bg-bg-elevated/50'
                ]"
                :style="{
                  width: `${100 / GRID_COLS}%`,
                  height: `${100 / GRID_ROWS}%`,
                  transform: `translate(${tile.col * 100}%, ${tile.row * 100}%)`,
                  transitionDuration: `${ANIMATION_DURATION}ms`
                }"
              >
                <span class="text-2xl sm:text-3xl md:text-4xl filter drop-shadow-md">
                  {{ tile.icon }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6 w-full max-w-[500px] mx-auto lg:mx-0 animate-fade-up animate-delay-3">

          <div class="border border-border-default bg-bg-surface p-6 transition-all duration-300 hover:border-accent-amber relative overflow-hidden group">
            <span class="absolute top-3 right-4 font-display text-6xl font-bold text-accent-amber/5 select-none pointer-events-none transition-transform group-hover:scale-110">01</span>

            <h2 class="font-display text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
              Luật chơi
            </h2>
            <ul class="text-sm font-body text-text-secondary space-y-3 leading-relaxed">
              <li class="flex gap-2"><span class="text-accent-coral">▸</span> Đổi chỗ 2 viên đá cạnh nhau để tạo thành hàng (ngang/dọc) có ít nhất 3 viên cùng màu.</li>
              <li class="flex gap-2"><span class="text-accent-coral">▸</span> Khi ăn điểm, các viên đá mới sẽ tự động rơi xuống lấp đầy.</li>
              <li class="flex gap-2"><span class="text-accent-coral">▸</span> Tạo combo liên tiếp để đạt điểm cao.</li>
            </ul>
          </div>

          <div class="flex flex-col gap-3">
            <button
              @click="initGame"
              class="w-full border border-accent-coral bg-accent-coral/10 text-accent-coral font-display font-semibold tracking-wide py-3 px-4 transition-all hover:bg-accent-coral hover:text-bg-deep active:scale-[0.98]"
            >
              LÀM MỚI BẢNG
            </button>

            <RouterLink
              to="/"
              class="w-full text-center border border-border-default bg-bg-surface text-text-secondary font-display font-semibold tracking-wide py-3 px-4 transition-all hover:border-accent-sky hover:text-text-primary active:scale-[0.98]"
            >
              &larr; QUAY LẠI TRANG CHỦ
            </RouterLink>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Không cần code CSS phức tạp vì Tailwind + Vue Reactivity (transform absolute) đã xử lý mượt mà animation */
</style>
