import {
  CHINA_TEAMS,
  DISTRIBUTION_RULES,
  GROUP_ORDER,
  KAN_KEYWORDS,
  NO_OPERATION_KEYWORDS,
  TEAMS,
  TEAM_TO_GROUP,
  type Team,
} from "./constants";
import type {
  AllocationDetail,
  CaseAllocation,
  GroupedSummary,
  KintoneCase,
  MonthlyReport,
  TeamSummary,
} from "./types";

function stripDirection(raw: string): string {
  return raw
    .replace(/輸出$/, "")
    .replace(/輸入$/, "")
    .replace(/\s*Team$/i, "")
    .trim();
}

function isKan(raw: string): boolean {
  const s = stripDirection(raw);
  return KAN_KEYWORDS.some((k) => s === k);
}

function isEmpty(raw: string): boolean {
  const s = stripDirection(raw);
  return NO_OPERATION_KEYWORDS.includes(s);
}

function normalizeTeam(raw: string): Team | null {
  const s = stripDirection(raw);
  if (!s) return null;
  if (KAN_KEYWORDS.includes(s)) return "通关";
  for (const t of TEAMS) {
    if (t === s) return t;
  }
  if (s === "Japan Desk" || s === "Japan desk" || s === "japan desk") return "Japan Desk";
  if (s === "物流开発" || s === "物流开发" || s === "物流開発") return "物流開発";
  return null;
}

function decideCountryTeam(
  c: KintoneCase,
  exportTeam: Team | null,
  importTeam: Team | null
): Team | null {
  const country = (c.customerCountry || "").toUpperCase().trim();

  if (country === "JP") return "TCC";

  if (country === "CN") {
    if (exportTeam && CHINA_TEAMS.includes(exportTeam)) return exportTeam;
    if (importTeam && CHINA_TEAMS.includes(importTeam)) return importTeam;
    return exportTeam ?? importTeam;
  }

  return exportTeam ?? importTeam;
}

function decidePrimaryTeam(c: KintoneCase): Team | null {
  if (c.appType === "ec") return "EC";
  if (isKan(c.exportTeam) || isKan(c.importTeam)) return "通关";
  if (!isEmpty(c.exportTeam)) return normalizeTeam(c.exportTeam);
  if (!isEmpty(c.importTeam)) return normalizeTeam(c.importTeam);
  return null;
}

export function distributeProfit(c: KintoneCase): CaseAllocation {
  const allocations: AllocationDetail[] = [];
  const primaryTeam = decidePrimaryTeam(c);

  if (c.appType === "ec") {
    allocations.push({
      team: "EC",
      jpy: c.grossProfitJpy * DISTRIBUTION_RULES.mitsumori,
      cny: c.grossProfitCny * DISTRIBUTION_RULES.mitsumori,
      basis: "mitsumori",
    });
    allocations.push({
      team: "EC",
      jpy: c.grossProfitJpy * DISTRIBUTION_RULES.customerCountry,
      cny: c.grossProfitCny * DISTRIBUTION_RULES.customerCountry,
      basis: "country",
    });
    allocations.push({
      team: "EC",
      jpy: c.grossProfitJpy * DISTRIBUTION_RULES.exportOp,
      cny: c.grossProfitCny * DISTRIBUTION_RULES.exportOp,
      basis: "operation_export",
    });
    allocations.push({
      team: "EC",
      jpy: c.grossProfitJpy * DISTRIBUTION_RULES.importOp,
      cny: c.grossProfitCny * DISTRIBUTION_RULES.importOp,
      basis: "operation_import",
    });
    return { case: c, primaryTeam, allocations };
  }

  const exportKan = isKan(c.exportTeam);
  const importKan = isKan(c.importTeam);
  if (exportKan || importKan) {
    const kanMitsumoriTeam = c.mitsumoriTeam ? normalizeTeam(c.mitsumoriTeam) : null;
    if (!kanMitsumoriTeam || kanMitsumoriTeam === "通关") {
      allocations.push({
        team: "通关",
        jpy: c.grossProfitJpy,
        cny: c.grossProfitCny,
        basis: "kan_full",
      });
    } else {
      const mitsumoriShare = DISTRIBUTION_RULES.mitsumori;
      allocations.push({
        team: kanMitsumoriTeam,
        jpy: c.grossProfitJpy * mitsumoriShare,
        cny: c.grossProfitCny * mitsumoriShare,
        basis: "mitsumori",
      });
      allocations.push({
        team: "通关",
        jpy: c.grossProfitJpy * (1 - mitsumoriShare),
        cny: c.grossProfitCny * (1 - mitsumoriShare),
        basis: "kan_full",
      });
    }
    return { case: c, primaryTeam, allocations };
  }

  if (c.kanFeeJpy !== 0 || c.kanFeeCny !== 0) {
    allocations.push({
      team: "通关",
      jpy: c.kanFeeJpy,
      cny: c.kanFeeCny,
      basis: "kan_fee",
    });
  }
  const remainJpy = c.grossProfitJpy - c.kanFeeJpy;
  const remainCny = c.grossProfitCny - c.kanFeeCny;

  const mitsumoriTeam = c.mitsumoriTeam ? normalizeTeam(c.mitsumoriTeam) : null;
  if (mitsumoriTeam) {
    allocations.push({
      team: mitsumoriTeam,
      jpy: remainJpy * DISTRIBUTION_RULES.mitsumori,
      cny: remainCny * DISTRIBUTION_RULES.mitsumori,
      basis: "mitsumori",
    });
  }

  const exportEmpty = isEmpty(c.exportTeam);
  const importEmpty = isEmpty(c.importTeam);
  const exportTeam = exportEmpty ? null : normalizeTeam(c.exportTeam);
  const importTeam = importEmpty ? null : normalizeTeam(c.importTeam);

  const countryTeam = decideCountryTeam(c, exportTeam, importTeam);
  if (countryTeam) {
    allocations.push({
      team: countryTeam,
      jpy: remainJpy * DISTRIBUTION_RULES.customerCountry,
      cny: remainCny * DISTRIBUTION_RULES.customerCountry,
      basis: "country",
    });
  }

  if (exportEmpty && importTeam) {
    allocations.push({
      team: importTeam,
      jpy: remainJpy * DISTRIBUTION_RULES.exportOp,
      cny: remainCny * DISTRIBUTION_RULES.exportOp,
      basis: "operation_export",
    });
    allocations.push({
      team: importTeam,
      jpy: remainJpy * DISTRIBUTION_RULES.importOp,
      cny: remainCny * DISTRIBUTION_RULES.importOp,
      basis: "operation_import",
    });
  } else if (importEmpty && exportTeam) {
    allocations.push({
      team: exportTeam,
      jpy: remainJpy * DISTRIBUTION_RULES.exportOp,
      cny: remainCny * DISTRIBUTION_RULES.exportOp,
      basis: "operation_export",
    });
    allocations.push({
      team: exportTeam,
      jpy: remainJpy * DISTRIBUTION_RULES.importOp,
      cny: remainCny * DISTRIBUTION_RULES.importOp,
      basis: "operation_import",
    });
  } else {
    if (exportTeam) {
      allocations.push({
        team: exportTeam,
        jpy: remainJpy * DISTRIBUTION_RULES.exportOp,
        cny: remainCny * DISTRIBUTION_RULES.exportOp,
        basis: "operation_export",
      });
    }
    if (importTeam) {
      allocations.push({
        team: importTeam,
        jpy: remainJpy * DISTRIBUTION_RULES.importOp,
        cny: remainCny * DISTRIBUTION_RULES.importOp,
        basis: "operation_import",
      });
    }
  }

  return { case: c, primaryTeam, allocations };
}

