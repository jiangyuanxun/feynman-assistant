import { NextResponse } from "next/server";
import {
  getDocumentById,
  listChaptersByDocument,
  setQuizSet,
} from "@/lib/mock/store";
import { generateQuizSetFromChapters } from "@/lib/quiz/generator";
import { generateQuizSetWithAI } from "@/lib/ai/quiz";
import { isOpenAIEnabled } from "@/lib/ai/openai";

type Payload = {
  documentId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  if (!body.documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const document = getDocumentById(body.documentId);
  if (!document) {
    return NextResponse.json({ error: "document not found" }, { status: 404 });
  }

  const chapterList = listChaptersByDocument(body.documentId);

  try {
    const quiz = isOpenAIEnabled()
      ? await generateQuizSetWithAI(body.documentId, chapterList)
      : generateQuizSetFromChapters(body.documentId, chapterList);
    const quizSet = setQuizSet(quiz);
    return NextResponse.json({ quizSet });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "generate-quiz failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
