'use client'
import { useState, useMemo } from 'react'

type Lang = 'zh' | 'en' | 'ja'
const LANGS = [{ code: 'zh' as Lang, label: '中文' }, { code: 'en' as Lang, label: 'EN' }, { code: 'ja' as Lang, label: '日本語' }]

type Dept = 'mgmt' | 'ops' | 'sales' | 'cs' | 'fin' | 'it'

interface Person {
  id: string
  name: Record<Lang, string>
  role: Record<Lang, string>
  dept: Dept
  phone: string
  email: string
  ext: string
}

interface Seat {
  id: string
  person: Person | null
}

const DEPTS: { id: Dept; label: Record<Lang, string>; color: string; text: string; border: string }[] = [
  { id: 'mgmt',  label: { zh: '管理层',   en: 'Management', ja: '経営' },       color: 'var(--dept-mgmt)',  text: 'var(--dept-mgmt-t)',  border: 'var(--dept-mgmt-b)'  },
  { id: 'ops',   label: { zh: '操作部',   en: 'Operations', ja: 'オペレーション' }, color: 'var(--dept-ops)',   text: 'var(--dept-ops-t)',   border: 'var(--dept-ops-b)'   },
  { id: 'sales', label: { zh: '销售部',   en: 'Sales',      ja: '営業'          }, color: 'var(--dept-sales)', text: 'var(--dept-sales-t)', border: 'var(--dept-sales-b)' },
  { id: 'cs',    label: { zh: '客服部',   en: 'Customer Service', ja: 'カスタマーサービス' }, color: 'var(--dept-cs)', text: 'var(--dept-cs-t)', border: 'var(--dept-cs-b)' },
  { id: 'fin',   label: { zh: '财务部',   en: 'Finance',    ja: '財務'          }, color: 'var(--dept-fin)',   text: 'var(--dept-fin-t)',   border: 'var(--dept-fin-b)'   },
  { id: 'it',    label: { zh: 'DX/IT部', en: 'DX / IT',   ja: 'DX／IT'        }, color: 'var(--dept-it)',    text: 'var(--dept-it-t)',    border: 'var(--dept-it-b)'    },
]