type DimColumn = "mitsumori" | "country" | "opExport" | "opImport";

function mapBasisToDimension(c: KintoneCase, basis: AllocationDetail["basis"]): DimColumn {
  switch (basis) {
    case "mitsumori":
      return "mitsumori";
    case "country":
      return "country";
    case "operation_export":
      return "opExport";
    case "operation_import":
      return "opImport";
    case "kan_full": {
      const expKan = isKan(c.exportTeam);
      const impKan = isKan(c.importTeam);
      if (expKan && !impKan) return "opExport";
      if (impKan && !expKan) return "opImport";
      return "opImport";
    }
    case "kan_fee":
      return "opImport";
    case "ec_full": {
      const exp = stripDirection(c.exportTeam);
      if (exp === "EC") return "opExport";
      return "opImport";
    }
  }
}

interface TeamAggregate {
  jpy: number;
  cny: number;
  primaryCount: number;
  mitsumoriJpy: number;
  mitsumoriCny: number;
  countryJpy: number;
  countryCny: number;
  opExportJpy: number;
  opExportCny: number;
  opImportJpy: number;
  opImportCny: number;
}

function newAggregate(): TeamAggregate {
  return {
    jpy: 0,
    cny: 0,
    primaryCount: 0,
    mitsumoriJpy: 0,
    mitsumoriCny: 0,
    countryJpy: 0,
    countryCny: 0,
    opExportJpy: 0,
    opExportCny: 0,
    opImportJpy: 0,
    opImportCny: 0,
  };
}

