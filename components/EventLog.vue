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
</script>

<template>
  <div class="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 custom-scrollbar pb-2">
    <div
      v-for="(entry, idx) in props.history"
      :key="idx"
      class="p-4 rounded-xl border-l-[3px] shadow-sm animate-fade-in relative overflow-hidden"
      :class="entry.type === 'death'
        ? 'bg-red-950/40 border-red-500 text-red-200'
        : entry.type === 'choice'
          ? 'bg-purple-950/40 border-purple-500 text-purple-200'
          : entry.type === 'achievement'
            ? 'bg-yellow-900/30 border-yellow-500 text-yellow-200'
            : entry.age === 0
              ? 'bg-gray-800/80 border-gray-500 text-gray-300'
              : 'bg-gray-800/80 border-blue-500/50 text-gray-100'"
    >
      <div class="flex items-center gap-2 mb-2">
        <span class="font-mono font-bold text-xs opacity-60 bg-black/30 px-2 py-0.5 rounded-md">
          {{ entry.age }} 岁
        </span>
        <span
          v-if="entry.type === 'choice'"
          class="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold uppercase"
        >
          抉择时刻
        </span>
        <template v-if="entry.achievements && entry.achievements.length > 0">
          <span
            v-for="(ach, i) in entry.achievements"
            :key="`${ach}-${i}`"
            class="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/30 font-bold flex items-center gap-1"
          >
            🏆 {{ ach }}
          </span>
        </template>
      </div>

      <div class="text-sm leading-relaxed whitespace-pre-wrap font-medium opacity-90">
        {{ entry.content }}
      </div>

      <div
        v-if="entry.statsChanged"
        class="mt-3 pt-2 border-t border-white/5 flex flex-wrap gap-3 text-xs opacity-75 font-mono"
      >
        <template v-for="(val, key) in entry.statsChanged" :key="key">
          <span
            v-if="val !== 0"
            class="flex items-center gap-1"
            :class="(val as number) > 0 ? 'text-green-400' : 'text-red-400'"
          >
            <span>
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
    <div ref="endRef" />
  </div>
</template>

