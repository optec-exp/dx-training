import { existsSync } from "fs";
import path from "path";

const CANDIDATE_FONTS = [
  "C:/Windows/Fonts/simhei.ttf",
  "C:/Windows/Fonts/Deng.ttf",
  "C:/Windows/Fonts/STKAITI.TTF",
  "C:/Windows/Fonts/simsunb.ttf",
  "/System/Library/Fonts/PingFang.ttc",
  "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
];

export function findChineseFontPath(): string {
  const projectFont = path.resolve(process.cwd(), "public/fonts/chinese.ttf");
  if (existsSync(projectFont)) return projectFont;

  for (const p of CANDIDATE_FONTS) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    "找不到中文字体。请在 public/fonts/chinese.ttf 放一个 TTF 字体文件，或安装系统中文字体。"
  );
}
