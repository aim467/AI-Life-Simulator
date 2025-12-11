<div align="center">

# 🎮 AI 人生重开模拟器

**Next-Gen Life Simulator powered by Gemini 2.5**

用 AI 重新体验一段不一样的人生旅程

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

</div>

## ✨ 功能特点

- 🎲 **天赋系统** - 十连抽天赋，包含普通、稀有、史诗、传说四种稀有度
- 📊 **属性分配** - 20 点自由分配或一键随机，包括健康、智力、魅力、家境、快乐
- 🤖 **AI 驱动** - 由 Gemini 2.5 生成独特的人生故事和事件
- 🔀 **命运抉择** - 在关键时刻做出影响人生走向的选择
- 🏆 **成就系统** - 解锁各种人生成就
- 📜 **人生日志** - 记录每一年的精彩瞬间

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Gemini API Key ([获取地址](https://aistudio.google.com/apikey))

### 安装运行

```bash
# 克隆项目
git clone https://github.com/your-username/AI-Life-Simulator.git
cd AI-Life-Simulator

# 安装依赖
npm install

# 配置环境变量
# 在 .env.local 文件中设置你的 Gemini API Key
GEMINI_API_KEY=your_api_key_here

# 启动开发服务器
npm run dev
```

## 📁 项目结构

```
AI-Life-Simulator/
├── components/          # React 组件
│   ├── StartScreen.tsx  # 开始界面（天赋抽取、属性分配）
│   ├── EventLog.tsx     # 人生事件日志
│   └── StatsPanel.tsx   # 属性面板
├── services/            # 服务层
│   ├── geminiService.ts # Gemini AI 服务
│   └── ollamaService.ts # Ollama 本地模型服务
├── App.tsx              # 主应用组件
├── types.ts             # TypeScript 类型定义
└── index.tsx            # 应用入口
```

## 🎯 游戏玩法

1. **抽取天赋** - 从 10 个随机天赋中选择 3 个，不满意可以重新十连抽
2. **分配属性** - 将 20 点属性点分配到五项属性中，或点击随机分配
3. **开始人生** - AI 将为你生成独特的人生故事
4. **做出选择** - 在命运的岔路口做出你的抉择
5. **见证结局** - 看看这一生你能走多远

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| React 19 | 前端框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Tailwind CSS | 样式框架 |
| Gemini 2.5 | AI 故事生成 |
| Ollama | 本地模型支持（可选） |

## 📝 License

MIT License

---

<div align="center">

**如果觉得有趣，欢迎 Star ⭐**

</div>
