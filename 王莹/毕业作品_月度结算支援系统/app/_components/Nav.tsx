import Link from "next/link";
import { MODULES, MODULE_GROUPS } from "@/lib/modules";

export default function Nav() {
  return (
    <nav className="sidebar">
      <Link href="/"><h1>月度结算支援系统</h1></Link>
      {MODULE_GROUPS.map((g) => (
        <div key={g}>
          <div className="group-label">{g}</div>
          {MODULES.filter((m) => m.group === g).map((m) => (
            <Link key={m.slug} href={`/${m.slug}`}>
              <span>{m.title}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
