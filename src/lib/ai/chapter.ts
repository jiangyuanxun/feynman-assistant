import { enrichChapter } from "@/lib/feynman/explainer";
import { callOpenAIJson } from "@/lib/ai/openai";
import type { ChapterEntity } from "@/lib/types";

type AIChapterFields = {
  coreConcepts: string[];
  keyCommands: Array<{ command: string; desc: string }>;
  steps: string[];
  commonMistakes: string[];
  feynmanExplanation: string;
};

const SYSTEM_PROMPT = [
  "你是资深技术教练，擅长用费曼学习法做知识拆解。",
  "你必须输出 JSON，且字段严格匹配用户要求。",
  "内容要准确、简洁、可执行，不要输出 markdown。",
].join(" ");

export async function enrichChapterWithAI(
  chapter: ChapterEntity,
): Promise<ChapterEntity> {
  const userPrompt = [
    "请根据下面章节内容，提取结构化学习数据。",
    "必须返回 JSON：",
    "{",
    '  "coreConcepts": string[] (3~6条),',
    '  "keyCommands": [{"command": string, "desc": string}] (2~6条),',
    '  "steps": string[] (3~6条),',
    '  "commonMistakes": string[] (2~5条),',
    '  "feynmanExplanation": string (80~200字，通俗易懂)',
    "}",
    `章节标题：${chapter.title}`,
    `章节正文：${chapter.content.slice(0, 6000)}`,
  ].join("\n");

  const result = await callOpenAIJson<AIChapterFields>(SYSTEM_PROMPT, userPrompt);
  return {
    ...chapter,
    coreConcepts: sanitizeStrings(result.coreConcepts, 3, 6, chapter.coreConcepts),
    keyCommands: sanitizeCommands(result.keyCommands, chapter.keyCommands),
    steps: sanitizeStrings(result.steps, 3, 6, chapter.steps),
    commonMistakes: sanitizeStrings(
      result.commonMistakes,
      2,
      5,
      chapter.commonMistakes,
    ),
    feynmanExplanation:
      normalizeText(result.feynmanExplanation) ||
      enrichChapter(chapter).feynmanExplanation,
  };
}

function sanitizeStrings(
  items: string[] | undefined,
  min: number,
  max: number,
  fallback: string[],
): string[] {
  const normalized = (items || [])
    .map(normalizeText)
    .filter(Boolean)
    .slice(0, max);

  if (normalized.length >= min) {
    return normalized;
  }

  const fallbackNormalized = (fallback || [])
    .map(normalizeText)
    .filter(Boolean)
    .slice(0, max);

  if (fallbackNormalized.length >= min) {
    return fallbackNormalized;
  }

  return normalized.length > 0 ? normalized : ["待补充"];
}

function sanitizeCommands(
  items: AIChapterFields["keyCommands"] | undefined,
  fallback: Array<{ command: string; desc: string }>,
): Array<{ command: string; desc: string }> {
  const normalized = (items || [])
    .map((item) => ({
      command: normalizeText(item?.command),
      desc: normalizeText(item?.desc),
    }))
    .filter((item) => item.command && item.desc)
    .slice(0, 6);

  if (normalized.length >= 2) {
    return normalized;
  }

  const fallbackNormalized = (fallback || [])
    .map((item) => ({
      command: normalizeText(item.command),
      desc: normalizeText(item.desc),
    }))
    .filter((item) => item.command && item.desc)
    .slice(0, 6);

  return fallbackNormalized.length > 0 ? fallbackNormalized : normalized;
}

function normalizeText(text: unknown): string {
  return typeof text === "string" ? text.trim() : "";
}
