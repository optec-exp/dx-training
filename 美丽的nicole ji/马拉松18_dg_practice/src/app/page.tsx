'use client';
import { useState, useCallback } from 'react';

// ── DG Class Data ─────────────────────────────────────────────────────────────
interface DGClass {
  cls: number;
  emoji: string;
  color: string;
  name: string;
  nameEn: string;
  divisions: string[];
  examples: string[];
  airRestriction: string;
  back: string;
}

const DG_CLASSES: DGClass[] = [
  {
    cls: 1, emoji: '💥', color: '#ef4444', name: '爆炸品', nameEn: 'Explosives',
    divisions: ['1.1 整体爆炸危险', '1.2 抛射危险（无整体爆炸）', '1.3 火灾+轻微爆炸危险', '1.4 无重大危险', '1.5 极不敏感爆炸物', '1.6 极不敏感物品'],
    examples: ['烟花爆竹', '弹药', '雷管', '导火索', '信号弹'],
    airRestriction: '1.1 / 1.2 / 1.3 禁止航空运输；1.4 有条件允许（需特批）',
    back: '爆炸品共6个小类（Division）。大多数爆炸品禁止商业航空运输，仅1.4S等极少数可在严格条件下运输。UN编码通常以UN 0XXX开头。',
  },
  {
    cls: 2, emoji: '🔵', color: '#3b82f6', name: '气体', nameEn: 'Gases',
    divisions: ['2.1 易燃气体（如液化石油气）', '2.2 非易燃无毒气体（如氮气、干冰）', '2.3 毒性气体（如氯气）'],
    examples: ['打火机（内含气体）', '灭火器', '氧气瓶', '干冰（固态CO₂）', '气溶胶'],
    airRestriction: '2.1 易燃气体禁止；2.2 部分允许（如小型气溶胶）；2.3 毒性气体禁止',
    back: '气体类危险品包括：易燃气体（2.1）、非易燃无毒气体（2.2）、毒性气体（2.3）。干冰属于2.2类，航空运输有特殊要求（需通风，标注重量）。',
  },
  {
    cls: 3, emoji: '🔥', color: '#f97316', name: '易燃液体', nameEn: 'Flammable Liquids',
    divisions: ['闪点 < 60°C 的液体'],
    examples: ['酒精/乙醇', '汽油', '油漆/稀释剂', '香水（含酒精）', '指甲油'],
    airRestriction: '客运航班：≤70%酒精类有条件允许；货机：有条件允许（需包装符合规定）',
    back: '易燃液体以闪点60°C为界定标准。常见误判：香水、酒精消毒液、含酒精的清洁产品均属第3类。个人携带少量（≤70%酒精且≤500ml）经批准可随身携带。',
  },
  {
    cls: 4, emoji: '🟠', color: '#f59e0b', name: '易燃固体', nameEn: 'Flammable Solids',
    divisions: ['4.1 易燃固体（如硫磺、镁粉）', '4.2 自燃物质（接触空气自燃）', '4.3 遇水危险物质（接触水产生易燃气体）'],
    examples: ['火柴', '镁粉', '活性炭（部分）', '金属钠', '电石（碳化钙）'],
    airRestriction: '大多数禁止或严格限制航空运输；安全火柴有条件允许',
    back: '第4类分三小类，危险机理各不相同：4.1自身可燃，4.2接触空气燃烧，4.3接触水生成可燃气体。其中4.3遇水危险物质在运输中须做好防潮处理。',
  },
  {
    cls: 5, emoji: '🟡', color: '#eab308', name: '氧化性物质 / 有机过氧化物', nameEn: 'Oxidizing Substances & Organic Peroxides',
    divisions: ['5.1 氧化性物质（助燃）', '5.2 有机过氧化物（易分解）'],
    examples: ['漂白粉（次氯酸钙）', '硝酸铵', '双氧水（高浓度）', '过氧化苯甲酰'],
    airRestriction: '5.1 有条件允许（需隔离存放）；5.2 大多数禁止或严格限制',
    back: '氧化性物质本身不燃，但能促进其他物质燃烧（助燃剂）。有机过氧化物热不稳定，容易分解并释放热量，运输中须控制温度。',
  },
  {
    cls: 6, emoji: '☠️', color: '#8b5cf6', name: '毒性和感染性物质', nameEn: 'Toxic & Infectious Substances',
    divisions: ['6.1 毒性物质（如农药、砷化物）', '6.2 感染性物质（如病毒样本、医疗废物）'],
    examples: ['农药', '氰化物', '临床诊断样本', '医疗废物', '病毒培养物'],
    airRestriction: '6.1 有条件允许（需标注骷髅标志）；6.2 严格限制，需UN2814/UN2900包装',
    back: '6.1毒性物质经皮肤、吸入或摄入可致死。6.2感染性物质可传播疾病，须使用三层包装系统（主容器→辅助容器→外包装），并附有医学证明。',
  },
  {
    cls: 7, emoji: '☢️', color: '#10b981', name: '放射性物质', nameEn: 'Radioactive Material',
    divisions: ['I白（最低放射性）', 'II黄（中等）', 'III黄（较高）', '特殊形式'],
    examples: ['医用同位素', '工业探伤仪', '核医学设备', '放射性废物'],
    airRestriction: '须经航空公司特别批准；客运限制更严格；须远离其他货物和邮件',
    back: '放射性物质以"运输指数（TI）"衡量危险程度，决定标签等级（白I/黄II/黄III）。航空运输须计算飞机上的累计TI值不得超标。须向机长发送NOTOC。',
  },
  {
    cls: 8, emoji: '🧪', color: '#06b6d4', name: '腐蚀性物质', nameEn: 'Corrosives',
    divisions: ['酸性腐蚀品', '碱性腐蚀品', '其他腐蚀品'],
    examples: ['盐酸 / 硫酸', '氢氧化钠（烧碱）', '蓄电池（含酸）', '汞（水银）', '甲醛'],
    airRestriction: '有条件允许；需内包装防渗漏；蓄电池有专项规定',
    back: '腐蚀品能损伤皮肤、金属及其他材料。常见误判：湿电池（铅酸蓄电池）属第8类。甲醛固定液（医院常用）也属腐蚀品。包装须通过漏液测试。',
  },
  {
    cls: 9, emoji: '⚡', color: '#a78bfa', name: '杂项危险品', nameEn: 'Miscellaneous Dangerous Goods',
    divisions: ['锂电池（UN3090/3091/3480/3481）', '磁性物质', '干冰（UN1845）', '环境危害物质', '高温货物'],
    examples: ['锂电池 / 含锂电池设备', '磁铁', '干冰', '聚苯乙烯泡沫球', '内燃发动机'],
    airRestriction: '锂电池限制最严（SOC ≤ 30%，瓦时数限制）；磁性物质需检测磁场强度',
    back: '第9类是"不属于其他类别但仍需特殊处置"的危险品。锂电池是目前空运中最常见、最受关注的第9类物质，规定极其复杂（区分PI965-PI970等），务必仔细核查。',
  },
];

