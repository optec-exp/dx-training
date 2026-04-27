// props 示例：LangSwitcher 通过 props 接收当前语言和切换函数
import type { Lang } from '@/data/translations'

type Props = {
  lang: Lang
  setLang: (l: Lang) => void
  labels: { ja: string; zh: string; en: string }
}

export default function LangSwitcher({ lang, setLang, labels }: Props) {
  return (
    <div className="lang-sw">
      {(['ja', 'zh', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`ls-btn${lang === l ? ' active' : ''}`}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  )
}
