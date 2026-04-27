// 组件复用示例：FeatureList 在三个服务页面上复用，通过 props 接收各自的功能列表
type Feature = { icon: string; title: string; desc: string }

type Props = {
  features: Feature[]
}

export default function FeatureList({ features }: Props) {
  return (
    <div className="feature-grid">
      {features.map((f, i) => (
        <div key={i} className="feature-card">
          <div className="feature-icon">{f.icon}</div>
          <h3 className="feature-title">{f.title}</h3>
          <p className="feature-desc">{f.desc}</p>
        </div>
      ))}
    </div>
  )
}
