// props 示例：StatsBar 通过 props 接收统计数据数组
type StatItem = { value: string; label: string }

type Props = {
  stats: StatItem[]
}

export default function StatsBar({ stats }: Props) {
  return (
    <div className="stats-bar">
      {stats.map((s, i) => (
        <div className="stat-item" key={i}>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
