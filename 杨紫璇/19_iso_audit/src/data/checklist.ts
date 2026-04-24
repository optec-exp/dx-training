export type Verdict = '✓' | '▽' | '×' | null;

export interface CheckItem {
  id: number;
  clause: string;
  requirement: string;
  evidence: string;
}

export interface Department {
  id: string;
  name: string;
  items: CheckItem[];
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'management',
    name: '管理层',
    items: [
      { id: 1, clause: '4.1', requirement: '组织已识别影响质量管理体系的内外部因素', evidence: '查阅SWOT分析/战略规划文件' },
      { id: 2, clause: '4.2', requirement: '组织已识别相关方及其需求和期望', evidence: '查阅相关方分析表/会议记录' },
      { id: 3, clause: '4.3', requirement: '质量管理体系范围已文件化', evidence: '查阅质量手册第一章' },
      { id: 4, clause: '5.1', requirement: '最高管理者对质量管理体系的领导力和承诺有证据', evidence: '管理评审记录/质量政策签署文件' },
      { id: 5, clause: '5.2', requirement: '质量方针已制定、传达并被员工理解', evidence: '质量方针展示/员工访谈' },
      { id: 6, clause: '6.1', requirement: '风险和机遇已识别并制定应对措施', evidence: '风险登记册/应对措施计划' },
      { id: 7, clause: '6.3', requirement: '变更管理有计划并按计划执行', evidence: '变更申请表/变更记录' },
      { id: 8, clause: '9.3', requirement: '管理评审按计划定期进行', evidence: '管理评审报告/会议签到表' },
      { id: 9, clause: '9.3.2', requirement: '管理评审输入包含所有规定内容', evidence: '管理评审议程/记录' },
      { id: 10, clause: '9.3.3', requirement: '管理评审输出包含改进决策和资源需求', evidence: '管理评审输出清单' },
      { id: 11, clause: '10.1', requirement: '持续改进机制已建立并实施', evidence: '改进项目台账/KPI趋势图' },
      { id: 12, clause: '10.3', requirement: '组织持续改进质量管理体系的适宜性和有效性', evidence: '年度改进计划/绩效报告' },
    ],
  },
  {
    id: 'hr',
    name: '总务人事部',
    items: [
      { id: 13, clause: '5.3', requirement: '组织内相关岗位的职责、权限已分配并传达', evidence: '岗位职责说明书/组织架构图' },
      { id: 14, clause: '6.2', requirement: '质量目标已建立，按职能分解，包含可测量指标', evidence: '部门质量目标表/KPI分解表' },
      { id: 15, clause: '7.1.2', requirement: '人员配置满足质量管理体系运行要求', evidence: '人员编制表/岗位招聘计划' },
      { id: 16, clause: '7.1.3', requirement: '基础设施（办公设备、IT系统）得到维护', evidence: '设备台账/维护保养记录' },
      { id: 17, clause: '7.1.4', requirement: '过程运行环境（办公环境、保密条件）受控', evidence: '工作环境检查记录' },
      { id: 18, clause: '7.2', requirement: '员工能力已识别，培训有效性得到评估', evidence: '培训计划/培训记录/考核结果' },
      { id: 19, clause: '7.3', requirement: '员工了解质量方针、目标及其对体系的贡献', evidence: '员工访谈/意识培训记录' },
    ],
  },
  {
    id: 'dx',
    name: 'DX部门',
    items: [
      { id: 20, clause: '6.2', requirement: '部门质量目标已制定，含数字化转型指标', evidence: '部门目标文件/数字化路线图' },
      { id: 21, clause: '7.1.3', requirement: '信息技术基础设施（服务器、系统）维护记录完整', evidence: 'IT资产台账/维护日志' },
      { id: 22, clause: '7.5', requirement: '文件化信息（电子文件）按规定创建、更新和控制', evidence: '文件管理系统/版本控制记录' },
      { id: 23, clause: '8.1', requirement: '运营规划过程已定义并实施数字化工具', evidence: '系统需求文档/上线验收记录' },
      { id: 24, clause: '9.1.1', requirement: '数据分析和评价方法已确定并实施', evidence: '数据报表/分析报告' },
      { id: 25, clause: '10.2', requirement: '数字化系统问题已识别，纠正措施已实施', evidence: '问题跟踪记录/改善报告' },
    ],
  },
  {
    id: 'finance',
    name: '财务部',
    items: [
      { id: 26, clause: '6.2', requirement: '财务部质量目标已建立并与公司目标一致', evidence: '财务部目标文件/预算计划' },
      { id: 27, clause: '7.1.1', requirement: '资源配置满足质量管理体系和业务运营需要', evidence: '年度预算审批/资源配置报告' },
      { id: 28, clause: '7.5', requirement: '财务文件化信息受控（合同、发票、账务记录）', evidence: '文件归档记录/审计痕迹' },
      { id: 29, clause: '8.4', requirement: '外部供应商（银行、审计机构）管理有评估记录', evidence: '供应商评估表/合作协议' },
      { id: 30, clause: '9.1.1', requirement: '财务绩效监测方法已建立并定期实施', evidence: '月度财务报表/KPI监测记录' },
      { id: 31, clause: '10.2', requirement: '财务差错已记录，纠正措施已实施并验证效果', evidence: '差错记录/纠正措施台账' },
    ],
  },
  {
    id: 'operations',
    name: '业务部',
    items: [
      { id: 32, clause: '6.2', requirement: '业务部质量目标已制定，含客户满意度指标', evidence: '业务部目标文件' },
      { id: 33, clause: '8.2', requirement: '与客户沟通机制已建立，客户要求已明确记录', evidence: '客户沟通记录/需求确认单' },
      { id: 34, clause: '8.4', requirement: '外部供应商（航空公司、港口）评估和监控有记录', evidence: '供应商评估表/绩效记录' },
      { id: 35, clause: '8.5.1', requirement: '货运操作在受控条件下进行，作业程序已文件化', evidence: '操作规程/作业指导书' },
      { id: 36, clause: '8.5.2', requirement: '可追溯性要求已明确，货物状态标识受控', evidence: '货物跟踪记录/状态标识规定' },
      { id: 37, clause: '8.5.3', requirement: '客户财产（货物、文件）得到妥善保护', evidence: '财产保护规定/异常处理记录' },
      { id: 38, clause: '8.5.4', requirement: '货物保存（储存条件、防损措施）措施已实施', evidence: '仓储管理规定/温控记录' },
      { id: 39, clause: '8.5.5', requirement: '交付后活动（跟进、投诉处理）有程序并执行', evidence: '交付后服务记录/投诉台账' },
      { id: 40, clause: '8.5.6', requirement: '变更控制（临时航线、特殊货物）有审批和记录', evidence: '变更审批单/临时方案记录' },
      { id: 41, clause: '8.6', requirement: '产品和服务放行前验证已完成并有记录', evidence: '放行核查表/出货确认单' },
      { id: 42, clause: '8.7', requirement: '不合格输出（延误、损货）已识别并控制', evidence: '不合格品记录/处理结果' },
      { id: 43, clause: '9.1.2', requirement: '客户满意度已监测，结果用于改进', evidence: '客户满意度调查/分析报告' },
    ],
  },
  {
    id: 'marketing',
    name: '市场开发部',
    items: [
      { id: 44, clause: '4.1', requirement: '市场环境（竞争态势、客户需求趋势）已分析', evidence: '市场分析报告/竞品研究' },
      { id: 45, clause: '4.2', requirement: '目标客户群及其期望已识别和文件化', evidence: '客户画像文件/需求分析' },
      { id: 46, clause: '5.2', requirement: '市场部了解并能传达质量方针对业务的意义', evidence: '员工访谈/培训记录' },
      { id: 47, clause: '6.2', requirement: '市场部质量目标含新客户获取、满意度等指标', evidence: '部门目标文件/销售KPI' },
      { id: 48, clause: '7.1.3', requirement: '市场推广工具和资源（CRM、展会设备）受控', evidence: 'CRM系统账号管理/资产台账' },
      { id: 49, clause: '7.2', requirement: '市场开发人员具备所需能力并有培训记录', evidence: '人员能力评估/培训记录' },
      { id: 50, clause: '7.4', requirement: '市场推广信息（对外宣传、报价）经审核后发布', evidence: '宣传材料审批记录/报价审批流' },
      { id: 51, clause: '8.2', requirement: '客户询盘、报价、签约过程有规范程序', evidence: '销售管理程序/合同模板' },
      { id: 52, clause: '8.2.3', requirement: '合同评审已进行，特殊要求已识别并传达运营部门', evidence: '合同评审记录/内部交接单' },
      { id: 53, clause: '8.5.1', requirement: '市场活动（展会、拜访）按计划实施并有记录', evidence: '市场活动计划/活动总结报告' },
      { id: 54, clause: '9.1.2', requirement: '新客户开发效果和老客户留存率定期分析', evidence: '客户分析报告/留存率统计' },
      { id: 55, clause: '9.1.3', requirement: '外部环境分析结果用于战略调整和服务改进', evidence: '市场分析结论/战略调整记录' },
      { id: 56, clause: '10.1', requirement: '市场推广方式持续改进，基于数据分析优化', evidence: '营销效果数据/改进措施记录' },
      { id: 57, clause: '10.2', requirement: '客户投诉和市场反馈已记录，纠正措施已跟进', evidence: '客户反馈台账/纠正措施记录' },
      { id: 58, clause: '10.3', requirement: '部门定期评估自身流程的适宜性和改进机会', evidence: '部门自评报告/改进计划' },
    ],
  },
];
