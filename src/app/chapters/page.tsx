import Link from "next/link";
import { ChapterCard } from "@/components/ChapterCard";
import { getDocumentSnapshot } from "@/lib/mock/store";

type PageProps = {
  searchParams: Promise<{ documentId?: string }>;
};

export default async function ChaptersPage({ searchParams }: PageProps) {
  const { documentId } = await searchParams;
  if (!documentId) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">章节结果</h1>
        <p className="mt-2 text-zinc-600">
          还没有可展示的文档，请先完成上传解析。
        </p>
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
        <h1 className="text-2xl font-semibold">章节结果</h1>
        <p className="mt-2 text-zinc-600">未找到对应文档，请重新上传。</p>
        <Link href="/upload" className="mt-4 inline-block rounded-lg border px-4 py-2">
          重新上传
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            ← 返回首页
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{snapshot.document.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            已拆分 {snapshot.chapters.length} 个章节
          </p>
        </div>
        <Link
          href={`/quiz?documentId=${snapshot.document.id}`}
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          去做测验
        </Link>
      </div>

      <section className="mt-6 space-y-4">
        {snapshot.chapters.map((chapter) => (
          <ChapterCard key={chapter.id} chapter={chapter} />
        ))}
      </section>
    </main>
  );
}
