import type { CalcResult } from '@/data/rates'
import type { T } from '@/data/translations'

type Props = {
  result: CalcResult
  t: T['result']
}

const usd = (n: number) => `$ ${n.toFixed(2)}`

export default function PriceBreakdown({ result, t }: Props) {
  const { distanceKm, zone, actualWeight, chargeableWeight, airFreight, fuelSC, security, handling, awb, cost, profit, total, marginRate } = result
  const wasUplifted = chargeableWeight > actualWeight

  return (
    <div className="breakdown">
      <h3 className="bd-title">{t.title}</h3>

      {/* Meta row */}
      <div className="bd-meta">
        <div className="bd-meta-item">
          <span className="bd-meta-label">{t.actual_weight}</span>
          <span className="bd-meta-val">{actualWeight.toFixed(1)} kg</span>
        </div>
        <div className="bd-meta-item">
          <span className="bd-meta-label">{t.chargeable_weight}</span>
          <span className="bd-meta-val">
            {chargeableWeight.toFixed(1)} kg
            {wasUplifted && <span className="bd-uplifted">{t.min_note}</span>}
          </span>
        </div>
        <div className="bd-meta-item">
          <span className="bd-meta-label">{t.distance}</span>
          <span className="bd-meta-val">{distanceKm.toLocaleString()} km</span>
        </div>
        <div className="bd-meta-item">
          <span className="bd-meta-label">{t.zone}</span>
          <span className="bd-meta-val">Zone {zone}</span>
        </div>
      </div>

      {/* Cost rows */}
      <div className="bd-rows">
        <div className="bd-row"><span>{t.air_freight}</span><span>{usd(airFreight)}</span></div>
        <div className="bd-row"><span>{t.fuel}</span><span>{usd(fuelSC)}</span></div>
        <div className="bd-row"><span>{t.security}</span><span>{usd(security)}</span></div>
        <div className="bd-row"><span>{t.handling}</span><span>{usd(handling)}</span></div>
        <div className="bd-row"><span>{t.awb}</span><span>{usd(awb)}</span></div>
      </div>

      {/* Subtotals */}
      <div className="bd-subtotals">
        <div className="bd-sub-row cost">
          <span>{t.cost_label}</span>
          <span>{usd(cost)}</span>
        </div>
        <div className="bd-sub-row profit">
          <span>{t.profit_label} ({marginRate}%)</span>
          <span>{usd(profit)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="bd-total">
        <span>{t.total_label}</span>
        <span className="bd-total-amount">{usd(total)}</span>
      </div>
    </div>
  )
}
