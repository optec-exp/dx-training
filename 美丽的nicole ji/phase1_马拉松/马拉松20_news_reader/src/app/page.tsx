'use client';
import { useState, useMemo } from 'react';

interface Article {
  id: number;
  title: string;
  source: string;
  date: string;
  tag: string;
  content: string;
  custom?: boolean;
}

const PRESET: Article[] = [
  {
    id: 1, tag: '市场动态', source: 'IATA', date: '2026-04-15',
    title: '2026年第一季度全球航空货运量同比增长8.3%，亚太区表现突出',
    content: `国际航空运输协会（IATA）发布2026年第一季度航空货运数据报告，全球航空货运量（以货运吨公里CTK计算）同比增长8.3%，较2025年全年平均增速加快2.1个百分点。

亚太地区航空公司表现尤为突出，区域内货运量增长达11.2%，主要得益于跨境电商持续高速增长以及半导体供应链恢复。其中日本至东南亚航线需求强劲，成田（NRT）、关西（KIX）两大货运枢纽吞吐量均创历史同期新高。

电商货物占空运总量的比重已升至约34%，成为推动市场增长的核心动力。时装、消费电子、医疗器械等高价值商品的空运需求也保持稳定增长态势。

IATA总干事Willie Walsh表示："航空货运市场正在展现出强劲的复苏势头，但地缘政治风险和燃油价格波动仍是行业面临的主要不确定因素。"

展望第二季度，IATA预计全球航空货运量将继续保持6%-8%的同比增长，亚太区仍将领跑全球。

【关键词】IATA / CTK / 跨境电商 / 亚太区 / 成田机场`,
  },
  {
    id: 2, tag: '法规更新', source: 'IATA DGR', date: '2026-04-10',
    title: '【重要】IATA第67版危险品规则（DGR）4月起正式实施，锂电池规定重大调整',
    content: `IATA第67版危险品规则（Dangerous Goods Regulations, DGR）已于2026年4月1日正式生效，其中锂电池相关条款发生重大调整，航空货运代理和托运人须重点关注。

主要变化如下：

一、锂离子电池（UN3480）荷电状态（SOC）限制
独立运输的锂离子电池，荷电状态须≤30%（此前为≤30%，但计量方式有所调整）。托运人须在AWB备注栏注明"SOC≤30%"，并提供相应证明文件。

二、含锂电池设备（PI966/PI967）新增标签要求
含锂电池的设备在包装外须粘贴新版锂电池标签（2026版），旧版标签不再接受。标签须标注瓦时数（Wh）和电池数量。

三、PI968新增重量限制
货机运输的独立锂金属电池（UN3090），单件包装净重从原先35kg调整为30kg。

四、危险品申报书（DGD）格式更新
电子DGD须采用IATA最新版本格式，纸质DGD须使用2026年版本模板。

建议操作：所有涉及锂电池货物的报价和操作环节，须重新确认符合第67版规定。如有疑问请联系GC部门。

【关键词】DGR / 锂电池 / UN3480 / PI966 / SOC / 危险品申报`,
  },
  {
    id: 3, tag: '市场动态', source: 'The Loadstar', date: '2026-04-08',
    title: '香港至日本航线运价持续走高，4月旺季舱位紧张',
    content: `据多家货运代理反映，香港（HKG）至日本主要机场（NRT/KIX/NGO）航线运价自3月下旬开始持续上涨，目前综合运价（含燃油附加费）较2月底上涨约15%-22%，部分货种溢价更高。

运价上涨的主要原因如下：

1. 电商旺季备货需求激增：日本国内主要电商平台的春季大促带动进口商品备货量大幅增加，消费电子、服装、日用品需求集中释放。

2. 腹舱运力收缩：受日本黄金周（4月下旬至5月初）前后部分航班调整影响，有效腹舱运力较正常月份减少约8%。

3. OBC需求旺盛：紧急件和小批量高价值货物的OBC需求同比增长约30%，可用人员趋于紧张，建议提前2-3天预约。

市场预测：5月中旬以后随黄金周结束，舱位紧张状况预计有所缓解，运价或回落5%-10%。

对OPTEC的操作建议：对于非紧急货物，建议客户考虑提前2周以上委托以锁定舱位和价格；对于必须在旺季发运的货物，应及时向客户说明运价上涨原因并取得认可。

【关键词】HKG-NRT / 舱位 / 运价 / OBC / 黄金周 / 腹舱运力`,
  },
  {
    id: 4, tag: '政策法规', source: '财务省关税局', date: '2026-04-03',
    title: '日本修订小额免税制度：跨境电商进口课税门槛将于7月下调',
    content: `日本财务省关税局宣布，将于2026年7月1日起对现行小额进口货物免税制度进行重要修订，主要针对跨境电商平台进口商品加强课税管理。

现行制度：进口货物完税价格（CIF）在1万日元以下，免征关税和消费税。

修订内容：
- 将免税门槛从1万日元下调至5000日元
- 要求海外电商平台（月销售额超过一定规模者）在日本进行消费税申报登记，并代为征收消费税
- 对于通过个人快递渠道进口的货物，加强申报真实性审查

对货运代理的影响：
部分以往享受免税的低价值跨境电商货物将开始缴纳关税和消费税，通关时间可能相应延长。代理此类货物的货运代理须提醒客户提前准备完整发票和商品描述，避免因申报不完整导致扣关。

专家评论：此次修订旨在为日本本土零售商创造公平竞争环境，预计将对以1-5万日元价格段为主的跨境电商货物产生显著影响。家电、服装、化妆品等品类受影响最大。

建议操作：货运代理应主动向相关客户说明新规，协助其更新商业发票格式和申报流程。

【关键词】小额免税 / 跨境电商 / 消费税 / 关税门槛 / 财务省`,
  },
  {
    id: 5, tag: '行业动态', source: 'Air Cargo World', date: '2026-03-28',
    title: 'AI技术加速渗透航空货运，多家货代开始部署智能报价和追踪系统',
    content: `航空货运行业正在迎来AI技术的快速渗透。据Air Cargo World调查报告，2026年上半年内已有超过35%的大型货运代理开始部署或测试基于大语言模型（LLM）的智能报价、追踪和客服系统，较2025年同期增长近一倍。

主要应用场景：

1. 智能报价：基于历史成交数据、实时舱位和运价信息，在5秒内为客户生成个性化报价，准确率达到人工报价的92%。

2. 货物追踪自动化：AI系统自动整合多家航空公司的追踪节点，主动向客户发送状态更新通知，减少人工查询工作量约60%。

3. 客服机器人：能处理约70%的常见客户咨询（报价查询、状态查询、文件要求），将人工客服时间释放用于处理复杂案件。

4. 风险预警：基于历史延误数据和航班信息，提前预测货物延误风险并向操作人员预警。

挑战与争议：
业界对AI在危险品鉴别和合规判断方面的应用仍持谨慎态度。多位行业专家表示，AI工具可辅助判断但不能替代人工的最终合规确认。

OPTEC展望：DX室正在评估将AI引入内部操作流程的可能性，如有进展将及时通报团队。

【关键词】AI / 大语言模型 / 智能报价 / 货物追踪 / DX / 数字化转型`,
  },
];

