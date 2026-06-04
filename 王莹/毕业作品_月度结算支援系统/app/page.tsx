import Link from "next/link";
import { MODULES, MODULE_GROUPS } from "@/lib/modules";

export default function Home() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>经营驾驶舱</h1>
      <p style={{ color: "var(--muted)" }}>
        国际货代月度结算支援系统 · Kintone（只读）× Supabase × AI。点击进入各模块。
      </p>
      {MODULE_GROUPS.map((g) => (
        <section key={g} style={{ marginTop: 24 }}>
          <h3 style={{ color: "var(--muted)", fontWeight: 500 }}>{g}</h3>
          <div className="cards">
            {MODULES.filter((m) => m.group === g).map((m) => (
              <Link key={m.slug} href={`/${m.slug}`} className="card">
                <div className="no">{m.no}</div>
                <div className="title">{m.title}</div>
                <div className="desc">{m.desc}</div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
