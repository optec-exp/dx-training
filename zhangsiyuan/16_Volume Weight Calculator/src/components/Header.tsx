"use client";

import { useApp } from '@/context/AppContext';
import { translations, Language, LANGUAGES } from '@/data/translations';

export function Header() {
  const { language, setLanguage } = useApp();
  const t = translations[language as Language];

  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="header-icon">📦</span>
        <div>
          <h1 className="header-title">{t.title}</h1>
          <p className="header-subtitle">{t.subtitle}</p>
        </div>
      </div>
      <div className="lang-switcher">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            className={`lang-btn${language === lang.code ? ' active' : ''}`}
            onClick={() => setLanguage(lang.code)}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
