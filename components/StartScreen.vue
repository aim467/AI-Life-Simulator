<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { Stats, Talent } from '../types';
import { LLMSelection, SUPPORTED_MODELS, getSavedLLMSelection, saveLLMSelection, DEFAULT_LLM_SELECTION } from '../services/llmService';

interface Emits {
  (e: 'start', stats: Stats, talents: Talent[]): void;
}

const emit = defineEmits<Emits>();

const TALENT_POOL: Talent[] = [
  { id: '1', name: '天选之子', description: '所有属性 +5', rarity: 'legendary', statModifiers: { health: 5, intelligence: 5, charm: 5, wealth: 5, happiness: 5 } },
  { id: '2', name: '早产儿', description: '初始健康 -10，智力 +5', rarity: 'common', statModifiers: { health: -10, intelligence: 5 } },
  { id: '3', name: '首富之子', description: '初始家境 +30，快乐 +10', rarity: 'legendary', statModifiers: { wealth: 30, happiness: 10 } },
  { id: '4', name: '颜值主播', description: '初始魅力 +15', rarity: 'rare', statModifiers: { charm: 15 } },
  { id: '5', name: '书香门第', description: '初始智力 +10，快乐 -5', rarity: 'rare', statModifiers: { intelligence: 10, happiness: -5 } },
  { id: '6', name: '乐天派', description: '初始快乐 +20', rarity: 'rare', statModifiers: { happiness: 20 } },
  { id: '7', name: '林黛玉', description: '健康 -15，魅力 +20', rarity: 'epic', statModifiers: { health: -15, charm: 20 } },
  { id: '8', name: '锦鲤', description: '运气极好，常有意外之喜', rarity: 'epic', statModifiers: { happiness: 5 } },
  { id: '9', name: '赛博精神病', description: '智力 +20，健康 -10，精神状态不稳定', rarity: 'epic', statModifiers: { intelligence: 20, health: -10 } },
  { id: '10', name: '土木老哥', description: '健康 +10，家境 -5', rarity: 'common', statModifiers: { health: 10, wealth: -5 } },
  { id: '11', name: '外星人', description: '你觉得自己不属于地球', rarity: 'legendary', statModifiers: { intelligence: 10, charm: -10 } },
  { id: '12', name: '魔法少女', description: '拥有隐藏的魔法力量', rarity: 'legendary', statModifiers: { charm: 10, health: 5 } },
  { id: '13', name: '独生子女', description: '家境 +5，快乐 +5', rarity: 'common', statModifiers: { wealth: 5, happiness: 5 } },
  { id: '14', name: '吃货', description: '健康 -5，快乐 +10', rarity: 'common', statModifiers: { health: -5, happiness: 10 } },
  { id: '15', name: '绝命毒师', description: '智力 +15，道德 -10', rarity: 'rare', statModifiers: { intelligence: 15 } },
];

const modelSelection = ref<LLMSelection>(DEFAULT_LLM_SELECTION);
const modelSaved = ref(false);
const points = ref(20);
const stats = ref<Stats>({
  health: 100,
  intelligence: 0,
  charm: 0,
  wealth: 0,
  happiness: 0,
});

const availableTalents = ref<Talent[]>([]);
const selectedTalents = ref<Talent[]>([]);

onMounted(() => {
  rollTalents();
  const savedModel = getSavedLLMSelection();
  modelSelection.value = savedModel;
});

const handleProviderChange = (provider: LLMSelection['provider']) => {
  const option = SUPPORTED_MODELS.find((m) => m.provider === provider);
  modelSelection.value = {
    provider,
    model: provider === modelSelection.value.provider ? modelSelection.value.model : option?.defaultModel || modelSelection.value.model,
  };
  modelSaved.value = false;
};

const handleModelInput = (value: string) => {
  modelSelection.value = { ...modelSelection.value, model: value };
  modelSaved.value = false;
};

const handleSaveModel = () => {
  const normalized = saveLLMSelection(modelSelection.value);
  modelSelection.value = normalized;
  modelSaved.value = true;
  setTimeout(() => (modelSaved.value = false), 1500);
};

const rollTalents = () => {
  const shuffled = [...TALENT_POOL].sort(() => 0.5 - Math.random());
  availableTalents.value = shuffled.slice(0, 10);
  selectedTalents.value = [];
};

const handleStatChange = (key: keyof Stats, delta: number) => {
  // Prevent modifying health stat
  if (key === 'health') return;
  
  const current = stats.value[key];
  if (delta > 0 && points.value > 0) {
    stats.value = { ...stats.value, [key]: current + 1 };
    points.value -= 1;
  } else if (delta < 0 && current > 0) {
    stats.value = { ...stats.value, [key]: current - 1 };
    points.value += 1;
  }
};

