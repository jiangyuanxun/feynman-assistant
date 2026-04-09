import type { ChapterEntity } from "@/lib/types";

export function enrichChapter(chapter: ChapterEntity): ChapterEntity {
  const fallbackConcepts = ["核心概念", "操作边界", "应用场景"];
  const fallbackCommands = [
    { command: "ls -al", desc: "查看目录详情" },
    { command: "cat <file>", desc: "查看文件内容" },
  ];
  const fallbackSteps = ["先理解目标", "再执行步骤", "最后复盘错误点"];
  const fallbackMistakes = ["只记结论不记原因", "只会背命令不会解释场景"];

  const concepts =
    chapter.coreConcepts.length > 0
      ? chapter.coreConcepts
      : guessConcepts(chapter.content, fallbackConcepts);

  const commands =
    chapter.keyCommands.length > 0
      ? chapter.keyCommands
      : guessCommands(chapter.content, fallbackCommands);

  const steps =
    chapter.steps.length > 0
      ? chapter.steps
      : guessSteps(chapter.content, fallbackSteps);

  const mistakes =
    chapter.commonMistakes.length > 0
      ? chapter.commonMistakes
      : fallbackMistakes;

  return {
    ...chapter,
    coreConcepts: concepts,
    keyCommands: commands,
    steps,
    commonMistakes: mistakes,
    feynmanExplanation: buildFeynmanExplanation(chapter.title, concepts, steps),
  };
}

function guessConcepts(content: string, fallback: string[]): string[] {
  const picks = content
    .split(/[，。,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4)
    .slice(0, 3);
  return picks.length > 0 ? picks : fallback;
}

function guessCommands(
  content: string,
  fallback: { command: string; desc: string }[],
): { command: string; desc: string }[] {
  if (/部署|服务|启动/.test(content)) {
    return [
      { command: "git pull", desc: "拉取最新代码" },
      { command: "npm install", desc: "安装依赖" },
      { command: "npm run start", desc: "启动服务" },
    ];
  }
  if (/排障|监控|日志/.test(content)) {
    return [
      { command: "tail -f app.log", desc: "实时查看日志" },
      { command: "top", desc: "观察系统负载" },
      { command: "netstat -ano", desc: "排查端口占用" },
    ];
  }
  return fallback;
}

function guessSteps(content: string, fallback: string[]): string[] {
  if (/部署|服务|启动/.test(content)) {
    return ["拉取代码", "安装依赖", "注入配置", "启动并验活"];
  }
  if (/排障|监控|日志/.test(content)) {
    return ["复现问题", "定位日志", "检查指标", "验证修复"];
  }
  return fallback;
}

function buildFeynmanExplanation(
  chapterTitle: string,
  concepts: string[],
  steps: string[],
): string {
  return [
    `${chapterTitle}可以理解成“先讲清楚再动手”的一章。`,
    `先抓住${concepts.slice(0, 2).join("和")}，别急着背所有细节。`,
    `执行时按“${steps.slice(0, 3).join(" -> ")}”推进，就不容易漏步骤。`,
  ].join("");
}
