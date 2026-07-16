import type { AppType, Team } from "./constants";

export interface KintoneCase {
  appType: AppType;
  recordId: string;
  caseNumber: string;
  customerName: string;
  customerCountry: string;
  exportTeam: string;
  importTeam: string;
  mitsumoriTeam: string | null;
  grossProfitJpy: number;
  grossProfitCny: number;
  kanFeeJpy: number;
  kanFeeCny: number;
  salesJpy: number;
  salesCny: number;
  costJpy: number;
  costCny: number;
  invoiceDate: string;
}

export type Currency = "jpy" | "cny";

export interface Money {
  jpy: number;
  cny: number;
}

export type TeamShare = Record<Team, Money>;

export interface AllocationDetail {
  team: Team;
  jpy: number;
  cny: number;
  basis:
    | "ec_full"
    | "kan_full"
    | "kan_fee"
    | "mitsumori"
    | "country"
    | "operation_export"
    | "operation_import";
}

export interface CaseAllocation {
  case: KintoneCase;
  primaryTeam: Team | null;
  allocations: AllocationDetail[];
}

export interface TeamSummary {
  team: Team;
  caseCount: number;
  totalJpy: number;
  totalCny: number;
  mitsumoriJpy: number;
  mitsumoriCny: number;
  countryJpy: number;
  countryCny: number;
  opExportJpy: number;
  opExportCny: number;
  opImportJpy: number;
  opImportCny: number;
  kanFeeJpy: number;
  kanFeeCny: number;
}

export interface GroupedSummary {
  name: string;
  isGroup: boolean;
  caseCount: number;
  totalJpy: number;
  totalCny: number;
  mitsumoriJpy: number;
  mitsumoriCny: number;
  countryJpy: number;
  countryCny: number;
  opExportJpy: number;
  opExportCny: number;
  opImportJpy: number;
  opImportCny: number;
  kanFeeJpy: number;
  kanFeeCny: number;
  childTeams: string[];
  children: TeamSummary[] | null;
}

export interface MonthlyTargets {
  companyJpy: number;
  teamsJpy: Record<string, number>;
  configured: boolean;
  previousCompanyJpy?: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalCases: number;
  totalProfitJpy: number;
  totalProfitCny: number;
  summaries: TeamSummary[];
  groupedSummaries: GroupedSummary[];
  caseAllocations: CaseAllocation[];
  targets: MonthlyTargets;
  dataFetchedAt: number;
  fromCache: boolean;
}
