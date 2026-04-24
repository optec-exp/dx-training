export interface Action {
  id: number;
  ncrNo: string;
  department: string;
  issue: string;
  measure: string;
  owner: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
}

export const ACTIONS: Action[] = [
  {
    id: 1,
    ncrNo: 'NCR-2026-001',
    department: '业务部',
    issue: '货物交接单签收率低于目标值85%，4月实际达成率仅71%',
    measure: '修订交接确认流程，增加电子签收系统培训，设立每日核查机制',
    owner: '张经理',
    dueDate: '2026-04-20',
    completed: false,
  },
  {
    id: 2,
    ncrNo: 'NCR-2026-002',
    department: '总务人事部',
    issue: '员工ISO内部培训记录缺失，3名新员工未完成意识培训',
    measure: '补充培训记录，完成3名新员工ISO意识培训，建立入职培训检查清单',
    owner: '李主任',
    dueDate: '2026-04-28',
    completed: false,
  },
  {
    id: 3,
    ncrNo: 'NCR-2026-003',
    department: 'DX部门',
    issue: '系统文件版本控制混乱，发现2份文件无版本号在流通使用',
    measure: '全面盘查现行文件，统一版本标识规则，上传至文档管理系统',
    owner: '王工程师',
    dueDate: '2026-05-01',
    completed: false,
  },
  {
    id: 4,
    ncrNo: 'NCR-2026-004',
    department: '财务部',
    issue: '供应商评估表未按季度更新，Q1评估记录缺失',
    measure: '补充Q1供应商评估，制定季度评估提醒机制，更新评估模板',
    owner: '陈会计',
    dueDate: '2026-05-10',
    completed: false,
  },
  {
    id: 5,
    ncrNo: 'NCR-2026-005',
    department: '市场开发部',
    issue: '对外报价单发出前未经审批，发现2份报价无审批签字',
    measure: '立即回收并重新审批，修订报价审批流程，增加发送前系统拦截确认',
    owner: '赵主任',
    dueDate: '2026-04-15',
    completed: false,
  },
  {
    id: 6,
    ncrNo: 'NCR-2026-006',
    department: '业务部',
    issue: '危险品申报文件存在错误，导致货物在目的地延误48小时',
    measure: '对危险品操作人员进行专项培训，建立申报文件双重审核制度',
    owner: '刘主管',
    dueDate: '2026-05-15',
    completed: false,
  },
  {
    id: 7,
    ncrNo: 'NCR-2026-007',
    department: '管理层',
    issue: 'Q1管理评审报告未在规定时间内发布，延迟15天',
    measure: '完成Q1管理评审报告并归档，修订管理评审时间计划，增加提醒机制',
    owner: '总经理办公室',
    dueDate: '2026-04-10',
    completed: true,
  },
  {
    id: 8,
    ncrNo: 'NCR-2026-008',
    department: '总务人事部',
    issue: '办公设备维护保养记录断档，打印机3台无2025年度维护记录',
    measure: '补充维护记录，联系设备供应商完成年度保养，建立维护台账',
    owner: '李主任',
    dueDate: '2026-03-31',
    completed: true,
  },
  {
    id: 9,
    ncrNo: 'NCR-2026-009',
    department: '业务部',
    issue: '客户投诉响应时间超标，3件投诉超过48小时响应期限',
    measure: '建立投诉自动提醒系统，明确各级响应时限责任人，纳入KPI考核',
    owner: '张经理',
    dueDate: '2026-05-20',
    completed: false,
  },
  {
    id: 10,
    ncrNo: 'NCR-2026-010',
    department: 'DX部门',
    issue: '数据备份未按规定执行，发现连续5天无备份记录',
    measure: '立即恢复备份作业，排查自动备份脚本故障，增加备份状态监控告警',
    owner: '王工程师',
    dueDate: '2026-04-26',
    completed: false,
  },
];
