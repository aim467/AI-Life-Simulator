<script setup lang="ts">
import type { Stats } from '../types';

defineProps<{
  stats: Stats;
}>();

const getStatColor = (key: string) => {
  const colors = {
    health: 'from-red-600 to-red-500',
    intelligence: 'from-blue-600 to-blue-500',
    charm: 'from-pink-600 to-pink-500',
    wealth: 'from-yellow-600 to-yellow-500',
    happiness: 'from-green-600 to-green-500',
  };
  return colors[key as keyof typeof colors] || 'from-gray-600 to-gray-500';
};

const getStatIcon = (key: string) => {
  const icons = {
    health: '❤️',
    intelligence: '🧠',
    charm: '✨',
    wealth: '💰',
    happiness: '😊',
  };
  return icons[key as keyof typeof icons] || '📊';
};

const getStatLabel = (key: string) => {
  const labels = {
    health: '健康',
    intelligence: '智力',
    charm: '魅力',
    wealth: '家境',
    happiness: '快乐',
  };
  return labels[key as keyof typeof labels] || key;
};
</script>

<template>
  <div class="bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 rounded-2xl border border-gray-700/50 shadow-xl backdrop-blur-sm">
    <div class="grid grid-cols-5 gap-3">
      <div
        v-for="(value, key) in stats"
        :key="key"
        class="flex flex-col items-center group"
      >
        <div class="text-xl mb-1 group-hover:scale-110 transition-transform">
          {{ getStatIcon(key as string) }}
        </div>
        <div class="text-xs text-gray-400 mb-1.5 font-bold">
          {{ getStatLabel(key as string) }}
        </div>
        <div class="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden border border-gray-600/30 mb-1">
          <div
            class="h-full transition-all duration-700 ease-out bg-gradient-to-r relative"
            :class="getStatColor(key as string)"
            :style="{ width: `${Math.min(Math.max(value, 0), 100)}%` }"
          >
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
        </div>
        <div class="text-sm font-black text-white font-mono">
          {{ value }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 3s infinite;
}
</style>

