'use client';
import { useState, useMemo } from 'react';

type Dept = 'OS' | 'GC' | '総務' | '人事' | '品宣' | '財務' | 'DX室' | 'mgr' | 'empty';

interface Seat {
  id: number; name: string; dept: Dept; role: string;
  email: string; ext: string; zone: 'biz' | 'admin'; row: number; col: number;
}

const COLOR: Record<Dept, string> = {
  OS: '#0ea5e9', GC: '#06b6d4', '総務': '#a78bfa', '人事': '#c084fc',
  '品宣': '#e879f9', '財務': '#f472b6', 'DX室': '#fb923c', mgr: '#f59e0b', empty: '#1e2537',
};

const SEATS: Seat[] = [
  {id:1,  name:'山田 太郎',  dept:'OS',   role:'OS担当',    email:'yamada.taro@optec-exp.com',        ext:'211', zone:'biz',   row:0, col:0},
  {id:2,  name:'田中 花子',  dept:'OS',   role:'OS担当',    email:'tanaka.hanako@optec-exp.com',      ext:'212', zone:'biz',   row:0, col:1},
  {id:3,  name:'鈴木 一郎',  dept:'OS',   role:'OS担当',    email:'suzuki.ichiro@optec-exp.com',      ext:'213', zone:'biz',   row:0, col:2},
  {id:4,  name:'佐藤 美咲',  dept:'OS',   role:'OS担当',    email:'sato.misaki@optec-exp.com',        ext:'214', zone:'biz',   row:0, col:3},
  {id:5,  name:'高橋 健',    dept:'OS',   role:'OS担当',    email:'takahashi.ken@optec-exp.com',      ext:'215', zone:'biz',   row:0, col:4},
  {id:6,  name:'伊藤 直樹',  dept:'OS',   role:'OS担当',    email:'ito.naoki@optec-exp.com',          ext:'216', zone:'biz',   row:1, col:0},
  {id:7,  name:'渡辺さくら', dept:'OS',   role:'OS担当',    email:'watanabe.sakura@optec-exp.com',    ext:'217', zone:'biz',   row:1, col:1},
  {id:8,  name:'中村 拓海',  dept:'OS',   role:'OS担当',    email:'nakamura.takumi@optec-exp.com',    ext:'218', zone:'biz',   row:1, col:2},
  {id:9,  name:'小林 陽子',  dept:'OS',   role:'OS担当',    email:'kobayashi.yoko@optec-exp.com',     ext:'219', zone:'biz',   row:1, col:3},
  {id:10, name:'加藤 隆',    dept:'OS',   role:'OS担当',    email:'kato.takashi@optec-exp.com',       ext:'220', zone:'biz',   row:1, col:4},
  {id:11, name:'吉田 真理',  dept:'OS',   role:'OS担当',    email:'yoshida.mari@optec-exp.com',       ext:'221', zone:'biz',   row:2, col:0},
  {id:12, name:'山本 誠',    dept:'OS',   role:'OS担当',    email:'yamamoto.makoto@optec-exp.com',    ext:'222', zone:'biz',   row:2, col:1},
  {id:13, name:'松本 由美',  dept:'OS',   role:'OS担当',    email:'matsumoto.yumi@optec-exp.com',     ext:'223', zone:'biz',   row:2, col:2},
  {id:14, name:'井上 大輝',  dept:'OS',   role:'OS担当',    email:'inoue.daiki@optec-exp.com',        ext:'224', zone:'biz',   row:2, col:3},
  {id:15, name:'木村 京子',  dept:'OS',   role:'OS担当',    email:'kimura.kyoko@optec-exp.com',       ext:'225', zone:'biz',   row:2, col:4},
  {id:16, name:'林 太一',    dept:'OS',   role:'OS担当',    email:'hayashi.taichi@optec-exp.com',     ext:'226', zone:'biz',   row:3, col:0},
  {id:17, name:'清水 奈々',  dept:'OS',   role:'OS担当',    email:'shimizu.nana@optec-exp.com',       ext:'227', zone:'biz',   row:3, col:1},
  {id:18, name:'山崎 俊介',  dept:'OS',   role:'OS担当',    email:'yamazaki.shunsuke@optec-exp.com',  ext:'228', zone:'biz',   row:3, col:2},
  {id:19, name:'池田 恵',    dept:'OS',   role:'OS担当',    email:'ikeda.megumi@optec-exp.com',       ext:'229', zone:'biz',   row:3, col:3},
  {id:20, name:'橋本 翔',    dept:'OS',   role:'OS担当',    email:'hashimoto.sho@optec-exp.com',      ext:'230', zone:'biz',   row:3, col:4},
  {id:21, name:'中島 麻衣',  dept:'GC',   role:'GC担当',    email:'nakajima.mai@optec-exp.com',       ext:'231', zone:'biz',   row:4, col:0},
  {id:22, name:'石川 竜也',  dept:'GC',   role:'GC担当',    email:'ishikawa.tatsuya@optec-exp.com',   ext:'232', zone:'biz',   row:4, col:1},
  {id:23, name:'前田 美穂',  dept:'GC',   role:'GC担当',    email:'maeda.miho@optec-exp.com',         ext:'233', zone:'biz',   row:4, col:2},
  {id:24, name:'藤田 悠斗',  dept:'GC',   role:'GC担当',    email:'fujita.yuto@optec-exp.com',        ext:'234', zone:'biz',   row:4, col:3},
  {id:25, name:'小川 恵子',  dept:'GC',   role:'GC担当',    email:'ogawa.keiko@optec-exp.com',        ext:'235', zone:'biz',   row:4, col:4},
  {id:26, name:'岡田 和也',  dept:'GC',   role:'GC担当',    email:'okada.kazuya@optec-exp.com',       ext:'236', zone:'biz',   row:5, col:0},
  {id:27, name:'後藤 綾子',  dept:'GC',   role:'GC担当',    email:'goto.ayako@optec-exp.com',         ext:'237', zone:'biz',   row:5, col:1},
  {id:28, name:'長谷川 涼',  dept:'GC',   role:'GC担当',    email:'hasegawa.ryo@optec-exp.com',       ext:'238', zone:'biz',   row:5, col:2},
  {id:29, name:'村上 千尋',  dept:'GC',   role:'GC担当',    email:'murakami.chihiro@optec-exp.com',   ext:'239', zone:'biz',   row:5, col:3},
  {id:30, name:'近藤 大輝',  dept:'GC',   role:'GC担当',    email:'kondo.daiki@optec-exp.com',        ext:'240', zone:'biz',   row:5, col:4},
  {id:31, name:'斎藤 理恵',  dept:'GC',   role:'GC担当',    email:'saito.rie@optec-exp.com',          ext:'241', zone:'biz',   row:6, col:0},
  {id:32, name:'坂本 明',    dept:'GC',   role:'GC担当',    email:'sakamoto.akira@optec-exp.com',     ext:'242', zone:'biz',   row:6, col:1},
  {id:33, name:'遠藤 愛',    dept:'GC',   role:'GC担当',    email:'endo.ai@optec-exp.com',            ext:'243', zone:'biz',   row:6, col:2},
  {id:34, name:'西村 健太',  dept:'GC',   role:'GC担当',    email:'nishimura.kenta@optec-exp.com',    ext:'244', zone:'biz',   row:6, col:3},
  {id:35, name:'LUNA',       dept:'mgr',  role:'業務部長',   email:'luna@optec-exp.com',               ext:'100', zone:'biz',   row:6, col:4},
  {id:36, name:'JENNY',      dept:'mgr',  role:'非業務部長', email:'jenny@optec-exp.com',              ext:'200', zone:'admin', row:0, col:0},
  {id:37, name:'田村 恵子',  dept:'総務', role:'総務担当',   email:'tamura.keiko@optec-exp.com',       ext:'301', zone:'admin', row:0, col:1},
  {id:38, name:'中田 博',    dept:'総務', role:'総務担当',   email:'nakata.hiroshi@optec-exp.com',     ext:'302', zone:'admin', row:0, col:2},
  {id:39, name:'岸本 由香',  dept:'人事', role:'人事担当',   email:'kishimoto.yuka@optec-exp.com',     ext:'303', zone:'admin', row:1, col:0},
  {id:40, name:'宮田 洋',    dept:'人事', role:'人事担当',   email:'miyata.hiroshi@optec-exp.com',     ext:'304', zone:'admin', row:1, col:1},
  {id:41, name:'吉岡 彩',    dept:'品宣', role:'品宣担当',   email:'yoshioka.aya@optec-exp.com',       ext:'305', zone:'admin', row:1, col:2},
  {id:42, name:'南 健二',    dept:'品宣', role:'品宣担当',   email:'minami.kenji@optec-exp.com',       ext:'306', zone:'admin', row:2, col:0},
  {id:43, name:'三上 誠',    dept:'財務', role:'財務担当',   email:'mikami.makoto@optec-exp.com',      ext:'307', zone:'admin', row:2, col:1},
  {id:44, name:'谷口 麻里',  dept:'財務', role:'財務担当',   email:'taniguchi.mari@optec-exp.com',     ext:'308', zone:'admin', row:2, col:2},
  {id:45, name:'森川 優',    dept:'DX室', role:'DX室担当',   email:'morikawa.yu@optec-exp.com',        ext:'309', zone:'admin', row:3, col:0},
  {id:46, name:'栗山 智也',  dept:'DX室', role:'DX室担当',   email:'kuriyama.tomoya@optec-exp.com',    ext:'310', zone:'admin', row:3, col:1},
  {id:47, name:'上田 明美',  dept:'DX室', role:'DX室担当',   email:'ueda.akemi@optec-exp.com',         ext:'311', zone:'admin', row:3, col:2},
  {id:48, name:'空席',       dept:'empty', role:'',          email:'',                                 ext:'',    zone:'admin', row:4, col:0},
  {id:49, name:'空席',       dept:'empty', role:'',          email:'',                                 ext:'',    zone:'admin', row:4, col:1},
  {id:50, name:'空席',       dept:'empty', role:'',          email:'',                                 ext:'',    zone:'admin', row:4, col:2},
];

