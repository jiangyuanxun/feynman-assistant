import { NextResponse } from "next/server";
import {
  getDocumentById,
  listChaptersByDocument,
  upsertChapters,
} from "@/lib/mock/store";
import { enrichChapter } from "@/lib/feynman/explainer";
import { enrichChapterWithAI } from "@/lib/ai/chapter";
import { isOpenAIEnabled } from "@/lib/ai/openai";
import type { ChapterEntity } from "@/lib/types";

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
    const enriched = isOpenAIEnabled()
      ? await enrichWithAI(chapterList)
      : chapterList.map((chapter) => enrichChapter(chapter));

    const chapters = upsertChapters(body.documentId, enriched);
    return NextResponse.json({ chapters });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "extract-points failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function enrichWithAI(chapterList: ChapterEntity[]): Promise<ChapterEntity[]> {
  const result: ChapterEntity[] = [];
  for (const chapter of chapterList) {
    result.push(await enrichChapterWithAI(chapter));
  }
  return result;
}
