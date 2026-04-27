'use client'
import { useLanguage } from '@/context/LanguageContext'
import translations from '@/data/translations'

export default function AboutPage() {
  const { lang } = useLanguage()
  const t = translations[lang].about

  return (
    <div className="about-page">

      {/* ─── MAP HERO ─── */}
      <section className="map-hero">
        <div className="map-hero-left">
          <p className="sec-lbl">{t.lbl}</p>
          <h1>{t.h1[0]}<br/><em>{t.h1[1]}</em></h1>
          <p>{t.hero_p}</p>
        </div>

        {/* SVG 世界地图 — office locations updated */}
        <div className="map-right">
          <svg viewBox="0 0 700 560" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <radialGradient id="ocean-grad" cx="60%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#0a1428"/>
                <stop offset="100%" stopColor="#030712"/>
              </radialGradient>
            </defs>
            <rect width="700" height="560" fill="url(#ocean-grad)"/>
            <g className="gline">
              <line x1="0" y1="140" x2="700" y2="140"/><line x1="0" y1="280" x2="700" y2="280"/>
              <line x1="0" y1="420" x2="700" y2="420"/><line x1="116" y1="0" x2="116" y2="560"/>
              <line x1="233" y1="0" x2="233" y2="560"/><line x1="350" y1="0" x2="350" y2="560"/>
              <line x1="466" y1="0" x2="466" y2="560"/><line x1="583" y1="0" x2="583" y2="560"/>
            </g>
            <g className="glow-layer">
              <path className="land" d="M 248,26 L 236,36 L 230,50 L 234,65 L 248,72 L 265,66 L 272,51 L 266,35 Z"/>
              <path className="land" d="M 38,85 L 26,98 L 22,115 L 30,132 L 42,146 L 50,162 L 58,178 L 68,193 L 80,203 L 96,210 L 110,217 L 116,213 L 120,221 L 108,226 L 194,199 L 200,185 L 206,168 L 210,152 L 214,136 L 208,118 L 196,101 L 180,88 L 164,78 L 146,72 L 128,70 L 112,74 L 94,71 L 78,72 L 62,78 Z"/>
              <path className="land" d="M 122,242 L 110,258 L 104,278 L 102,306 L 106,338 L 112,368 L 120,398 L 130,428 L 140,456 L 152,474 L 164,482 L 175,478 L 186,460 L 194,436 L 198,408 L 195,374 L 188,340 L 178,308 L 165,278 L 152,258 L 138,244 Z"/>
              <path className="land" d="M 304,150 L 300,138 L 308,122 L 322,112 L 336,104 L 350,100 L 364,98 L 378,100 L 394,104 L 406,110 L 416,118 L 420,130 L 412,142 L 400,152 L 386,158 L 370,160 L 356,155 L 344,148 L 332,150 L 318,152 L 306,152 Z"/>
              <path className="land" d="M 330,170 L 312,186 L 302,210 L 300,240 L 304,272 L 314,308 L 328,344 L 346,376 L 364,400 L 382,414 L 400,420 L 416,412 L 430,392 L 438,364 L 440,330 L 434,294 L 422,260 L 408,230 L 395,204 L 380,184 L 364,172 L 347,166 Z"/>
              <path className="land" d="M 430,72 L 468,60 L 510,52 L 554,48 L 598,50 L 634,56 L 662,64 L 682,76 L 694,90 L 698,108 L 694,126 L 682,144 L 666,158 L 648,166 L 628,170 L 610,164 L 592,170 L 574,162 L 556,156 L 540,150 L 522,144 L 506,136 L 490,130 L 472,126 L 456,130 L 443,142 L 432,154 L 424,144 L 418,130 L 420,112 L 424,94 L 428,78 Z"/>
              <path className="land" d="M 457,170 L 445,185 L 442,205 L 448,224 L 462,236 L 476,232 L 485,216 L 482,196 L 472,180 Z"/>
              <path className="land" d="M 500,152 L 490,170 L 488,192 L 494,216 L 506,234 L 520,242 L 532,234 L 538,214 L 534,192 L 524,172 L 512,156 Z"/>
              <path className="land" d="M 618,138 L 610,152 L 614,168 L 626,172 L 636,162 L 634,146 L 626,136 Z"/>
              <path className="land" d="M 566,354 L 548,378 L 546,408 L 556,440 L 576,464 L 604,478 L 634,480 L 660,468 L 680,448 L 688,420 L 684,390 L 668,366 L 644,350 L 618,342 L 590,340 L 568,348 Z"/>
            </g>

            {/* ─── Routes from Tokyo HQ to all 7 branches ─── */}
            {/* China cluster (Yantai/Shanghai/HK) */}
            <path className="route2" d="M 622,168 Q 601,153 571,163" style={{ animationDelay: '0.1s' }}/>
            <path className="route2" d="M 622,168 Q 604,172 586,182" style={{ animationDelay: '0.3s' }}/>
            <path className="route2" d="M 622,168 Q 597,188 572,210" style={{ animationDelay: '0.5s' }}/>
            {/* Thailand */}
            <path className="route2" d="M 622,168 Q 584,203 546,238" style={{ animationDelay: '0.7s' }}/>
            {/* UK */}
            <path className="route2" d="M 622,168 Q 490,58 350,120" style={{ animationDelay: '1.0s' }}/>
            {/* Spain */}
            <path className="route2" d="M 622,168 Q 482,76 342,154" style={{ animationDelay: '1.2s' }}/>
            {/* Florida */}
            <path className="route2" d="M 622,168 Q 420,78 195,200" style={{ animationDelay: '1.4s' }}/>

            {/* ─── Tokyo HQ ─── */}
            <circle className="ring-hq" cx="622" cy="168" r="7"/>
            <circle cx="622" cy="168" r="12" fill="var(--gold)" fillOpacity="0.15"/>
            <circle cx="622" cy="168" r="5" fill="var(--gold)" fillOpacity="0.4"/>
            <circle cx="622" cy="168" r="3" fill="#ffe08a"/>
            <text className="clabel-hq" x="632" y="162">TOKYO ★ HQ</text>

            {/* ─── Yantai ─── */}
            <circle className="ring" cx="571" cy="163" r="4" style={{ animationDelay: '0.2s' }}/>
            <circle cx="571" cy="163" r="7" fill="var(--gold)" fillOpacity="0.12"/>
            <circle cx="571" cy="163" r="2.5" fill="#ffe08a"/>
            <text className="clabel" x="530" y="157" textAnchor="end">YANTAI</text>

            {/* ─── Shanghai ─── */}
            <circle className="ring" cx="586" cy="182" r="4" style={{ animationDelay: '0.4s' }}/>
            <circle cx="586" cy="182" r="7" fill="var(--gold)" fillOpacity="0.12"/>
            <circle cx="586" cy="182" r="2.5" fill="#ffe08a"/>
            <text className="clabel" x="540" y="194" textAnchor="end">SHANGHAI</text>

            {/* ─── Hong Kong ─── */}
            <circle className="ring" cx="572" cy="210" r="4" style={{ animationDelay: '0.6s' }}/>
            <circle cx="572" cy="210" r="7" fill="var(--gold)" fillOpacity="0.12"/>
            <circle cx="572" cy="210" r="2.5" fill="#ffe08a"/>
            <text className="clabel" x="534" y="222" textAnchor="end">HONG KONG</text>

            {/* ─── Bangkok ─── */}
            <circle className="ring" cx="546" cy="238" r="4" style={{ animationDelay: '0.8s' }}/>
            <circle cx="546" cy="238" r="7" fill="var(--gold)" fillOpacity="0.12"/>
            <circle cx="546" cy="238" r="2.5" fill="#ffe08a"/>
            <text className="clabel" x="554" y="234">BANGKOK</text>

            {/* ─── UK ─── */}
            <circle className="ring" cx="350" cy="120" r="4" style={{ animationDelay: '1.1s' }}/>
            <circle cx="350" cy="120" r="7" fill="var(--gold)" fillOpacity="0.12"/>
            <circle cx="350" cy="120" r="2.5" fill="#ffe08a"/>
            <text className="clabel" x="358" y="116">UK</text>

            {/* ─── Spain ─── */}
            <circle className="ring" cx="342" cy="154" r="4" style={{ animationDelay: '1.3s' }}/>
            <circle cx="342" cy="154" r="7" fill="var(--gold)" fillOpacity="0.12"/>
            <circle cx="342" cy="154" r="2.5" fill="#ffe08a"/>
            <text className="clabel" x="350" y="150">SPAIN</text>

            {/* ─── Florida ─── */}
            <circle className="ring" cx="195" cy="200" r="4" style={{ animationDelay: '1.5s' }}/>
            <circle cx="195" cy="200" r="7" fill="var(--gold)" fillOpacity="0.12"/>
            <circle cx="195" cy="200" r="2.5" fill="#ffe08a"/>
            <text className="clabel" x="203" y="196">FLORIDA</text>
          </svg>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <div className="stats-row">
        <div className="stat"><div className="stat-n">96</div><div className="stat-l">{t.stats[0]}</div></div>
        <div className="stat"><div className="stat-n">10<span style={{ fontSize: '1.4rem' }}>+</span></div><div className="stat-l">{t.stats[1]}</div></div>
        <div className="stat"><div className="stat-n">7</div><div className="stat-l">{t.stats[2]}</div></div>
        <div className="stat"><div className="stat-n">24/7</div><div className="stat-l">{t.stats[3]}</div></div>
      </div>

      {/* ─── ABOUT BODY ─── */}
      <section className="about-body">
        <div className="about-l">
          <p className="sec-lbl">{t.body_lbl}</p>
          <h2>
            {t.body_h2.split('\n').map((line, i) => (
              <span key={i}>{i > 0 && <br/>}{line}</span>
            ))}
          </h2>
          <p>{t.body_p}</p>
        </div>
        <div className="about-r">
          {t.points.map((pt, i) => (
            <div className="point" key={i}>
              <h3>{pt.h}</h3>
              <p>{pt.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── COMPANY INFO TABLE ─── */}
      <section className="company-info">
        <h2>{t.table_title}</h2>
        <table className="info-table">
          <tbody>
            {t.table.map(([th, td], i) => (
              <tr key={i}><th>{th}</th><td>{td}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ─── LANGUAGE STRIP ─── */}
      <div className="lang-strip">
        {t.lang_strip.map((cell, i) => (
          <div className="lang-cell" key={i}>
            <div className="lang-flag">{cell.flag}</div>
            <div><h3>{cell.h}</h3><p>{cell.p}</p></div>
          </div>
        ))}
      </div>

    </div>
  )
}
