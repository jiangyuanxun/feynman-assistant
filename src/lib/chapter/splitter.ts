import type { ChapterEntity } from "@/lib/types";

type SplitInput = {
  documentId: string;
  rawText: string;
};

const headingRegex = /(第[一二三四五六七八九十百0-9]+章[^\n]*)/g;

export function splitChapters(input: SplitInput): ChapterEntity[] {
  const normalizedText = input.rawText.replace(/\r\n/g, "\n").trim();
  if (!normalizedText) {
    return [];
  }

  const chunks = normalizedText.split(headingRegex).map((item) => item.trim());
  const chapters: ChapterEntity[] = [];
  let order = 1;

  for (let index = 1; index < chunks.length; index += 2) {
    const title = chunks[index];
    const content = chunks[index + 1] || "暂无章节内容";
    chapters.push(createDraftChapter(input.documentId, title, content, order));
    order += 1;
  }

  if (chapters.length > 0) {
    return chapters;
  }

  return [
    createDraftChapter(
      input.documentId,
      "第一章 自动拆分结果",
      normalizedText,
      1,
    ),
  ];
}

function createDraftChapter(
  documentId: string,
  title: string,
  content: string,
  order: number,
): ChapterEntity {
  return {
    id: crypto.randomUUID(),
    documentId,
    title,
    order,
    content,
    coreConcepts: [],
    keyCommands: [],
    steps: [],
    commonMistakes: [],
    feynmanExplanation: "",
  };
}
