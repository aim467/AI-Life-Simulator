<div align="center">

# 🎮 AI 人生重开模拟器

**Next-Gen Life Simulator · Vue 3 + Vite + Tailwind**

用 AI 重新体验一段不一样的人生旅程

[![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

</div>

## ✨ 功能特点

- 🤖 **多模型驱动**：支持 Gemini 2.5（云端）与 Ollama 本地模型，启动界面可选并记忆配置
- 🎲 **天赋十连抽**：从 10 个随机天赋中挑 3 个，稀有度/加成各不相同
- 📊 **属性自由分配**：20 点属性自由或一键随机，五维度影响人生走向
- 🔀 **命运抉择**：关键年龄给出分支选择，实时影响事件与属性
- 🏆 **成就与墓志铭**：记录成就，结局自动生成墓志铭/人生总结
- 🌓 **极简暗色 UI**：Tailwind 打造的移动优先布局

## 🚀 快速开始

### 环境要求
- Node.js 18+
- （可选）Gemini API Key：用于云端调用 [获取](https://aistudio.google.com/apikey)
- （可选）本地 Ollama：`ollama serve` 已运行，并已拉取所需模型

### 安装 & 运行
```bash
# 克隆项目
git clone https://github.com/your-username/AI-Life-Simulator.git
cd AI-Life-Simulator

# 安装依赖
npm install

# 配置环境变量（创建 .env.local）
API_KEY=your_google_api_key          # 仅在使用 Gemini 时需要
OLLAMA_URL=http://localhost:11434    # 可选，默认为 http://192.168.1.188:11434
OLLAMA_MODEL=qwen3:32b               # 可选，本地默认模型

# 启动开发服务器
npm run dev
```

常用脚本：
- `npm run dev`：本地开发（Vite）
- `npm run build`：打包产物生成到 `dist/`
- `npm run preview`：本地预览打包结果

### 玩法流程
1) 选择 AI 提供商与模型（会保存在浏览器）  
2) 十连抽天赋，挑选 3 个喜欢的组合  
3) 分配 20 点属性或点击随机分配  
4) 开启人生：每年生成事件，必要时给出分支选择  
5) 收集成就，迎来结局并查看墓志铭

## 📁 项目结构
```
AI-Life-Simulator/
├── App.vue
├── main.ts
├── index.css
├── components/
│   ├── StartScreen.vue      # 模型选择、天赋抽取、属性分配
│   ├── StatsPanel.vue       # 属性面板
│   └── EventLog.vue         # 年度事件日志
├── services/
│   ├── llmService.ts        # 统一大模型入口与存储
│   ├── geminiService.ts     # Gemini 2.5 接入
│   └── ollamaService.ts     # Ollama 本地模型接入
├── types.ts                 # 类型定义
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 🛠️ 技术栈

| 技术 | 用途 |
| ---- | ---- |
| Vue 3 | 前端框架 |
| TypeScript | 类型与工具链 |
| Vite 6 | 构建与开发服务器 |
| Tailwind CSS | 样式与主题 |
| Gemini 2.5 | 云端故事/事件生成 |
| Ollama | 本地大模型推理 |

## 📝 License

MIT License

---

<div align="center">

**如果觉得有趣，欢迎 Star ⭐**

</div>
