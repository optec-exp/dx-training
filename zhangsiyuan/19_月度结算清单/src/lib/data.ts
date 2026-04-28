import type { ChecklistItem } from './types'

export const CHECKLIST: ChecklistItem[] = [
  // ── AR 应收账款 ────────────────────────────────────
  {
    id: 'ar-01',
    category: 'ar',
    deadlineDay: 3,
    priority: 'high',
    label: { zh: '应收账款余额核对', en: 'AR Balance Reconciliation', ja: '売掛金残高照合' },
    note:  { zh: '核对系统与台账中的应收余额，确认一致', en: 'Verify AR balances between system and ledger', ja: 'システムと台帳の売掛金残高を照合する' },
  },
  {
    id: 'ar-02',
    category: 'ar',
    deadlineDay: 5,
    priority: 'high',
    label: { zh: '销售发票开具确认', en: 'Sales Invoice Issuance Check', ja: '売上請求書発行確認' },
    note:  { zh: '确认上月所有销售发票已开具完毕', en: 'Confirm all sales invoices for the month have been issued', ja: '先月の全請求書の発行完了を確認する' },
  },
  {
    id: 'ar-03',
    category: 'ar',
    deadlineDay: 8,
    priority: 'medium',
    label: { zh: '收款到账确认', en: 'Payment Receipt Confirmation', ja: '入金確認' },
    note:  { zh: '确认客户付款是否按时到账，标记未到账客户', en: 'Confirm customer payments received; flag outstanding accounts', ja: '顧客入金の確認、未入金先をマークする' },
  },
  {
    id: 'ar-04',
    category: 'ar',
    deadlineDay: 10,
    priority: 'medium',
    label: { zh: '逾期应收账款跟进', en: 'Overdue AR Follow-up', ja: '売掛金督促対応' },
    note:  { zh: '对超期未付账款发送催款通知', en: 'Send reminders for overdue receivables', ja: '期限超過の売掛金に督促を送付する' },
  },

  // ── AP 应付账款 ────────────────────────────────────
  {
    id: 'ap-01',
    category: 'ap',
    deadlineDay: 5,
    priority: 'high',
    label: { zh: '采购发票核对', en: 'Purchase Invoice Verification', ja: '仕入請求書確認' },
    note:  { zh: '核对所有供应商发票与采购订单一致', en: 'Match all supplier invoices against purchase orders', ja: '全仕入請求書を発注書と照合する' },
  },
  {
    id: 'ap-02',
    category: 'ap',
    deadlineDay: 7,
    priority: 'high',
    label: { zh: '费用报销审批', en: 'Expense Reimbursement Approval', ja: '経費精算承認' },
    note:  { zh: '完成所有员工费用报销单的审批', en: 'Approve all employee expense claims', ja: '全社員の経費精算を承認する' },
  },
  {
    id: 'ap-03',
    category: 'ap',
    deadlineDay: 12,
    priority: 'medium',
    label: { zh: '预付款结清确认', en: 'Prepayment Settlement Check', ja: '仮払精算確認' },
    note:  { zh: '确认上月预付款已全部结清并入账', en: 'Verify all prepayments from last month are settled', ja: '前月の仮払金が全額精算・計上済か確認する' },
  },
  {
    id: 'ap-04',
    category: 'ap',
    deadlineDay: 15,
    priority: 'medium',
    label: { zh: '应付账款付款执行', en: 'AP Payment Execution', ja: '買掛金支払実行' },
    note:  { zh: '按付款计划执行本月到期的供应商付款', en: 'Execute scheduled supplier payments due this month', ja: '当月支払予定の仕入先へ支払を実行する' },
  },

  // ── 对账 ──────────────────────────────────────────
  {
    id: 'rec-01',
    category: 'reconcile',
    deadlineDay: 8,
    priority: 'high',
    label: { zh: '银行余额对账', en: 'Bank Reconciliation', ja: '銀行残高照合' },
    note:  { zh: '将银行对账单与系统账目逐笔核对', en: 'Reconcile bank statement against system records line by line', ja: '銀行明細とシステム残高を1件ずつ照合する' },
  },
  {
    id: 'rec-02',
    category: 'reconcile',
    deadlineDay: 10,
    priority: 'high',
    label: { zh: '收入确认核对', en: 'Revenue Recognition Check', ja: '売上計上確認' },
    note:  { zh: '确认当月收入计提符合会计准则', en: 'Confirm revenue recognition complies with accounting standards', ja: '当月の売上計上が会計基準に準拠していることを確認する' },
  },
  {
    id: 'rec-03',
    category: 'reconcile',
    deadlineDay: 10,
    priority: 'medium',
    label: { zh: '固定资产台账确认', en: 'Fixed Asset Register Check', ja: '固定資産台帳確認' },
    note:  { zh: '核对固定资产台账与实物清单一致', en: 'Verify fixed asset register matches physical inventory', ja: '固定資産台帳と実物リストを照合する' },
  },
  {
    id: 'rec-04',
    category: 'reconcile',
    deadlineDay: 15,
    priority: 'medium',
    label: { zh: '薪资核对', en: 'Payroll Reconciliation', ja: '給与計算確認' },
    note:  { zh: '核对薪资计算表与出勤记录，确认无误', en: 'Cross-check payroll calculations against attendance records', ja: '給与計算書と出勤記録を照合し、誤りがないか確認する' },
  },

  // ── 报告 ──────────────────────────────────────────
  {
    id: 'rep-01',
    category: 'report',
    deadlineDay: 18,
    priority: 'high',
    label: { zh: '月度损益表（P&L）编制', en: 'Monthly P&L Statement', ja: '月次損益計算書作成' },
    note:  { zh: '编制并审核本月损益报表', en: 'Prepare and review the monthly profit & loss statement', ja: '当月の損益計算書を作成・レビューする' },
  },
  {
    id: 'rep-02',
    category: 'report',
    deadlineDay: 18,
    priority: 'high',
    label: { zh: '资产负债表确认', en: 'Balance Sheet Review', ja: '貸借対照表確認' },
    note:  { zh: '确认资产负债表各科目余额合理', en: 'Review all balance sheet account balances for accuracy', ja: 'BS各勘定科目の残高が適正かレビューする' },
  },
  {
    id: 'rep-03',
    category: 'report',
    deadlineDay: 20,
    priority: 'medium',
    label: { zh: '部门预算实绩对比分析', en: 'Budget vs Actual Analysis', ja: '部門別予実比較' },
    note:  { zh: '分析各部门预算执行情况并标注差异原因', en: 'Analyze budget variance by department and note reasons', ja: '各部門の予算実績差異を分析し、理由を記載する' },
  },
  {
    id: 'rep-04',
    category: 'report',
    deadlineDay: 20,
    priority: 'medium',
    label: { zh: '税务申报数据准备', en: 'Tax Filing Data Preparation', ja: '税務申告データ準備' },
    note:  { zh: '整理用于税务申报的数据和凭证', en: 'Compile data and documentation for tax filings', ja: '税務申告に必要なデータと証憑を整理する' },
  },

  // ── 审批 ──────────────────────────────────────────
  {
    id: 'app-01',
    category: 'approval',
    deadlineDay: 22,
    priority: 'high',
    label: { zh: '管理层月度报告提交', en: 'Management Report Submission', ja: '経営月次報告提出' },
    note:  { zh: '向管理层提交完整的月度经营报告', en: 'Submit the complete monthly management report to leadership', ja: '経営層への月次経営報告書を提出する' },
  },
  {
    id: 'app-02',
    category: 'approval',
    deadlineDay: 25,
    priority: 'medium',
    label: { zh: '审计文件整理归档', en: 'Audit Document Filing', ja: '監査書類整理・保管' },
    note:  { zh: '整理并归档本月所有会计凭证和审计文件', en: 'Organize and archive all accounting documents for audit', ja: '当月の会計証憑・監査書類を整理・保管する' },
  },
  {
    id: 'app-03',
    category: 'approval',
    deadlineDay: 28,
    priority: 'low',
    label: { zh: '下月预算计划确认', en: 'Next Month Budget Plan Review', ja: '翌月予算計画確認' },
    note:  { zh: '确认并批准下月预算计划', en: 'Review and approve the budget plan for the upcoming month', ja: '翌月の予算計画を確認・承認する' },
  },
]

export const CATEGORIES = [
  { id: 'ar',         color: '#4f8ef7' },
  { id: 'ap',         color: '#f7a24f' },
  { id: 'reconcile',  color: '#4fc8f7' },
  { id: 'report',     color: '#9d7ef7' },
  { id: 'approval',   color: '#4ff7a2' },
] as const
