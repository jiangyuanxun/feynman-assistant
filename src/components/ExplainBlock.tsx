export function ExplainBlock({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-xl bg-zinc-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        费曼解释
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-700">{text}</p>
    </div>
  );
}