const TAG_COLOR: Record<string, string> = {
  '市场动态': '#3b82f6',
  '法规更新': '#ef4444',
  '政策法规': '#f59e0b',
  '行业动态': '#10b981',
  '自定义':   '#8b5cf6',
};

const KEY_TERMS = [
  'IATA', 'AWB', 'OBC', 'DGR', 'SOC', 'ULD', 'CTK',
  'NRT', 'HKG', 'KIX', 'PVG',
  'UN3480', 'UN3090', 'PI966', 'PI967',
  '锂电池', '危险品', '清关', '通关', '关税', '消费税', '舱位',
  'DX', 'AI', '跨境电商',
];

function highlight(text: string, terms: string[]): React.ReactNode {
  if (!terms.length) return text;
  const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'g');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    terms.includes(part)
      ? <mark key={i}>{part}</mark>
      : part
  );
}

function readTime(content: string): number {
  return Math.max(1, Math.round(content.length / 400));
}

const INP: React.CSSProperties = {
  background: '#020810', border: '1px solid #1e3a5f', borderRadius: 6,
  color: '#e2e8f0', padding: '8px 12px', width: '100%', fontSize: 13,
};

export default function Page() {
  const [articles, setArticles]   = useState<Article[]>(PRESET);
  const [selected, setSelected]   = useState<number>(PRESET[0].id);
  const [read, setRead]           = useState<Set<number>>(new Set());
  const [notes, setNotes]         = useState<Record<number, string>>({});
  const [showPaste, setShowPaste] = useState(false);
  const [hlOn, setHlOn]           = useState(true);
  const [filterTag, setFilterTag] = useState('全部');

  // Paste form
  const [pasteTitle,   setPasteTitle]   = useState('');
  const [pasteSource,  setPasteSource]  = useState('');
  const [pasteDate,    setPasteDate]    = useState(new Date().toISOString().slice(0, 10));
  const [pasteTag,     setPasteTag]     = useState('自定义');
  const [pasteContent, setPasteContent] = useState('');

  const article = articles.find(a => a.id === selected)!;
  const isRead  = read.has(selected);

  const tags = useMemo(() => ['全部', ...Array.from(new Set(articles.map(a => a.tag)))], [articles]);
  const filtered = filterTag === '全部' ? articles : articles.filter(a => a.tag === filterTag);

  const toggleRead = () => setRead(p => {
    const next = new Set(p);
    next.has(selected) ? next.delete(selected) : next.add(selected);
    return next;
  });

  const addArticle = () => {
    if (!pasteTitle.trim() || !pasteContent.trim()) return;
    const newArt: Article = {
      id: Date.now(), title: pasteTitle.trim(),
      source: pasteSource.trim() || '自定义',
      date: pasteDate, tag: pasteTag,
      content: pasteContent.trim(), custom: true,
    };
    setArticles(p => [newArt, ...p]);
    setSelected(newArt.id);
    setShowPaste(false);
    setPasteTitle(''); setPasteSource(''); setPasteContent(''); setPasteTag('自定义');
  };

  const deleteArticle = (id: number) => {
    setArticles(p => p.filter(a => a.id !== id));
    if (selected === id) setSelected(articles.find(a => a.id !== id)?.id ?? 0);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 26, marginBottom: 4 }}>📰 行业新闻阅读器</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>预置行业要闻 · 支持粘贴自定义新闻 · 关键词高亮 · 笔记</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          {/* ── LEFT: Article list ─────────────────────────────────────────── */}
          <div>
            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setShowPaste(v => !v)} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: showPaste ? '#7c3aed' : '#1e40af', color: '#fff', fontSize: 13, fontWeight: 600,
              }}>
                {showPaste ? '✕ 取消' : '+ 粘贴新闻'}
              </button>
              <div style={{
                padding: '9px 12px', borderRadius: 8, border: '1px solid #1e3a5f',
                background: '#0d1b2e', color: '#64748b', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {read.size}/{articles.length} 已读
              </div>
            </div>

            {/* Paste form */}
            {showPaste && (
              <div style={{ background: '#0d1b2e', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid #7c3aed' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>标题 *</div>
                <input style={{ ...INP, marginBottom: 8 }} placeholder="新闻标题" value={pasteTitle} onChange={e => setPasteTitle(e.target.value)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>来源</div>
                    <input style={INP} placeholder="如 Reuters" value={pasteSource} onChange={e => setPasteSource(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>日期</div>
                    <input style={INP} type="date" value={pasteDate} onChange={e => setPasteDate(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>分类</div>
                  <select style={INP} value={pasteTag} onChange={e => setPasteTag(e.target.value)}>
                    {['自定义', '市场动态', '法规更新', '政策法规', '行业动态'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>正文 * （直接粘贴）</div>
                  <textarea style={{ ...INP, minHeight: 120, resize: 'vertical' }}
                    placeholder="在此粘贴新闻正文…"
                    value={pasteContent} onChange={e => setPasteContent(e.target.value)} />
                </div>
                <button onClick={addArticle} style={{
                  width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: pasteTitle && pasteContent ? '#7c3aed' : '#1e2537',
                  color: pasteTitle && pasteContent ? '#fff' : '#475569', fontSize: 13, fontWeight: 600,
                }}>
                  添加到列表
                </button>
              </div>
            )}

            {/* Tag filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {tags.map(tag => {
                const color = tag === '全部' ? '#64748b' : (TAG_COLOR[tag] ?? '#64748b');
                const active = filterTag === tag;
                return (
                  <button key={tag} onClick={() => setFilterTag(tag)} style={{
                    padding: '4px 10px', borderRadius: 14, fontSize: 11, cursor: 'pointer',
                    border: `1px solid ${active ? color : '#1e3a5f'}`,
                    background: active ? color + '22' : 'transparent',
                    color: active ? color : '#64748b', fontWeight: active ? 600 : 400,
                  }}>{tag}</button>
                );
              })}
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(a => {
                const tagColor = TAG_COLOR[a.tag] ?? '#64748b';
                const active = selected === a.id;
                const isReadA = read.has(a.id);
                return (
                  <div key={a.id} onClick={() => setSelected(a.id)} style={{
                    background: active ? '#0a1e3d' : '#0d1b2e',
                    border: `2px solid ${active ? '#3b82f6' : '#1e3a5f'}`,
                    borderRadius: 10, padding: 12, cursor: 'pointer',
                    opacity: isReadA && !active ? 0.65 : 1, transition: 'all .15s',
                    position: 'relative',
                  }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: tagColor,
                        background: tagColor + '22', border: `1px solid ${tagColor}44`,
                        borderRadius: 4, padding: '1px 6px',
                      }}>{a.tag}</span>
                      {isReadA && <span style={{ fontSize: 10, color: '#4ade80' }}>✅ 已读</span>}
                      {a.custom && (
                        <button onClick={e => { e.stopPropagation(); deleteArticle(a.id); }} style={{
                          marginLeft: 'auto', background: 'none', border: 'none',
                          color: '#475569', cursor: 'pointer', fontSize: 14, lineHeight: 1,
                        }}>✕</button>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: active ? '#e2e8f0' : '#cbd5e1', marginBottom: 4 }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{a.source} · {a.date} · 约{readTime(a.content)}分钟</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Reader ──────────────────────────────────────────────── */}
          {article && (
            <div style={{ position: 'sticky', top: 20, alignSelf: 'start', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Article header */}
              <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, border: '1px solid #1e3a5f' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: TAG_COLOR[article.tag] ?? '#64748b',
                    background: (TAG_COLOR[article.tag] ?? '#64748b') + '22',
                    border: `1px solid ${(TAG_COLOR[article.tag] ?? '#64748b')}44`,
                    borderRadius: 5, padding: '2px 8px',
                  }}>{article.tag}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{article.source} · {article.date}</span>
                  <span style={{ fontSize: 12, color: '#475569', marginLeft: 'auto' }}>🕐 约{readTime(article.content)}分钟</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.6, marginBottom: 14 }}>{article.title}</div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={toggleRead} style={{
                    padding: '7px 16px', borderRadius: 8,
                    border: `1px solid ${isRead ? '#22c55e' : '#1e3a5f'}`,
                    background: isRead ? '#14532d' : 'transparent',
                    color: isRead ? '#4ade80' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  }}>
                    {isRead ? '✅ 已读' : '标记已读'}
                  </button>
                  <button onClick={() => setHlOn(v => !v)} style={{
                    padding: '7px 16px', borderRadius: 8,
                    border: `1px solid ${hlOn ? '#854d0e' : '#1e3a5f'}`,
                    background: hlOn ? '#78350f33' : 'transparent',
                    color: hlOn ? '#fbbf24' : '#64748b', cursor: 'pointer', fontSize: 12,
                  }}>
                    {hlOn ? '🔆 关键词高亮开' : '关键词高亮关'}
                  </button>
                </div>
              </div>

              {/* Article body */}
              <div style={{
                background: '#0d1b2e', borderRadius: 12, padding: 20,
                border: '1px solid #1e3a5f', flex: 1, overflowY: 'auto',
                fontSize: 14, lineHeight: 1.9, color: '#cbd5e1',
              }}>
                {article.content.split('\n').map((line, i) => (
                  <p key={i} style={{ marginBottom: line === '' ? 8 : 4 }}>
                    {hlOn ? highlight(line, KEY_TERMS) : line}
                  </p>
                ))}
              </div>

              {/* Notes */}
              <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 16, border: '1px solid #1e3a5f' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>📝 我的笔记</div>
                <textarea
                  style={{ ...INP, minHeight: 80, resize: 'vertical' }}
                  placeholder="记录关键信息、行动事项、想法…"
                  value={notes[selected] ?? ''}
                  onChange={e => setNotes(p => ({ ...p, [selected]: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
