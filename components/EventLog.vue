<script setup lang="ts">
import { onUpdated, ref } from 'vue';
import type { LogEntry } from '../types';

const props = defineProps<{
  history: LogEntry[];
}>();

const endRef = ref<HTMLDivElement | null>(null);

onUpdated(() => {
  endRef.value?.scrollIntoView({ behavior: 'smooth' });
});

const getEventIcon = (entry: LogEntry) => {
  if (entry.type === 'death') return '💀';
  if (entry.type === 'choice') return '🔀';
  if (entry.achievements && entry.achievements.length > 0) return '🏆';
  if (entry.age === 0) return '👶';
  if (entry.age >= 18 && entry.age <= 22) return '🎓';
  if (entry.age >= 23 && entry.age <= 30) return '💼';
  if (entry.age >= 60) return '👴';
  return '📖';
};
</script>

<template>
  <div class="space-y-3 pb-4">
    <div
      v-for="(entry, idx) in props.history"
      :key="idx"
      class="p-4 rounded-2xl border-l-4 shadow-lg animate-fade-in relative overflow-hidden backdrop-blur-sm"
      :class="entry.type === 'death'
        ? 'bg-gradient-to-r from-red-950/60 to-red-900/40 border-red-500 text-red-100'
        : entry.type === 'choice'
          ? 'bg-gradient-to-r from-purple-950/60 to-purple-900/40 border-purple-500 text-purple-100'
          : entry.achievements && entry.achievements.length > 0
            ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/40 border-yellow-500 text-yellow-100'
            : entry.age === 0
              ? 'bg-gradient-to-r from-gray-800/70 to-gray-700/50 border-gray-500 text-gray-200'
              : 'bg-gradient-to-r from-gray-800/60 to-gray-900/50 border-blue-500/40 text-gray-100'"
    >
      <!-- 背景装饰 -->
      <div class="absolute top-0 right-0 text-6xl opacity-5">
        {{ getEventIcon(entry) }}
      </div>

      <!-- 头部信息 -->
      <div class="flex items-center gap-2 mb-3 flex-wrap relative z-10">
        <span class="text-lg">{{ getEventIcon(entry) }}</span>
        <span class="font-mono font-black text-sm bg-black/30 px-3 py-1 rounded-lg border border-white/10">
          {{ entry.age }} 岁
        </span>
        <span
          v-if="entry.type === 'choice'"
          class="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-1 rounded-lg border border-purple-400/40 font-bold uppercase tracking-wider"
        >
          抉择
        </span>
        <template v-if="entry.achievements && entry.achievements.length > 0">
          <span
            v-for="(ach, i) in entry.achievements"
            :key="`${ach}-${i}`"
            class="text-[10px] bg-yellow-500/30 text-yellow-200 px-2 py-1 rounded-lg border border-yellow-400/40 font-bold flex items-center gap-1"
          >
            <span>🏆</span>
            {{ ach }}
          </span>
        </template>
      </div>

      <!-- 事件内容 -->
      <div class="text-sm leading-relaxed whitespace-pre-wrap font-medium relative z-10">
        {{ entry.content }}
      </div>

      <!-- 属性变化 -->
      <div
        v-if="entry.statsChanged && Object.values(entry.statsChanged).some(v => v !== 0)"
        class="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2 text-xs font-mono relative z-10"
      >
        <template v-for="(val, key) in entry.statsChanged" :key="key">
          <span
            v-if="val !== 0"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold"
            :class="(val as number) > 0 
              ? 'bg-green-900/40 text-green-300 border border-green-500/30' 
              : 'bg-red-900/40 text-red-300 border border-red-500/30'"
          >
            <span class="text-base">
              {{
                key === 'health'
                  ? '❤️'
                  : key === 'intelligence'
                    ? '🧠'
                    : key === 'charm'
                      ? '✨'
                      : key === 'wealth'
                        ? '💰'
                        : '😊'
              }}
            </span>
            <span>{{ (val as number) > 0 ? '+' : '' }}{{ val }}</span>
          </span>
        </template>
      </div>
    </div>
    
    <!-- 滚动锚点 -->
    <div ref="endRef" class="h-1" />
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
</style>

