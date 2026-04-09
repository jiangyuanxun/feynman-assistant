import Link from "next/link";
import { QuizCard } from "@/components/QuizCard";
import { getDocumentSnapshot, setQuizSet } from "@/lib/mock/store";
import { generateQuizSetFromChapters } from "@/lib/quiz/generator";

type PageProps = {
  searchParams: Promise<{ documentId?: string }>;
};

export default async function QuizPage({ searchParams }: PageProps) {
  const { documentId } = await searchParams;
  if (!documentId) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">章节测验</h1>
        <p className="mt-2 text-zinc-600">请先上传文档并完成章节解析。</p>
        <Link href="/upload" className="mt-4 inline-block rounded-lg border px-4 py-2">
          去上传
        </Link>
      </main>
    );
  }

  const snapshot = getDocumentSnapshot(documentId);
  if (!snapshot) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">章节测验</h1>
        <p className="mt-2 text-zinc-600">文档不存在，请重新上传。</p>
      </main>
    );
  }

  const quizSet =
    snapshot.quizSet ||
    setQuizSet(generateQuizSetFromChapters(documentId, snapshot.chapters));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← 返回首页
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{snapshot.document.title} · 测验</h1>
        <p className="mt-1 text-sm text-zinc-600">
          包含选择题、判断题、填空题、场景题（含面试导向）
        </p>
      </div>

      <section className="mt-6 space-y-4">
        {quizSet.questions.length === 0 ? (
          <p className="text-sm text-zinc-600">当前暂无题目，请先解析章节内容。</p>
        ) : (
          quizSet.questions.map((question) => (
            <QuizCard key={question.id} question={question} />
          ))
        )}
      </section>
    </main>
  );
}
