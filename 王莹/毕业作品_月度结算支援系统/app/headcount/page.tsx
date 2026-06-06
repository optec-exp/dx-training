import { redirect } from "next/navigation";

// 已合并至 /data-entry（数据录入）。保留路由用于旧书签重定向。
export default function HeadcountRedirect() {
  redirect("/data-entry");
}
