import { getAvailableMonths } from "@/lib/data";
import SyncCheckView from "@/app/_components/SyncCheckView";

export const dynamic = "force-dynamic";

export default async function SyncCheckPage() {
  const months = await getAvailableMonths();
  const month = months[0] || "2026-05";
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>三 App 同步排查</h1>
      <SyncCheckView initialMonth={month} months={months} />
    </div>
  );
}
