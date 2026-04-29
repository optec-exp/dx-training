'use client';
import { useState } from 'react';

interface Card {
  id: number;
  category: string;
  front: string;
  frontSub?: string;
  back: string;
  tip?: string;
}

const CARDS: Card[] = [
  {
    id: 1, category: '基础概念',
    front: 'HS编码', frontSub: 'Harmonized System Code',
    back: '国际统一商品分类编码，前6位全球通用，后续各国自行扩展（日本10位）。决定关税税率、是否需要许可证等一切通关要素。',
    tip: '空运实务中，HS编码错误是通关被卡最常见的原因之一。',
  },
  {
    id: 2, category: '税费',
    front: '关税', frontSub: 'Customs Duty',
    back: '进口货物向海关缴纳的税款。税率由HS编码决定，计算公式：关税 = 完税价格（CIF价）× 税率。',
    tip: '日本部分货物关税为0%，但消费税仍需缴纳。',
  },
  {
    id: 3, category: '税费',
    front: '消费税（进口）', frontSub: '輸入消費税',
    back: '进口货物同样须缴纳消费税（日本目前为10%）。计算公式：消费税 = （完税价格 + 关税）× 10%。',
    tip: '消费税和关税是进口的两大税费，不能混淆。',
  },
  {
    id: 4, category: '基础概念',
    front: '完税价格', frontSub: 'Customs Value',
    back: '海关用于计算关税的货物价值，通常以CIF价格（成本+保险+运费）为基础。需以商业发票为依据申报。',
    tip: '低报完税价格属于违规行为，可能导致罚款或货物扣押。',
  },
  {
    id: 5, category: '流程',
    front: '进口申报', frontSub: '輸入申告',
    back: '向海关提交进口申报书（含HS编码、价格、数量、原产地等），经审查后缴税放行。日本使用电子通关系统 NACCS。',
    tip: 'NACCS（Nippon Automated Cargo and Port Consolidated System）是日本海关的电子申报平台。',
  },
  {
    id: 6, category: '流程',
    front: '查验', frontSub: '貨物検査',
    back: '海关对货物进行实物检查，核实申报内容是否与实物一致。分为书面审查、X光扫描和开箱查验三个级别。',
    tip: '被查验不代表有问题，海关有随机抽查机制。但查验会延误通关时间，需提前告知客户。',
  },
  {
    id: 7, category: '文件',
    front: '商业发票', frontSub: 'Commercial Invoice',
    back: '贸易中最重要的单据，记录货物名称、数量、单价、总价、贸易条款、买卖双方信息。是计算完税价格的主要依据。',
    tip: '发票描述必须与实物一致，且价格必须是实际交易价格。',
  },
  {
    id: 8, category: '文件',
    front: '装箱单', frontSub: 'Packing List',
    back: '列明每箱货物的品名、数量、重量、尺寸的明细单据。与商业发票配套使用，供海关核对货物。',
    tip: '装箱单上的件数、重量须与运单（AWB）完全一致。',
  },
  {
    id: 9, category: '文件',
    front: '原产地证明', frontSub: 'Certificate of Origin',
    back: '证明货物生产国的官方文件。享受EPA（经济伙伴协定）优惠关税时必须提供。分为Form A、AHEPA等多种形式。',
    tip: '没有原产地证明则无法享受关税减免，需按普通税率缴税。',
  },
  {
    id: 10, category: '文件',
    front: 'MSDS', frontSub: '物质安全数据表',
    back: 'Material Safety Data Sheet，记录化学品/危险品的成分、危险性、应急处理方法等。进口危险品时海关必查文件。',
    tip: '锂电池、化学品、涂料等常见商品都需要MSDS，应提前向发货方索取。',
  },
  {
    id: 11, category: '许可证',
    front: '进口许可证', frontSub: 'Import License / 輸入承認',
    back: '部分特定货物进口前须取得政府主管部门的进口许可或承认（経済産業省等）。如：特定化学品、战略物资、濒危物种（CITES）等。',
    tip: '许可证申请需要时间，务必提前确认货物是否需要，避免货物到港后无法清关。',
  },
  {
    id: 12, category: '许可证',
    front: 'CITES', frontSub: '濒危物种国际贸易公约',
    back: 'Convention on International Trade in Endangered Species，管制濒危动植物及其制品（象牙、珊瑚、皮革等）的国际公约。违反者货物没收并面临刑事处罚。',
    tip: '皮质产品、动物标本、某些木材制品都可能受CITES管制，须仔细确认。',
  },
  {
    id: 13, category: '基础概念',
    front: '保税仓库', frontSub: '保税倉庫',
    back: '经海关批准，货物可在缴税前存入保税仓库暂存。适用于转口货物、需等待许可证的货物，或分批清关的货物。',
    tip: '保税仓库存放期间不缴税，出库时才完成清关缴税，有助于资金周转。',
  },
  {
    id: 14, category: '流程',
    front: '查验比率', frontSub: '検査率',
    back: '海关对进口货物实施实物查验的比率。日本空运查验率约5-15%。查验被选中时，货运代理须配合安排开箱，费用由货主承担。',
    tip: '高风险货物（食品、动植物、危险品）查验率明显高于普通工业品。',
  },
  {
    id: 15, category: '税费',
    front: 'EPA 优惠关税', frontSub: '経済連携協定',
    back: '日本与特定国家/地区签订的经济伙伴协定，对协定内货物给予关税减免。需提供原产地证明，税率可能从数%降至0%。',
    tip: '日本EPA覆盖：东盟、澳大利亚、欧盟、英国、美国（部分）等。中国目前没有EPA，但RCEP有部分优惠。',
  },
  {
    id: 16, category: '基础概念',
    front: 'AEO认证', frontSub: 'Authorized Economic Operator',
    back: '海关认证的"可信企业"制度。取得AEO资质的企业享有优先通关、低查验率等优惠待遇。',
    tip: 'OPTEC若为AEO认证企业，客户货物通关效率更高、被查验概率更低。',
  },
  {
    id: 17, category: '基础概念',
    front: '转口 / 转运', frontSub: 'Transshipment',
    back: '货物经中转地转运至最终目的地，在中转地不完成进口清关。例如：货物从上海飞香港再转飞东京，香港为转口地。',
    tip: '转口货物在中转地无需缴税，但须在最终目的地完成进口申报。',
  },
  {
    id: 18, category: '流程',
    front: '通关时间', frontSub: '通関リードタイム',
    back: '从货物到港到完成清关放行的时间。正常情况下日本空运清关约1-2个工作日，若被查验或需许可证可能延至数天至数周。',
    tip: '节假日、大量货物集中期（春节、年底）通关时间会明显延长，需提前告知客户。',
  },
  {
    id: 19, category: '许可证',
    front: '食品进口申报', frontSub: '食品等輸入届',
    back: '进口食品须向厚生劳动省提交食品等输入届，经检疫所审查（有时需检验）后方可放行。不合格品须销毁或退运。',
    tip: '食品进口检查严格，通关时间不可预测。加工食品还需确认添加剂合规性。',
  },
  {
    id: 20, category: '基础概念',
    front: '进口禁止品', frontSub: '輸入禁制品',
    back: '日本法律明令禁止进口的物品，包括：麻醉药品、枪支弹药、爆炸物、儿童色情物品、假冒伪劣商品、部分动植物病害等。',
    tip: '即使是客户委托，货运代理也有义务拒绝处理疑似禁止进口的货物，并有权向海关举报。',
  },
];

