import { getAvailableMonths } from "@/lib/data";
import SettlementView from "@/app/_components/SettlementView";

export const dynamic = "force-dynamic";

export default async function SettlementPage() {
  const months = await getAvailableMonths();
  const month = months[0] || "2026-05";
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>月度决算</h1>
      <SettlementView initialMonth={month} months={months} />
    </div>
  );
}
