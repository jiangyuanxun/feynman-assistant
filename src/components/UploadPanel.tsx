"use client";

import { FormEvent, useState } from "react";

export type UploadInput = {
  fileName: string;
  transcript: string;
  file: File | null;
};

type UploadPanelProps = {
  onStart: (input: UploadInput) => Promise<void>;
  disabled?: boolean;
};

export function UploadPanel({ onStart, disabled = false }: UploadPanelProps) {
  const [fileName, setFileName] = useState("day01_系统服务器部署与运维.pdf");
  const [transcript, setTranscript] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      setFileError("");
      return;
    }

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setSelectedFile(null);
      setFileError("仅支持上传 .pdf 文件。");
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setFileError("");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedFile) {
      console.log("Selected PDF file:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      });
    }

    await onStart({
      fileName: fileName.trim() || "未命名学习材料.pdf",
      transcript,
      file: selectedFile,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-medium text-zinc-700">选择 PDF 文件</label>
        <p className="mt-1 text-xs text-zinc-500">
          支持可提取文本的 PDF。上传失败时可改用下方口述内容继续流程。
        </p>
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={onFileChange}
          disabled={disabled}
          className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:text-white"
        />
        {selectedFile ? (
          <p className="mt-2 text-xs text-zinc-600">已选择：{selectedFile.name}</p>
        ) : null}
        {fileError ? <p className="mt-2 text-xs text-red-600">{fileError}</p> : null}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700">文件名（可编辑）</label>
        <input
          className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
          value={fileName}
          onChange={(event) => setFileName(event.target.value)}
          placeholder="例如：day01_系统服务器部署与运维.pdf"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700">口述学习内容（可选）</label>
        <p className="mt-1 text-xs text-zinc-500">
          未上传 PDF 时，系统将使用口述内容完成最小 mock 解析流程。
        </p>
        <textarea
          className="mt-2 h-44 w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="示例：今天学习了服务器部署流程，包括环境准备、服务启动和日志排障。"
          disabled={disabled}
        />
      </div>

      <button
        type="submit"
        disabled={disabled || Boolean(fileError)}
        className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-zinc-900 disabled:hover:shadow-sm"
      >
        {disabled ? "解析中..." : "开始解析与出题"}
      </button>
    </form>
  );
}
