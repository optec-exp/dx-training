'use client';
import { useState } from 'react';

interface Question {
  id: number;
  category: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1, category: '基础术语',
    q: 'AWB 是什么的缩写？',
    options: ['Air Waybill', 'Airport Withdrawal Bill', 'Airline Weight Bill', 'Air Waiver Board'],
    answer: 0,
    explanation: 'AWB（Air Waybill）即"航空运单"，是空运最重要的基础单据，具有运输合同、收据和海关文件的功能。',
  },
  {
    id: 2, category: '国际组织',
    q: 'IATA 是哪个国际组织的缩写？',
    options: ['国际民航组织', '国际航空运输协会', '国际货运代理协会', '国际机场理事会'],
    answer: 1,
    explanation: 'IATA（International Air Transport Association）即"国际航空运输协会"，负责制定全球航空运输标准，包括机场代码、危险品规则等。',
  },
  {
    id: 3, category: '机场代码',
    q: '成田国际机场的 IATA 代码是？',
    options: ['TYO', 'HND', 'NRT', 'OSA'],
    answer: 2,
    explanation: 'NRT 是成田国际机场（Narita International Airport）的 IATA 代码。TYO 是东京城市代码，HND 是羽田机场代码。',
  },
  {
    id: 4, category: '机场代码',
    q: '香港国际机场的 IATA 代码是？',
    options: ['HKI', 'HKG', 'KOW', 'CHK'],
    answer: 1,
    explanation: 'HKG 是香港国际机场（Hong Kong International Airport）的 IATA 代码，位于大屿山赤鱲角。',
  },
  {
    id: 5, category: '机场代码',
    q: '上海浦东机场的 IATA 代码是？',
    options: ['SHA', 'SHG', 'PVG', 'PUD'],
    answer: 2,
    explanation: 'PVG 是上海浦东国际机场的 IATA 代码。SHA 是上海虹桥机场的代码。',
  },
  {
    id: 6, category: '基础术语',
    q: 'ULD 在空运中是指什么？',
    options: ['货物重量单位', '航空货运集装设备', '海关申报文件', '航空公司代码'],
    answer: 1,
    explanation: 'ULD（Unit Load Device）即航空集装设备，包括集装箱和集装板，用于将货物标准化装载到飞机上，提高装卸效率。',
  },
  {
    id: 7, category: '运单知识',
    q: 'MAWB 和 HAWB 中，MAWB 是指？',
    options: ['分运单', '主运单', '海运提单', '危险品运单'],
    answer: 1,
    explanation: 'MAWB（Master Air Waybill）是主运单，由航空公司签发给货运代理。HAWB（House Air Waybill）是分运单，由货运代理签发给托运人。',
  },
  {
    id: 8, category: '计费规则',
    q: '空运计费重量应取哪个？',
    options: ['实际重量', '体积重量', '两者中较大值', '两者中较小值'],
    answer: 2,
    explanation: '空运计费重量（Chargeable Weight）取实际重量和体积重量中的较大值，以保证航空公司的舱位收益。',
  },
  {
    id: 9, category: '计费规则',
    q: '空运体积重量的计算公式（厘米单位）是？',
    options: ['长×宽×高 ÷ 5000', '长×宽×高 ÷ 6000', '长×宽×高 ÷ 4000', '长×宽×高 ÷ 3000'],
    answer: 1,
    explanation: '空运体积重量 = 长(cm)×宽(cm)×高(cm) ÷ 6000，单位为 kg。例如 60×50×40cm 的货物，体积重量 = 60×50×40÷6000 = 20kg。',
  },
  {
    id: 10, category: '服务类型',
    q: 'OBC 是什么服务？',
    options: ['海运整柜', '随身携带快递服务', '海关清关服务', '危险品包装服务'],
    answer: 1,
    explanation: 'OBC（On Board Courier）即随身携带快递，由专人将货物作为随身行李随机交付，适用于极度紧急且轻小的货物。',
  },
  {
    id: 11, category: '基础术语',
    q: 'DG 在空运中代表什么？',
    options: ['Delivery Guarantee', 'Dangerous Goods', 'Direct Flight', 'Document Guide'],
    answer: 1,
    explanation: 'DG（Dangerous Goods）即危险品。空运危险品须遵循 IATA DGR（危险品规则）进行分类、包装、标记和申报。',
  },
  {
    id: 12, category: '基础术语',
    q: 'NOTOC 是什么文件？',
    options: ['货物清单', '机长危险品通知书', '发货通知', '清关证明'],
    answer: 1,
    explanation: 'NOTOC（Notification to Captain）即机长危险品通知书，告知机长本次航班载有哪些危险品及其位置，是空运危险品的必备文件。',
  },
  {
    id: 13, category: '基础术语',
    q: 'GHA 是什么？',
    options: ['航空公司总部', '地面处理代理', '海关处理机构', '货运代理协会'],
    answer: 1,
    explanation: 'GHA（Ground Handling Agent）即地面处理代理，负责机场地面操作，包括货物收发、装卸、仓储等服务。',
  },
  {
    id: 14, category: '基础术语',
    q: 'POD 代表什么？',
    options: ['Port of Departure', 'Proof of Delivery', 'Port of Destination', 'Post Office Document'],
    answer: 1,
    explanation: 'POD（Proof of Delivery）即交货证明，是收货人签收货物的凭证，是结案和对账的重要文件。',
  },
  {
    id: 15, category: '贸易条款',
    q: 'FOB 贸易条款中，风险在哪个节点转移给买方？',
    options: ['货物离开卖方仓库时', '货物装上运输工具时', '货物到达目的港时', '货物完成进口清关时'],
    answer: 1,
    explanation: 'FOB（Free On Board）条款下，货物装上船（或飞机）后，风险由卖方转移给买方。出口清关由卖方负责，进口清关由买方负责。',
  },
  {
    id: 16, category: '贸易条款',
    q: 'EXW 贸易条款对卖方的责任是？',
    options: ['负责运到目的地', '负责出口清关', '只需在指定地点备货，其余由买方承担', '负责到目的港卸货'],
    answer: 2,
    explanation: 'EXW（Ex Works）是卖方责任最小的条款，卖方只需在工厂或仓库备妥货物，装车、出口清关、运输全部由买方负责。',
  },
  {
    id: 17, category: '贸易条款',
    q: 'DDP 贸易条款对卖方意味着？',
    options: ['只负责装船', '负责到目的地并完成进口清关及缴税', '只负责出口清关', '风险在装船时转移'],
    answer: 1,
    explanation: 'DDP（Delivered Duty Paid）是卖方责任最大的条款，卖方需负责将货物运至目的地、完成进口清关并缴纳所有税费。',
  },
  {
    id: 18, category: '贸易条款',
    q: 'CIF 贸易条款中，I 代表什么？',
    options: ['Import', 'Insurance', 'International', 'Invoice'],
    answer: 1,
    explanation: 'CIF（Cost, Insurance and Freight）即成本+保险费+运费，卖方需负责安排货物运至目的港并购买保险，风险在装运港装船时转移。',
  },
  {
    id: 19, category: '危险品',
    q: 'IATA 危险品分类中，第1类是？',
    options: ['易燃液体', '爆炸品', '放射性物质', '腐蚀性物质'],
    answer: 1,
    explanation: 'IATA 危险品共9类：第1类爆炸品、第2类气体、第3类易燃液体、第4类易燃固体、第5类氧化性物质、第6类毒性物质、第7类放射性物质、第8类腐蚀性物质、第9类杂项危险品。',
  },
  {
    id: 20, category: '运单知识',
    q: '空运主运单号（AWB No.）通常由几位数字组成？',
    options: ['8位', '10位', '11位', '13位'],
    answer: 2,
    explanation: 'AWB 号码由11位数字组成：前3位是航空公司前缀代码（如国航CA是999），后8位是流水号，最后1位有时用于校验。',
  },
];

