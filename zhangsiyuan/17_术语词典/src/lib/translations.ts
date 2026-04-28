import type { Lang } from './fuzzySearch'

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' },
]

export const CATEGORIES = [
  { id: 'all',       color: '#94a3b8' },
  { id: 'service',   color: '#f59e0b' },
  { id: 'time',      color: '#10b981' },
  { id: 'document',  color: '#8b5cf6' },
  { id: 'weight',    color: '#3b82f6' },
  { id: 'cargo',     color: '#ef4444' },
  { id: 'party',     color: '#ec4899' },
  { id: 'transport', color: '#14b8a6' },
  { id: 'incoterm',  color: '#f97316' },
] as const

export type CategoryId = typeof CATEGORIES[number]['id']

export const UI: Record<Lang, {
  appTitle: string
  appSubtitle: string
  searchPlaceholder: string
  noResults: string
  noResultsHint: string
  termsCount: (n: number) => string
  categories: Record<string, string>
  close: string
  fullNameLabel: string
  categoryLabel: string
  transportLabel: string
  transport: Record<string, string>
  customsLabel: string
  customsExport: string
  customsImport: string
  party: Record<string, string>
  riskLabel: string
  legacyBadge: string
  legacyNote: string
}> = {
  zh: {
    appTitle: 'OPTEC 航空货运术语词典',
    appSubtitle: '涵盖航空服务、时间术语、单据文件、贸易术语等专业词汇',
    searchPlaceholder: '搜索术语、全称或定义…',
    noResults: '未找到匹配结果',
    noResultsHint: '请尝试其他关键词或切换分类',
    termsCount: (n) => `共 ${n} 个术语`,
    categories: {
      all: '全部',
      service: '航空服务',
      time: '时间术语',
      document: '单据文件',
      weight: '重量计费',
      cargo: '货物属性',
      party: '相关方',
      transport: '运输方式',
      incoterm: '贸易术语',
    },
    close: '关闭',
    fullNameLabel: '全称',
    categoryLabel: '分类',
    transportLabel: '适用运输方式',
    transport: { any: '各种运输方式', sea: '海运 / 内河运输', land: '陆运' },
    customsLabel: '海关责任',
    customsExport: '出口报关',
    customsImport: '进口报关',
    party: { buyer: '买方', seller: '卖方' },
    riskLabel: '风险转移',
    legacyBadge: '已废止',
    legacyNote: '此术语已在 Incoterms 2010 / 2020 中被新条款取代',
  },
  en: {
    appTitle: 'OPTEC Air Cargo Glossary',
    appSubtitle: 'Aviation services, time terms, documents, trade terms and more',
    searchPlaceholder: 'Search terms, full names or definitions…',
    noResults: 'No results found',
    noResultsHint: 'Try different keywords or switch category',
    termsCount: (n) => `${n} term${n !== 1 ? 's' : ''}`,
    categories: {
      all: 'All',
      service: 'Aviation Services',
      time: 'Time Terms',
      document: 'Documents',
      weight: 'Weight & Billing',
      cargo: 'Cargo Properties',
      party: 'Trade Parties',
      transport: 'Transport Modes',
      incoterm: 'Incoterms',
    },
    close: 'Close',
    fullNameLabel: 'Full Name',
    categoryLabel: 'Category',
    transportLabel: 'Transport Mode',
    transport: { any: 'Any mode of transport', sea: 'Sea / Inland waterway', land: 'Land transport' },
    customsLabel: 'Customs Responsibility',
    customsExport: 'Export Customs',
    customsImport: 'Import Customs',
    party: { buyer: 'Buyer', seller: 'Seller' },
    riskLabel: 'Risk Transfer',
    legacyBadge: 'Legacy',
    legacyNote: 'This term was replaced in Incoterms 2010 / 2020',
  },
  ja: {
    appTitle: 'OPTEC 航空貨物用語辞典',
    appSubtitle: '航空サービス・時間用語・書類・インコタームズ等の専門用語',
    searchPlaceholder: '用語・正式名称・定義を検索…',
    noResults: '該当する結果が見つかりません',
    noResultsHint: '別のキーワードを試すかカテゴリを変更してください',
    termsCount: (n) => `${n} 件`,
    categories: {
      all: 'すべて',
      service: '航空サービス',
      time: '時間用語',
      document: '書類',
      weight: '重量・課金',
      cargo: '貨物属性',
      party: '取引関係者',
      transport: '輸送方式',
      incoterm: 'インコタームズ',
    },
    close: '閉じる',
    fullNameLabel: '正式名称',
    categoryLabel: 'カテゴリ',
    transportLabel: '適用輸送方式',
    transport: { any: 'あらゆる輸送方式', sea: '海上・内陸水路輸送', land: '陸上輸送' },
    customsLabel: '通関責任',
    customsExport: '輸出通関',
    customsImport: '輸入通関',
    party: { buyer: '買主', seller: '売主' },
    riskLabel: 'リスク移転',
    legacyBadge: '廃止済み',
    legacyNote: 'この条件はインコタームズ 2010 / 2020 で新条件に置き換えられました',
  },
}

export function getCategoryColor(id: string): string {
  return CATEGORIES.find(c => c.id === id)?.color ?? '#94a3b8'
}
