export interface ServiceData {
  id: string;
  tabLabel: string;
  accent: string;
  tag: string;
  title: string;
  tempRange: string;
  desc: string;
  features: { icon: string; text: string }[];
  stats: { num: string; label: string }[];
}

export const SERVICES: ServiceData[] = [
  {
    id: 'cryo',
    tabLabel: '超低温运输',
    accent: '#2dd4bf',
    tag: 'CryoTransport',
    title: '超低温\n运输服务',
    tempRange: '-196°C ～ -80°C 液氮全程温控',
    desc: '专为细胞治疗产品、干细胞、基因治疗药物设计的超低温运输方案。采用液氮干燥运输容器，全程实时数据记录，确保生物活性完整无损。',
    features: [
      { icon: '🧊', text: '液氮干燥容器，持续维持 -196°C 至 -80°C' },
      { icon: '📡', text: '全程实时温度监控与数据记录（Data Logger）' },
      { icon: '✈', text: 'IATA P650 危险品认证包装与运输' },
      { icon: '🏥', text: '细胞治疗 · 干细胞 · 基因药物专用流程' },
      { icon: '⚡', text: '24/7 紧急调度，AOG级响应速度' },
    ],
    stats: [
      { num: '-196°C', label: '最低温度' },
      { num: '100%', label: '温控达标率' },
      { num: '24/7', label: '紧急响应' },
      { num: '186', label: '覆盖城市' },
    ],
  },
  {
    id: 'cool',
    tabLabel: '冷藏运输',
    accent: '#10b981',
    tag: 'CoolChain',
    title: '冷藏温控\n运输服务',
    tempRange: '2–8°C / 15–25°C 精准双温区',
    desc: '适用于生物制剂、疫苗、血液制品及普通医药品的精准冷藏运输方案。符合WHO预认证标准，提供多温区管理与全程品质追溯报告。',
    features: [
      { icon: '🌡', text: '2–8°C 及 15–25°C 双温区精准控制' },
      { icon: '💉', text: '疫苗 · 血液制品 · 生物制剂专项处理' },
      { icon: '📊', text: 'WHO PQ 认证温控包装与监控方案' },
      { icon: '🔍', text: '全程温湿度数据记录与偏差分析报告' },
      { icon: '🌐', text: '96国合作网络，本地冷链无缝衔接' },
    ],
    stats: [
      { num: '2–8°C', label: '冷藏温区' },
      { num: '96国', label: '合作网络' },
      { num: 'WHO PQ', label: '认证包装' },
      { num: '10+年', label: '行业经验' },
    ],
  },
  {
    id: 'comply',
    tabLabel: 'GDP 合规',
    accent: '#34d399',
    tag: 'CompliService',
    title: 'GDP / GMP\n合规服务',
    tempRange: 'EU GDP · PIC/S GMP 双标准合规',
    desc: '提供符合欧盟GDP与PIC/S GMP标准的医药物流合规全流程服务。从品质协议签订到温度偏差管理，为制药企业提供完整的监管合规支持。',
    features: [
      { icon: '📋', text: 'EU GDP / PIC·S GMP 双标准合规操作' },
      { icon: '🤝', text: '品质协议（Quality Agreement）签订与维护' },
      { icon: '⚠️', text: '温度偏差即时报告与纠正预防措施（CAPA）' },
      { icon: '📁', text: '进出口许可证 · 通关文件一站式管理' },
      { icon: '🔐', text: '供应链安全管理与防伪验证支持' },
    ],
    stats: [
      { num: 'EU GDP', label: '认证标准' },
      { num: 'ISO 9001', label: ':2015 认证' },
      { num: '<1h', label: '偏差响应' },
      { num: '全程', label: '文件追溯' },
    ],
  },
];
