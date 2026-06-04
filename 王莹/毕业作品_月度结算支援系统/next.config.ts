import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 中文路径下 ESLint/构建偶发问题，按既有作品惯例关闭构建期 ESLint 阻断。
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
