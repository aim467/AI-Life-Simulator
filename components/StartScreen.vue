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
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4 max-w-3xl mx-auto font-sans">
    <div class="text-center mb-8">
      <h1 class="text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
        AI 人生重开
      </h1>
      <p class="text-gray-400 tracking-wider text-sm uppercase">Next-Gen Life Simulator with Multi-Model Support</p>
    </div>

    <div class="w-full bg-gray-800/80 backdrop-blur rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
      <div class="p-6 border-b border-gray-700 bg-gray-900/40">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="bg-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">0</span>
              模型设置
            </h2>
            <p class="text-xs text-gray-400 mt-1">选择并保存你想要使用的大模型，设置会保存在浏览器</p>
          </div>
          <span
            v-if="modelSaved"
            class="text-xs text-green-400 font-bold bg-green-900/40 border border-green-500/30 px-3 py-1 rounded-full"
          >
            已保存 ✓
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            v-for="option in SUPPORTED_MODELS"
            :key="option.provider"
            class="p-4 rounded-xl border transition-all cursor-pointer block"
            :class="modelSelection.provider === option.provider
              ? 'border-blue-500/70 bg-blue-900/20 ring-1 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2">
                <input
                  type="radio"
                  name="llm-provider"
                  :checked="modelSelection.provider === option.provider"
                  class="accent-blue-500 w-4 h-4"
                  @change="handleProviderChange(option.provider)"
                />
                <div>
                  <div class="text-sm font-bold text-white">{{ option.label }}</div>
                  <p class="text-xs text-gray-400 mt-0.5">{{ option.description }}</p>
                </div>
              </div>
            </div>
            <div class="mt-3">
              <label class="text-[11px] text-gray-400 uppercase tracking-wide mb-1 block">模型名称</label>
              <input
                :value="modelSelection.provider === option.provider ? modelSelection.model ?? '' : option.defaultModel"
                :disabled="modelSelection.provider !== option.provider"
                :placeholder="option.defaultModel"
                class="w-full px-3 py-2 rounded-lg border text-sm bg-gray-900"
                :class="modelSelection.provider === option.provider
                  ? 'border-blue-500/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                  : 'border-gray-700 text-gray-500 cursor-not-allowed'"
                @input="handleModelInput(($event.target as HTMLInputElement).value)"
              />
              <p v-if="option.helper" class="text-[11px] text-gray-500 mt-1">{{ option.helper }}</p>
            </div>
          </label>
        </div>

        <div class="flex justify-end mt-4">
          <button
            type="button"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-900/30"
            @click="handleSaveModel"
          >
            保存模型设置
          </button>
        </div>
      </div>

      <div class="p-6 border-b border-gray-700">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              天赋抽取
            </h2>
            <p class="text-xs text-gray-400 mt-1">请选择 <span class="text-blue-400 font-bold">3</span> 个天赋</p>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-blue-300 transition flex items-center gap-1"
            @click="rollTalents"
          >
            🔄 十连抽
          </button>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          <button
            v-for="t in availableTalents"
            :key="t.id"
            type="button"
            class="p-2 rounded-lg border text-left transition-all relative overflow-hidden group"
            :class="[
              selectedTalents.some((sel) => sel.id === t.id)
                ? 'border-blue-500 bg-blue-900/40 ring-1 ring-blue-500'
                : 'border-gray-700 bg-gray-700/30 hover:bg-gray-700/60',
              !selectedTalents.some((sel) => sel.id === t.id) && selectedTalents.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''
            ]"
            :disabled="!selectedTalents.some((sel) => sel.id === t.id) && selectedTalents.length >= 3"
            @click="toggleTalent(t)"
          >
            <div
              class="text-sm font-bold truncate"
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
            <div class="text-[10px] text-gray-500 mt-1 leading-tight line-clamp-2">{{ t.description }}</div>
            <div v-if="t.rarity === 'legendary'" class="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-bl shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
          </button>
        </div>
      </div>

      <div class="p-6 bg-gray-900/30">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span class="bg-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
            属性分配
          </h2>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-purple-300 transition flex items-center gap-1"
              @click="randomizeStats"
            >
              🎲 随机分配
            </button>
            <div class="text-sm bg-gray-800 border border-gray-600 px-4 py-1.5 rounded-full text-white shadow-inner">
              可用点数: <span :class="['font-mono font-bold text-lg', points > 0 ? 'text-green-400' : 'text-gray-500']">{{ points }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div v-for="key in (Object.keys(stats) as Array<keyof Stats>)" :key="key" class="flex items-center gap-4 group">
            <span class="w-12 text-sm text-gray-400 font-bold capitalize text-right group-hover:text-gray-200 transition-colors">
              {{ key === 'health' ? '健康' : key === 'intelligence' ? '智力' : key === 'charm' ? '魅力' : key === 'wealth' ? '家境' : '快乐' }}
            </span>
            <button
              v-if="key !== 'health'"
              type="button"
              class="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-all font-bold"
              @click="handleStatChange(key, -1)"
            >
              -
            </button>
            <div v-else class="w-8 h-8 flex items-center justify-center text-gray-600 text-xs">锁定</div>
            <div class="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
              <div
                class="h-full transition-all duration-300"
                :class="key === 'health'
                  ? 'bg-red-500'
                  : key === 'intelligence'
                    ? 'bg-blue-500'
                    : key === 'charm'
                      ? 'bg-pink-500'
                      : key === 'wealth'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'"
                :style="{ width: key === 'health' ? '100%' : `${(stats[key] / 20) * 100}%` }"
              />
            </div>
            <span class="w-8 text-center font-mono text-lg font-bold text-white">{{ stats[key] }}</span>
            <button
              v-if="key !== 'health'"
              type="button"
              class="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg hover:bg-green-500/20 hover:text-green-400 text-gray-500 transition-all font-bold"
              @click="handleStatChange(key, 1)"
            >
              +
            </button>
            <div v-else class="w-8 h-8 flex items-center justify-center text-gray-600 text-xs">锁定</div>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-gray-700">
        <button
          type="button"
          class="w-full py-4 rounded-xl font-black text-lg tracking-[0.2em] transition-all transform duration-200"
          :class="points === 0
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] text-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'"
          :disabled="points > 0"
          @click="handleStart"
        >
          {{ points > 0 ? `剩余 ${points} 点属性未分配` : '开启新人生' }}
        </button>
      </div>
    </div>
  </div>
</template>

