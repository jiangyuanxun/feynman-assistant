import pdfParse from "pdf-parse/lib/pdf-parse.js";

export type ParseInput = {
  fileName: string;
  transcript?: string;
};

export type ParseResult = {
  title: string;
  sourceFileName: string;
  rawText: string;
};

export function parsePdfMock(input: ParseInput): ParseResult {
  const title = input.fileName.replace(/\.pdf$/i, "");
  const fallbackText = [
    "第一章 学习目标拆解",
    "定义本章核心概念、关键术语和学习边界。",
    "第二章 操作与命令",
    "整理关键命令、常见参数与标准操作步骤。",
    "第三章 错误与排障",
    "总结常见错误、定位方法和面试高频问题。",
  ].join("\n");

  return {
    title,
    sourceFileName: input.fileName,
    rawText: input.transcript?.trim() || fallbackText,
  };
}

export async function parsePdfFromBuffer(
  fileName: string,
  buffer: Buffer,
): Promise<ParseResult> {
  const parsed = await pdfParse(buffer);
  const rawText = normalizeExtractedText(parsed.text);

  if (!rawText) {
    throw new Error("PDF 解析失败：未提取到文本。当前仅支持可提取文本的 PDF。");
  }

  return {
    title: fileName.replace(/\.pdf$/i, ""),
    sourceFileName: fileName,
    rawText,
  };
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
