import { GameState, GeminiResponse } from "../types";

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://192.168.1.188:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:32b'; // 推荐使用支持中文的模型

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

const parseJsonFromText = (text: string): any => {
  // 清理文本
  let cleaned = text.trim();
  
  // 尝试多种方式提取 JSON
  const patterns = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
    /(\{[\s\S]*\})/,
  ];
  
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1] || match[0];
        return JSON.parse(jsonStr.trim());
      } catch (e) {
        continue;
      }
    }
  }
  
  // 如果都失败，尝试直接解析
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 最后尝试修复常见问题
    cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    try {
      const braceStart = cleaned.indexOf('{');
      const braceEnd = cleaned.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd !== -1) {
        return JSON.parse(cleaned.slice(braceStart, braceEnd + 1));
      }
    } catch (e2) {
      // 返回 null 让调用方处理
    }
  }
  
  return null;
};

export const generateTurn = async (gameState: GameState, choiceMade?: string): Promise<GeminiResponse> => {
  try {
    const age = gameState.age + 1;
    
    // 生命阶段上下文
    let stageContext = "普通的一年。";
    if (age === 0) stageContext = "出生。描述家庭背景（富裕/贫穷/奇特），父母，可能的兄弟姐妹。天赋开始影响人生。";
    else if (age <= 3) stageContext = "婴儿期。学走路/说话，有趣的意外，幼儿园面试。";
    else if (age <= 6) stageContext = "幼儿期。幼儿园，交朋友，发现天赋。";
    else if (age <= 12) stageContext = "小学。童年烦恼，爱好，调皮行为。";
    else if (age <= 15) stageContext = "初中。青春期，叛逆，初恋，学业压力。";
    else if (age < 18) stageContext = "高中。紧张学习，压力，深厚友谊。";
    else if (age === 18) stageContext = "高考！这是决定未来的重大人生事件。";
    else if (age <= 22) stageContext = "大学生活或初入职场。自由，约会，翘课，实习。";
    else if (age === 23) stageContext = "毕业/进入职场。文化冲击。";
    else if (age < 30) stageContext = "青年。职业挣扎，父母催婚，经济独立。";
    else if (age < 50) stageContext = "中年。事业巅峰/低谷，养育孩子，父母老去，健康问题，中年危机。";
    else if (age < 65) stageContext = "退休前。空巢，健康下降，反思，成为祖父母。";
    else stageContext = "老年。退休，孙辈，健康斗争，回顾人生。";

    const systemPrompt = `你是人生模拟游戏引擎。用简体中文。只输出JSON，不要任何解释。

输出格式示例：
{"content":"你出生在一个普通家庭，父母是工薪阶层。","statChanges":{"health":0,"intelligence":0,"charm":0,"wealth":-5,"happiness":5},"isDeath":false,"achievements":[],"choices":[]}`;

    let userPrompt = `
当前状态：
年龄: ${age}岁
属性: 健康=${gameState.stats.health}, 智力=${gameState.stats.intelligence}, 魅力=${gameState.stats.charm}, 财富=${gameState.stats.wealth}, 幸福=${gameState.stats.happiness}
天赋: ${gameState.talents.map(t => t.name).join(', ') || '无'}
人生阶段: ${stageContext}
`;

    if (choiceMade) {
      userPrompt += `\n玩家选择了: "${choiceMade}"。生成这个选择的直接后果。`;
    } else {
      userPrompt += `
生成这一年的事件：
- 如果健康<10，死亡风险高
- 根据天赋调整事件概率
- 15%概率提供选择（关键年份如18、22岁必须有选择）
- 如果财富<=0，描述贫困挣扎
- 如果发生稀有事件，添加成就
`;
    }

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        format: "json",
        options: {
          temperature: 0.8,
          num_predict: 300,
        }
      })
    });


    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();
    console.log("Ollama raw response:", data.response); // 调试用
    
    const parsed = parseJsonFromText(data.response);

    console.log(parsed);
    
    if (!parsed) {
      // JSON 解析失败，从原始文本生成回退响应
      return {
        content: data.response.slice(0, 100) || "平淡的一年。",
        statChanges: { health: 0, intelligence: 0, charm: 0, wealth: 0, happiness: 0 },
        isDeath: false,
      };
    }
    
    return {
      content: parsed.content || "平淡的一年。",
      statChanges: parsed.statChanges || {},
      isDeath: parsed.isDeath || false,
      deathReason: parsed.deathReason,
      achievements: parsed.achievements || [],
      choices: parsed.choices || [],
    };

  } catch (error: any) {
    console.error("Ollama API Error:", error);
    
    const isConnectionError = error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED');
    
    if (isConnectionError) {
      return {
        content: "无法连接到本地 AI 服务器。请确保 Ollama 正在运行 (ollama serve)。",
        statChanges: { happiness: -10 },
        isDeath: false
      };
    }

    return {
      content: "这一年过得很平淡，大脑一片空白 (AI 解析失败)。",
      statChanges: { happiness: -5 },
      isDeath: false
    };
  }
};

export const generateSummary = async (gameState: GameState): Promise<string> => {
  try {
    const prompt = `
为一个活到${gameState.age}岁的角色写一段简短、深刻的墓志铭/总结。
属性: 健康=${gameState.stats.health}, 智力=${gameState.stats.intelligence}, 魅力=${gameState.stats.charm}, 财富=${gameState.stats.wealth}
成就: ${gameState.achievements.join(', ') || '无'}
重要事件: ${gameState.history.filter(h => h.type === 'choice' || h.type === 'achievement').slice(-8).map(h => h.content).join('; ')}
死因: ${gameState.deathReason || '自然死亡'}

风格：机智而深刻，使用简体中文，2-3句话即可。
`;
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.8, num_predict: 200 }
      })
    });

    if (!response.ok) throw new Error("Ollama error");
    
    const data: OllamaResponse = await response.json();
    return data.response.trim() || "人生如梦，一樽还酹江月。";
  } catch (e) {
    return "人生总有终点。";
  }
};
