import { NextResponse } from "next/server";
import { createDocument } from "@/lib/mock/store";
import { parsePdfFromBuffer, parsePdfMock } from "@/lib/pdf/parser";

export const runtime = "nodejs";

type JsonPayload = {
  fileName?: string;
  transcript?: string;
};

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      return await handleMultipartRequest(request);
    }
    return await handleJsonRequest(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PDF 解析失败，请稍后重试。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function handleMultipartRequest(request: Request) {
  const formData = await request.formData();
  const fileValue = formData.get("file");
  const transcript = String(formData.get("transcript") || "");
  const fallbackName = String(formData.get("fileName") || "未命名学习材料.pdf");

  if (!(fileValue instanceof File)) {
    return NextResponse.json({ error: "请先选择 PDF 文件。" }, { status: 400 });
  }

  const file = fileValue;
  const fileName = file.name || fallbackName;
  const isPdf =
    file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return NextResponse.json({ error: "文件格式不正确，仅支持 .pdf 文件。" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.byteLength === 0) {
    return NextResponse.json({ error: "上传文件为空，请重新选择 PDF。" }, { status: 400 });
  }

  const parsed = await parsePdfFromBuffer(fileName, buffer);
  const rawText = parsed.rawText || transcript.trim();
  if (!rawText) {
    return NextResponse.json(
      { error: "未提取到文本，请确认 PDF 可复制文本内容。" },
      { status: 400 },
    );
  }

  const document = createDocument(parsed.sourceFileName, rawText, parsed.title);
  return NextResponse.json({ document });
}

async function handleJsonRequest(request: Request) {
  const body = (await request.json()) as JsonPayload;
  const fileName = body.fileName?.trim() || "未命名学习材料.pdf";
  const parsed = parsePdfMock({ fileName, transcript: body.transcript });
  const document = createDocument(
    parsed.sourceFileName,
    parsed.rawText,
    parsed.title,
  );
  return NextResponse.json({ document });
}
