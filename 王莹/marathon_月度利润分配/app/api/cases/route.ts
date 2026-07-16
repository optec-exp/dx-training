import { NextResponse } from "next/server";
import { fetchMonthlyCases } from "@/lib/kintone";
import { buildMonthlyReport } from "@/lib/profit-calc";
import { getMonthlyTarget } from "@/lib/targets";
import type { MonthlyTargets } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json(
      { error: "需要参数 year (YYYY) 和 month (1-12)" },
      { status: 400 }
    );
  }

  if (year < 2026 || (year === 2026 && month < 4)) {
    return NextResponse.json(
      { error: "数据范围从 2026 年 4 月开始" },
      { status: 400 }
    );
  }

  const refresh = searchParams.get("refresh") === "1";

  try {
    const { cases, fetchedAt, fromCache } = await fetchMonthlyCases(
      year,
      month,
      refresh
    );
    const report = buildMonthlyReport(year, month, cases, {
      fetchedAt,
      fromCache,
    });

    let targets: MonthlyTargets = {
      companyJpy: 0,
      teamsJpy: {},
      configured: false,
    };
    try {
      const current = await getMonthlyTarget(year, month, refresh);
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const previous = await getMonthlyTarget(prevYear, prevMonth, false);
      if (current) {
        targets = {
          companyJpy: current.companyJpy,
          teamsJpy: current.teamsJpy,
          configured: true,
          previousCompanyJpy: previous?.companyJpy,
        };
      } else if (process.env.GOOGLE_SHEET_ID) {
        targets.configured = false;
      }
    } catch (err) {
      console.error("[cases] 目标数据拉取失败:", err);
    }

    return NextResponse.json({ ...report, targets });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
