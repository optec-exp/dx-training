// props 示例：StatsBand 通过 props 接收统计数据数组
type Stat = { value: string; label: string }

type Props = {
  stats: Stat[]
}

export default function StatsBand({ stats }: Props) {
  return (
    <div className="stats-band">
      {stats.map((s, i) => (
        <div key={i} className="stat-item">
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
