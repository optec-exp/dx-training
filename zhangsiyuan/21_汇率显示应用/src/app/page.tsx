'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'

type Lang = 'zh' | 'en' | 'ja'
const LANGS = [{ code: 'zh' as Lang, label: '中文' }, { code: 'en' as Lang, label: 'EN' }, { code: 'ja' as Lang, label: '日本語' }]

interface CurrencyInfo {
  code: string
  name: Record<Lang, string>
  flag: string
  symbol: string
}

const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: { zh: '美元',         en: 'US Dollar',            ja: '米ドル'             }, flag: '🇺🇸', symbol: '$'    },
  { code: 'EUR', name: { zh: '欧元',         en: 'Euro',                 ja: 'ユーロ'             }, flag: '🇪🇺', symbol: '€'    },
  { code: 'CNY', name: { zh: '人民币',       en: 'Chinese Yuan',         ja: '中国元'             }, flag: '🇨🇳', symbol: '¥'    },
  { code: 'JPY', name: { zh: '日元',         en: 'Japanese Yen',         ja: '日本円'             }, flag: '🇯🇵', symbol: '¥'    },
  { code: 'GBP', name: { zh: '英镑',         en: 'British Pound',        ja: '英ポンド'           }, flag: '🇬🇧', symbol: '£'    },
  { code: 'KRW', name: { zh: '韩元',         en: 'Korean Won',           ja: '韓国ウォン'         }, flag: '🇰🇷', symbol: '₩'    },
  { code: 'HKD', name: { zh: '港元',         en: 'Hong Kong Dollar',     ja: '香港ドル'           }, flag: '🇭🇰', symbol: 'HK$'  },
  { code: 'TWD', name: { zh: '新台币',       en: 'Taiwan Dollar',        ja: '台湾ドル'           }, flag: '🇹🇼', symbol: 'NT$'  },
  { code: 'SGD', name: { zh: '新加坡元',     en: 'Singapore Dollar',     ja: 'シンガポールドル'   }, flag: '🇸🇬', symbol: 'S$'   },
  { code: 'AUD', name: { zh: '澳大利亚元',   en: 'Australian Dollar',    ja: '豪ドル'             }, flag: '🇦🇺', symbol: 'A$'   },
  { code: 'CAD', name: { zh: '加拿大元',     en: 'Canadian Dollar',      ja: 'カナダドル'         }, flag: '🇨🇦', symbol: 'C$'   },
  { code: 'CHF', name: { zh: '瑞士法郎',     en: 'Swiss Franc',          ja: 'スイスフラン'       }, flag: '🇨🇭', symbol: 'Fr'   },
  { code: 'INR', name: { zh: '印度卢比',     en: 'Indian Rupee',         ja: 'インドルピー'       }, flag: '🇮🇳', symbol: '₹'    },
  { code: 'THB', name: { zh: '泰铢',         en: 'Thai Baht',            ja: 'タイバーツ'         }, flag: '🇹🇭', symbol: '฿'    },
  { code: 'MYR', name: { zh: '马来西亚林吉特', en: 'Malaysian Ringgit',  ja: 'リンギット'         }, flag: '🇲🇾', symbol: 'RM'   },
  { code: 'IDR', name: { zh: '印尼盾',       en: 'Indonesian Rupiah',    ja: 'インドネシアルピア' }, flag: '🇮🇩', symbol: 'Rp'   },
  { code: 'PHP', name: { zh: '菲律宾比索',   en: 'Philippine Peso',      ja: 'フィリピンペソ'     }, flag: '🇵🇭', symbol: '₱'    },
  { code: 'VND', name: { zh: '越南盾',       en: 'Vietnamese Dong',      ja: 'ベトナムドン'       }, flag: '🇻🇳', symbol: '₫'    },
  { code: 'AED', name: { zh: '迪拜迪拉姆',   en: 'UAE Dirham',           ja: 'UAEディルハム'      }, flag: '🇦🇪', symbol: 'AED'  },
  { code: 'SAR', name: { zh: '沙特里亚尔',   en: 'Saudi Riyal',          ja: 'サウジリヤル'       }, flag: '🇸🇦', symbol: 'SAR'  },
  { code: 'BRL', name: { zh: '巴西雷亚尔',   en: 'Brazilian Real',       ja: 'ブラジルレアル'     }, flag: '🇧🇷', symbol: 'R$'   },
  { code: 'MXN', name: { zh: '墨西哥比索',   en: 'Mexican Peso',         ja: 'メキシコペソ'       }, flag: '🇲🇽', symbol: 'MX$'  },
  { code: 'ZAR', name: { zh: '南非兰特',     en: 'South African Rand',   ja: '南アフリカランド'   }, flag: '🇿🇦', symbol: 'R'    },
  { code: 'NOK', name: { zh: '挪威克朗',     en: 'Norwegian Krone',      ja: 'ノルウェークローネ' }, flag: '🇳🇴', symbol: 'kr'   },
  { code: 'SEK', name: { zh: '瑞典克朗',     en: 'Swedish Krona',        ja: 'スウェーデンクローナ' }, flag: '🇸🇪', symbol: 'kr' },
  { code: 'NZD', name: { zh: '新西兰元',     en: 'New Zealand Dollar',   ja: 'NZドル'             }, flag: '🇳🇿', symbol: 'NZ$'  },
]