const randomizeStats = () => {
  const totalPoints = 20;
  const statKeys: Array<keyof Stats> = ['intelligence', 'charm', 'wealth', 'happiness'];
  const newStats: Stats = { health: 50, intelligence: 0, charm: 0, wealth: 0, happiness: 0 };
  let remainingPoints = totalPoints;

  for (let i = 0; i < statKeys.length - 1; i += 1) {
    const maxForThisStat = remainingPoints - (statKeys.length - 1 - i);
    const randomPoints = Math.floor(Math.random() * (maxForThisStat + 1));
    newStats[statKeys[i]] = randomPoints;
    remainingPoints -= randomPoints;
  }

  newStats[statKeys[statKeys.length - 1]] = remainingPoints;

  stats.value = newStats;
  points.value = 0;
};

const toggleTalent = (talent: Talent) => {
  const exists = selectedTalents.value.find((t) => t.id === talent.id);
  if (exists) {
    selectedTalents.value = selectedTalents.value.filter((t) => t.id !== talent.id);
    return;
  }
  if (selectedTalents.value.length < 3) {
    selectedTalents.value = [...selectedTalents.value, talent];
  }
};

const handleStart = () => {
  saveLLMSelection(modelSelection.value);
  const finalStats = { ...stats.value };
  selectedTalents.value.forEach((t) => {
    if (t.statModifiers) {
      finalStats.health = Math.max(0, finalStats.health + (t.statModifiers.health || 0));
      finalStats.intelligence = Math.max(0, finalStats.intelligence + (t.statModifiers.intelligence || 0));
      finalStats.charm = Math.max(0, finalStats.charm + (t.statModifiers.charm || 0));
      finalStats.wealth = Math.max(0, finalStats.wealth + (t.statModifiers.wealth || 0));
      finalStats.happiness = Math.max(0, finalStats.happiness + (t.statModifiers.happiness || 0));
    }
  });

  emit('start', finalStats, selectedTalents.value);
};
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 max-w-4xl mx-auto font-sans relative overflow-hidden">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s"></div>
    </div>

    <div class="text-center mb-10 relative z-10">
      <div class="inline-block mb-4">
        <div class="text-6xl mb-2">🎮</div>
      </div>
      <h1 class="text-6xl md:text-7xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient">
        AI 人生重开
      </h1>
      <p class="text-gray-500 tracking-widest text-xs uppercase font-bold">Next-Gen Life Simulator · Powered by AI</p>
      <div class="mt-4 flex items-center justify-center gap-2 text-xs text-gray-600">
        <span class="px-2 py-1 bg-gray-800/50 rounded border border-gray-700/50">Vue 3</span>
        <span class="px-2 py-1 bg-gray-800/50 rounded border border-gray-700/50">Gemini</span>
        <span class="px-2 py-1 bg-gray-800/50 rounded border border-gray-700/50">Ollama</span>
      </div>
    </div>

    <div class="w-full bg-gray-800/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden relative z-10">
      <!-- Step 0: 模型设置 -->
      <div class="p-8 border-b border-gray-700/50 bg-gradient-to-br from-gray-900/60 to-gray-800/40">
        <div class="flex justify-between items-start mb-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="bg-gradient-to-br from-emerald-500 to-emerald-600 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-emerald-900/50">0</span>
              <h2 class="text-2xl font-black text-white">模型设置</h2>
            </div>
            <p class="text-sm text-gray-400 ml-11">选择你的 AI 引擎，配置将自动保存</p>
          </div>
          <span
            v-if="modelSaved"
            class="text-xs text-green-400 font-bold bg-green-900/40 border border-green-500/30 px-4 py-2 rounded-full animate-fade-in flex items-center gap-2"
          >
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            已保存
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label
            v-for="option in SUPPORTED_MODELS"
            :key="option.provider"
            class="p-5 rounded-2xl border-2 transition-all cursor-pointer block group relative overflow-hidden"
            :class="modelSelection.provider === option.provider
              ? 'border-blue-500/70 bg-gradient-to-br from-blue-900/30 to-blue-800/20 shadow-lg shadow-blue-900/30'
              : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50'"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" v-if="modelSelection.provider !== option.provider"></div>
            
            <div class="flex items-start gap-3 relative z-10">
              <div class="mt-0.5">
                <input
                  type="radio"
                  name="llm-provider"
                  :checked="modelSelection.provider === option.provider"
                  class="accent-blue-500 w-5 h-5 cursor-pointer"
                  @change="handleProviderChange(option.provider)"
                />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-lg">{{ option.provider === 'ollama' ? '🏠' : '☁️' }}</span>
                  <div class="text-base font-bold text-white">{{ option.label }}</div>
                </div>
                <p class="text-xs text-gray-400 leading-relaxed">{{ option.description }}</p>
              </div>
            </div>
            
            <div class="mt-4 relative z-10">
              <label class="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block font-bold">模型名称</label>
              <input
                :value="modelSelection.provider === option.provider ? modelSelection.model ?? '' : option.defaultModel"
                :disabled="modelSelection.provider !== option.provider"
                :placeholder="option.defaultModel"
                class="w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all"
                :class="modelSelection.provider === option.provider
                  ? 'border-blue-500/50 bg-gray-900/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500'
                  : 'border-gray-700/50 bg-gray-900/40 text-gray-500 cursor-not-allowed'"
                @input="handleModelInput(($event.target as HTMLInputElement).value)"
              />
              <p v-if="option.helper" class="text-[10px] text-gray-500 mt-2 leading-relaxed">💡 {{ option.helper }}</p>
            </div>
          </label>
        </div>

        <div class="flex justify-end mt-6">
          <button
            type="button"
            class="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 hover:scale-105 active:scale-95"
            @click="handleSaveModel"
          >
            💾 保存配置
          </button>
        </div>
      </div>

      <!-- Step 1: 天赋抽取 -->
      <div class="p-8 border-b border-gray-700/50 bg-gradient-to-br from-gray-800/40 to-gray-900/40">
        <div class="flex justify-between items-start mb-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="bg-gradient-to-br from-blue-500 to-blue-600 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-blue-900/50">1</span>
              <h2 class="text-2xl font-black text-white">天赋抽取</h2>
            </div>
            <p class="text-sm text-gray-400 ml-11">
              从命运池中选择 <span class="text-blue-400 font-bold px-2 py-0.5 bg-blue-900/30 rounded">3</span> 个天赋
              <span class="text-gray-600 ml-2">(已选 {{ selectedTalents.length }}/3)</span>
            </p>
          </div>
          <button
            type="button"
            class="px-4 py-2.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 rounded-xl text-sm font-bold text-purple-300 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 shadow-lg"
            @click="rollTalents"
          >
            <span class="text-base">🎲</span>
            十连抽
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
          <button
            v-for="t in availableTalents"
            :key="t.id"
            type="button"
            class="p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden group"
            :class="[
              selectedTalents.some((sel) => sel.id === t.id)
                ? 'border-blue-500 bg-gradient-to-br from-blue-900/50 to-blue-800/30 ring-2 ring-blue-500/50 shadow-lg shadow-blue-900/50 scale-105'
                : 'border-gray-700/50 bg-gray-800/30 hover:bg-gray-700/50 hover:border-gray-600 hover:scale-102',
              !selectedTalents.some((sel) => sel.id === t.id) && selectedTalents.length >= 3 ? 'opacity-30 cursor-not-allowed grayscale' : ''
            ]"
            :disabled="!selectedTalents.some((sel) => sel.id === t.id) && selectedTalents.length >= 3"
            @click="toggleTalent(t)"
          >
            <!-- 稀有度光效 -->
            <div
              v-if="t.rarity === 'legendary'"
              class="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 animate-pulse"
            ></div>
            <div
              v-else-if="t.rarity === 'epic'"
              class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"
            ></div>

            <!-- 选中标记 -->
            <div
              v-if="selectedTalents.some((sel) => sel.id === t.id)"
              class="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
            >
              ✓
            </div>

            <!-- 稀有度角标 -->
            <div
              v-if="t.rarity === 'legendary'"
              class="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-r-[24px] border-t-orange-500 border-r-transparent opacity-80"
            >
              <span class="absolute -top-5 right-0.5 text-[10px]">✨</span>
            </div>
            <div
              v-else-if="t.rarity === 'epic'"
              class="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-purple-500 border-r-transparent opacity-60"
            ></div>

            <div class="relative z-10">
              <div
                class="text-sm font-bold mb-1 truncate"
                :class="t.rarity === 'legendary'
                  ? 'text-orange-400'
                  : t.rarity === 'epic'
                    ? 'text-purple-400'
                    : t.rarity === 'rare'
                      ? 'text-blue-400'
                      : 'text-gray-300'"
              >
                {{ t.name }}
              </div>
              <div class="text-[10px] text-gray-500 leading-tight line-clamp-3">{{ t.description }}</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Step 2: 属性分配 -->
      <div class="p-8 bg-gradient-to-br from-gray-900/40 to-gray-800/40">
        <div class="flex justify-between items-start mb-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="bg-gradient-to-br from-purple-500 to-purple-600 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-lg shadow-purple-900/50">2</span>
              <h2 class="text-2xl font-black text-white">属性分配</h2>
            </div>
            <p class="text-sm text-gray-400 ml-11">自由分配你的初始属性点</p>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="px-4 py-2.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-xl text-sm font-bold text-purple-300 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 shadow-lg"
              @click="randomizeStats"
            >
              <span class="text-base">🎲</span>
              随机
            </button>
            <div class="text-sm bg-gray-800/80 border-2 border-gray-700/50 px-5 py-2.5 rounded-xl text-white shadow-lg backdrop-blur">
              <span class="text-gray-400 text-xs">剩余</span>
              <span :class="['font-mono font-black text-2xl ml-2', points > 0 ? 'text-green-400' : 'text-gray-500']">{{ points }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div v-for="key in (Object.keys(stats) as Array<keyof Stats>)" :key="key" class="group">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xl">
                  {{ key === 'health' ? '❤️' : key === 'intelligence' ? '🧠' : key === 'charm' ? '✨' : key === 'wealth' ? '💰' : '😊' }}
                </span>
                <span class="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                  {{ key === 'health' ? '健康' : key === 'intelligence' ? '智力' : key === 'charm' ? '魅力' : key === 'wealth' ? '家境' : '快乐' }}
                </span>
                <span v-if="key === 'health'" class="text-[10px] text-gray-600 bg-gray-800/50 px-2 py-0.5 rounded-full">固定</span>
              </div>
              <span class="font-mono text-2xl font-black text-white">{{ stats[key] }}</span>
            </div>
            
            <div class="flex items-center gap-3">
              <button
                v-if="key !== 'health'"
                type="button"
                class="w-10 h-10 flex items-center justify-center bg-gray-800/80 rounded-xl hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 text-gray-500 transition-all font-bold border-2 border-gray-700/50 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="stats[key] === 0"
                @click="handleStatChange(key, -1)"
              >
                −
              </button>
              <div v-else class="w-10 h-10 flex items-center justify-center text-gray-700 text-xs bg-gray-800/30 rounded-xl border-2 border-gray-800/50">🔒</div>
              
              <div class="flex-1 h-4 bg-gray-800/80 rounded-full overflow-hidden border-2 border-gray-700/50 shadow-inner relative">
                <div
                  class="h-full transition-all duration-500 ease-out relative"
                  :class="key === 'health'
                    ? 'bg-gradient-to-r from-red-600 to-red-500'
                    : key === 'intelligence'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500'
                      : key === 'charm'
                        ? 'bg-gradient-to-r from-pink-600 to-pink-500'
                        : key === 'wealth'
                          ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                          : 'bg-gradient-to-r from-green-600 to-green-500'"
                  :style="{ width: key === 'health' ? '100%' : `${(stats[key] / 20) * 100}%` }"
                >
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
              </div>
              
              <button
                v-if="key !== 'health'"
                type="button"
                class="w-10 h-10 flex items-center justify-center bg-gray-800/80 rounded-xl hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30 text-gray-500 transition-all font-bold border-2 border-gray-700/50 hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="points === 0"
                @click="handleStatChange(key, 1)"
              >
                +
              </button>
              <div v-else class="w-10 h-10 flex items-center justify-center text-gray-700 text-xs bg-gray-800/30 rounded-xl border-2 border-gray-800/50">🔒</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 开始按钮 -->
      <div class="p-8 bg-gradient-to-br from-gray-900/60 to-gray-800/60">
        <button
          type="button"
          class="w-full py-5 rounded-2xl font-black text-xl tracking-wider transition-all transform duration-200 relative overflow-hidden group"
          :class="points === 0
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-2xl shadow-indigo-900/50 hover:shadow-indigo-900/70'
            : 'bg-gray-800/50 text-gray-600 cursor-not-allowed border-2 border-gray-700/50'"
          :disabled="points > 0"
          @click="handleStart"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          <span class="relative z-10 flex items-center justify-center gap-3">
            <span v-if="points === 0" class="text-2xl">🚀</span>
            <span v-else class="text-2xl">⏳</span>
            {{ points > 0 ? `还有 ${points} 点未分配` : '开启新人生' }}
          </span>
        </button>
        
        <div v-if="points === 0" class="mt-4 text-center text-xs text-gray-500">
          <p>✨ 准备好了吗？你的人生即将开始...</p>
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

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-gradient {
  background-size: 200% auto;
  animation: gradient 3s ease infinite;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

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
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(120, 120, 120, 0.7);
}

.hover\:scale-102:hover {
  transform: scale(1.02);
}
</style>

