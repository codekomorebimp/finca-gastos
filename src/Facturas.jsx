import { useState, useMemo, useEffect, useRef } from 'react'
import { CATS, COP, calcTotal, fmtDate, catOf, esPorMetro } from './data'
import { getFotos, subirFoto, eliminarFoto } from './services/facturaFotos'

const TABS = [
  { id: 'materiales', label: 'Materiales',   icon: '🧱', dotClass: 'mat'  },
  { id: 'mano_obra',  label: 'Mano de obra', icon: '👷', dotClass: 'obra' },
  { id: 'otro',       label: 'Otro',         icon: '📦', dotClass: 'otro' },
]

function FacturaDetalle({ fac, onBack }) {
  const total   = fac.items.reduce((s, g) => s + calcTotal(g), 0)
  const sorted  = [...fac.items].sort((a, b) => a.fecha.localeCompare(b.fecha))
  const fileRef = useRef()

  const [fotos,      setFotos]      = useState([])
  const [uploading,  setUploading]  = useState(false)
  const [fotoGrande, setFotoGrande] = useState(null)

  useEffect(() => {
    if (!fac.esSinFactura) getFotos(fac.factura).then(setFotos)
  }, [fac.factura, fac.esSinFactura])

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await subirFoto(fac.factura, file)
      setFotos(prev => [...prev, url])
    } catch (err) {
      console.error(err)
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleEliminar(url) {
    if (!confirm('¿Eliminar esta foto?')) return
    await eliminarFoto(fac.factura, url)
    setFotos(prev => prev.filter(f => f !== url))
  }

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
          const tot    = calcTotal(g)
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
              <div className="fac-det-row-total">{COP(tot)}</div>
            </div>
          )
        })}
      </div>

      <div className="fac-det-footer">
        <span className="fac-footer-label">Total factura</span>
        <span className="fac-footer-total">{COP(total)}</span>
      </div>

      {/* Fotos de la factura */}
      {!fac.esSinFactura && (
        <div className="fac-fotos">
          <div className="fac-fotos-header">
            <span className="fac-fotos-title">📷 Fotos de la factura</span>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            <button className="fac-fotos-btn" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? <span className="fac-fotos-spinner" /> : '+ Agregar foto'}
            </button>
          </div>

          {fotos.length === 0 && !uploading && (
            <div className="fac-fotos-empty">Sin fotos adjuntas</div>
          )}

          <div className="fac-fotos-grid">
            {fotos.map((url, i) => (
              <div key={i} className="fac-foto-wrap">
                <img src={url} className="fac-foto-img" alt={`Factura ${i+1}`}
                  onClick={() => setFotoGrande(url)} />
                <button className="fac-foto-del" onClick={() => handleEliminar(url)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {fotoGrande && (
        <div className="fac-lightbox" onClick={() => setFotoGrande(null)}>
          <img src={fotoGrande} className="fac-lightbox-img" alt="Foto factura" />
          <button className="fac-lightbox-close">✕</button>
        </div>
      )}

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
  const [tabCat,     setTabCat]     = useState('materiales')
  const [search,     setSearch]     = useState('')
  const [filterMat,  setFilterMat]  = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [selected,   setSelected]   = useState(null)

  // Gastos de la categoría activa
  const gastosCat = useMemo(
    () => gastos.filter(g => g.categoria === tabCat),
    [gastos, tabCat]
  )

  // Materiales únicos dentro de la categoría activa (para el selector)
  const materialesUnicos = useMemo(() => {
    const set = new Set(gastosCat.map(g => g.descripcion))
    return [...set].sort()
  }, [gastosCat])

  // Aplicar filtros de material y fecha antes de agrupar por factura
  const gastosFiltrados = useMemo(() => gastosCat.filter(g => {
    if (filterMat  && g.descripcion !== filterMat)  return false
    if (fechaDesde && g.fecha < fechaDesde)          return false
    if (fechaHasta && g.fecha > fechaHasta)          return false
    return true
  }), [gastosCat, filterMat, fechaDesde, fechaHasta])

  const facturas = useMemo(() => buildFacturas(gastosFiltrados), [gastosFiltrados])

  // Buscar por número de factura sobre las ya filtradas
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return facturas
    return facturas.filter(f => !f.esSinFactura && f.factura.toLowerCase().includes(q))
  }, [facturas, search])

  const conNumero  = facturas.filter(f => !f.esSinFactura).length
  const hayFiltros = search || filterMat || fechaDesde || fechaHasta

  function handleTabChange(id) {
    setTabCat(id); setSelected(null)
    setSearch(''); setFilterMat(''); setFechaDesde(''); setFechaHasta('')
  }
  function limpiar() { setSearch(''); setFilterMat(''); setFechaDesde(''); setFechaHasta('') }

  const selFac  = selected ? facturas.find(f => f.factura === selected) : null
  const tabInfo = TABS.find(t => t.id === tabCat)

  if (selFac) return <FacturaDetalle fac={selFac} onBack={() => setSelected(null)} />

  return (
    <div className="page-wrap">

      {/* Tabs de categoría */}
      <div className="fac-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={`fac-tab fac-tab-${t.dotClass} ${tabCat === t.id ? 'fac-tab-active' : ''}`}
            onClick={() => handleTabChange(t.id)}>
            <span className="fac-tab-icon">{t.icon}</span>
            <span className="fac-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      {gastosCat.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">{tabInfo.icon}</div>
          <h3>Sin registros de {tabInfo.label.toLowerCase()}</h3>
          <p>Agrega gastos en esta categoría para verlos aquí.</p>
        </div>
      ) : (
        <>
          {/* Barra de filtros compacta */}
          <div className="fac-filters">
            <div className="fac-filter-search">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="N° factura..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <select className={`filter-select fac-filter-sel ${filterMat ? 'active' : ''}`}
              value={filterMat} onChange={e => setFilterMat(e.target.value)}>
              <option value="">Todos los {tabInfo.label.toLowerCase()}</option>
              {materialesUnicos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <div className="fac-filter-dates">
              <input type="date" className="filter-date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
              <span className="filter-date-sep">→</span>
              <input type="date" className="filter-date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </div>

            {hayFiltros && (
              <button className="chip chip-clear" onClick={limpiar}>✕</button>
            )}
          </div>

          <div className="pg-toolbar" style={{ paddingTop: 4 }}>
            <span className="reg-count">
              {conNumero} factura{conNumero !== 1 ? 's' : ''}
              {facturas.some(f => f.esSinFactura) && ` · ${facturas.find(f => f.esSinFactura)?.items.length} sin número`}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <h3>Sin resultados</h3>
              <p>Intenta con otros filtros.</p>
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
