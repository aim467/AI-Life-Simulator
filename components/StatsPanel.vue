<script setup lang="ts">
import type { Stats } from '../types';

defineProps<{
  stats: Stats;
}>();
</script>

<template>
  <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
    <h3 class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
      Core Attributes
    </h3>

    <div class="flex flex-col mb-3">
      <div class="flex justify-between text-xs mb-1 font-medium text-gray-300">
        <span class="flex items-center gap-1">❤️ 健康 (Health)</span>
        <span>{{ stats.health }}</span>
      </div>
      <div class="h-2.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div class="h-full transition-all duration-500 ease-out bg-red-500" :style="{ width: `${Math.min(Math.max(stats.health, 0), 100)}%` }" />
      </div>
    </div>

    <div class="flex flex-col mb-3">
      <div class="flex justify-between text-xs mb-1 font-medium text-gray-300">
        <span class="flex items-center gap-1">🧠 智力 (Smarts)</span>
        <span>{{ stats.intelligence }}</span>
      </div>
      <div class="h-2.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div class="h-full transition-all duration-500 ease-out bg-blue-500" :style="{ width: `${Math.min(Math.max(stats.intelligence, 0), 100)}%` }" />
      </div>
    </div>

    <div class="flex flex-col mb-3">
      <div class="flex justify-between text-xs mb-1 font-medium text-gray-300">
        <span class="flex items-center gap-1">✨ 魅力 (Charm)</span>
        <span>{{ stats.charm }}</span>
      </div>
      <div class="h-2.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div class="h-full transition-all duration-500 ease-out bg-pink-500" :style="{ width: `${Math.min(Math.max(stats.charm, 0), 100)}%` }" />
      </div>
    </div>

    <div class="flex flex-col mb-3">
      <div class="flex justify-between text-xs mb-1 font-medium text-gray-300">
        <span class="flex items-center gap-1">💰 家境 (Wealth)</span>
        <span>{{ stats.wealth }}</span>
      </div>
      <div class="h-2.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div class="h-full transition-all duration-500 ease-out bg-yellow-500" :style="{ width: `${Math.min(Math.max(stats.wealth, 0), 100)}%` }" />
      </div>
    </div>

    <div class="flex flex-col">
      <div class="flex justify-between text-xs mb-1 font-medium text-gray-300">
        <span class="flex items-center gap-1">😊 快乐 (Happy)</span>
        <span>{{ stats.happiness }}</span>
      </div>
      <div class="h-2.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div class="h-full transition-all duration-500 ease-out bg-green-500" :style="{ width: `${Math.min(Math.max(stats.happiness, 0), 100)}%` }" />
      </div>
    </div>
  </div>
</template>