const CATEGORIES = ['全部', ...Array.from(new Set(CARDS.map(c => c.category)))];

const CAT_COLOR: Record<string, string> = {
  '基础概念': '#3b82f6',
  '税费':     '#f59e0b',
  '流程':     '#10b981',
  '文件':     '#8b5cf6',
  '许可证':   '#ef4444',
};

function FlipCard({ card, viewed, onView }: {
  card: Card;
  viewed: boolean;
  onView: (id: number) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const color = CAT_COLOR[card.category] ?? '#3b82f6';

  const toggle = () => {
    setFlipped(f => !f);
    if (!viewed) onView(card.id);
  };

  return (
    <div
      onClick={toggle}
      style={{ perspective: 1000, height: 200, cursor: 'pointer', position: 'relative' }}
    >
      <div className={`card-inner${flipped ? ' flipped' : ''}`}>
        {/* Front */}
        <div
          className="card-face"
          style={{
            background: '#0d1b2e',
            border: `2px solid ${flipped ? color : '#1e3a5f'}`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center',
          }}
        >
          <div style={{
            fontSize: 11, fontWeight: 600, color, background: color + '22',
            border: `1px solid ${color}`, borderRadius: 6, padding: '2px 8px', marginBottom: 14,
          }}>
            {card.category}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{card.front}</div>
          {card.frontSub && <div style={{ fontSize: 12, color: '#64748b' }}>{card.frontSub}</div>}
          <div style={{ position: 'absolute', bottom: 12, fontSize: 11, color: '#475569' }}>点击翻转 →</div>
          {viewed && (
            <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 16 }}>✅</div>
          )}
        </div>

        {/* Back */}
        <div
          className="card-face card-back"
          style={{
            background: '#020810',
            border: `2px solid ${color}`,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            padding: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color, marginBottom: 10 }}>{card.front}</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.65 }}>{card.back}</div>
          </div>
          {card.tip && (
            <div style={{
              marginTop: 10, padding: '8px 10px', borderRadius: 7,
              background: color + '15', border: `1px solid ${color}44`,
              fontSize: 12, color: '#94a3b8', lineHeight: 1.5,
            }}>
              💡 {card.tip}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [activeCat, setActiveCat] = useState('全部');
  const [viewed, setViewed]       = useState<Set<number>>(new Set());

  const filtered = activeCat === '全部' ? CARDS : CARDS.filter(c => c.category === activeCat);
  const viewedCount = viewed.size;

  const markViewed = (id: number) => setViewed(p => new Set([...p, id]));
  const resetAll   = () => setViewed(new Set());

  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📚 通关知识学习卡</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>进口清关流程 · 税费 · 许可证 · 文件 · 共{CARDS.length}张</div>
        </div>

        {/* Progress */}
        <div style={{ background: '#0d1b2e', borderRadius: 12, padding: '14px 20px', marginBottom: 20, border: '1px solid #1e3a5f', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: '#94a3b8' }}>已学习</span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>{viewedCount} / {CARDS.length}</span>
            </div>
            <div style={{ height: 6, background: '#1e3a5f', borderRadius: 3 }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width .3s',
                width: `${(viewedCount / CARDS.length) * 100}%`,
                background: viewedCount === CARDS.length ? '#22c55e' : 'linear-gradient(90deg,#1e40af,#0ea5e9)',
              }} />
            </div>
          </div>
          {viewedCount > 0 && (
            <button onClick={resetAll} style={{
              padding: '6px 14px', borderRadius: 7, border: '1px solid #1e3a5f',
              background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 12, flexShrink: 0,
            }}>
              重置
            </button>
          )}
          {viewedCount === CARDS.length && (
            <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 600, flexShrink: 0 }}>全部完成 🎉</div>
          )}
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {CATEGORIES.map(cat => {
            const color = cat === '全部' ? '#64748b' : (CAT_COLOR[cat] ?? '#3b82f6');
            const active = activeCat === cat;
            return (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${active ? color : '#1e3a5f'}`,
                background: active ? color + '22' : 'transparent',
                color: active ? color : '#64748b',
                cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all .15s',
              }}>
                {cat}
                {cat !== '全部' && (
                  <span style={{ marginLeft: 5, fontSize: 11, opacity: .7 }}>
                    {CARDS.filter(c => c.category === cat).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {filtered.map(card => (
            <FlipCard
              key={card.id}
              card={card}
              viewed={viewed.has(card.id)}
              onView={markViewed}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 12, color: '#475569' }}>
          点击卡片正面翻转查看详解 · 翻看后自动标记为已学习 ✅
        </div>
      </div>
    </div>
  );
}
