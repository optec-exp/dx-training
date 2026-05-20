import { supabase, type Item } from "@/lib/supabase";
import AddItemForm from "./components/AddItemForm";
import ItemList from "./components/ItemList";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabase
    .from("items")
    .select("*, borrow_history(*)")
    .order("id", { ascending: true });

  const items = (data ?? []) as Item[];

  return (
    <main
      style={{
        padding: "40px 24px",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700 }}>📦 物品管理</h1>
          <p style={{ marginTop: "6px", color: "#6b7280" }}>
            共 {items.length} 件物品
          </p>
        </div>
        <AddItemForm />
      </header>

      {error && (
        <div
          style={{
            padding: "16px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          ❌ 数据加载失败：{error.message}
        </div>
      )}

      <ItemList items={items} />
    </main>
  );
}
