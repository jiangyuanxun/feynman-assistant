import { callOpenAIJson } from "@/lib/ai/openai";
import { generateQuizSetFromChapters } from "@/lib/quiz/generator";
import type { ChapterEntity, Difficulty, QuizQuestion, QuizSet } from "@/lib/types";

type AIQuizPayload = {
  questions: Array<{
    type: QuizQuestion["type"];
    stem: string;
    options?: string[];
    answer: string | string[];
    analysis: string;
    difficulty: Difficulty;
  }>;
};

const SYSTEM_PROMPT = [
  "你是技术面试官与学习教练。",
  "请生成可用于复盘和面试训练的题目。",
  "你必须只返回 JSON，不要输出 markdown。",
].join(" ");

export async function generateQuizSetWithAI(
  documentId: string,
  chapterList: ChapterEntity[],
): Promise<QuizSet> {
  const chapter = chapterList[0];
  if (!chapter) {
    return generateQuizSetFromChapters(documentId, chapterList);
  }

  const userPrompt = [
    "请基于下面章节生成 4 道题，题型必须各一题：",
    "- single_choice",
    "- true_false",
    "- fill_blank",
    "- scenario",
    "返回 JSON：",
    "{",
    '  "questions": [',
    "    {",
    '      "type": "single_choice|true_false|fill_blank|scenario",',
    '      "stem": "题干",',
    '      "options": ["A","B","C","D"] (仅选择题需要),',
    '      "answer": "答案字符串或字符串数组",',
    '      "analysis": "解析",',
    '      "difficulty": "easy|medium|hard"',
    "    }",
    "  ]",
    "}",
    `章节标题：${chapter.title}`,
    `核心概念：${chapter.coreConcepts.join("、")}`,
    `章节内容：${chapter.content.slice(0, 5000)}`,
  ].join("\n");

  const payload = await callOpenAIJson<AIQuizPayload>(SYSTEM_PROMPT, userPrompt);
  const questions = normalizeQuestions(payload.questions, chapter.id);

  if (questions.length === 0) {
    return generateQuizSetFromChapters(documentId, chapterList);
  }

  return {
    id: crypto.randomUUID(),
    documentId,
    chapterId: chapter.id,
    questions,
    createdAt: new Date().toISOString(),
  };
}

function normalizeQuestions(
  questions: AIQuizPayload["questions"] | undefined,
  chapterId: string,
): QuizQuestion[] {
  const normalized = (questions || [])
    .map((question) => normalizeQuestion(question, chapterId))
    .filter((item): item is QuizQuestion => Boolean(item));

  const preferredOrder: QuizQuestion["type"][] = [
    "single_choice",
    "true_false",
    "fill_blank",
    "scenario",
  ];

  const used = new Set<QuizQuestion["type"]>();
  const ordered: QuizQuestion[] = [];

  for (const type of preferredOrder) {
    const found = normalized.find((item) => item.type === type && !used.has(type));
    if (found) {
      ordered.push(found);
      used.add(type);
    }
  }

  return ordered;
}

function normalizeQuestion(
  question: AIQuizPayload["questions"][number],
  chapterId: string,
): QuizQuestion | null {
  if (!question || !isValidType(question.type)) {
    return null;
  }

  const stem = normalizeText(question.stem);
  const analysis = normalizeText(question.analysis);
  if (!stem || !analysis) {
    return null;
  }

  const difficulty = isValidDifficulty(question.difficulty)
    ? question.difficulty
    : "medium";

  const answer = normalizeAnswer(question.answer);
  if (!answer) {
    return null;
  }

  const normalized: QuizQuestion = {
    id: crypto.randomUUID(),
    chapterId,
    type: question.type,
    stem,
    answer,
    analysis,
    difficulty,
  };

  if (question.type === "single_choice") {
    const options = (question.options || [])
      .map(normalizeText)
      .filter(Boolean)
      .slice(0, 6);
    if (options.length < 2 || typeof answer !== "string") {
      return null;
    }
    normalized.options = options;
  }

  return normalized;
}

function normalizeAnswer(answer: unknown): string | string[] | null {
  if (typeof answer === "string" && answer.trim()) {
    return answer.trim();
  }
  if (Array.isArray(answer)) {
    const values = answer
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    return values.length > 0 ? values : null;
  }
  return null;
}

function normalizeText(text: unknown): string {
  return typeof text === "string" ? text.trim() : "";
}

function isValidType(type: unknown): type is QuizQuestion["type"] {
  return (
    type === "single_choice" ||
    type === "true_false" ||
    type === "fill_blank" ||
    type === "scenario"
  );
}

function isValidDifficulty(value: unknown): value is Difficulty {
  return value === "easy" || value === "medium" || value === "hard";
}
