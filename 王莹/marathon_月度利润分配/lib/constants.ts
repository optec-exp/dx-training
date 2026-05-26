export type AppType = "air" | "sea" | "ec";

export const KINTONE_APP_CONFIG: Record<
  AppType,
  { appId: number; label: string; timeField: string; tokenEnv: string }
> = {
  air: {
    appId: 1001,
    label: "Air案件管理2026",
    timeField: "請求日",
    tokenEnv: "KINTONE_TOKEN_AIR",
  },
  sea: {
    appId: 1002,
    label: "SEA案件管理2026",
    timeField: "請求日",
    tokenEnv: "KINTONE_TOKEN_SEA",
  },
  ec: {
    appId: 1003,
    label: "EC案件管理2026",
    timeField: "纳品完了日",
    tokenEnv: "KINTONE_TOKEN_EC",
  },
};

export const TEAMS = [
  "TCC",
  "OS",
  "EC",
  "GC",
  "Japan Desk",
  "Project",
  "物流開発",
  "通关",
] as const;

export type Team = (typeof TEAMS)[number];

export const CHINA_TEAMS: Team[] = [
  "OS",
  "EC",
  "GC",
  "Japan Desk",
  "Project",
  "物流開発",
];

export const KAN_KEYWORDS = ["通関", "通关"];

export const NO_OPERATION_KEYWORDS = ["操作なし", "操作无", ""];

export const DATA_START_DATE = "2026-04-01";

export const DISTRIBUTION_RULES = {
  mitsumori: 0.2,
  customerCountry: 0.35,
  exportOp: 0.27,
  importOp: 0.18,
} as const;

export const TEAM_TO_GROUP: Partial<Record<Team, string>> = {
  TCC: "Japan Desk",
  GC: "Japan Desk",
  EC: "Japan Desk",
  "Japan Desk": "Japan Desk",
};

export const GROUP_ORDER: string[] = ["Japan Desk"];
