'use client'
// Context 示例：语言状态存在 Context 里，跨页面共享，切换语言后导航到其他页面也不会重置
import { createContext, useContext, useState } from 'react'
import type { Lang } from '@/data/translations'

type LangCtx = { lang: Lang; setLang: (l: Lang) => void }

const LangContext = createContext<LangCtx>({ lang: 'ja', setLang: () => {} })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ja')
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
