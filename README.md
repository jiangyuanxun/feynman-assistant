# Feynman Learning Assistant

单页学习助手（Next.js）：上传 PDF -> 章节拆分 -> 知识点提取 -> 出题测验。

## Quick Start

```bash
npm install
npm run dev
```

打开：`http://localhost:3000`

## GPT 接入

本项目支持两种模式：

1. 未配置 OpenAI Key：自动走本地 mock 规则
2. 配置 OpenAI Key：`extract-points` 与 `generate-quiz` 自动走 GPT

在项目根目录创建 `.env.local`：

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

然后重启 `npm run dev`。

## 当前 API

- `POST /api/parse-pdf`：支持 `multipart/form-data` 上传 PDF（仅可提取文本的 PDF）
- `POST /api/split-chapters`
- `POST /api/extract-points`
- `POST /api/generate-quiz`

## 说明

- 旧页面 `/upload`、`/chapters`、`/quiz` 保留但不作为主入口
- 主体验页面是 `/`
