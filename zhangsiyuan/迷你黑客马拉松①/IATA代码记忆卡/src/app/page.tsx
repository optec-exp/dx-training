'use client'
import { useState, useMemo, useEffect, useRef } from 'react'

type Lang = 'zh' | 'en' | 'ja'
const LANGS = [{ code: 'zh' as Lang, label: '中文' }, { code: 'en' as Lang, label: 'EN' }, { code: 'ja' as Lang, label: '日本語' }]

type Mode = 'iata-to-city' | 'city-to-iata'

interface Airport {
  iata: string
  city: Record<Lang, string>
  country: Record<Lang, string>
  name: string
}

const AIRPORTS: Airport[] = [
  { iata:'NRT', city:{zh:'东京成田',en:'Tokyo Narita',ja:'東京成田'},     country:{zh:'日本',en:'Japan',ja:'日本'},         name:'Narita International Airport' },
  { iata:'HND', city:{zh:'东京羽田',en:'Tokyo Haneda',ja:'東京羽田'},     country:{zh:'日本',en:'Japan',ja:'日本'},         name:'Tokyo Haneda Airport' },
  { iata:'KIX', city:{zh:'大阪关西',en:'Osaka Kansai',ja:'大阪関西'},     country:{zh:'日本',en:'Japan',ja:'日本'},         name:'Kansai International Airport' },
  { iata:'PVG', city:{zh:'上海浦东',en:'Shanghai Pudong',ja:'上海浦東'},   country:{zh:'中国',en:'China',ja:'中国'},         name:'Shanghai Pudong Intl Airport' },
  { iata:'PEK', city:{zh:'北京首都',en:'Beijing Capital',ja:'北京首都'},   country:{zh:'中国',en:'China',ja:'中国'},         name:'Beijing Capital Intl Airport' },
  { iata:'PKX', city:{zh:'北京大兴',en:'Beijing Daxing',ja:'北京大興'},    country:{zh:'中国',en:'China',ja:'中国'},         name:'Beijing Daxing Intl Airport' },
  { iata:'CAN', city:{zh:'广州',    en:'Guangzhou',    ja:'広州'},         country:{zh:'中国',en:'China',ja:'中国'},         name:'Guangzhou Baiyun Intl Airport' },
  { iata:'HKG', city:{zh:'香港',    en:'Hong Kong',    ja:'香港'},         country:{zh:'香港',en:'Hong Kong',ja:'香港'},     name:'Hong Kong Intl Airport' },
  { iata:'TPE', city:{zh:'台北桃园', en:'Taipei Taoyuan',ja:'台北桃園'},   country:{zh:'台湾',en:'Taiwan',ja:'台湾'},        name:'Taiwan Taoyuan Intl Airport' },
  { iata:'ICN', city:{zh:'首尔仁川', en:'Seoul Incheon', ja:'ソウル仁川'}, country:{zh:'韩国',en:'South Korea',ja:'韓国'},   name:'Incheon Intl Airport' },
  { iata:'SIN', city:{zh:'新加坡',  en:'Singapore',    ja:'シンガポール'}, country:{zh:'新加坡',en:'Singapore',ja:'シンガポール'}, name:'Singapore Changi Airport' },
  { iata:'BKK', city:{zh:'曼谷素万那普',en:'Bangkok Suvarnabhumi',ja:'バンコクスワンナプーム'}, country:{zh:'泰国',en:'Thailand',ja:'タイ'}, name:'Suvarnabhumi Airport' },
  { iata:'DMK', city:{zh:'曼谷廊曼',en:'Bangkok Don Mueang',ja:'バンコクドンムアン'}, country:{zh:'泰国',en:'Thailand',ja:'タイ'}, name:'Don Mueang Intl Airport' },
  { iata:'KUL', city:{zh:'吉隆坡',  en:'Kuala Lumpur', ja:'クアラルンプール'}, country:{zh:'马来西亚',en:'Malaysia',ja:'マレーシア'}, name:'Kuala Lumpur Intl Airport' },
  { iata:'CGK', city:{zh:'雅加达',  en:'Jakarta',      ja:'ジャカルタ'},   country:{zh:'印尼',en:'Indonesia',ja:'インドネシア'}, name:'Soekarno-Hatta Intl Airport' },
  { iata:'BOM', city:{zh:'孟买',    en:'Mumbai',       ja:'ムンバイ'},     country:{zh:'印度',en:'India',ja:'インド'},      name:'Chhatrapati Shivaji Maharaj Airport' },
  { iata:'DEL', city:{zh:'新德里',  en:'New Delhi',    ja:'ニューデリー'}, country:{zh:'印度',en:'India',ja:'インド'},      name:'Indira Gandhi Intl Airport' },
  { iata:'DXB', city:{zh:'迪拜',    en:'Dubai',        ja:'ドバイ'},       country:{zh:'阿联酋',en:'UAE',ja:'UAE'},         name:'Dubai Intl Airport' },
  { iata:'AUH', city:{zh:'阿布扎比',en:'Abu Dhabi',    ja:'アブダビ'},     country:{zh:'阿联酋',en:'UAE',ja:'UAE'},         name:'Abu Dhabi Intl Airport' },
  { iata:'DOH', city:{zh:'多哈',    en:'Doha',         ja:'ドーハ'},       country:{zh:'卡塔尔',en:'Qatar',ja:'カタール'},   name:'Hamad Intl Airport' },
  { iata:'FRA', city:{zh:'法兰克福',en:'Frankfurt',    ja:'フランクフルト'}, country:{zh:'德国',en:'Germany',ja:'ドイツ'},   name:'Frankfurt Airport' },
  { iata:'LHR', city:{zh:'伦敦希思罗',en:'London Heathrow',ja:'ロンドンヒースロー'}, country:{zh:'英国',en:'UK',ja:'英国'}, name:'London Heathrow Airport' },
  { iata:'CDG', city:{zh:'巴黎戴高乐',en:'Paris CDG',  ja:'パリCDG'},     country:{zh:'法国',en:'France',ja:'フランス'},   name:'Charles de Gaulle Airport' },
  { iata:'AMS', city:{zh:'阿姆斯特丹',en:'Amsterdam',  ja:'アムステルダム'}, country:{zh:'荷兰',en:'Netherlands',ja:'オランダ'}, name:'Amsterdam Airport Schiphol' },
  { iata:'JFK', city:{zh:'纽约肯尼迪',en:'New York JFK',ja:'ニューヨークJFK'}, country:{zh:'美国',en:'USA',ja:'アメリカ'}, name:'John F. Kennedy Intl Airport' },
  { iata:'LAX', city:{zh:'洛杉矶',  en:'Los Angeles',  ja:'ロサンゼルス'}, country:{zh:'美国',en:'USA',ja:'アメリカ'},      name:'Los Angeles Intl Airport' },
  { iata:'ORD', city:{zh:'芝加哥奥黑尔',en:"Chicago O'Hare",ja:"シカゴオヘア"}, country:{zh:'美国',en:'USA',ja:'アメリカ'}, name:"Chicago O'Hare Intl Airport" },
  { iata:'SYD', city:{zh:'悉尼',    en:'Sydney',       ja:'シドニー'},     country:{zh:'澳大利亚',en:'Australia',ja:'オーストラリア'}, name:'Sydney Kingsford Smith Airport' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [mode, setMode] = useState<Mode>('iata-to-city')
  const [deck, setDeck] = useState(() => shuffle(AIRPORTS))
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'correct'|'wrong'|null>(null)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const card = deck[idx]
  const total = deck.length
  const done = idx >= total

  const L = {
    zh: { h1:'IATA 代码记忆卡', correct:'正确', wrong:'错误', remain:'剩余', iataToCity:'看代码猜城市', cityToIata:'看城市猜代码',
          typeCode:'输入IATA代码', guess:'确认', skip:'跳过', next:'下一题', restart:'再来一次',
          doneTitle:'完成！', doneSub:(c:number,t:number)=>`答对 ${c} / ${t} 题`,
          tapFlip:'点击卡片查看答案', frontHint:'这是哪个城市？', backHint:'答案' },
    en: { h1:'IATA Code Flashcards', correct:'Correct', wrong:'Wrong', remain:'Left', iataToCity:'IATA → City', cityToIata:'City → IATA',
          typeCode:'Type IATA code', guess:'Submit', skip:'Skip', next:'Next', restart:'Restart',
          doneTitle:'All done!', doneSub:(c:number,t:number)=>`${c} correct out of ${t}`,
          tapFlip:'Click card to reveal', frontHint:'Which city?', backHint:'Answer' },
    ja: { h1:'IATA コード記憶カード', correct:'正解', wrong:'不正解', remain:'残り', iataToCity:'コード→都市', cityToIata:'都市→コード',
          typeCode:'IATAコードを入力', guess:'確認', skip:'スキップ', next:'次へ', restart:'もう一度',
          doneTitle:'完了！', doneSub:(c:number,t:number)=>`${t}問中${c}問正解`,
          tapFlip:'カードをクリックして確認', frontHint:'どの都市？', backHint:'答え' },
  }[lang]

  const restart = () => {
    setDeck(shuffle(AIRPORTS))
    setIdx(0)
    setFlipped(false)
    setAnswer('')
    setFeedback(null)
    setCorrect(0)
    setWrong(0)
  }

  const changeMode = (m: Mode) => {
    setMode(m)
    restart()
  }

  const submit = () => {
    if (!card || feedback) return
    const ans = answer.trim().toUpperCase()
    const isCorrect = mode === 'city-to-iata'
      ? ans === card.iata
      : ans.toLowerCase() === card.city[lang].toLowerCase() || ans.toLowerCase() === card.city.en.toLowerCase()
    setFeedback(isCorrect ? 'correct' : 'wrong')
    setFlipped(true)
    if (isCorrect) setCorrect(c => c+1); else setWrong(w => w+1)
  }

  const next = () => {
    setIdx(i => i+1)
    setFlipped(false)
    setAnswer('')
    setFeedback(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  useEffect(() => { inputRef.current?.focus() }, [idx])

  if (done) return (
    <div className="app">
      <header className="header">
        <div className="header-brand"><div className="header-icon">✈</div><span className="header-title">{L.h1}</span></div>
        <div className="lang-switcher">{LANGS.map(l => <button key={l.code} className={`lang-btn${lang===l.code?' active':''}`} onClick={()=>setLang(l.code)}>{l.label}</button>)}</div>
      </header>
      <div className="main">
        <div className="done-screen">
          <div className="done-icon">{correct >= total*0.8 ? '🏆' : correct >= total*0.5 ? '👍' : '📚'}</div>
          <div className="done-title">{L.doneTitle}</div>
          <div className="done-score">{L.doneSub(correct, total)}</div>
          <button className="restart-btn" onClick={restart}>{L.restart}</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand"><div className="header-icon">✈</div><span className="header-title">{L.h1}</span></div>
        <div className="lang-switcher">{LANGS.map(l => <button key={l.code} className={`lang-btn${lang===l.code?' active':''}`} onClick={()=>setLang(l.code)}>{l.label}</button>)}</div>
      </header>
      <div className="main">
        <div className="score-bar">
          <div className="score-item"><div className="score-num correct">{correct}</div><div className="score-label">{L.correct}</div></div>
          <div className="score-div"/>
          <div className="score-item"><div className="score-num wrong">{wrong}</div><div className="score-label">{L.wrong}</div></div>
          <div className="score-div"/>
          <div className="score-item"><div className="score-num remain">{total - idx}</div><div className="score-label">{L.remain}</div></div>
          <div className="mode-btns">
            <button className={`mode-btn${mode==='iata-to-city'?' active':''}`} onClick={()=>changeMode('iata-to-city')}>{L.iataToCity}</button>
            <button className={`mode-btn${mode==='city-to-iata'?' active':''}`} onClick={()=>changeMode('city-to-iata')}>{L.cityToIata}</button>
          </div>
        </div>

        <div className="card-wrap">
          <div className={`card${flipped?' flipped':''}`} onClick={()=>!feedback && setFlipped(f=>!f)}>
            <div className={`card-face card-front${feedback==='correct'?' correct-flash':feedback==='wrong'?' wrong-flash':''}`}>
              {mode === 'iata-to-city' ? (
                <>
                  <div className="card-iata">{card.iata}</div>
                  <div className="card-prompt">{L.frontHint}</div>
                </>
              ) : (
                <>
                  <div className="card-city">{card.city[lang]}</div>
                  <div className="card-country">{card.country[lang]}</div>
                  <div className="card-airport">{card.name}</div>
                  <div className="card-prompt">{L.typeCode}</div>
                </>
              )}
              {!feedback && <div className="card-click-hint">{L.tapFlip}</div>}
            </div>
            <div className="card-face card-back">
              {mode === 'iata-to-city' ? (
                <>
                  <div className="card-city">{card.city[lang]}</div>
                  <div className="card-country">{card.country[lang]}</div>
                  <div className="card-airport">{card.name}</div>
                  <div style={{marginTop:8,fontFamily:'monospace',fontSize:13,color:'var(--muted)'}}>{card.iata}</div>
                </>
              ) : (
                <>
                  <div className="card-iata">{card.iata}</div>
                  <div style={{fontSize:13,color:'var(--text2)',marginTop:6}}>{card.city[lang]}</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="answer-area">
          {!feedback ? (
            <>
              <input
                ref={inputRef}
                className="answer-input"
                placeholder={mode==='city-to-iata'?'???':'???'}
                value={answer}
                onChange={e=>setAnswer(mode==='city-to-iata'?e.target.value.toUpperCase():e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submit()}
                maxLength={mode==='city-to-iata'?3:40}
              />
              <div className="answer-btns">
                <button className="answer-btn submit" onClick={submit}>{L.guess}</button>
                <button className="answer-btn skip" onClick={()=>{setWrong(w=>w+1);next()}}>{L.skip}</button>
              </div>
            </>
          ) : (
            <>
              <div className={`feedback ${feedback}`}>
                {feedback==='correct'?(lang==='zh'?'✓ 正确！':lang==='en'?'✓ Correct!':'✓ 正解！'):(lang==='zh'?`✗ 正确答案: ${mode==='city-to-iata'?card.iata:card.city[lang]}`:lang==='en'?`✗ Answer: ${mode==='city-to-iata'?card.iata:card.city.en}`:`✗ 正解: ${mode==='city-to-iata'?card.iata:card.city[lang]}`)}
              </div>
              <button className="answer-btn next" onClick={next}>{L.next} →</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
