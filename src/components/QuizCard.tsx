import type { QuizQuestion } from "@/lib/types";

const typeLabel: Record<QuizQuestion["type"], string> = {
  single_choice: "选择题",
  true_false: "判断题",
  fill_blank: "填空题",
  scenario: "场景题",
};

export function QuizCard({ question }: { question: QuizQuestion }) {
  return (
    <article className="rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-500">
          {typeLabel[question.type]}
        </span>
        <span className="text-xs text-zinc-500">{question.difficulty}</span>
      </div>

      <h3 className="mt-2 font-medium">{question.stem}</h3>

      {question.options?.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          {question.options.map((option) => (
            <li key={option}>{option}</li>
          ))}
        </ul>
      ) : null}

      <details className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm">
        <summary className="cursor-pointer font-medium">查看答案与解析</summary>
        <p className="mt-2 text-zinc-700">
          答案：
          {Array.isArray(question.answer)
            ? question.answer.join("；")
            : question.answer}
        </p>
        <p className="mt-1 text-zinc-700">解析：{question.analysis}</p>
      </details>
    </article>
  );
}