const CAT_COLOR: Record<string, string> = {
  '基础术语': '#3b82f6',
  '国际组织': '#8b5cf6',
  '机场代码': '#06b6d4',
  '运单知识': '#f59e0b',
  '计费规则': '#f97316',
  '服务类型': '#10b981',
  '贸易条款': '#e879f9',
  '危险品':   '#ef4444',
};

type Phase = 'start' | 'quiz' | 'result';

export default function Page() {
  const [phase, setPhase]     = useState<Phase>('start');
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults]   = useState<boolean[]>([]);

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const score = results.filter(Boolean).length;

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    setResults(r => [...r, idx === q.answer]);
  };

  const handleNext = () => {
    if (current + 1 >= total) {
      setPhase('result');
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const handleRestart = () => {
    setPhase('start');
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setResults([]);
  };

  const optionBg = (idx: number) => {
    if (!answered) return '#0d1b2e';
    if (idx === q.answer) return '#14532d';
    if (idx === selected && idx !== q.answer) return '#7f1d1d';
    return '#0d1b2e';
  };

  const optionBorder = (idx: number) => {
    if (!answered) return selected === idx ? '#3b82f6' : '#1e3a5f';
    if (idx === q.answer) return '#22c55e';
    if (idx === selected && idx !== q.answer) return '#ef4444';
    return '#1e3a5f';
  };

  const optionColor = (idx: number) => {
    if (!answered) return '#e2e8f0';
    if (idx === q.answer) return '#4ade80';
    if (idx === selected && idx !== q.answer) return '#fca5a5';
    return '#64748b';
  };

  const grade = () => {
    const pct = score / total;
    if (pct >= 0.9) return { label: '优秀 ⭐⭐⭐', color: '#22c55e' };
    if (pct >= 0.7) return { label: '良好 ⭐⭐', color: '#f59e0b' };
    if (pct >= 0.5) return { label: '及格 ⭐', color: '#f97316' };
    return { label: '需要加油 📖', color: '#ef4444' };
  };

  // ── Start screen ────────────────────────────────────────────────────────────
  if (phase === 'start') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✈️</div>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>航空用語クイズ</div>
        <div style={{ color: '#64748b', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
          空运业务术语测验<br />
          共 {total} 题 · 涵盖AWB / 机场代码 / 贸易条款 / 危险品
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
          {Object.entries(CAT_COLOR).map(([cat, color]) => (
            <div key={cat} style={{
              background: '#0d1b2e', border: `1px solid ${color}`, borderRadius: 8,
              padding: '8px 14px', fontSize: 13, color, textAlign: 'left',
            }}>
              {cat}
            </div>
          ))}
        </div>
        <button
          onClick={() => setPhase('quiz')}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #1e40af, #0ea5e9)',
            color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer',
          }}
        >
          开始测验 →
        </button>
      </div>
    </div>
  );

  // ── Result screen ────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const g = grade();
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          <div style={{ background: '#0d1b2e', borderRadius: 16, padding: 32, textAlign: 'center', border: `2px solid ${g.color}`, marginBottom: 20 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: g.color, marginBottom: 4 }}>{score} / {total}</div>
            <div style={{ fontSize: 18, color: g.color, marginBottom: 8 }}>{g.label}</div>
            <div style={{ color: '#64748b', fontSize: 14 }}>正确率 {Math.round(score / total * 100)}%</div>
          </div>
          {/* Per-question recap */}
          <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #1e3a5f' }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#93c5fd' }}>答题详情</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: r ? '#14532d' : '#7f1d1d', fontSize: 13, fontWeight: 700, color: r ? '#4ade80' : '#fca5a5',
                  border: `1px solid ${r ? '#22c55e' : '#ef4444'}`,
                }}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleRestart}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #0ea5e9)',
              color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            }}
          >
            再挑戦 🔄
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz screen ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}>
            <span>第 {current + 1} 题 / 共 {total} 题</span>
            <span>得分：{score}</span>
          </div>
          <div style={{ height: 6, background: '#1e3a5f', borderRadius: 3 }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${((current) / total) * 100}%`,
              background: 'linear-gradient(90deg,#1e40af,#0ea5e9)',
              transition: 'width .3s',
            }} />
          </div>
        </div>

        {/* Question card */}
        <div style={{ background: '#0d1b2e', borderRadius: 16, padding: 28, border: '1px solid #1e3a5f', marginBottom: 16 }}>
          {/* Category badge */}
          <div style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: (CAT_COLOR[q.category] ?? '#3b82f6') + '22',
            color: CAT_COLOR[q.category] ?? '#3b82f6',
            border: `1px solid ${CAT_COLOR[q.category] ?? '#3b82f6'}`,
            marginBottom: 16,
          }}>
            {q.category}
          </div>

          <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>
            Q{current + 1}. {q.q}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                style={{
                  padding: '13px 18px', borderRadius: 10, cursor: answered ? 'default' : 'pointer',
                  border: `2px solid ${optionBorder(idx)}`,
                  background: optionBg(idx),
                  color: optionColor(idx),
                  fontSize: 14, textAlign: 'left', transition: 'all .15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: optionBorder(idx) + '33', fontSize: 12, fontWeight: 700,
                  color: optionColor(idx),
                }}>
                  {answered && idx === q.answer ? '✓' : answered && idx === selected && idx !== q.answer ? '✗' : 'ABCD'[idx]}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Explanation */}
        {answered && (
          <div style={{
            background: '#020810', borderRadius: 12, padding: 20,
            border: `1px solid ${results[results.length - 1] ? '#22c55e' : '#ef4444'}`,
            marginBottom: 16,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: results[results.length - 1] ? '#4ade80' : '#fca5a5' }}>
              {results[results.length - 1] ? '✅ 正确！' : `❌ 正确答案是：${q.options[q.answer]}`}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>{q.explanation}</div>
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button
            onClick={handleNext}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #1e40af, #0ea5e9)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {current + 1 >= total ? '查看结果 🎯' : '下一题 →'}
          </button>
        )}
      </div>
    </div>
  );
}
