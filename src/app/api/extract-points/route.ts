import { NextResponse } from "next/server";
import {
  getDocumentById,
  listChaptersByDocument,
  upsertChapters,
} from "@/lib/mock/store";
import { enrichChapter } from "@/lib/feynman/explainer";

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
  const enriched = chapterList.map((chapter) => enrichChapter(chapter));
  const chapters = upsertChapters(body.documentId, enriched);

  return NextResponse.json({ chapters });
}