const BIZ_MAP = new Map(SEATS.filter(s => s.zone === 'biz').map(s => [`${s.row}-${s.col}`, s]));
const ADMIN_MAP = new Map(SEATS.filter(s => s.zone === 'admin').map(s => [`${s.row}-${s.col}`, s]));

const LEGEND: { dept: Dept; label: string }[] = [
  { dept: 'mgr', label: '部門長' }, { dept: 'OS', label: 'OS部門' }, { dept: 'GC', label: 'GC部門' },
  { dept: '総務', label: '総務' }, { dept: '人事', label: '人事' },
  { dept: '品宣', label: '品宣' }, { dept: '財務', label: '財務' }, { dept: 'DX室', label: 'DX室' },
];

export default function Page() {
  const [selected, setSelected] = useState<Seat | null>(null);
  const [query, setQuery] = useState('');

  const matched = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return new Set<number>();
    return new Set(
      SEATS.filter(s =>
        s.name.toLowerCase().includes(q) || s.dept.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.ext.includes(q)
      ).map(s => s.id)
    );
  }, [query]);

  const renderSeat = (seat: Seat | undefined) => {
    if (!seat) return null;
    const c = COLOR[seat.dept];
    const isSel = selected?.id === seat.id;
    const isHit = matched.size > 0 && matched.has(seat.id);
    const isEmpty = seat.dept === 'empty';
    return (
      <div
        key={seat.id}
        onClick={() => !isEmpty && setSelected(isSel ? null : seat)}
        title={isEmpty ? '' : `${seat.name}　${seat.role}　内線 #${seat.ext}`}
        style={{
          width: 74, height: 70, borderRadius: 7, padding: '0 4px 5px',
          cursor: isEmpty ? 'default' : 'pointer',
          border: `1.5px solid ${isSel ? c : isHit ? '#f59e0b' : isEmpty ? '#0d1829' : c + '50'}`,
          background: isSel ? c + '2a' : isHit ? '#f59e0b18' : isEmpty ? '#06101e' : '#0a1628',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
          gap: 2, transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
          boxShadow: isSel ? `0 0 16px ${c}55` : isHit ? '0 0 10px #f59e0b44' : 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: isEmpty ? '#0d1829' : isSel ? c : isHit ? '#f59e0b' : c + '88',
          borderRadius: '7px 7px 0 0',
        }} />
        <div style={{
          fontSize: 11, textAlign: 'center', lineHeight: 1.3,
          color: isEmpty ? '#1e3a5f' : isSel ? '#fff' : '#cbd5e1',
          fontWeight: seat.dept === 'mgr' ? 700 : 400,
        }}>
          {seat.name}
        </div>
        {seat.ext && (
          <div style={{ fontSize: 9.5, color: isHit ? '#f59e0b' : c, opacity: isEmpty ? 0 : 0.9 }}>
            #{seat.ext}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid #0d1829', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>OPTEC 座位表</div>
          <div style={{ fontSize: 12, color: '#334155', marginTop: 3 }}>社内座位 · 人名検索 · 50席</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索姓名 / 部门 / 分机..."
            style={{
              width: 240, padding: '8px 14px', borderRadius: 8,
              border: '1px solid #1e3a5f', background: '#07111d', color: '#e2e8f0',
              fontSize: 13, outline: 'none',
            }}
          />
          {matched.size > 0 && <span style={{ fontSize: 12, color: '#f59e0b', whiteSpace: 'nowrap' }}>找到 {matched.size} 人</span>}
          {query.trim() && matched.size === 0 && <span style={{ fontSize: 12, color: '#ef4444' }}>未找到</span>}
        </div>
      </div>

      {/* Floor plan */}
      <div style={{ padding: '28px 32px', display: 'flex', gap: 40, alignItems: 'flex-start', overflowX: 'auto' }}>
        {/* 業務部 */}
        <div>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 16, background: '#0ea5e9', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>業務部</span>
          </div>

          <div style={{ fontSize: 11, color: '#0ea5e9', marginBottom: 7, paddingLeft: 2, letterSpacing: 0.5 }}>OS部門</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[0, 1, 2, 3].map(r => (
              <div key={r} style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3, 4].map(c => renderSeat(BIZ_MAP.get(`${r}-${c}`)))}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: '#06b6d4', margin: '16px 0 7px', paddingLeft: 2, letterSpacing: 0.5 }}>GC部門</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[4, 5, 6].map(r => (
              <div key={r} style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3, 4].map(c => renderSeat(BIZ_MAP.get(`${r}-${c}`)))}
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: '#0d1829', alignSelf: 'stretch', minHeight: 300, flexShrink: 0 }} />

        {/* 非業務部 */}
        <div>
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 16, background: '#a78bfa', borderRadius: 2 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>非業務部</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[0, 1, 2, 3, 4].map(r => (
              <div key={r} style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(c => renderSeat(ADMIN_MAP.get(`${r}-${c}`)))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{
          margin: '0 32px 24px', padding: '18px 24px', background: '#07111d', borderRadius: 10,
          border: `1px solid ${COLOR[selected.dept]}30`,
          display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: COLOR[selected.dept] + '20', border: `2px solid ${COLOR[selected.dept]}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: COLOR[selected.dept],
          }}>
            {selected.name.replace(/\s/g, '').slice(0, 1)}
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{selected.role}</div>
          </div>
          <div style={{ display: 'flex', gap: 28, flex: 1, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: '#334155', marginBottom: 3 }}>部門</div>
              <div style={{ fontSize: 13, color: COLOR[selected.dept] }}>{selected.dept}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#334155', marginBottom: 3 }}>内線</div>
              <div style={{ fontSize: 13 }}>#{selected.ext}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#334155', marginBottom: 3 }}>メール</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{selected.email}</div>
            </div>
          </div>
          <button
            onClick={() => setSelected(null)}
            style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}
          >×</button>
        </div>
      )}

      {/* Legend */}
      <div style={{ padding: '0 32px 32px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#1e3a5f' }}>图例：</span>
        {LEGEND.map(({ dept, label }) => (
          <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: COLOR[dept] }} />
            <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#1e3a5f' }}>点击座位查看联系方式</div>
      </div>
    </div>
  );
}
