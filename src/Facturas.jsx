import { useState, useMemo } from 'react'
import { CATS, COP, calcTotal, fmtDate, catOf, esPorMetro } from './data'

const TABS = [
  { id: 'materiales', label: 'Materiales', icon: '🧱', dotClass: 'mat' },
  { id: 'mano_obra',  label: 'Mano de obra', icon: '👷', dotClass: 'obra' },
  { id: 'otro',       label: 'Otro', icon: '📦', dotClass: 'otro' },
]

function FacturaDetalle({ fac, onBack }) {
  const total = fac.items.reduce((s, g) => s + calcTotal(g), 0)
  const sorted = [...fac.items].sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <div className="page-wrap">
      <div className="fac-det-topbar">
        <button className="fac-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Facturas
        </button>
      </div>

      <div className="fac-det-hero">
        <div className="fac-det-hero-num">
          {fac.esSinFactura ? 'Sin número de factura' : `Factura # ${fac.factura}`}
        </div>
        <div className="fac-det-hero-total">{COP(total)}</div>
        <div className="fac-det-hero-meta">
          {fac.items.length} producto{fac.items.length !== 1 ? 's' : ''}
          {fac.fechaMin && (
            <> · {fmtDate(fac.fechaMin)}{fac.fechaMin !== fac.fechaMax ? ` → ${fmtDate(fac.fechaMax)}` : ''}</>
          )}
        </div>
        <div className="fac-det-hero-cats">
          {[...new Set(fac.items.map(g => g.categoria))].map(catId => {
            const cat = CATS.find(c => c.id === catId)
            return cat ? <span key={catId} className={`fac-hero-badge fac-hero-${cat.dotClass}`}>{cat.icon} {cat.label}</span> : null
          })}
        </div>
      </div>

      <div className="fac-det-items">
        {sorted.map((g, i) => {
          const cat    = catOf(g.categoria)
          const isMtro = g.porMetro ?? esPorMetro(g.unidad)
          const total  = calcTotal(g)
          return (
            <div key={g.id} className="fac-det-row">
              <div className="fac-det-row-num">{i + 1}</div>
              <div className={`fac-det-row-icon cat-dot ${cat.dotClass}`}>{cat.icon}</div>
              <div className="fac-det-row-body">
                <div className="fac-det-row-name">{g.descripcion}</div>
                <div className="fac-det-row-calc">
                  {COP(g.precio_unitario)} / {g.unidad}
                  {isMtro
                    ? ` × ${g.metros}${+g.cantidad > 1 ? ` × ${g.cantidad} pzas` : ''}`
                    : ` × ${g.cantidad}`}
                </div>
                <div className="fac-det-row-date">{fmtDate(g.fecha)}</div>
              </div>
              <div className="fac-det-row-total">{COP(total)}</div>
            </div>
          )
        })}
      </div>

      <div className="fac-det-footer">
        <span className="fac-footer-label">Total factura</span>
        <span className="fac-footer-total">{COP(total)}</span>
      </div>

      <div style={{ height: 24 }} />
    </div>
  )
}

function buildFacturas(gastos) {
  const map = {}
  gastos.forEach(g => {
    const key = g.factura?.trim() || '__sin__'
    if (!map[key]) map[key] = { factura: key, esSinFactura: key === '__sin__', items: [], fechas: [] }
    map[key].items.push(g)
    if (g.fecha) map[key].fechas.push(g.fecha)
  })
  return Object.values(map)
    .map(f => {
      const sorted = [...f.fechas].sort()
      return { ...f, total: f.items.reduce((s, g) => s + calcTotal(g), 0), fechaMin: sorted[0] ?? '', fechaMax: sorted.at(-1) ?? '' }
    })
    .sort((a, b) => {
      if (a.esSinFactura) return 1
      if (b.esSinFactura) return -1
      return b.fechaMax.localeCompare(a.fechaMax)
    })
}

export default function Facturas({ gastos }) {
  const [tabCat,   setTabCat]   = useState('materiales')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const gastosFiltrados = useMemo(
    () => gastos.filter(g => g.categoria === tabCat),
    [gastos, tabCat]
  )

  const facturas = useMemo(() => buildFacturas(gastosFiltrados), [gastosFiltrados])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return facturas
    return facturas.filter(f => !f.esSinFactura && f.factura.toLowerCase().includes(q))
  }, [facturas, search])

  const conNumero = facturas.filter(f => !f.esSinFactura).length

  const selFac = selected ? facturas.find(f => f.factura === selected) : null

  function handleTabChange(id) {
    setTabCat(id)
    setSelected(null)
    setSearch('')
  }

  if (selFac) return <FacturaDetalle fac={selFac} onBack={() => setSelected(null)} />

  const tabInfo = TABS.find(t => t.id === tabCat)

  return (
    <div className="page-wrap">
      {/* Tabs de categoría */}
      <div className="fac-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`fac-tab fac-tab-${t.dotClass} ${tabCat === t.id ? 'fac-tab-active' : ''}`}
            onClick={() => handleTabChange(t.id)}
          >
            <span className="fac-tab-icon">{t.icon}</span>
            <span className="fac-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      {gastosFiltrados.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">{tabInfo.icon}</div>
          <h3>Sin registros de {tabInfo.label.toLowerCase()}</h3>
          <p>Agrega gastos en esta categoría para verlos aquí.</p>
        </div>
      ) : (
        <>
          <div className="search-wrap" style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 14 }}>
            <div className="search-wrap-inner">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Buscar por número de factura..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="pg-toolbar" style={{ paddingTop: 0 }}>
            <span className="reg-count">
              {conNumero} factura{conNumero !== 1 ? 's' : ''}
              {facturas.some(f => f.esSinFactura) && ` · ${facturas.find(f => f.esSinFactura)?.items.length} sin número`}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <h3>Sin resultados</h3>
              <p>No hay facturas con ese número.</p>
            </div>
          ) : (
            <div className="fac-list">
              {filtered.map(f => (
                <div key={f.factura} className={`fac-card ${f.esSinFactura ? 'fac-card-sin' : ''}`} onClick={() => setSelected(f.factura)}>
                  <div className="fac-card-icon">{f.esSinFactura ? '📋' : '🧾'}</div>
                  <div className="fac-card-body">
                    <div className="fac-card-num">
                      {f.esSinFactura ? 'Sin número de factura' : `Factura # ${f.factura}`}
                    </div>
                    <div className="fac-card-meta">
                      {f.items.length} producto{f.items.length !== 1 ? 's' : ''}
                      {f.fechaMin && <> · {fmtDate(f.fechaMin)}{f.fechaMin !== f.fechaMax ? ` → ${fmtDate(f.fechaMax)}` : ''}</>}
                    </div>
                    <div className="fac-card-cats">
                      {[...new Set(f.items.map(g => g.categoria))].map(catId => {
                        const cat = CATS.find(c => c.id === catId)
                        return cat ? <span key={catId} className={`tbl-cat-badge tbl-cat-${cat.dotClass}`}>{cat.icon} {cat.label}</span> : null
                      })}
                    </div>
                  </div>
                  <div className="fac-card-right">
                    <div className="fac-card-total">{COP(f.total)}</div>
                    <div className="fac-card-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <div style={{ height: 16 }} />
    </div>
  )
}
