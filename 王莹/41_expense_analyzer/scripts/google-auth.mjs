// Google OAuth 一次性授权脚本
// 运行：node --env-file=.env.local scripts/google-auth.mjs
// 流程：起本地监听 8765 → 打印授权 URL → 用户浏览器点允许 → 自动捕获 refresh_token → 写入 .env.local

import { google } from "googleapis";
import http from "node:http";
import fs from "node:fs";
import { URL } from "node:url";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 8765;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive.file",
];
const ENV_FILE = ".env.local";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("缺少 GOOGLE_CLIENT_ID 或 GOOGLE_CLIENT_SECRET，请检查 .env.local");
  process.exit(1);
}

const oauth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const authUrl = oauth.generateAuthUrl({
  access_type: "offline",   // 关键：要 refresh_token 而非仅 access_token
  prompt: "consent",        // 强制弹同意页，保证 refresh_token 返回
  scope: SCOPES,
});

console.log("=== Google OAuth 一次性授权 ===");
console.log("");
console.log("用浏览器打开下面这个 URL（用 wangying@optec-exp.com 登录并点允许）：");
console.log("");
console.log(authUrl);
console.log("");
console.log("授权后浏览器会跳转到 http://127.0.0.1:8765/callback，脚本会自动捕获 token。");
console.log("");

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
    if (u.pathname !== "/callback") {
      res.writeHead(404).end("Not found");
      return;
    }
    const code = u.searchParams.get("code");
    const errParam = u.searchParams.get("error");
    if (errParam) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" })
         .end(`<h1>授权失败</h1><p>${errParam}</p>`);
      console.error("授权失败:", errParam);
      server.close();
      process.exit(1);
    }
    if (!code) {
      res.writeHead(400).end("缺少 code 参数");
      return;
    }

    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token) {
      const msg = "Google 没返回 refresh_token（如果此账号之前已授权过本 client，删除已授权应用后重试）";
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" }).end(`<h1>失败</h1><p>${msg}</p>`);
      console.error(msg);
      console.error("tokens:", tokens);
      server.close();
      process.exit(1);
    }

    // 更新 .env.local
    let envContent = "";
    try { envContent = fs.readFileSync(ENV_FILE, "utf8"); } catch {}
    if (envContent.match(/^GOOGLE_REFRESH_TOKEN=/m)) {
      envContent = envContent.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      if (envContent && !envContent.endsWith("\n")) envContent += "\n";
      envContent += `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
    }
    fs.writeFileSync(ENV_FILE, envContent, "utf8");

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html><html><body style="font-family:system-ui;padding:48px;text-align:center;background:#0f172a;color:#e2e8f0;"><h1 style="color:#22c55e;">✓ 授权完成</h1><p>refresh_token 已写入 .env.local，可以关闭本页回到终端。</p></body></html>`);
    console.log("✓ 授权成功，GOOGLE_REFRESH_TOKEN 已写入 .env.local");
    setTimeout(() => { server.close(); process.exit(0); }, 500);
  } catch (e) {
    console.error("回调处理失败:", e);
    const msg = e instanceof Error ? e.message : String(e);
    res.writeHead(500).end(`Error: ${msg}`);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`(监听 http://127.0.0.1:${PORT} 等待回调...)`);
});

// 5 分钟超时
setTimeout(() => {
  console.error("超时未授权（5分钟），退出");
  server.close();
  process.exit(1);
}, 5 * 60 * 1000);
