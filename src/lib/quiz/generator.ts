import type { ChapterEntity, QuizQuestion, QuizSet } from "@/lib/types";

export function generateQuizSet(
  documentId: string,
  chapterId: string,
  chapterTitle: string,
  concepts: string[],
): QuizSet {
  const questions = createQuestions(chapterId, chapterTitle, concepts);

  return {
    id: crypto.randomUUID(),
    documentId,
    chapterId,
    questions,
    createdAt: new Date().toISOString(),
  };
}

export function generateQuizSetFromChapters(
  documentId: string,
  chapterList: ChapterEntity[],
): QuizSet {
  const chapter = chapterList[0];
  if (!chapter) {
    return {
      id: crypto.randomUUID(),
      documentId,
      chapterId: "empty",
      questions: [],
      createdAt: new Date().toISOString(),
    };
  }

  return generateQuizSet(
    documentId,
    chapter.id,
    chapter.title,
    chapter.coreConcepts,
  );
}

function createQuestions(
  chapterId: string,
  chapterTitle: string,
  concepts: string[],
): QuizQuestion[] {
  const conceptA = concepts[0] || "核心概念";
  const conceptB = concepts[1] || "关键命令";

  return [
    {
      id: crypto.randomUUID(),
      chapterId,
      type: "single_choice",
      stem: `${chapterTitle}中，学习顺序最合理的是哪一项？`,
      options: [
        `先理解${conceptA}，再执行操作步骤`,
        "先背命令，再考虑为什么要执行",
        "跳过概念，直接做场景题",
        "只看答案，不做复盘",
      ],
      answer: `先理解${conceptA}，再执行操作步骤`,
      analysis: "费曼法强调先讲明白原理，再动手操作。",
      difficulty: "easy",
    },
    {
      id: crypto.randomUUID(),
      chapterId,
      type: "true_false",
      stem: `判断：只要记住${conceptB}的命令格式，就等于掌握该章节。`,
      answer: "错误",
      analysis: "掌握不仅是记忆，还包括解释原理、步骤和错误排查。",
      difficulty: "easy",
    },
    {
      id: crypto.randomUUID(),
      chapterId,
      type: "fill_blank",
      stem: `填空：费曼复述建议按“概念 -> 步骤 -> ________”来检查掌握程度。`,
      answer: "常见错误",
      analysis: "能说出容易犯错的点，才说明理解深入。",
      difficulty: "medium",
    },
    {
      id: crypto.randomUUID(),
      chapterId,
      type: "scenario",
      stem: `场景面试题：你在复盘${chapterTitle}时发现同学只会背命令不会解释原因。请给出你的纠偏方案。`,
      answer: [
        "让对方先用自己的话解释目标与边界",
        "要求按标准步骤复述并演示",
        "补充至少2个常见错误和规避方法",
      ],
      analysis: "面试场景重点是结构化表达和纠错能力。",
      difficulty: "hard",
    },
  ];
}
