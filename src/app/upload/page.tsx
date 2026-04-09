import Link from "next/link";
import { UploadPanel } from "@/components/UploadPanel";

export default function UploadPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← 返回首页
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">上传与解析</h1>
        <p className="mt-1 text-zinc-600">
          MVP 阶段先使用 mock 解析流程，后续可替换成真实 PDF 解析器。
        </p>
      </div>
      <UploadPanel />
    </main>
  );
}
