import sampleOutput from "@/mock/sample-output.json";
import type {
  ChapterEntity,
  DocumentEntity,
  DocumentSnapshot,
  QuizSet,
} from "@/lib/types";

type SeedShape = {
  documents: DocumentEntity[];
  chapters: ChapterEntity[];
  quizSets: QuizSet[];
};

const seed = sampleOutput as SeedShape;

const documents: DocumentEntity[] = [...seed.documents];
let chapters: ChapterEntity[] = [...seed.chapters];
let quizSets: QuizSet[] = [...seed.quizSets];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createDocument(
  sourceFileName: string,
  rawText: string,
  title?: string,
): DocumentEntity {
  const now = new Date().toISOString();
  const document: DocumentEntity = {
    id: crypto.randomUUID(),
    title: title || sourceFileName.replace(/\.pdf$/i, "") || "未命名文档",
    sourceFileName,
    rawText,
    createdAt: now,
  };
  documents.push(document);
  return clone(document);
}

export function getDocumentById(documentId: string): DocumentEntity | undefined {
  return clone(documents.find((item) => item.id === documentId));
}

export function listChaptersByDocument(documentId: string): ChapterEntity[] {
  return clone(
    chapters
      .filter((item) => item.documentId === documentId)
      .sort((a, b) => a.order - b.order),
  );
}

export function upsertChapters(
  documentId: string,
  chapterList: ChapterEntity[],
): ChapterEntity[] {
  chapters = chapters.filter((item) => item.documentId !== documentId);
  chapters.push(...chapterList);
  return listChaptersByDocument(documentId);
}

export function getQuizSetByDocument(documentId: string): QuizSet | undefined {
  return clone(quizSets.find((item) => item.documentId === documentId));
}

export function setQuizSet(quizSet: QuizSet): QuizSet {
  quizSets = quizSets.filter((item) => item.documentId !== quizSet.documentId);
  quizSets.push(quizSet);
  return clone(quizSet);
}

export function getDocumentSnapshot(
  documentId: string,
): DocumentSnapshot | undefined {
  const document = documents.find((item) => item.id === documentId);
  if (!document) {
    return undefined;
  }

  const snapshot: DocumentSnapshot = {
    document: clone(document),
    chapters: listChaptersByDocument(documentId),
    quizSet: getQuizSetByDocument(documentId),
  };

  return snapshot;
}
