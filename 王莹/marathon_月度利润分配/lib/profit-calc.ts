import {
  CHINA_TEAMS,
  DISTRIBUTION_RULES,
  KAN_KEYWORDS,
  NO_OPERATION_KEYWORDS,
  TEAMS,
  type Team,
} from "./constants";
import type {
  AllocationDetail,
  CaseAllocation,
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
      jpy: c.grossProfitJpy,
      cny: c.grossProfitCny,
      basis: "ec_full",
    });
    return { case: c, primaryTeam, allocations };
  }

  const exportKan = isKan(c.exportTeam);
  const importKan = isKan(c.importTeam);
  if (exportKan || importKan) {
    allocations.push({
      team: "通关",
      jpy: c.grossProfitJpy,
      cny: c.grossProfitCny,
      basis: "kan_full",
    });
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

  const opTotal = DISTRIBUTION_RULES.exportOp + DISTRIBUTION_RULES.importOp;
  if (exportEmpty && importTeam) {
    allocations.push({
      team: importTeam,
      jpy: remainJpy * opTotal,
      cny: remainCny * opTotal,
      basis: "operation_import",
    });
  } else if (importEmpty && exportTeam) {
    allocations.push({
      team: exportTeam,
      jpy: remainJpy * opTotal,
      cny: remainCny * opTotal,
      basis: "operation_export",
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

  const teamTotals = new Map<Team, { jpy: number; cny: number; primaryCount: number }>();
  for (const ca of caseAllocations) {
    if (ca.primaryTeam) {
      const existing = teamTotals.get(ca.primaryTeam) ?? {
        jpy: 0,
        cny: 0,
        primaryCount: 0,
      };
      existing.primaryCount += 1;
      teamTotals.set(ca.primaryTeam, existing);
    }
    for (const a of ca.allocations) {
      const existing = teamTotals.get(a.team) ?? {
        jpy: 0,
        cny: 0,
        primaryCount: 0,
      };
      existing.jpy += a.jpy;
      existing.cny += a.cny;
      teamTotals.set(a.team, existing);
    }
  }

  const summaries: TeamSummary[] = Array.from(teamTotals.entries())
    .map(([team, v]) => ({
      team,
      caseCount: v.primaryCount,
      totalJpy: v.jpy,
      totalCny: v.cny,
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

  return {
    year,
    month,
    totalCases: cases.length,
    totalProfitJpy,
    totalProfitCny,
    summaries,
    caseAllocations,
    dataFetchedAt: meta.fetchedAt,
    fromCache: meta.fromCache,
  };
}
