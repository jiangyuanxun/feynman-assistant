import type { ChapterEntity } from "@/lib/types";
import { ExplainBlock } from "@/components/ExplainBlock";

export function ChapterCard({ chapter }: { chapter: ChapterEntity }) {
  return (
    <article className="rounded-2xl border p-5">
      <h2 className="text-lg font-semibold">{chapter.title}</h2>
      <p className="mt-2 text-sm text-zinc-600">{chapter.content}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Section title="核心概念" items={chapter.coreConcepts} />
        <Section
          title="关键命令"
          items={chapter.keyCommands.map((cmd) => `${cmd.command}：${cmd.desc}`)}
        />
        <Section title="操作步骤" items={chapter.steps} />
        <Section title="常见错误" items={chapter.commonMistakes} />
      </div>

      <ExplainBlock text={chapter.feynmanExplanation} />
    </article>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
