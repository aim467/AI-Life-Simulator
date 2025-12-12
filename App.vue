<script setup lang="ts">
import { reactive, watch, toRaw } from 'vue';
import StartScreen from '@/components/StartScreen.vue';
import StatsPanel from '@/components/StatsPanel.vue';
import EventLog from '@/components/EventLog.vue';
import { generateTurn, generateSummary } from '@/services/llmService';
import { GameState, Phase, Stats, Talent, ChoiceOption } from '@/types';

const gameState = reactive<GameState>({
  age: -1,
  stats: { health: 0, intelligence: 0, charm: 0, wealth: 0, happiness: 0 },
  talents: [],
  history: [],
  phase: Phase.START,
  isProcessing: false,
  pendingChoice: null,
  achievements: [],
});

const startGame = (initialStats: Stats, talents: Talent[]) => {
  gameState.age = 0;
  gameState.stats = { ...initialStats };
  gameState.talents = talents;
  gameState.history = [
    {
      age: 0,
      content: `你出生了。天空一声巨响，系统闪亮登场。${talents.length > 0 ? `天赋: ${talents.map((t) => t.name).join(', ')}` : ''}`,
      type: 'normal',
    },
  ];
  gameState.phase = Phase.PLAYING;
  gameState.isProcessing = false;
  gameState.pendingChoice = null;
  gameState.achievements = [];
  gameState.summary = undefined;
  gameState.deathReason = undefined;
};

const handleNextTurn = async (choiceId?: string) => {
  if (gameState.isProcessing || gameState.phase === Phase.ENDED) return;

  let choiceText = '';
  if (choiceId && gameState.pendingChoice) {
    const choice = gameState.pendingChoice.find((c) => c.id === choiceId);
    choiceText = choice ? choice.text : '';
  }

  gameState.isProcessing = true;
  const snapshot = toRaw(gameState) as GameState;
  const result = await generateTurn(snapshot, choiceText);

  const newStats = { ...gameState.stats };
  if (result.statChanges) {
    newStats.health += result.statChanges.health || 0;
    newStats.intelligence += result.statChanges.intelligence || 0;
    newStats.charm += result.statChanges.charm || 0;
    newStats.wealth += result.statChanges.wealth || 0;
    newStats.happiness += result.statChanges.happiness || 0;
  }

  newStats.health = Math.min(100, Math.max(0, newStats.health));

  const currentAchievements = [...gameState.achievements];
  if (result.achievements) {
    result.achievements.forEach((a) => {
      if (!currentAchievements.includes(a)) currentAchievements.push(a);
    });
  }

  const newHistory = [...gameState.history];
  newHistory.push({
    age: gameState.age + 1,
    content: result.content,
    type: result.isDeath ? 'death' : result.choices && result.choices.length > 0 ? 'choice' : 'normal',
    statsChanged: result.statChanges,
    achievements: result.achievements,
  });

  const nextAge = gameState.age + 1;
  let nextPhase = gameState.phase;
  let deathReason = gameState.deathReason;

  if (result.isDeath || newStats.health <= 0) {
    nextPhase = Phase.ENDED;
    deathReason = result.deathReason || (newStats.health <= 0 ? '健康耗尽，遗憾离世。' : '意外身亡');
  }

  gameState.age = nextAge;
  gameState.stats = newStats;
  gameState.history = newHistory;
  gameState.pendingChoice = result.choices && !result.isDeath ? (result.choices as ChoiceOption[]) : null;
  gameState.phase = nextPhase;
  gameState.deathReason = deathReason;
  gameState.achievements = currentAchievements;
  gameState.isProcessing = false;
};

watch(
  () => gameState.phase,
  async (phase) => {
    if (phase === Phase.ENDED && !gameState.summary) {
      const summary = await generateSummary(toRaw(gameState) as GameState);
      gameState.summary = summary;
    }
  }
);

const handleRestart = () => {
  gameState.age = -1;
  gameState.stats = { health: 0, intelligence: 0, charm: 0, wealth: 0, happiness: 0 };
  gameState.talents = [];
  gameState.history = [];
  gameState.phase = Phase.START;
  gameState.isProcessing = false;
  gameState.pendingChoice = null;
  gameState.achievements = [];
  gameState.deathReason = undefined;
  gameState.summary = undefined;
};
</script>

