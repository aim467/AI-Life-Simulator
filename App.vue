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
    class="flex flex-col h-screen max-w-md mx-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 shadow-2xl md:max-w-xl md:border-x md:border-gray-800/50 font-sans relative"
  >
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div class="absolute top-0 left-0 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/3 rounded-full blur-3xl"></div>
    </div>

    <!-- 顶部状态栏 -->
    <div class="flex-shrink-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50 shadow-2xl relative z-20">
      <div class="px-5 py-4">
        <!-- 年龄和天赋 -->
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-baseline gap-2">
            <span class="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">{{ gameState.age }}</span>
            <span class="text-base text-gray-500 font-bold">岁</span>
          </div>
          <div class="flex flex-col items-end gap-2">
            <div class="flex flex-wrap gap-1.5 justify-end max-w-[180px]">
              <span
                v-for="t in gameState.talents"
                :key="t.id"
                class="text-[10px] px-2 py-1 rounded-lg bg-gradient-to-r from-blue-900/40 to-purple-900/40 text-blue-300 border border-blue-700/50 backdrop-blur-sm font-bold"
              >
                {{ t.name }}
              </span>
            </div>
            <div v-if="gameState.achievements.length > 0" class="flex items-center gap-1.5 text-xs bg-yellow-900/30 text-yellow-400 font-bold px-3 py-1.5 rounded-lg border border-yellow-700/50">
              <span class="text-sm">🏆</span>
              <span>{{ gameState.achievements.length }}</span>
            </div>
          </div>
        </div>
        
        <!-- 属性面板 -->
        <StatsPanel :stats="gameState.stats" />
      </div>
    </div>

    <!-- 事件日志区域 -->
    <div class="flex-1 overflow-y-auto p-4 relative custom-scrollbar">
      <EventLog :history="gameState.history" />
      
      <!-- 底部渐变遮罩 - 仅在非处理状态显示 -->
      <div
        v-if="!gameState.isProcessing"
        class="sticky bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent pointer-events-none -mt-20"
      ></div>

      <!-- AI 思考中动画 -->
      <div
        v-if="gameState.isProcessing"
        class="sticky bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent flex items-end justify-center pb-6 pointer-events-none -mt-32"
      >
        <div class="flex flex-col items-center gap-3">
          <div class="flex items-center space-x-2 text-blue-300 bg-gray-900/90 px-6 py-3 rounded-2xl border-2 border-blue-500/30 shadow-2xl backdrop-blur-md">
            <div class="flex space-x-1.5">
              <div class="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
              <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
              <div class="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
            </div>
            <span class="text-sm font-bold tracking-wide ml-2">AI 正在编织命运...</span>
          </div>
          <div class="text-xs text-gray-600 animate-pulse">请稍候</div>
        </div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="flex-shrink-0 p-5 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50 pb-safe relative z-30">
      <!-- 游戏结束界面 -->
      <div v-if="gameState.phase === Phase.ENDED" class="text-center animate-fade-in-up">
        <div class="mb-6">
          <div class="text-6xl mb-3">⚰️</div>
          <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500 mb-2">人生落幕</h2>
          <p class="text-sm text-gray-600">享年 {{ gameState.age }} 岁</p>
        </div>
        
        <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-6 rounded-2xl text-gray-300 italic mb-6 border-2 border-gray-700/50 shadow-2xl backdrop-blur-sm">
          <div class="text-xs text-gray-600 mb-2">墓志铭</div>
          <p class="text-sm leading-relaxed">"{{ gameState.summary || '正在生成墓志铭...' }}"</p>
        </div>
        
        <!-- 成就展示 -->
        <div class="bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 mb-6">
          <div class="flex items-center justify-center gap-2 mb-3">
            <span class="text-xl">🏆</span>
            <span class="text-sm text-gray-400 font-bold">本局成就</span>
            <span class="text-xs text-gray-600">({{ gameState.achievements.length }})</span>
          </div>
          <div v-if="gameState.achievements.length === 0" class="text-xs text-gray-600 py-2">
            平凡的一生，未解锁任何成就
          </div>
          <div v-else class="flex flex-wrap gap-2 justify-center">
            <span
              v-for="(a, i) in gameState.achievements"
              :key="`${a}-${i}`"
              class="text-xs bg-gradient-to-r from-yellow-900/30 to-orange-900/30 text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-700/40 font-bold"
            >
              {{ a }}
            </span>
          </div>
        </div>
        
        <button
          type="button"
          class="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-black py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-purple-900/50 text-lg"
          @click="handleRestart"
        >
          <span class="flex items-center justify-center gap-2">
            <span class="text-xl">🔄</span>
            再次重开
          </span>
        </button>
      </div>

      <!-- 游戏进行中 -->
      <div v-else class="space-y-3">
        <!-- 选择分支 -->
        <div v-if="gameState.pendingChoice && gameState.pendingChoice.length > 0" class="space-y-3 animate-fade-in-up">
          <div class="text-center mb-2">
            <div class="inline-flex items-center gap-2 bg-purple-900/30 text-purple-300 px-4 py-2 rounded-full border border-purple-500/30">
              <span class="text-base">🔀</span>
              <span class="text-xs font-bold uppercase tracking-wider">命运抉择</span>
            </div>
          </div>
          <button
            v-for="choice in gameState.pendingChoice"
            :key="choice.id"
            class="w-full py-4 px-5 bg-gradient-to-r from-purple-900/80 to-purple-800/80 hover:from-purple-800 hover:to-purple-700 border-2 border-purple-500/40 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-900/50 active:scale-[0.98] flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="gameState.isProcessing"
            @click="handleNextTurn(choice.id)"
          >
            <span class="text-sm text-left flex-1">{{ choice.text }}</span>
            <span class="text-purple-300 group-hover:translate-x-1 transition-transform text-lg">→</span>
          </button>
        </div>
        
        <!-- 继续按钮 -->
        <button
          v-else
          type="button"
          class="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 active:scale-[0.98] relative overflow-hidden group"
          :disabled="gameState.isProcessing"
          @click="handleNextTurn()"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <span class="relative z-10 flex items-center justify-center gap-2">
            <span class="text-xl">{{ gameState.age === 0 ? '🎬' : '⏭️' }}</span>
            {{ gameState.age === 0 ? '开始人生' : '下一年' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(100, 100, 100, 0.5);
  border-radius: 10px;
  transition: background 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(120, 120, 120, 0.7);
}

/* Firefox 滚动条 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 100, 100, 0.5) rgba(0, 0, 0, 0.2);
}
</style>

