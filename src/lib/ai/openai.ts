import { spawn } from "node:child_process";

type ApiStyle = "responses" | "chat_completions";

type LLMResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

export function isOpenAIEnabled(): boolean {
  return Boolean(normalizeApiKey(process.env.OPENAI_API_KEY));
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4.1-mini";
}

export function getOpenAIBaseUrl(): string {
  return process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
}

export function getApiStyle(): ApiStyle {
  const envStyle = (process.env.OPENAI_API_STYLE || "").toLowerCase().trim();
  if (envStyle === "chat_completions") {
    return "chat_completions";
  }
  if (envStyle === "responses") {
    return "responses";
  }

  const base = getOpenAIBaseUrl().toLowerCase();
  if (base.includes("open.bigmodel.cn")) {
    return "chat_completions";
  }
  return "responses";
}

export async function callOpenAIJson<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const apiKey = normalizeApiKey(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 未配置。");
  }

  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 45000);
  const style = getApiStyle();
  const base = getOpenAIBaseUrl().replace(/\/+$/, "");
  const endpoint =
    style === "chat_completions"
      ? `${base}/chat/completions`
      : `${base}/responses`;

  const requestBody =
    style === "chat_completions"
      ? {
          model: getOpenAIModel(),
          temperature: 0.2,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }
      : {
          model: getOpenAIModel(),
          temperature: 0.2,
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: systemPrompt }],
            },
            {
              role: "user",
              content: [{ type: "input_text", text: userPrompt }],
            },
          ],
        };

  const payload = await postJsonViaCurl(endpoint, apiKey, requestBody, timeoutMs);

  const rawText = extractOutputText(payload);
  if (!rawText) {
    throw new Error("模型返回为空，未获取到可解析内容。");
  }

  const jsonText = pickJson(rawText);
  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error("模型返回内容不是合法 JSON。");
  }
}

function extractOutputText(payload: LLMResponse): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const responsesText =
    payload.output
      ?.flatMap((item) => item.content || [])
      .filter((item) => item.type === "output_text" && typeof item.text === "string")
      .map((item) => item.text!.trim())
      .filter(Boolean) || [];

  if (responsesText.length > 0) {
    return responsesText.join("\n").trim();
  }

  const choiceContent = payload.choices?.[0]?.message?.content;
  if (typeof choiceContent === "string" && choiceContent.trim()) {
    return choiceContent.trim();
  }

  if (Array.isArray(choiceContent)) {
    const items = choiceContent
      .map((item) => (typeof item?.text === "string" ? item.text.trim() : ""))
      .filter(Boolean);
    return items.join("\n").trim();
  }

  return "";
}

function pickJson(input: string): string {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return input.slice(start, end + 1);
  }
  return input;
}

function normalizeApiKey(rawKey: string | undefined): string {
  if (!rawKey) {
    return "";
  }
  return rawKey.trim().replace(/[，,\s]+$/g, "");
}

async function postJsonViaCurl(
  url: string,
  apiKey: string,
  body: object,
  timeoutMs: number,
): Promise<LLMResponse> {
  return new Promise((resolve, reject) => {
    const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";
    const maxTimeSec = Math.max(1, Math.ceil(timeoutMs / 1000));
    const args = [
      "-sS",
      "-X",
      "POST",
      url,
      "-H",
      `Authorization: Bearer ${apiKey}`,
      "-H",
      "Content-Type: application/json",
      "--max-time",
      String(maxTimeSec),
      "-w",
      "\n__HTTP_STATUS__:%{http_code}",
      "--data-binary",
      "@-",
    ];

    if (proxy) {
      args.splice(6, 0, "-x", proxy);
    }

    const child = spawn("curl.exe", args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(new Error(`网络请求失败：${error.message}`));
    });
    child.on("close", (code) => {
      if (code !== 0 && !stdout) {
        reject(new Error(stderr.trim() || `curl 退出码 ${code}`));
        return;
      }

      const marker = "__HTTP_STATUS__:";
      const idx = stdout.lastIndexOf(marker);
      const rawBody = idx >= 0 ? stdout.slice(0, idx).trim() : stdout.trim();
      const statusText = idx >= 0 ? stdout.slice(idx + marker.length).trim() : "";
      const status = Number(statusText || "0");

      let parsed: LLMResponse;
      try {
        parsed = rawBody ? (JSON.parse(rawBody) as LLMResponse) : {};
      } catch {
        reject(new Error("返回内容不是合法 JSON。"));
        return;
      }

      if (!status || status >= 400) {
        reject(
          new Error(
            parsed.error?.message || stderr.trim() || `请求失败（${status || "unknown"}）`,
          ),
        );
        return;
      }

      resolve(parsed);
    });

    child.stdin.write(JSON.stringify(body));
    child.stdin.end();
  });
}
