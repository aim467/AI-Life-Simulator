import { GameState, GeminiResponse } from "../types";
import { generateTurn as generateTurnWithOllama, generateSummary as generateSummaryWithOllama } from "./ollamaService";
import { generateTurn as generateTurnWithGemini, generateSummary as generateSummaryWithGemini } from "./geminiService";

export type LLMProvider = "ollama" | "gemini";

export interface LLMSelection {
  provider: LLMProvider;
  model?: string;
}

interface ModelOption {
  provider: LLMProvider;
  label: string;
  description: string;
  defaultModel: string;
  helper?: string;
}

const STORAGE_KEY = "llmPreference";

export const SUPPORTED_MODELS: ModelOption[] = [
  {
    provider: "ollama",
    label: "Ollama 本地模型",
    description: "使用本地部署的模型，需要在本地运行 ollama serve。",
    defaultModel: "qwen3:32b",
    helper: "在本地已拉取的模型名称，例如 qwen2.5:14b、llama3.1。",
  },
  {
    provider: "gemini",
    label: "Gemini 2.5 Flash",
    description: "通过 Google API Key 调用，速度快，适合快速体验。",
    defaultModel: "gemini-2.5-flash",
    helper: "需要在环境变量 API_KEY 中配置有效的 Google API Key。",
  },
];

export const DEFAULT_LLM_SELECTION: LLMSelection = {
  provider: "ollama",
  model: SUPPORTED_MODELS.find(m => m.provider === "ollama")?.defaultModel,
};

const isBrowser = typeof window !== "undefined";

const normalizeSelection = (selection?: LLMSelection): LLMSelection => {
  if (!selection) return DEFAULT_LLM_SELECTION;
  const option = SUPPORTED_MODELS.find(m => m.provider === selection.provider);
  return {
    provider: selection.provider || DEFAULT_LLM_SELECTION.provider,
    model: selection.model?.trim() || option?.defaultModel || DEFAULT_LLM_SELECTION.model,
  };
};

export const getSavedLLMSelection = (): LLMSelection => {
  if (!isBrowser) return DEFAULT_LLM_SELECTION;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_LLM_SELECTION;
  try {
    const parsed: LLMSelection = JSON.parse(stored);
    return normalizeSelection(parsed);
  } catch (e) {
    return DEFAULT_LLM_SELECTION;
  }
};

export const saveLLMSelection = (selection: LLMSelection): LLMSelection => {
  const normalized = normalizeSelection(selection);
  if (isBrowser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
};

export const generateTurn = async (
  gameState: GameState,
  choiceMade?: string
): Promise<GeminiResponse> => {
  const selection = getSavedLLMSelection();

  if (selection.provider === "gemini") {
    return generateTurnWithGemini(gameState, choiceMade, selection.model);
  }

  return generateTurnWithOllama(gameState, choiceMade, selection.model);
};

export const generateSummary = async (gameState: GameState): Promise<string> => {
  const selection = getSavedLLMSelection();

  if (selection.provider === "gemini") {
    return generateSummaryWithGemini(gameState, selection.model);
  }

  return generateSummaryWithOllama(gameState, selection.model);
};

