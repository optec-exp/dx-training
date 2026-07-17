export type Lang = "zh" | "ja";

export const DEFAULT_LANG: Lang = "zh";

export type TranslationKey = keyof typeof translations.zh;

export const translations = {
  zh: {
    // header
    appTitle: "月度利润自动分配",
    appDescription: "Air / SEA / EC 三类案件，按业务规则自动计算各小组分得的利润",

    // top bar
    refresh: "刷新数据",
    refreshing: "刷新中…",
    refreshTooltip: "重新从 Kintone 拉取数据",
    dataUpdatedAt: "数据更新于",
    cache: "缓存",

    // stat cards
    statTotalCases: "案件数",
    statTotalProfit: "本月利润合计",
    statTeamCount: "参与分利小组数",

    // summary table headers
    colTeam: "小组",
    colCaseCount: "案件数",
    colMitsumori: "見積",
    colCountry: "顾客所在国",
    colOpExport: "操作-輸出",
    colOpImport: "操作-輸入",
    colKanFee: "自社通关",
    colTotal: "合计",
    colRatio: "占比",

    // detail buttons
    btnDetail: "明细",
    btnCollapse: "收起",
    btnCollapseDetail: "收起明细",
    btnViewDetail: "查看案件明细 →",

    // action bar
    btnExcel: "Excel",
    btnPdf: "PDF",
    btnSlack: "Slack 通知",
    slackSending: "发送中…",
    slackConfirm: "确定要发送 {year}年{month}月 的利润汇总到 Slack 吗？",
    slackSuccess: "已发送到 Slack",
    slackFailed: "Slack 通知发送失败",
    slackException: "Slack 通知请求异常",
    slackSuccessDetail: "{year}年{month}月报告 · 耗时 {seconds}s",
    slackErrorConsole: "详细错误已记录到浏览器控制台（F12 查看）",
    btnRetry: "重试",
    btnClose: "关闭",

    // currency toggle
    currencyJpy: "日元 JPY",
    currencyCny: "人民币 CNY",

    // search
    searchCase: "搜索案件",
    searchPlaceholder: "输入案件番号或顾客名（如 OPT2604350 / UT ロジ）",
    btnClear: "清除",
    foundMatched: "找到 {count} 件匹配的案件",
    truncated: "（还有 {count} 件未显示，输入更具体的关键词缩小范围）",
    noMatched: "本月没有匹配的案件",

    // case card / detail
    lblExport: "输出",
    lblImport: "输入",
    lblMitsumori: "見積",
    lblNoOperation: "操作なし",
    lblGrossProfit: "粗利益",
    lblKanFeeTotal: "請求合計",
    lblAllocationTotal: "分配总和",
    colAllocationBasis: "分配依据",
    colShareAmount: "分得金额",
    colOwnerTeam: "归属小组",
    colCustomer: "顾客名",
    colCountryCode: "国コード",
    colCategory: "类别",
    colCaseNumber: "案件番号",

    // basis labels
    basisEcFull: "EC 全归",
    basisKanFull: "通关全归",
    basisKanFee: "通关请求合计",
    basisMitsumori: "見積 20%",
    basisCountry: "顾客所在国 35%",
    basisOpExport: "操作-輸出",
    basisOpImport: "操作-輸入",

    // messages
    loading: "数据加载中…",
    noData: "本月暂无利润数据",
    noAllocation: "{team} 在本月没有分配明细",
    labelYear: "年",
    labelMonth: "月",

    // language switcher
    lblLanguage: "语言",
    langZh: "中文",
    langJa: "日本語",

    // sheet titles
    sheetSummary: "小组汇总",
    sheetDetail: "案件明细",
    sheetSummaryJpy: "小组汇总 JPY",
    sheetSummaryCny: "小组汇总 CNY",
    pdfTitle: "月度利润分配报告",
    pdfGeneratedAt: "生成于",
    pdfSectionHeading: "各小组利润分配（按合计高到低排序）",
    pdfPage: "第 {n} / {total} 页",
    pdfRowTotal: "合计",

    // targets
    statAchievement: "本月目标达成率",
    colAchievement: "达成率",
    colTarget: "目标",
    lblTarget: "目标",
    lblDiff: "差额",
    lblVsPrev: "环比上月",
    lblPt: "pt",
    achievementNotConfigured: "未配置",
    achievementNoData: "本月暂无目标",
    achievementCnyNotice: "人民币金额仅供参考，目标达成率仅在日元视图显示",
    currencyRefSuffix: "（参考）",
    achvBadgePrecise: "達成",
  },
  ja: {
    // header
    appTitle: "月次利益自動配分",
    appDescription: "Air / SEA / EC 案件を業務ルールに基づき自動配分",

    // top bar
    refresh: "データ更新",
    refreshing: "更新中…",
    refreshTooltip: "Kintone から最新データを取得",
    dataUpdatedAt: "データ更新",
    cache: "キャッシュ",

    // stat cards
    statTotalCases: "案件数",
    statTotalProfit: "今月利益合計",
    statTeamCount: "配分チーム数",

    // summary table headers
    colTeam: "チーム",
    colCaseCount: "案件数",
    colMitsumori: "見積",
    colCountry: "顧客所在国",
    colOpExport: "操作-輸出",
    colOpImport: "操作-輸入",
    colKanFee: "自社通関",
    colTotal: "合計",
    colRatio: "割合",

    // detail buttons
    btnDetail: "明細",
    btnCollapse: "閉じる",
    btnCollapseDetail: "明細を閉じる",
    btnViewDetail: "案件明細を見る →",

    // action bar
    btnExcel: "Excel",
    btnPdf: "PDF",
    btnSlack: "Slack 送信",
    slackSending: "送信中…",
    slackConfirm: "{year}年{month}月の利益配分を Slack に送信しますか？",
    slackSuccess: "Slack に送信しました",
    slackFailed: "Slack 送信失敗",
    slackException: "Slack 送信リクエスト異常",
    slackSuccessDetail: "{year}年{month}月報告 · 所要 {seconds}s",
    slackErrorConsole: "詳細エラーはブラウザコンソール（F12）に記録されました",
    btnRetry: "再試行",
    btnClose: "閉じる",

    // currency toggle
    currencyJpy: "日本円 JPY",
    currencyCny: "人民元 CNY",

    // search
    searchCase: "案件検索",
    searchPlaceholder: "案件番号または顧客名を入力（例：OPT2604350 / UT ロジ）",
    btnClear: "クリア",
    foundMatched: "{count} 件の案件がヒット",
    truncated: "（残り {count} 件は非表示、より具体的なキーワードで絞り込み）",
    noMatched: "今月は該当する案件がありません",

    // case card / detail
    lblExport: "輸出",
    lblImport: "輸入",
    lblMitsumori: "見積",
    lblNoOperation: "操作なし",
    lblGrossProfit: "粗利益",
    lblKanFeeTotal: "請求合計",
    lblAllocationTotal: "配分合計",
    colAllocationBasis: "配分基準",
    colShareAmount: "配分金額",
    colOwnerTeam: "所属チーム",
    colCustomer: "顧客名",
    colCountryCode: "国コード",
    colCategory: "種別",
    colCaseNumber: "案件番号",

    // basis labels
    basisEcFull: "EC 全体",
    basisKanFull: "通関全体",
    basisKanFee: "通関請求合計",
    basisMitsumori: "見積 20%",
    basisCountry: "顧客所在国 35%",
    basisOpExport: "操作-輸出",
    basisOpImport: "操作-輸入",

    // messages
    loading: "データ読み込み中…",
    noData: "今月の利益データはありません",
    noAllocation: "{team} は今月の配分明細がありません",
    labelYear: "年",
    labelMonth: "月",

    // language switcher
    lblLanguage: "言語",
    langZh: "中国語",
    langJa: "日本語",

    // sheet titles
    sheetSummary: "チーム集計",
    sheetDetail: "案件明細",
    sheetSummaryJpy: "チーム集計 JPY",
    sheetSummaryCny: "チーム集計 CNY",
    pdfTitle: "月次利益配分レポート",
    pdfGeneratedAt: "作成日時",
    pdfSectionHeading: "各チーム利益配分（合計高順）",
    pdfPage: "{n} / {total} ページ",
    pdfRowTotal: "合計",

    // targets
    statAchievement: "今月の目標達成率",
    colAchievement: "達成率",
    colTarget: "目標",
    lblTarget: "目標",
    lblDiff: "差額",
    lblVsPrev: "前月比",
    lblPt: "pt",
    achievementNotConfigured: "未設定",
    achievementNoData: "今月の目標未登録",
    achievementCnyNotice: "人民元金額は参考のみ、目標達成率は日本円のみ表示",
    currencyRefSuffix: "（参考のみ）",
    achvBadgePrecise: "達成",
  },
} as const;

export function t(lang: Lang, key: TranslationKey, params?: Record<string, string | number>): string {
  const raw = translations[lang][key] ?? translations.zh[key] ?? String(key);
  if (!params) return raw;
  return Object.entries(params).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    raw
  );
}

export function normalizeLang(v: unknown): Lang {
  if (v === "ja") return "ja";
  return "zh";
}

const TEAM_NAME_JA: Record<string, string> = {
  "通关": "通関",
  "物流开发": "物流開発",
};

export function teamName(lang: Lang, name: string): string {
  if (lang === "ja") {
    return TEAM_NAME_JA[name] ?? name;
  }
  return name;
}