const PEOPLE: Person[] = [
  { id:'P01', name:{zh:'陈明远',en:'Ming-Yuan Chen',ja:'チェン・ミンユアン'}, role:{zh:'总经理',en:'General Manager',ja:'社長'}, dept:'mgmt', phone:'138-0001-0001', email:'chen.my@optec-exp.com', ext:'101' },
  { id:'P02', name:{zh:'林佳欣',en:'Jia-Xin Lin',ja:'リン・ジャシン'}, role:{zh:'副总经理',en:'Deputy GM',ja:'副社長'}, dept:'mgmt', phone:'138-0001-0002', email:'lin.jx@optec-exp.com', ext:'102' },
  { id:'P03', name:{zh:'王志强',en:'Zhi-Qiang Wang',ja:'ワン・ジーチャン'}, role:{zh:'操作主管',en:'Operations Manager',ja:'オペレーションマネージャー'}, dept:'ops', phone:'138-0002-0001', email:'wang.zq@optec-exp.com', ext:'201' },
  { id:'P04', name:{zh:'张思远',en:'Si-Yuan Zhang',ja:'チャン・スーユアン'}, role:{zh:'DX负责人',en:'DX Lead',ja:'DXリード'}, dept:'it', phone:'138-0006-0001', email:'zhangsiyuan@optec-exp.com', ext:'601' },
  { id:'P05', name:{zh:'赵雅婷',en:'Ya-Ting Zhao',ja:'ジャオ・ヤーティン'}, role:{zh:'操作专员',en:'Operations Specialist',ja:'オペレーション担当'}, dept:'ops', phone:'138-0002-0002', email:'zhao.yt@optec-exp.com', ext:'202' },
  { id:'P06', name:{zh:'刘建国',en:'Jian-Guo Liu',ja:'リュウ・ジェングオ'}, role:{zh:'销售经理',en:'Sales Manager',ja:'営業マネージャー'}, dept:'sales', phone:'138-0003-0001', email:'liu.jg@optec-exp.com', ext:'301' },
  { id:'P07', name:{zh:'孙晓琳',en:'Xiao-Lin Sun',ja:'スン・シャオリン'}, role:{zh:'客服主管',en:'CS Supervisor',ja:'カスタマーサービス主任'}, dept:'cs', phone:'138-0004-0001', email:'sun.xl@optec-exp.com', ext:'401' },
  { id:'P08', name:{zh:'高伟杰',en:'Wei-Jie Gao',ja:'ガオ・ウェイジェ'}, role:{zh:'财务经理',en:'Finance Manager',ja:'財務マネージャー'}, dept:'fin', phone:'138-0005-0001', email:'gao.wj@optec-exp.com', ext:'501' },
  { id:'P09', name:{zh:'周磊',en:'Lei Zhou',ja:'ジョウ・レイ'}, role:{zh:'销售专员',en:'Sales Specialist',ja:'営業担当'}, dept:'sales', phone:'138-0003-0002', email:'zhou.lei@optec-exp.com', ext:'302' },
  { id:'P10', name:{zh:'吴美玲',en:'Mei-Ling Wu',ja:'ウー・メイリン'}, role:{zh:'客服专员',en:'CS Specialist',ja:'カスタマーサービス担当'}, dept:'cs', phone:'138-0004-0002', email:'wu.ml@optec-exp.com', ext:'402' },
  { id:'P11', name:{zh:'陈晓峰',en:'Xiao-Feng Chen',ja:'チェン・シャオフォン'}, role:{zh:'操作专员',en:'Operations Specialist',ja:'オペレーション担当'}, dept:'ops', phone:'138-0002-0003', email:'chen.xf@optec-exp.com', ext:'203' },
  { id:'P12', name:{zh:'李娟',en:'Juan Li',ja:'リー・ジュアン'}, role:{zh:'财务专员',en:'Finance Specialist',ja:'財務担当'}, dept:'fin', phone:'138-0005-0002', email:'li.juan@optec-exp.com', ext:'502' },
  { id:'P13', name:{zh:'杨帆',en:'Fan Yang',ja:'ヤン・ファン'}, role:{zh:'系统工程师',en:'System Engineer',ja:'システムエンジニア'}, dept:'it', phone:'138-0006-0002', email:'yang.fan@optec-exp.com', ext:'602' },
  { id:'P14', name:{zh:'黄小莉',en:'Xiao-Li Huang',ja:'ホアン・シャオリー'}, role:{zh:'销售专员',en:'Sales Specialist',ja:'営業担当'}, dept:'sales', phone:'138-0003-0003', email:'huang.xl@optec-exp.com', ext:'303' },
  { id:'P15', name:{zh:'郑晨',en:'Chen Zheng',ja:'ジョン・チェン'}, role:{zh:'客服专员',en:'CS Specialist',ja:'カスタマーサービス担当'}, dept:'cs', phone:'138-0004-0003', email:'zheng.chen@optec-exp.com', ext:'403' },
]

const SEATS_CONFIG: { zone: Dept; seats: (string|null)[] }[] = [
  { zone: 'mgmt',  seats: ['P01', 'P02', null] },
  { zone: 'ops',   seats: ['P03', 'P05', 'P11', null] },
  { zone: 'sales', seats: ['P06', 'P09', 'P14', null] },
  { zone: 'cs',    seats: ['P07', 'P10', 'P15', null] },
  { zone: 'fin',   seats: ['P08', 'P12', null] },
  { zone: 'it',    seats: ['P04', 'P13', null] },
]

