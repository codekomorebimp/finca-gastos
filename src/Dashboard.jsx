import { useMemo } from 'react'
import { CATS, PRESUPUESTO, COP, calcTotal, esPorMetro, catOf } from './data'

const pct = (v, total) => (total ? (v / total) * 100 : 0)

/* ── Donut SVG ── */
function Donut({ segments, size = 160 }) {
  const r = 52, cx = size / 2, cy = size / 2
  const circum = 2 * Math.PI * r
  const total = segments.reduce((s, d) => s + d.value, 0)
  if (!total) return null
  let offset = 0
  const slices = segments.map((d) => {
    const len = (d.value / total) * circum
    const slice = { ...d, offset, len }
    offset += len
    return slice
  })
  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {slices.map((s) => (
        <circle key={s.name} cx={cx} cy={cy} r={r}
          fill="none" stroke={s.color} strokeWidth={22}
          strokeDasharray={`${s.len} ${circum - s.len}`}
          strokeDashoffset={-s.offset + circum / 4}
          style={{ transition: 'stroke-dasharray 0.5s' }} />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="#6b7280">Total</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={13} fontWeight={700} fill="#111827">
        {COP(total)}
      </text>
    </svg>
  )
}

/* ── Barra horizontal ── */
function HBar({ name, value, maxVal, color, sub }) {
  const w = maxVal ? Math.max((value / maxVal) * 100, 2) : 0
  return (
    <div className="hbar-row">
      <div className="hbar-name">{name}</div>
      <div className="hbar-track">
        <div className="hbar-fill" style={{ width: `${w}%`, background: color }} />
      </div>
      <div className="hbar-vals">
        <span className="hbar-cop">{COP(value)}</span>
        {sub && <span className="hbar-sub">{sub}</span>}
      </div>
    </div>
  )
}

/* ── Budget card ── */
function BudgetCard({ totalGastado }) {
  const restante = PRESUPUESTO - totalGastado
  const p = Math.min((totalGastado / PRESUPUESTO) * 100, 100)
  const fillClass = p > 90 ? 'over' : p > 70 ? 'warn' : ''
  return (
    <div className="db-budget-card">
      <div className="db-budget-row">
        <span className="db-budget-label">Presupuesto total</span>
        <span className="db-budget-pct">{p.toFixed(1)}% ejecutado</span>
      </div>
      <div className="db-budget-amounts">
        <div>
          <div className="db-amount-val gastado">{COP(totalGastado)}</div>
          <div className="db-amount-label">Gastado</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={`db-amount-val ${restante < 0 ? 'rojo' : 'verde'}`}>{COP(restante)}</div>
          <div className="db-amount-label">Restante</div>
        </div>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${fillClass}`} style={{ width: `${p}%` }} />
      </div>
      <div className="db-budget-total">{COP(PRESUPUESTO)}</div>
    </div>
  )
}

export default function Dashboard({ gastos }) {
  const totalGastado = useMemo(() => gastos.reduce((s, g) => s + calcTotal(g), 0), [gastos])

  const porCategoria = useMemo(() =>
    CATS.map((cat) => ({
      name: cat.label, icon: cat.icon, color: cat.color,
      value: gastos.filter((g) => g.categoria === cat.id).reduce((s, g) => s + calcTotal(g), 0),
      count: gastos.filter((g) => g.categoria === cat.id).length,
    })).filter((d) => d.value > 0),
  [gastos])

  const porMaterial = useMemo(() => {
    const map = {}
    gastos.filter((g) => g.categoria === 'materiales').forEach((g) => {
      const k = g.descripcion
      map[k] = (map[k] || 0) + calcTotal(g)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 10)
  }, [gastos])

  const cantidades = useMemo(() => {
    const map = {}
    gastos.filter((g) => g.categoria === 'materiales').forEach((g) => {
      const k = g.descripcion
      if (!map[k]) map[k] = { name: k, qty: 0, unidad: g.unidad, gasto: 0 }
      const qty = esPorMetro(g.unidad)
        ? +(g.metros || 0) * Math.max(+(g.cantidad || 1), 1)
        : +(g.cantidad || 0)
      map[k].qty += qty
      map[k].gasto += calcTotal(g)
    })
    return Object.values(map).sort((a, b) => b.gasto - a.gasto)
  }, [gastos])

  const porManoObra = useMemo(() => {
    const map = {}
    gastos.filter((g) => g.categoria === 'mano_obra').forEach((g) => {
      const k = g.descripcion
      map[k] = (map[k] || 0) + calcTotal(g)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 8)
  }, [gastos])

  const maxMat  = porMaterial[0]?.value  || 1
  const maxObra = porManoObra[0]?.value  || 1

  if (gastos.length === 0) {
    return (
      <div className="db-wrap">
        <BudgetCard totalGastado={0} />
        <div className="db-stats-grid">
          {[{icon:'💰',label:'Total gastado',val:COP(0),sub:'0% ejecutado',subClass:''},{icon:'🏦',label:'Restante',val:COP(PRESUPUESTO),sub:'Del presupuesto',subClass:'verde'},{icon:'🧱',label:'Materiales',val:COP(0),sub:'0 registros',subClass:''},{icon:'👷',label:'Mano de obra',val:COP(0),sub:'0 registros',subClass:''}].map((s,i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-icon" style={{background:['#eff6ff','#f0fdf4','#eff6ff','#fff7ed'][i]}}>{s.icon}</div>
              <div className="stat-card-body"><div className="stat-card-val">{s.val}</div><div className="stat-card-label">{s.label}</div><div className={`stat-card-sub ${s.subClass}`}>{s.sub}</div></div>
            </div>
          ))}
        </div>
        <div className="empty" style={{ marginTop: 32 }}>
          <div className="empty-icon">📊</div>
          <h3>Sin datos aún</h3>
          <p>Agrega gastos con el botón + para ver las gráficas.</p>
        </div>
      </div>
    )
  }

  const pctExec = Math.min((totalGastado / PRESUPUESTO) * 100, 100)
  const restante = PRESUPUESTO - totalGastado
  const matTotal  = porCategoria.find(c => c.name === 'Materiales')?.value  ?? 0
  const obraTotal = porCategoria.find(c => c.name === 'Mano de obra')?.value ?? 0

  return (
    <div className="db-wrap">
      <BudgetCard totalGastado={totalGastado} />

      {/* Stats desktop */}
      <div className="db-stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{background:'#fefce8'}}>💰</div>
          <div className="stat-card-body">
            <div className="stat-card-val">{COP(totalGastado)}</div>
            <div className="stat-card-label">Total gastado</div>
            <div className={`stat-card-sub ${pctExec>90?'rojo':pctExec>70?'yellow':''}`}>{pctExec.toFixed(1)}% del presupuesto</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{background: restante>=0 ? '#f0fdf4':'#fef2f2'}}>{restante>=0?'🏦':'⚠️'}</div>
          <div className="stat-card-body">
            <div className="stat-card-val">{COP(Math.abs(restante))}</div>
            <div className="stat-card-label">{restante>=0?'Presupuesto restante':'Excedido'}</div>
            <div className={`stat-card-sub ${restante>=0?'verde':'rojo'}`}>{restante>=0?'Disponible':'Por encima del límite'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{background:'#eff6ff'}}>🧱</div>
          <div className="stat-card-body">
            <div className="stat-card-val">{COP(matTotal)}</div>
            <div className="stat-card-label">Materiales</div>
            <div className="stat-card-sub" style={{color:'#64748b'}}>{gastos.filter(g=>g.categoria==='materiales').length} registros</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{background:'#fff7ed'}}>👷</div>
          <div className="stat-card-body">
            <div className="stat-card-val">{COP(obraTotal)}</div>
            <div className="stat-card-label">Mano de obra</div>
            <div className="stat-card-sub" style={{color:'#64748b'}}>{gastos.filter(g=>g.categoria==='mano_obra').length} registros</div>
          </div>
        </div>
      </div>

      {/* Tarjetas por categoría (mobile) */}
      <div className="db-cat-cards">
        {CATS.map((cat) => {
          const d = porCategoria.find((x) => x.name === cat.label) ?? { value: 0, count: 0 }
          return (
            <div key={cat.id} className={`db-cat-card db-cat-${cat.dotClass}`}>
              <span className="db-cat-icon">{cat.icon}</span>
              <span className="db-cat-val">{COP(d.value)}</span>
              <span className="db-cat-label">{cat.label}</span>
              <span className="db-cat-pct" style={{ color: cat.color }}>
                {pct(d.value, totalGastado).toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>

      <div className="db-charts-grid">

      {/* Donut distribución */}
      {porCategoria.length > 0 && (
        <div className="db-chart-card">
          <div className="db-chart-title">Distribución del gasto</div>
          <Donut segments={porCategoria} />
          <div className="chart-legend">
            {porCategoria.map((d) => (
              <div key={d.name} className="chart-legend-item">
                <span className="chart-legend-dot" style={{ background: d.color }} />
                <span>{d.icon} {d.name} <span style={{ color: '#9ca3af', fontSize: 11 }}>({d.count})</span></span>
                <span className="chart-legend-val">{COP(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gasto por material */}
      {porMaterial.length > 0 && (
        <div className="db-chart-card db-chart-full">
          <div className="db-chart-title">🧱 Gasto por material</div>
          {porMaterial.map((d, i) => (
            <HBar key={d.name} name={d.name} value={d.value} maxVal={maxMat}
              color={`hsl(${220 - i * 12}, 75%, ${52 + i * 2}%)`} />
          ))}
        </div>
      )}

      {/* Cantidades compradas */}
      {cantidades.length > 0 && (
        <div className="db-chart-card db-chart-full">
          <div className="db-chart-title">📦 Cantidades compradas</div>
          <div className="db-qty-list">
            {cantidades.map((d) => (
              <div key={d.name} className="db-qty-row">
                <div className="db-qty-name">{d.name}</div>
                <div className="db-qty-right">
                  <span className="db-qty-val">
                    {d.qty % 1 === 0 ? d.qty.toLocaleString('es-CO') : d.qty.toFixed(2)}
                    <span className="db-qty-unit"> {d.unidad}</span>
                  </span>
                  <span className="db-qty-gasto">{COP(d.gasto)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mano de obra */}
      {porManoObra.length > 0 && (
        <div className="db-chart-card">
          <div className="db-chart-title">👷 Mano de obra</div>
          {porManoObra.map((d, i) => (
            <HBar key={d.name} name={d.name} value={d.value} maxVal={maxObra}
              color={`hsl(${25 + i * 8}, 85%, ${52 + i * 2}%)`} />
          ))}
        </div>
      )}

      </div> {/* end db-charts-grid */}
      <div style={{ height: 24 }} />
    </div>
  )
}
