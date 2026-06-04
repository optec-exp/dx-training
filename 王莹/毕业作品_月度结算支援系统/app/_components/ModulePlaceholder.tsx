import { MODULES } from "@/lib/modules";

// 模块空壳：骨架阶段统一占位，逐个模块再填实现。
export default function ModulePlaceholder({ slug }: { slug: string }) {
  const m = MODULES.find((x) => x.slug === slug);
  return (
    <div className="placeholder">
      <h2>{m ? `${m.no} ${m.title}` : slug}</h2>
      <p>{m?.desc}</p>
      <p><span className="badge todo">骨架占位 · 待实现</span></p>
    </div>
  );
}
