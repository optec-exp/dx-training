import { supabase, type Employee } from "@/lib/supabase";
import AddEmployeeForm from "./components/AddEmployeeForm";
import EmployeeList from "./components/EmployeeList";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("id", { ascending: true });

  const employees = (data ?? []) as Employee[];

  return (
    <main
      style={{
        padding: "40px 24px",
        maxWidth: "1100px",
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
          <h1 style={{ fontSize: "28px", fontWeight: 700 }}>
            📇 公司内部通讯录
          </h1>
          <p style={{ marginTop: "6px", color: "#6b7280" }}>
            共 {employees.length} 位员工
          </p>
        </div>
        <AddEmployeeForm />
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

      <EmployeeList employees={employees} />
    </main>
  );
}
