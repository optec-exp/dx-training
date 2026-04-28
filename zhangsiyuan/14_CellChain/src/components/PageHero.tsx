// 组件复用示例：PageHero 在首页和三个服务页面上都复用，通过 props 接收不同内容
type Props = {
  eyebrow: string
  h1: string[]
  tagline?: string
  desc: string
  children?: React.ReactNode
}

export default function PageHero({ eyebrow, h1, tagline, desc, children }: Props) {
  return (
    <section className="page-hero">
      <div className="container hero-inner">
        <p className="hero-eyebrow">{eyebrow}</p>
        <h1 className="hero-h1">
          {h1[0]}<br />
          <em>{h1[1]}</em>
        </h1>
        {tagline && <p className="hero-tagline">{tagline}</p>}
        <p className="hero-desc">{desc}</p>
        {children}
      </div>
    </section>
  )
}
