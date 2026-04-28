'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

export type Lang = 'ja' | 'zh' | 'en'

type LangCtx = { lang: Lang; setLang: (l: Lang) => void }

const LanguageContext = createContext<LangCtx>({ lang: 'ja', setLang: () => {} })

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ja')
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