// ── Matching Game ─────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

interface MatchState {
  selectedDesc: number | null;
  selectedCls: number | null;
  matched: number[];
  wrong: number[];
  shaking: number | null;
}

function MatchingMode() {
  const descOrder = useState(() => shuffle(DG_CLASSES.map(d => d.cls)))[0];
  const [ms, setMs] = useState<MatchState>({
    selectedDesc: null, selectedCls: null,
    matched: [], wrong: [], shaking: null,
  });

  const allDone = ms.matched.length === DG_CLASSES.length;

  const handleDesc = (cls: number) => {
    if (ms.matched.includes(cls)) return;
    setMs(p => ({ ...p, selectedDesc: p.selectedDesc === cls ? null : cls, selectedCls: null }));
  };

  const handleCls = useCallback((cls: number) => {
    if (ms.matched.includes(cls)) return;
    if (ms.selectedDesc === null) {
      setMs(p => ({ ...p, selectedCls: p.selectedCls === cls ? null : cls }));
      return;
    }
    if (ms.selectedDesc === cls) {
      // Correct
      setMs(p => ({ ...p, matched: [...p.matched, cls], selectedDesc: null, selectedCls: null }));
    } else {
      // Wrong
      const wrongCls = ms.selectedDesc;
      setMs(p => ({ ...p, wrong: [wrongCls, cls], shaking: wrongCls, selectedDesc: null, selectedCls: null }));
      setTimeout(() => setMs(p => ({ ...p, wrong: [], shaking: null })), 600);
    }
  }, [ms.selectedDesc]);

  const reset = () => setMs({ selectedDesc: null, selectedCls: null, matched: [], wrong: [], shaking: null });

  const descBg = (cls: number) => {
    if (ms.matched.includes(cls)) return '#14532d';
    if (ms.wrong.includes(cls)) return '#7f1d1d';
    if (ms.selectedDesc === cls) return '#1e3a5f';
    return '#0d1b2e';
  };
  const descBorder = (cls: number) => {
    if (ms.matched.includes(cls)) return '#22c55e';
    if (ms.wrong.includes(cls)) return '#ef4444';
    if (ms.selectedDesc === cls) return '#3b82f6';
    return '#1e3a5f';
  };

  const clsBg = (cls: number) => {
    if (ms.matched.includes(cls)) return '#14532d';
    if (ms.wrong.includes(cls)) return '#7f1d1d';
    if (ms.selectedDesc === cls) return '#1e3a5f';
    return '#0d1b2e';
  };
  const clsBorder = (cls: number) => {
    const dg = DG_CLASSES.find(d => d.cls === cls)!;
    if (ms.matched.includes(cls)) return '#22c55e';
    if (ms.wrong.includes(cls)) return '#ef4444';
    if (ms.selectedDesc === cls) return '#3b82f6';
    return dg.color;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>
          先点击左侧描述，再点击右侧对应的类别编号
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
            {ms.matched.length} / {DG_CLASSES.length}
          </span>
          <button onClick={reset} style={{
            padding: '5px 12px', borderRadius: 7, border: '1px solid #1e3a5f',
            background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 12,
          }}>重新开始</button>
        </div>
      </div>

      {allDone ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>全部配对正确！</div>
          <div style={{ color: '#64748b', marginBottom: 24 }}>你已掌握 IATA 危险品9大类分类</div>
          <button onClick={reset} style={{
            padding: '12px 32px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg,#1e40af,#0ea5e9)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>再练一次 🔄</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
          {/* Left: descriptions (shuffled) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {descOrder.map(cls => {
              const dg = DG_CLASSES.find(d => d.cls === cls)!;
              const done = ms.matched.includes(cls);
              return (
                <button
                  key={cls}
                  onClick={() => handleDesc(cls)}
                  className={ms.shaking === cls ? 'shake' : ''}
                  style={{
                    padding: '12px 16px', borderRadius: 10, textAlign: 'left',
                    border: `2px solid ${descBorder(cls)}`,
                    background: descBg(cls),
                    cursor: done ? 'default' : 'pointer',
                    opacity: done ? 0.6 : 1, transition: 'all .15s',
                  }}
                >
                  <div style={{ fontSize: 13, color: done ? '#4ade80' : '#e2e8f0', lineHeight: 1.5 }}>
                    {done ? `✅ ` : ''}{dg.name} — {dg.examples.slice(0, 2).join('、')}等
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: class numbers (in order) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DG_CLASSES.map(dg => {
              const done = ms.matched.includes(dg.cls);
              return (
                <button
                  key={dg.cls}
                  onClick={() => handleCls(dg.cls)}
                  className={ms.shaking === dg.cls ? 'shake' : ''}
                  style={{
                    width: 72, height: 52, borderRadius: 10,
                    border: `2px solid ${clsBorder(dg.cls)}`,
                    background: done ? '#14532d' : clsBg(dg.cls),
                    cursor: done ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 2, transition: 'all .15s', opacity: done ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{done ? '✅' : dg.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: done ? '#4ade80' : dg.color }}>
                    第{dg.cls}类
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Flip Card ─────────────────────────────────────────────────────────────────
function DGCard({ dg, viewed, onView }: { dg: DGClass; viewed: boolean; onView: () => void }) {
  const [flipped, setFlipped] = useState(false);

  const toggle = () => {
    setFlipped(f => !f);
    if (!viewed) onView();
  };

  return (
    <div onClick={toggle} style={{ perspective: 1000, height: 240, cursor: 'pointer', position: 'relative' }}>
      <div className={`card-inner${flipped ? ' flipped' : ''}`}>
        {/* Front */}
        <div className="card-face" style={{
          background: '#0d1b2e', border: `2px solid ${flipped ? dg.color : '#1e3a5f'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{dg.emoji}</div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: dg.color,
            background: dg.color + '22', border: `1px solid ${dg.color}`,
            borderRadius: 6, padding: '2px 8px', marginBottom: 10,
          }}>第 {dg.cls} 类</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{dg.name}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{dg.nameEn}</div>
          <div style={{ position: 'absolute', bottom: 10, fontSize: 11, color: '#475569' }}>点击翻转 →</div>
          {viewed && <div style={{ position: 'absolute', top: 10, right: 10 }}>✅</div>}
        </div>
        {/* Back */}
        <div className="card-face card-back" style={{
          background: '#020810', border: `2px solid ${dg.color}`,
          padding: 16, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: dg.color }}>第{dg.cls}类 · {dg.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{dg.back}</div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>✈️ 航空限制</div>
            <div style={{ fontSize: 11, color: '#fbbf24', background: '#92400e33', borderRadius: 6, padding: '5px 8px' }}>
              {dg.airRestriction}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>常见货物</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {dg.examples.map(e => (
                <span key={e} style={{
                  fontSize: 11, padding: '2px 6px', borderRadius: 4,
                  background: dg.color + '22', color: dg.color, border: `1px solid ${dg.color}44`,
                }}>{e}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardMode() {
  const [viewed, setViewed] = useState<Set<number>>(new Set());
  const viewedCount = viewed.size;

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: '#94a3b8' }}>已学习</span>
            <span style={{ color: '#4ade80', fontWeight: 600 }}>{viewedCount} / {DG_CLASSES.length}</span>
          </div>
          <div style={{ height: 6, background: '#1e3a5f', borderRadius: 3 }}>
            <div style={{
              height: '100%', borderRadius: 3, transition: 'width .3s',
              width: `${(viewedCount / DG_CLASSES.length) * 100}%`,
              background: viewedCount === DG_CLASSES.length ? '#22c55e' : 'linear-gradient(90deg,#ef4444,#f97316)',
            }} />
          </div>
        </div>
        {viewedCount === DG_CLASSES.length && (
          <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600, flexShrink: 0 }}>全部完成 🎉</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
        {DG_CLASSES.map(dg => (
          <DGCard
            key={dg.cls}
            dg={dg}
            viewed={viewed.has(dg.cls)}
            onView={() => setViewed(p => new Set([...p, dg.cls]))}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
type Mode = 'card' | 'match';

export default function Page() {
  const [mode, setMode] = useState<Mode>('card');

  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>⚠️ IATA 危险品分类练习</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>9大类危险品 · 记忆卡 + 配对练习</div>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: 'flex', background: '#0d1b2e', borderRadius: 10, padding: 4,
          marginBottom: 24, border: '1px solid #1e3a5f',
        }}>
          {([['card', '📚 记忆卡'], ['match', '🎯 配对练习']] as [Mode, string][]).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: mode === m ? '#1e40af' : 'transparent',
              color: mode === m ? '#93c5fd' : '#64748b',
              fontSize: 14, fontWeight: mode === m ? 700 : 400, transition: 'all .2s',
            }}>{label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 24, border: '1px solid #1e3a5f' }}>
          {mode === 'card' ? <CardMode /> : <MatchingMode />}
        </div>

        {/* Quick reference */}
        <div style={{ marginTop: 20, background: '#0d1b2e', borderRadius: 12, padding: 16, border: '1px solid #1e3a5f' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>速查表</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {DG_CLASSES.map(dg => (
              <div key={dg.cls} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{dg.emoji}</span>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: dg.color }}>第{dg.cls}类 </span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{dg.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
