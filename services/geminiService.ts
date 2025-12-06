import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameState, GeminiResponse, ChoiceOption } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for the structured response from Gemini
const gameTurnSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    content: {
      type: Type.STRING,
      description: "The narrative description of what happened this year. Keep it concise (1-2 sentences) but interesting/funny/tragic. Use Chinese.",
    },
    statChanges: {
      type: Type.OBJECT,
      description: "Changes to player stats based on the event.",
      properties: {
        health: { type: Type.INTEGER },
        intelligence: { type: Type.INTEGER },
        charm: { type: Type.INTEGER },
        wealth: { type: Type.INTEGER },
        happiness: { type: Type.INTEGER },
      },
    },
    isDeath: {
      type: Type.BOOLEAN,
      description: "Whether the character died this year.",
    },
    deathReason: {
      type: Type.STRING,
      description: "If died, the cause of death.",
    },
    achievements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of any special achievements unlocked this turn (e.g. '高考状元', '千万富翁', '情圣').",
    },
    choices: {
      type: Type.ARRAY,
      description: "Optional. Provide 2-3 choices if a major decision is needed.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING, description: "The text of the choice." },
        },
        required: ["id", "text"],
      },
    },
  },
  required: ["content", "isDeath"],
};

export const generateTurn = async (gameState: GameState, choiceMade?: string): Promise<GeminiResponse> => {
  if (!apiKey) {
    return {
      content: "系统检测到 API Key 缺失，世界崩塌了。",
      isDeath: true,
      deathReason: "次元壁破裂 (Missing API Key)"
    };
  }

  try {
    const model = "gemini-2.5-flash";
    const age = gameState.age + 1;
    
    // Determine life stage context to guide the AI
    let stageContext = "Normal year.";
    if (age === 0) stageContext = "Birth. Describe family background (rich/poor/strange), parents, potential siblings. Talent influence starts now.";
    else if (age <= 3) stageContext = "Infancy. Learning to walk/talk, funny accidents, kindergarten interview.";
    else if (age <= 6) stageContext = "Early childhood. Kindergarten, making friends, discovering talents.";
    else if (age <= 12) stageContext = "Primary school. Innocent troubles, hobbies, naughty behavior.";
    else if (age <= 15) stageContext = "Middle school. Puberty, rebellion, first crush, academic pressure.";
    else if (age < 18) stageContext = "High school. Intense study, stress, intense friendships.";
    else if (age === 18) stageContext = "THE GAOKAO (College Entrance Exam). This is a major life event determining the future.";
    else if (age <= 22) stageContext = "University life or early work. Freedom, dating, skipping classes, internships.";
    else if (age === 23) stageContext = "Graduation / Entering real workforce. Culture shock.";
    else if (age < 30) stageContext = "Young adult. Career struggles, marriage pressure from parents, financial independence.";
    else if (age < 50) stageContext = "Middle age. Career peak/slump, raising kids, aging parents, health issues, mid-life crisis.";
    else if (age < 65) stageContext = "Pre-retirement. Empty nest, health decline, reflection, becoming a grandparent.";
    else stageContext = "Old age. Retirement, grandkids, health battles, looking back at life.";

    let prompt = `
      You are the engine for a text-based life simulator game (AI Life Restart).
      Tone: Humorous, slightly cynical, meme-friendly, but can be touching or tragic. 
      Use simplified Chinese.
      
      Current State:
      Age: ${age}
      Stats: Health=${gameState.stats.health}, Int=${gameState.stats.intelligence}, Charm=${gameState.stats.charm}, Wealth=${gameState.stats.wealth}, Happy=${gameState.stats.happiness}
      Talents: ${gameState.talents.map(t => t.name).join(', ')}
      Life Stage Context: ${stageContext}
    `;

    if (choiceMade) {
      prompt += `\nThe user made choice: "${choiceMade}". Generate the immediate consequence of this choice.`;
    } else {
      prompt += `\nGenerate the event for this new year. 
      - Adjust probability of death based on Health (if Health < 10, high risk).
      - Adjust probability of events based on Talents.
      - 15% chance to offer choices (decisions) unless it's a critical year (18, 22, etc).
      - If Wealth is 0 or negative, describe poverty struggles.
      - Provide 'achievements' if something rare happens.
      `;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: gameTurnSchema,
        temperature: 1.2, // High creativity
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as GeminiResponse;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Graceful error handling for 403 or other API issues
    const isPermissionError = error.message?.includes('403') || error.status === 403;
    
    if (isPermissionError) {
       return {
         content: "一道闪电击中了你的电脑，或者说... Google 的服务器？(Error 403: Permission Denied. Please check your API Key settings).",
         statChanges: { health: -100 },
         isDeath: true,
         deathReason: "世界被不可抗力毁灭 (API Permission Error)"
       };
    }

    return {
      content: "这一年过得很平淡，大脑一片空白 (AI 连接超时).",
      statChanges: { happiness: -5 },
      isDeath: false
    };
  }
};

export const generateSummary = async (gameState: GameState): Promise<string> => {
  if (!apiKey) return "一个没有被记录的人生。";

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Write a poignant, short epitaph/summary for a character who lived to ${gameState.age}.
      Stats: Health=${gameState.stats.health}, Int=${gameState.stats.intelligence}, Charm=${gameState.stats.charm}, Wealth=${gameState.stats.wealth}.
      Achievements: ${gameState.achievements.join(', ')}
      Key Events: ${gameState.history.filter(h => h.type === 'choice' || h.type === 'achievement').slice(-8).map(h => h.content).join('; ')}
      Death Reason: ${gameState.deathReason}
      Tone: Witty and profound.
      Language: Chinese (Simplified).
    `;
    
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    return response.text || "人生如梦，一樽还酹江月。";
  } catch (e) {
    return "人生总有终点。";
  }
};