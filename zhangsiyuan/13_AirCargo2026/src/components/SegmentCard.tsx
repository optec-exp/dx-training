// props 示例：SegmentCard 通过 props 接收展区数据
type Props = {
  icon: string
  title: string
  desc: string
  index: number
}

export default function SegmentCard({ icon, title, desc, index }: Props) {
  return (
    <div className="seg-card" data-index={index}>
      <div className="seg-icon">{icon}</div>
      <h3 className="seg-title">{title}</h3>
      <p className="seg-desc">{desc}</p>
    </div>
  )
}
