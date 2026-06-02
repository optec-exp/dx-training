// 直接调 Gemini REST API（不引 SDK，省一个依赖）。
// 用 responseMimeType + responseSchema 强制结构化 JSON 输出。

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export async function callGeminiStructured<T>(opts: {
  apiKey: string;
  model: string;           // 例：gemini-2.5-flash
  prompt: string;
  responseSchema: object;  // OpenAPI 3.0 子集
}): Promise<{ parsed: T; raw: string; model: string }> {
  const url = `${GEMINI_API_BASE}/${opts.model}:generateContent?key=${opts.apiKey}`;
  const body = {
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: opts.responseSchema,
    },
  };
  // 5xx 上指数退避重试（Gemini 偶尔 503 UNAVAILABLE 高负载，重试通常即可解决）
  let res: Response | null = null;
  let lastErr = "";
  const delays = [0, 2000, 5000]; // 3 次尝试，间隔 0/2/5 秒
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]));
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) break;
    lastErr = await res.text();
    if (res.status < 500) break; // 4xx 不重试（key/quota/请求格式问题）
    console.warn(`[gemini] ${res.status} 第 ${i + 1} 次失败，准备重试。${lastErr.slice(0, 200)}`);
  }
  if (!res || !res.ok) {
    throw new Error(`Gemini API ${res?.status ?? "?"} (尝试 ${delays.length} 次后失败): ${lastErr.slice(0, 800)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini 返回为空: " + JSON.stringify(data).slice(0, 500));
  }
  try {
    return { parsed: JSON.parse(text) as T, raw: text, model: opts.model };
  } catch {
    throw new Error("Gemini 返回不是合法 JSON: " + text.slice(0, 500));
  }
}