export function buildMonthlyReport(
  year: number,
  month: number,
  cases: KintoneCase[],
  meta: { fetchedAt: number; fromCache: boolean } = {
    fetchedAt: Date.now(),
    fromCache: false,
  }
): MonthlyReport {
  const caseAllocations = cases.map((c) => distributeProfit(c));

  const teamTotals = new Map<Team, TeamAggregate>();
  for (const ca of caseAllocations) {
    if (ca.primaryTeam) {
      const existing = teamTotals.get(ca.primaryTeam) ?? newAggregate();
      existing.primaryCount += 1;
      teamTotals.set(ca.primaryTeam, existing);
    }
    for (const a of ca.allocations) {
      const existing = teamTotals.get(a.team) ?? newAggregate();
      existing.jpy += a.jpy;
      existing.cny += a.cny;
      const dim = mapBasisToDimension(ca.case, a.basis);
      if (dim === "mitsumori") {
        existing.mitsumoriJpy += a.jpy;
        existing.mitsumoriCny += a.cny;
      } else if (dim === "country") {
        existing.countryJpy += a.jpy;
        existing.countryCny += a.cny;
      } else if (dim === "opExport") {
        existing.opExportJpy += a.jpy;
        existing.opExportCny += a.cny;
      } else if (dim === "opImport") {
        existing.opImportJpy += a.jpy;
        existing.opImportCny += a.cny;
      }
      teamTotals.set(a.team, existing);
    }
  }

  const summaries: TeamSummary[] = Array.from(teamTotals.entries())
    .map(([team, v]) => ({
      team,
      caseCount: v.primaryCount,
      totalJpy: v.jpy,
      totalCny: v.cny,
      mitsumoriJpy: v.mitsumoriJpy,
      mitsumoriCny: v.mitsumoriCny,
      countryJpy: v.countryJpy,
      countryCny: v.countryCny,
      opExportJpy: v.opExportJpy,
      opExportCny: v.opExportCny,
      opImportJpy: v.opImportJpy,
      opImportCny: v.opImportCny,
    }))
    .filter((s) => s.caseCount > 0 || Math.abs(s.totalJpy) > 0.01 || Math.abs(s.totalCny) > 0.01)
    .sort((a, b) => b.totalJpy - a.totalJpy);

  const totalProfitJpy = caseAllocations.reduce(
    (sum, ca) => sum + ca.allocations.reduce((s, a) => s + a.jpy, 0),
    0
  );
  const totalProfitCny = caseAllocations.reduce(
    (sum, ca) => sum + ca.allocations.reduce((s, a) => s + a.cny, 0),
    0
  );

  const groupedSummaries = buildGroupedSummaries(summaries);

  return {
    year,
    month,
    totalCases: cases.length,
    totalProfitJpy,
    totalProfitCny,
    summaries,
    groupedSummaries,
    caseAllocations,
    dataFetchedAt: meta.fetchedAt,
    fromCache: meta.fromCache,
  };
}

function buildGroupedSummaries(summaries: TeamSummary[]): GroupedSummary[] {
  const groupMap = new Map<string, TeamSummary[]>();
  const standalone: TeamSummary[] = [];

  for (const s of summaries) {
    const groupName = TEAM_TO_GROUP[s.team];
    if (groupName) {
      const list = groupMap.get(groupName) ?? [];
      list.push(s);
      groupMap.set(groupName, list);
    } else {
      standalone.push(s);
    }
  }

  for (const groupName of GROUP_ORDER) {
    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, []);
    }
  }

  const result: GroupedSummary[] = [];

  for (const [groupName, children] of groupMap) {
    const childTeams = Object.entries(TEAM_TO_GROUP)
      .filter(([, g]) => g === groupName)
      .map(([t]) => t);

    const orderedChildren: TeamSummary[] = childTeams
      .map((t) => children.find((c) => c.team === t))
      .filter((c): c is TeamSummary => Boolean(c))
      .sort((a, b) => b.totalJpy - a.totalJpy);

    const totals = orderedChildren.reduce(
      (acc, c) => ({
        caseCount: acc.caseCount + c.caseCount,
        totalJpy: acc.totalJpy + c.totalJpy,
        totalCny: acc.totalCny + c.totalCny,
        mitsumoriJpy: acc.mitsumoriJpy + c.mitsumoriJpy,
        mitsumoriCny: acc.mitsumoriCny + c.mitsumoriCny,
        countryJpy: acc.countryJpy + c.countryJpy,
        countryCny: acc.countryCny + c.countryCny,
        opExportJpy: acc.opExportJpy + c.opExportJpy,
        opExportCny: acc.opExportCny + c.opExportCny,
        opImportJpy: acc.opImportJpy + c.opImportJpy,
        opImportCny: acc.opImportCny + c.opImportCny,
      }),
      {
        caseCount: 0,
        totalJpy: 0,
        totalCny: 0,
        mitsumoriJpy: 0,
        mitsumoriCny: 0,
        countryJpy: 0,
        countryCny: 0,
        opExportJpy: 0,
        opExportCny: 0,
        opImportJpy: 0,
        opImportCny: 0,
      }
    );

    if (totals.caseCount === 0 && Math.abs(totals.totalJpy) < 0.01) continue;

    result.push({
      name: groupName,
      isGroup: true,
      ...totals,
      childTeams,
      children: orderedChildren,
    });
  }

  for (const s of standalone) {
    result.push({
      name: s.team,
      isGroup: false,
      caseCount: s.caseCount,
      totalJpy: s.totalJpy,
      totalCny: s.totalCny,
      mitsumoriJpy: s.mitsumoriJpy,
      mitsumoriCny: s.mitsumoriCny,
      countryJpy: s.countryJpy,
      countryCny: s.countryCny,
      opExportJpy: s.opExportJpy,
      opExportCny: s.opExportCny,
      opImportJpy: s.opImportJpy,
      opImportCny: s.opImportCny,
      childTeams: [s.team],
      children: null,
    });
  }

  return result.sort((a, b) => b.totalJpy - a.totalJpy);
}
