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
    const age = gameState.age;
    
    // 生命阶段上下文（包含明确的年龄范围）
    let stageContext = "普通的一年。";
    if (age === 0) stageContext = "0岁：出生。描述家庭背景（富裕/贫穷/奇特），父母，可能的兄弟姐妹。天赋开始影响人生。";
    else if (age >= 1 && age <= 3) stageContext = "1-3岁：婴儿期。学走路/说话，有趣的意外，幼儿园面试。";
    else if (age >= 4 && age <= 6) stageContext = "4-6岁：幼儿期。幼儿园，交朋友，发现天赋。";
    else if (age >= 7 && age <= 12) stageContext = "7-12岁：小学。童年烦恼，爱好，调皮行为。";
    else if (age >= 13 && age <= 15) stageContext = "13-15岁：初中。青春期，叛逆，初恋，学业压力。";
    else if (age >= 16 && age <= 17) stageContext = "16-17岁：高中。紧张学习，压力，深厚友谊。";
    else if (age === 18) stageContext = "18岁：高考！这是决定未来的重大人生事件。";
    else if (age >= 19 && age <= 22) stageContext = "19-22岁：大学生活或初入职场。自由，约会，翘课，实习。";
    else if (age === 23) stageContext = "23岁：毕业/进入职场。文化冲击。";
    else if (age >= 24 && age <= 29) stageContext = "24-29岁：青年。职业挣扎，父母催婚，经济独立。";
    else if (age >= 30 && age <= 49) stageContext = "30-49岁：中年。事业巅峰/低谷，养育孩子，父母老去，健康问题，中年危机。";
    else if (age >= 50 && age <= 64) stageContext = "50-64岁：退休前。空巢，健康下降，反思，成为祖父母。";
    else if (age >= 65) stageContext = "65岁以上：老年。退休，孙辈，健康斗争，回顾人生。";

    const systemPrompt = `你是一个专业的人生模拟游戏叙事引擎。你的任务是创造真实、连贯、有情感深度的人生故事。

核心原则：
1. 故事连贯性：每个事件都应该与角色的年龄、属性、天赋和过往经历相呼应
2. 情感真实性：描写要有细节和情感，避免空洞的叙述
3. 因果关系：事件之间要有逻辑联系，选择要有实际后果
4. 属性影响：高智力影响学业/职业，高魅力影响社交/恋爱，高财富影响生活质量
5. 天赋作用：天赋应该在关键时刻发挥明显作用

输出要求：
- 只输出JSON格式，不要任何额外文字
- content字段：50-120字，生动具体，有细节描写
- statChanges：合理范围（-20到+20），重大事件可以更大
- choices：如果提供选择，必须是有意义的两难抉择，每个选项都有明确的利弊

输出格式示例：
{"content":"你出生在一个普通的工薪家庭。父亲是工厂技工，母亲是小学教师。虽然家境不富裕，但父母的爱让这个小家充满温暖。","statChanges":{"health":0,"intelligence":5,"charm":0,"wealth":-5,"happiness":10},"isDeath":false,"achievements":[],"choices":[]}`;

    // 获取最近的重要历史事件作为上下文
    const recentHistory = gameState.history
      .slice(-3)
      .map(h => `${h.age}岁: ${h.content}`)
      .join('\n');

    let userPrompt = `
【角色档案】
年龄: ${age}岁
当前属性: 健康${gameState.stats.health} | 智力${gameState.stats.intelligence} | 魅力${gameState.stats.charm} | 财富${gameState.stats.wealth} | 幸福${gameState.stats.happiness}
天赋特质: ${gameState.talents.map(t => `${t.name}(${t.description})`).join(', ') || '无特殊天赋'}
已获成就: ${gameState.achievements.slice(-3).join(', ') || '暂无'}

【人生阶段】
${stageContext}

【近期经历】
${recentHistory || '人生刚刚开始'}
`;

    if (choiceMade) {
      userPrompt += `
【任务】玩家做出了选择："${choiceMade}"
请生成这个选择的后果：
1. 描述选择带来的直接影响和情感体验（50-100字）
2. 属性变化要符合选择的逻辑（例如：选择学习→智力+5~15，选择冒险→可能健康-10但财富+20）
3. 如果是重大选择，可能触发新的人生转折或成就
4. 保持与角色性格、天赋的一致性`;
    } else {
      userPrompt += `
【任务】生成${age}岁这一年的人生事件
要求：
1. 事件必须符合年龄阶段特征和角色当前状态
2. 考虑天赋的影响（例如：学霸天赋→学业事件更频繁且结果更好）
3. 属性影响事件：
   - 健康<20: 可能生病住院
   - 智力>80: 学业/职业上有突出表现
   - 魅力>80: 社交/恋爱机遇增多
   - 财富<10: 经济困难影响生活
   - 幸福<30: 可能出现心理问题
4. 关键年龄必须有选择：
   - 18岁(高考): 提供专业/就业选择
   - 22岁(毕业): 提供职业道路选择
   - 28-32岁: 可能出现婚姻/事业选择
5. 普通年份15%概率提供选择，选择要有实际意义
6. 重大事件（升学、结婚、生子、晋升、意外）可以添加成就
7. 如果健康<10，高概率死亡（isDeath:true，提供deathReason）`;
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
    const keyMoments = gameState.history
      .filter(h => h.type === 'choice' || h.type === 'achievement')
      .slice(-8)
      .map(h => `${h.age}岁: ${h.content}`)
      .join('\n');

    const prompt = `
【人生总结任务】
为一个${gameState.age}岁离世的角色撰写墓志铭。

【角色生平】
寿命: ${gameState.age}岁
最终属性: 健康${gameState.stats.health} | 智力${gameState.stats.intelligence} | 魅力${gameState.stats.charm} | 财富${gameState.stats.wealth} | 幸福${gameState.stats.happiness}
人生成就: ${gameState.achievements.join('、') || '平凡一生'}
天赋特质: ${gameState.talents.map(t => t.name).join('、') || '无'}

【关键时刻】
${keyMoments || '波澜不惊的一生'}

【离世原因】
${gameState.deathReason || '寿终正寝，安详离世'}

【撰写要求】
1. 3-4句话，80-150字
2. 要有文学性和情感深度，避免流水账
3. 突出人生的主题或转折点
4. 如果有遗憾，要含蓄表达
5. 如果成就卓越，要有敬意
6. 如果平凡，要有温情
7. 风格可以是感慨、讽刺、温暖或悲壮，根据人生经历选择
8. 使用简体中文，语言优美

直接输出墓志铭文字，不要任何标签或解释。
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
