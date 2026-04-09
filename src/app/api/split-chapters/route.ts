import { NextResponse } from "next/server";
import {
  getDocumentById,
  listChaptersByDocument,
  upsertChapters,
} from "@/lib/mock/store";
import { splitChapters } from "@/lib/chapter/splitter";

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

  const existing = listChaptersByDocument(body.documentId);
  if (existing.length > 0) {
    return NextResponse.json({ chapters: existing });
  }

  const chapters = splitChapters({
    documentId: body.documentId,
    rawText: document.rawText,
  });

  return NextResponse.json({
    chapters: upsertChapters(body.documentId, chapters),
  });
}
