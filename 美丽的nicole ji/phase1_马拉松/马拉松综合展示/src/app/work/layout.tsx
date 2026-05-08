'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TITLES = [
  '邮件模板', '时区转换', '运费估算', '截货倒计时', '会议议程',
  '入职引导', '联系人目录', '座位图', '社内FAQ', '会议记录',
  '货物追踪', '满意度评价', '紧急联系人', '故障诊断', '案件报告',
  '航空测验', '海关申报', '危险品练习', '业务用语', '新闻阅读',
];

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const match = path.match(/\/work\/(\d+)/);
  const id = match ? parseInt(match[1], 10) : 0;
  const prev = id > 1 ? String(id - 1).padStart(2, '0') : null;
  const next = id < 20 ? String(id + 1).padStart(2, '0') : null;
  const title = TITLES[id - 1] ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#020810',
        borderBottom: '1px solid #0d1829',
        padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        height: 48, flexShrink: 0,
      }}>
        <Link href="/" style={{
          fontSize: 12, color: '#475569', textDecoration: 'none',
          padding: '4px 10px', borderRadius: 6,
          border: '1px solid #0d1829',
          whiteSpace: 'nowrap',
        }}>
          ← 首页
        </Link>

        <div style={{ fontSize: 12, color: '#1e3a5f' }}>|</div>

        {prev ? (
          <Link href={`/work/${prev}`} style={{
            fontSize: 12, color: '#475569', textDecoration: 'none',
            padding: '4px 10px', borderRadius: 6,
            border: '1px solid #0d1829',
            whiteSpace: 'nowrap',
          }}>
            ← {TITLES[parseInt(prev) - 1]}
          </Link>
        ) : (
          <span style={{ fontSize: 12, color: '#1e3a5f' }}>（第一个）</span>
        )}

        <div style={{
          flex: 1, textAlign: 'center',
          fontSize: 13, fontWeight: 700, color: '#38bdf8',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          作品{String(id).padStart(2, '0')} · {title}
        </div>

        {next ? (
          <Link href={`/work/${next}`} style={{
            fontSize: 12, color: '#475569', textDecoration: 'none',
            padding: '4px 10px', borderRadius: 6,
            border: '1px solid #0d1829',
            whiteSpace: 'nowrap',
          }}>
            {TITLES[parseInt(next) - 1]} →
          </Link>
        ) : (
          <span style={{ fontSize: 12, color: '#1e3a5f' }}>（最后一个）</span>
        )}
      </div>

      {/* Work content */}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
