"use client";

import { useMemo, useState } from "react";
import { ChapterCard } from "@/components/ChapterCard";
import { QuizCard } from "@/components/QuizCard";
import { UploadInput, UploadPanel } from "@/components/UploadPanel";
import type { ChapterEntity, QuizSet } from "@/lib/types";

type HomeStatus = "idle" | "parsing" | "ready" | "error";

type ParseResponse = {
  document: {
    id: string;
    title: string;
  };
};

type ChaptersResponse = {
  chapters: ChapterEntity[];
};

type QuizResponse = {
  quizSet: QuizSet;
};

const flowSteps = ["输入", "解析中", "知识点", "测验"] as const;

export default function Home() {
  const [status, setStatus] = useState<HomeStatus>("idle");
  const [documentId, setDocumentId] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [chapters, setChapters] = useState<ChapterEntity[]>([]);
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [chapterOpen, setChapterOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  const statusText = useMemo(() => {
    if (status === "idle") return "待开始";
    if (status === "parsing") return "正在解析中...";
    if (status === "ready") return "已就绪";
    return "失败";
  }, [status]);

  const currentStepIndex = useMemo(() => {
    if (status === "idle") return 0;
    if (status === "parsing") return 1;
    if (status === "ready") return 3;
    return 1;
  }, [status]);

  async function runPipeline(input: UploadInput) {
    setStatus("parsing");
    setErrorMessage("");

    try {
      const parsePayload = input.file
        ? await requestForm<ParseResponse>("/api/parse-pdf", {
            file: input.file,
            fileName: input.fileName,
            transcript: input.transcript,
          })
        : await requestJson<ParseResponse>("/api/parse-pdf", {
            fileName: input.fileName,
            transcript: input.transcript,
          });

      const nextDocumentId = parsePayload.document.id;
      setDocumentId(nextDocumentId);
      setDocumentTitle(parsePayload.document.title);

      await requestJson<ChaptersResponse>("/api/split-chapters", {
        documentId: nextDocumentId,
      });

      const extracted = await requestJson<ChaptersResponse>("/api/extract-points", {
        documentId: nextDocumentId,
      });
      setChapters(extracted.chapters);

      const quizPayload = await requestJson<QuizResponse>("/api/generate-quiz", {
        documentId: nextDocumentId,
      });
      setQuizSet(quizPayload.quizSet);

      setChapterOpen(true);
      setQuizOpen(false);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setChapters([]);
      setQuizSet(null);
      setErrorMessage(
        error instanceof Error ? error.message : "系统异常，请稍后重试。",
      );
    }
  }

  const failedApi = useMemo(() => {
    const match = errorMessage.match(/\/api\/[a-z-]+/);
    return match ? match[0] : "未知接口";
  }, [errorMessage]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6">
        <section className="rounded-2xl bg-slate-50/95 p-8 shadow-md ring-1 ring-slate-200/70 backdrop-blur">
          <p className="text-sm font-medium text-slate-500">Feynman Learning Assistant</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">费曼学习助手</h1>
          <p className="mt-3 max-w-3xl text-slate-700">
            把学过的内容讲清楚，并立即检验你是否真正理解。
          </p>
          <p className="mt-2 text-sm text-slate-500">
            输入一段内容，3 秒内得到知识点 + 测试题。
          </p>
        </section>

        <section className="rounded-2xl bg-slate-50/95 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">当前步骤</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(status)}`}>
              {statusText}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {flowSteps.map((step, index) => {
              const isReady = status === "ready";
              const isCurrent = !isReady && index === currentStepIndex;
              const isDone = isReady || index < currentStepIndex;
              const isParsingStep = status === "parsing" && step === "解析中";
              const stepLabel = isReady
                ? `✓ ${step}`
                : isParsingStep
                  ? "解析中..."
                  : step;
              return (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 ${
                      isCurrent
                        ? "border-slate-900 bg-slate-900 text-white"
                        : isDone
                          ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-500"
                    }`}
                  >
                    {stepLabel}
                  </span>
                  {index < flowSteps.length - 1 ? (
                    <span className="text-slate-400">→</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {documentId ? (
            <p className="mt-4 text-sm text-slate-600">
              文档：{documentTitle || "未命名"} · ID：{documentId}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl bg-slate-50/95 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">步骤 1：输入学习内容</h2>
          <UploadPanel onStart={runPipeline} disabled={status === "parsing"} />
        </section>

        {status === "error" ? (
          <section className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-red-800">处理失败</h2>
            <p className="mt-2 text-sm text-red-700">失败接口：{failedApi}</p>
            <p className="mt-1 text-sm text-red-700">
              错误详情：{errorMessage || "未知错误"}
            </p>
            <p className="mt-2 text-sm text-red-700">
              重试方式：检查输入后再次点击“开始解析与出题”。
            </p>
          </section>
        ) : null}

        <section className="rounded-2xl bg-slate-50/95 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
          <details
            open={chapterOpen}
            onToggle={(event) =>
              setChapterOpen((event.currentTarget as HTMLDetailsElement).open)
            }
          >
            <summary className="cursor-pointer text-xl font-semibold text-slate-900">
              步骤 2：章节知识点
              {chapters.length > 0 ? `（${chapters.length} 章）` : "（待生成）"}
            </summary>
            <div className="mt-5 space-y-4">
              {chapters.length === 0 ? (
                <p className="text-sm text-slate-600">解析完成后会在这里展示章节知识点。</p>
              ) : (
                chapters.map((chapter) => (
                  <ChapterCard key={chapter.id} chapter={chapter} />
                ))
              )}
            </div>
          </details>
        </section>

        <section className="rounded-2xl bg-slate-50/95 p-6 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
          <details
            open={quizOpen}
            onToggle={(event) =>
              setQuizOpen((event.currentTarget as HTMLDetailsElement).open)
            }
          >
            <summary className="cursor-pointer text-xl font-semibold text-slate-900">
              步骤 3：测试题
              {quizSet?.questions?.length
                ? `（${quizSet.questions.length} 题）`
                : "（待生成）"}
            </summary>
            <div className="mt-5 space-y-4">
              {!quizSet || quizSet.questions.length === 0 ? (
                <p className="text-sm text-slate-600">出题完成后会在这里展示测验与解析。</p>
              ) : (
                quizSet.questions.map((question) => (
                  <QuizCard key={question.id} question={question} />
                ))
              )}
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}

function statusBadgeClass(status: HomeStatus): string {
  if (status === "ready") return "bg-emerald-100 text-emerald-700";
  if (status === "parsing") return "bg-amber-100 text-amber-700";
  if (status === "error") return "bg-red-100 text-red-700";
  return "bg-zinc-100 text-zinc-700";
}

async function requestJson<T>(url: string, payload: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `接口调用失败：${url}（HTTP ${response.status}）${
        text ? `，详情：${text}` : ""
      }`,
    );
  }

  return (await response.json()) as T;
}

async function requestForm<T>(
  url: string,
  payload: { file: File; fileName: string; transcript: string },
): Promise<T> {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("fileName", payload.fileName);
  formData.append("transcript", payload.transcript);

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `接口调用失败：${url}（HTTP ${response.status}）${
        text ? `，详情：${text}` : ""
      }`,
    );
  }

  return (await response.json()) as T;
}
