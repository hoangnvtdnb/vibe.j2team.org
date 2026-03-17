<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useGame } from './useGame'
import { GRID_ROWS, GRID_COLS, ANIMATION_DURATION } from './config'

const {
  board, level, moves, targetChips, collectedChips, gameStatus,
  startLevel, restartGame, nextLevel, onPointerDown
} = useGame()

onMounted(() => {
  startLevel(1)
})
</script>

<template>
  <div class="min-h-screen bg-bg-deep text-text-primary font-body flex flex-col items-center py-10 px-4 relative overflow-hidden">
    <div class="max-w-5xl w-full mx-auto relative z-10">

      <div class="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6 animate-fade-up">
        <div class="text-center lg:text-left">
          <h1 class="font-display text-4xl font-bold text-accent-coral tracking-tight uppercase">Neo Gems</h1>
          <div class="flex items-center justify-center lg:justify-start gap-2 mt-2">
            <span class="text-accent-amber font-display text-sm tracking-widest">//</span>
            <span class="text-text-secondary text-sm tracking-wide">HỆ THỐNG MATCH-3 NĂNG LƯỢNG</span>
          </div>
        </div>

        <div class="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
          <div class="border border-border-default bg-bg-surface px-4 py-3 min-w-[90px] text-center shadow-lg shadow-accent-sky/5">
            <p class="text-xs text-text-dim font-display tracking-widest mb-1">LEVEL</p>
            <p class="font-display text-2xl font-bold text-text-primary">{{ level }}</p>
          </div>
          <div
            class="border bg-bg-surface px-4 py-3 min-w-[90px] text-center shadow-lg transition-colors duration-300"
            :class="moves <= 5 ? 'border-accent-coral shadow-accent-coral/10' : 'border-border-default shadow-accent-amber/5'"
          >
            <p class="text-xs text-text-dim font-display tracking-widest mb-1">MOVES</p>
            <p class="font-display text-2xl font-bold" :class="moves <= 5 ? 'text-accent-coral animate-pulse' : 'text-accent-amber'">{{ moves }}</p>
          </div>
          <div class="border border-border-default bg-bg-surface px-4 py-3 min-w-[120px] text-center shadow-lg shadow-accent-coral/5">
            <p class="text-xs text-text-dim font-display tracking-widest mb-1">CHIPS</p>
            <p class="font-display text-2xl font-bold text-accent-sky">{{ collectedChips }} <span class="text-sm text-text-dim">/ {{ targetChips }}</span></p>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-[1fr_300px] gap-8 items-start animate-fade-up animate-delay-2">

        <div class="flex justify-center w-full relative">
          <div
            class="relative border border-border-default bg-bg-surface p-2 shadow-2xl shadow-accent-coral/5 touch-none"
            style="width: 100%; max-width: 500px; aspect-ratio: 1/1;"
          >
            <div
              v-if="gameStatus !== 'playing'"
              class="absolute inset-0 z-20 bg-bg-deep/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 border-2 animate-fade-up"
              :class="gameStatus === 'won' ? 'border-accent-sky' : 'border-accent-coral'"
            >
              <h3 class="font-display text-3xl font-bold mb-2 tracking-tight uppercase" :class="gameStatus === 'won' ? 'text-accent-sky' : 'text-accent-coral'">
                {{ gameStatus === 'won' ? 'Level Cleared' : 'System Failure' }}
              </h3>
              <p class="text-text-secondary font-body text-center mb-8 text-sm leading-relaxed max-w-[250px]">
                {{ gameStatus === 'won' ? 'Nạp năng lượng thành công. Đã sẵn sàng bước sang chu kỳ mới.' : 'Hết lượt thao tác. Không thể hoàn thành mục tiêu thu thập.' }}
              </p>

              <button
                v-if="gameStatus === 'won'"
                @click="nextLevel"
                class="border border-accent-sky bg-accent-sky/10 text-accent-sky font-display font-semibold tracking-widest py-3 px-6 transition-all hover:bg-accent-sky hover:text-bg-deep active:scale-[0.98]"
              >
                TIẾP TỤC &rarr;
              </button>
              <button
                v-else
                @click="restartGame"
                class="border border-accent-coral bg-accent-coral/10 text-accent-coral font-display font-semibold tracking-widest py-3 px-6 transition-all hover:bg-accent-coral hover:text-bg-deep active:scale-[0.98]"
              >
                THỬ LẠI LEVEL 1
              </button>
            </div>

            <div class="w-full h-full relative overflow-hidden bg-bg-elevated/50">
              <div
                v-for="tile in board"
                :key="tile.id"
                @pointerdown.prevent="onPointerDown($event, tile)"
                class="absolute flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-all"
                :class="[
                  tile.colorClass,
                  tile.isMatched ? 'opacity-0 scale-50' : 'opacity-100 scale-100',
                  'border border-border-default/30 hover:bg-bg-elevated/50'
                ]"
                :style="{
                  width: `${100 / GRID_COLS}%`,
                  height: `${100 / GRID_ROWS}%`,
                  transform: `translate(${tile.col * 100}%, ${tile.row * 100}%)`,
                  transitionDuration: `${ANIMATION_DURATION}ms`
                }"
              >
                <span class="text-2xl sm:text-3xl md:text-4xl filter drop-shadow-md pointer-events-none">
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
              Giao thức nạp
            </h2>
            <ul class="text-sm font-body text-text-secondary space-y-3 leading-relaxed">
              <li class="flex gap-2"><span class="text-accent-coral">▸</span> Vuốt để đổi chỗ 2 viên đá, tạo hàng ngang/dọc có ít nhất 3 viên cùng màu.</li>
              <li class="flex gap-2"><span class="text-accent-coral">▸</span> Mỗi viên đá nổ tương đương 1 <span class="text-accent-sky font-bold">CHIP</span> năng lượng.</li>
              <li class="flex gap-2"><span class="text-accent-coral">▸</span> Đạt đủ Target Chips trước khi <span class="text-accent-amber font-bold">MOVES</span> về 0 để qua màn.</li>
            </ul>
          </div>

          <div class="flex flex-col gap-3">
            <button
              @click="restartGame"
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