<template>
  <StartScreen v-if="gameState.phase === Phase.START" @start="startGame" />

  <div
    v-else
    class="flex flex-col h-screen max-w-md mx-auto bg-gray-950 shadow-2xl overflow-hidden md:max-w-xl md:border-x md:border-gray-800 font-sans"
  >
    <div class="bg-gray-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-gray-800 shadow-xl">
      <div class="px-4 py-3 flex justify-between items-center">
        <div class="flex items-baseline">
          <span class="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{{ gameState.age }}</span>
          <span class="text-sm text-gray-400 ml-1 font-bold">岁</span>
        </div>
        <div class="flex flex-col items-end">
          <div class="flex gap-1 mb-1">
            <span
              v-for="t in gameState.talents"
              :key="t.id"
              class="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-800/50 truncate max-w-[80px]"
            >
              {{ t.name }}
            </span>
          </div>
          <div v-if="gameState.achievements.length > 0" class="text-[10px] text-yellow-500 font-bold">
            🏆 {{ gameState.achievements.length }} 成就
          </div>
        </div>
      </div>
      <div class="px-4 pb-3">
        <StatsPanel :stats="gameState.stats" />
      </div>
    </div>

    <div class="flex-1 overflow-hidden flex flex-col p-3 bg-gray-950 relative">
      <EventLog :history="gameState.history" />

      <div
        v-if="gameState.isProcessing"
        class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent flex items-end justify-center pb-6 z-20 pointer-events-none"
      >
        <div class="flex items-center space-x-2 text-blue-300 bg-gray-900/80 px-5 py-2.5 rounded-full border border-blue-500/20 shadow-2xl backdrop-blur-sm">
          <div class="flex space-x-1">
            <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
            <div class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
          </div>
          <span class="text-xs font-bold tracking-wider ml-2">命运推演中...</span>
        </div>
      </div>
    </div>

    <div class="p-4 bg-gray-900 border-t border-gray-800 pb-8 z-20">
      <div v-if="gameState.phase === Phase.ENDED" class="text-center animate-fade-in-up">
        <h2 class="text-3xl font-black text-white mb-2 tracking-tight">人生重启</h2>
        <div class="bg-gray-800 p-5 rounded-2xl text-gray-300 italic mb-6 border border-gray-700 shadow-inner">
          "{{ gameState.summary || '正在生成墓志铭...' }}"
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2 bg-gray-800/50 p-3 rounded-xl border border-gray-700 flex flex-wrap gap-2 justify-center">
            <span class="text-xs text-gray-500 w-full text-center mb-1">本局成就</span>
            <span
              v-if="gameState.achievements.length === 0"
              class="text-xs text-gray-600"
            >
              无
            </span>
            <span
              v-for="(a, i) in gameState.achievements"
              :key="`${a}-${i}`"
              class="text-xs bg-yellow-900/20 text-yellow-500 px-2 py-1 rounded border border-yellow-700/30"
            >
              {{ a }}
            </span>
          </div>
          <button
            type="button"
            class="col-span-2 w-full bg-white hover:bg-gray-100 text-gray-900 font-black py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-white/10"
            @click="handleRestart"
          >
            再次重开
          </button>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div v-if="gameState.pendingChoice && gameState.pendingChoice.length > 0" class="space-y-2 animate-fade-in-up">
          <p class="text-center text-xs text-purple-400 font-bold uppercase tracking-widest mb-2">命运的岔路口</p>
          <button
            v-for="choice in gameState.pendingChoice"
            :key="choice.id"
            class="w-full py-4 px-5 bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 border border-purple-500/30 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] flex justify-between items-center group"
            :disabled="gameState.isProcessing"
            @click="handleNextTurn(choice.id)"
          >
            <span class="text-sm">{{ choice.text }}</span>
            <span class="text-purple-400 group-hover:translate-x-1 transition-transform">➔</span>
          </button>
        </div>
        <button
          v-else
          type="button"
          class="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98] tracking-widest"
          :disabled="gameState.isProcessing"
          @click="handleNextTurn()"
        >
          {{ gameState.age === 0 ? '开始人生' : '下一年' }}
        </button>
      </div>
    </div>
  </div>
</template>