const DEFAULT_TARGETS = new Set(['EUR', 'CNY', 'JPY', 'GBP', 'KRW', 'HKD', 'SGD', 'AUD'])
const HIGH_UNIT = new Set(['JPY', 'KRW', 'IDR', 'VND'])

function fmtAmount(n: number, code: string): string {
  if (!isFinite(n)) return '—'
  if (HIGH_UNIT.has(code)) return n.toLocaleString('en', { maximumFractionDigits: 0 })
  if (n < 0.0001) return n.toFixed(6)
  if (n < 1) return n.toFixed(4)
  return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtRate(r: number, code: string): string {
  if (!isFinite(r)) return '—'
  if (HIGH_UNIT.has(code)) return r.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (r < 0.0001) return r.toFixed(6)
  if (r < 0.01) return r.toFixed(5)
  return r.toFixed(4)
}

const getCurrency = (code: string) => CURRENCIES.find(c => c.code === code)

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [from, setFrom] = useState('USD')
  const [amount, setAmount] = useState('1')
  const [targets, setTargets] = useState<Set<string>>(new Set(DEFAULT_TARGETS))
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [rates, setRates] = useState<Record<string, number> | null>(null)
  const [rateDate, setRateDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRates = useCallback(async (d: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/rates?date=${d}`)
      const data = await res.json() as { rates?: Record<string, number>; date?: string; error?: string }
      if (data.error) throw new Error(data.error)
      setRates(data.rates ?? null)
      setRateDate(data.date ?? d)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRates(date) }, [date, fetchRates])

  const numAmount = parseFloat(amount) || 0

  const convert = useCallback((to: string): number => {
    if (!rates) return 0
    const fromRate = rates[from] ?? 1
    const toRate = rates[to] ?? 1
    return numAmount * (toRate / fromRate)
  }, [rates, from, numAmount])

  const getRate = useCallback((to: string): number => {
    if (!rates) return 0
    return (rates[to] ?? 1) / (rates[from] ?? 1)
  }, [rates, from])

  const toggleTarget = (code: string) => {
    if (code === from) return
    setTargets(prev => { const s = new Set(prev); s.has(code) ? s.delete(code) : s.add(code); return s })
  }

  const handleFromChange = (code: string) => {
    setFrom(code)
    setTargets(prev => { const s = new Set(prev); s.delete(code); return s })
  }

  const selectAll = () => setTargets(new Set(CURRENCIES.filter(c => c.code !== from).map(c => c.code)))
  const selectNone = () => setTargets(new Set())

  const activeTargets = useMemo(
    () => CURRENCIES.filter(c => c.code !== from && targets.has(c.code)),
    [targets, from]
  )

  const fromCurrency = getCurrency(from)
  const today = new Date().toISOString().split('T')[0]

  const L = {
    zh: { h1: '汇率转换器', amount: '金额', from: '源币种', date: '日期', targets: '目标币种（多选）',
          selectAll: '全选', selectNone: '清空', loading: '正在获取汇率…',
          source: '数据来源', base: '基准货币', rateDate: '汇率日期',
          noKey: '⚠ 未配置 API Key，请先在 .env.local 中设置 OPEN_EXCHANGE_RATES_APP_ID',
          noTargets: '请在上方选择至少一种目标货币',
          historical: '（历史汇率）', refresh: '刷新' },
    en: { h1: 'Currency Converter', amount: 'Amount', from: 'From', date: 'Date', targets: 'Target Currencies (multi-select)',
          selectAll: 'All', selectNone: 'None', loading: 'Fetching rates…',
          source: 'Source', base: 'Base', rateDate: 'Rate Date',
          noKey: '⚠ API Key not configured. Set OPEN_EXCHANGE_RATES_APP_ID in .env.local',
          noTargets: 'Select at least one target currency above',
          historical: '(historical)', refresh: 'Refresh' },
    ja: { h1: '為替レート換算', amount: '金額', from: '換算元', date: '日付', targets: '換算先通貨（複数選択可）',
          selectAll: '全選', selectNone: 'クリア', loading: 'レート取得中…',
          source: 'データソース', base: '基準通貨', rateDate: 'レート日付',
          noKey: '⚠ APIキーが未設定です。.env.localにOPEN_EXCHANGE_RATES_APP_IDを設定してください',
          noTargets: '上のボタンで換算先通貨を選択してください',
          historical: '（過去レート）', refresh: '更新' },
  }[lang]

  const isHistorical = rateDate && rateDate < today

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">💱</div>
          <span className="header-title">{L.h1}</span>
        </div>
        <div className="lang-switcher">
          {LANGS.map(l => <button key={l.code} className={`lang-btn${lang === l.code ? ' active' : ''}`} onClick={() => setLang(l.code)}>{l.label}</button>)}
        </div>
      </header>

      <div className="main">
        {/* Controls */}
        <div className="controls-card">
          <div className="controls-row">
            <div className="field-group">
              <label>{L.amount}</label>
              <input
                type="number"
                className="amount-input"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
                step="any"
                placeholder="0"
              />
            </div>
            <div className="field-group">
              <label>{L.from}</label>
              <select className="currency-select" value={from} onChange={e => handleFromChange(e.target.value)}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name[lang]}</option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label>{L.date}</label>
              <input
                type="date"
                className="date-input"
                value={date}
                max={today}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <button className="refresh-btn" onClick={() => fetchRates(date)} disabled={loading} title={L.refresh}>
              {loading ? '⟳' : '↻'}
            </button>
          </div>

          <div className="targets-row">
            <span className="targets-label">{L.targets}:</span>
            <div className="targets-toggle">
              {CURRENCIES.filter(c => c.code !== from).map(c => (
                <button
                  key={c.code}
                  className={`target-btn${targets.has(c.code) ? ' active' : ''}`}
                  onClick={() => toggleTarget(c.code)}
                >
                  {c.flag} {c.code}
                </button>
              ))}
            </div>
            <div className="select-btns">
              <button className="select-btn" onClick={selectAll}>{L.selectAll}</button>
              <button className="select-btn" onClick={selectNone}>{L.selectNone}</button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            {error.includes('API') || error.includes('key') || error.includes('configured') ? L.noKey : error}
          </div>
        )}

        {/* From display */}
        {!error && rates && fromCurrency && (
          <div style={{ marginBottom: 12 }}>
            <span className="from-display">
              <span>{fromCurrency.flag}</span>
              <span className="from-display-amount">{fmtAmount(numAmount, from)} {from}</span>
              <span style={{ color: 'var(--muted)' }}>→</span>
              {isHistorical && <span style={{ fontSize: 11, color: 'var(--accent)' }}>{L.historical}</span>}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <span>{L.loading}</span>
          </div>
        )}

        {/* Empty targets */}
        {!loading && !error && rates && activeTargets.length === 0 && (
          <div className="empty-targets">
            <div className="empty-icon">💱</div>
            <div>{L.noTargets}</div>
          </div>
        )}

        {/* Results grid */}
        {!loading && rates && activeTargets.length > 0 && (
          <div className="results-grid">
            {activeTargets.map(c => {
              const result = convert(c.code)
              const rate = getRate(c.code)
              const reverseRate = rate > 0 ? 1 / rate : 0
              return (
                <div key={c.code} className="result-card">
                  <div className="result-header">
                    <span className="result-flag">{c.flag}</span>
                    <div>
                      <div className="result-code">{c.code}</div>
                      <div className="result-name">{c.name[lang]}</div>
                    </div>
                    <button className="remove-btn" onClick={() => toggleTarget(c.code)} title="×">×</button>
                  </div>
                  <div className="result-amount">{c.symbol} {fmtAmount(result, c.code)}</div>
                  <div className="result-rates">
                    <div className="rate-line">1 {from} = {fmtRate(rate, c.code)} {c.code}</div>
                    <div className="rate-line">1 {c.code} = {fmtRate(reverseRate, from)} {from}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        {rates && (
          <div className="footer-info">
            <span>{L.source}: Open Exchange Rates</span>
            <span className="footer-dot">·</span>
            <span>{L.base}: USD</span>
            <span className="footer-dot">·</span>
            <span>{L.rateDate}: {rateDate}</span>
          </div>
        )}
      </div>
    </div>
  )
}