function initials(name: string): string {
  const words = name.split(/[\s-]/)
  return words.map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2)
}

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [selected, setSelected] = useState<Person | null>(null)
  const [filterDept, setFilterDept] = useState<Dept | null>(null)
  const [search, setSearch] = useState('')

  const L = {
    zh: { h1: 'OPTEC Express 座位表', floor: '办公室楼层平面图', empty: '空位', phone: '电话', email: '邮箱', ext: '分机', search: '搜索姓名 / 职位…', allDepts: '全部部门', total: '共', people: '人' },
    en: { h1: 'OPTEC Express Office', floor: 'Office Floor Plan', empty: 'Vacant', phone: 'Phone', email: 'Email', ext: 'Ext.', search: 'Search name / role…', allDepts: 'All Depts', total: '', people: 'people' },
    ja: { h1: 'OPTECオフィス座席表', floor: 'オフィスフロアマップ', empty: '空席', phone: '電話', email: 'メール', ext: '内線', search: '名前・役職で検索…', allDepts: '全部署', total: '合計', people: '名' },
  }[lang]

  const deptCounts = useMemo(() => {
    const m: Record<string, number> = {}
    PEOPLE.forEach(p => { m[p.dept] = (m[p.dept] || 0) + 1 })
    return m
  }, [])

  const matchedIds = useMemo(() => {
    if (!search) return null
    const q = search.toLowerCase()
    return new Set(PEOPLE.filter(p =>
      p.name[lang].toLowerCase().includes(q) || p.role[lang].toLowerCase().includes(q) || p.name.en.toLowerCase().includes(q)
    ).map(p => p.id))
  }, [search, lang])

  const getDept = (id: Dept) => DEPTS.find(d => d.id === id)!

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">🏢</div>
          <span className="header-title">{L.h1}</span>
        </div>
        <div className="lang-switcher">
          {LANGS.map(l => <button key={l.code} className={`lang-btn${lang === l.code ? ' active' : ''}`} onClick={() => setLang(l.code)}>{l.label}</button>)}
        </div>
      </header>
      <div className="main">
        <div className="left-panel">
          <input className="search-box" placeholder={L.search} value={search} onChange={e => setSearch(e.target.value)} />
          <div className="legend">
            <div className="legend-title">{lang === 'zh' ? '部门' : lang === 'en' ? 'Dept' : '部署'}</div>
            <div className={`legend-item${filterDept === null ? ' active-filter' : ''}`} onClick={() => setFilterDept(null)}>
              <div className="legend-dot" style={{ background: 'var(--muted)' }} />
              <span className="legend-name">{L.allDepts}</span>
              <span className="legend-count">{PEOPLE.length}</span>
            </div>
            {DEPTS.map(d => (
              <div key={d.id} className={`legend-item${filterDept === d.id ? ' active-filter' : ''}`} onClick={() => setFilterDept(filterDept === d.id ? null : d.id)}>
                <div className="legend-dot" style={{ background: d.border }} />
                <span className="legend-name">{d.label[lang]}</span>
                <span className="legend-count">{deptCounts[d.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="right-panel">
          <div className="floor-label">{L.floor}</div>
          <div className="office">
            {SEATS_CONFIG.map(({ zone, seats }) => {
              const dept = getDept(zone)
              if (filterDept && filterDept !== zone) return null
              return (
                <div key={zone} className="dept-zone">
                  <div className="dept-header" style={{ background: dept.color, color: dept.text, borderColor: dept.border }}>
                    {dept.label[lang]}
                  </div>
                  <div className="desk-row">
                    {seats.map((pid, i) => {
                      const person = pid ? PEOPLE.find(p => p.id === pid) || null : null
                      const isMatch = matchedIds ? (pid ? matchedIds.has(pid) : false) : true
                      const isDimmed = matchedIds ? !isMatch : false
                      return (
                        <div
                          key={i}
                          className={`desk${!person ? ' empty' : ''}${person === selected ? ' highlighted' : ''}${isDimmed ? ' dimmed' : ''}`}
                          style={{ background: dept.color, borderColor: dept.border }}
                          onClick={() => person && setSelected(selected?.id === person.id ? null : person)}
                        >
                          {person ? (
                            <>
                              <div className="desk-avatar" style={{ background: dept.border, color: dept.text }}>{initials(person.name.en)}</div>
                              <div className="desk-name" style={{ color: dept.text }}>{person.name[lang]}</div>
                              <div className="desk-role" style={{ color: dept.text }}>{person.role[lang]}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{L.empty}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div className="popup-overlay" onClick={() => setSelected(null)}>
          <div className="popup" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setSelected(null)}>×</button>
            {(() => {
              const dept = getDept(selected.dept)
              return (
                <>
                  <div className="popup-avatar" style={{ background: dept.color, color: dept.text, borderColor: dept.border }}>{initials(selected.name.en)}</div>
                  <div className="popup-name">{selected.name[lang]}</div>
                  <div className="popup-role">{selected.role[lang]}</div>
                  <div className="popup-dept" style={{ background: dept.color, color: dept.text, borderColor: dept.border }}>{dept.label[lang]}</div>
                  <div className="popup-info">
                    <div className="popup-info-row"><span className="popup-info-icon">📞</span><span className="popup-info-text">{selected.phone} &nbsp;|&nbsp; {L.ext} {selected.ext}</span></div>
                    <div className="popup-info-row"><span className="popup-info-icon">✉️</span><span className="popup-info-text">{selected.email}</span></div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
