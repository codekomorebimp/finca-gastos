import { useState, useMemo, useRef } from 'react'
import { CATS, COP, calcTotal, esPorMetro, fmtDate, catOf } from './data'

const SWIPE_THRESHOLD = 72

function SwipeCard({ onDelete, onEdit, children }) {
  const [offset, setOffset]     = useState(0)
  const [swiped, setSwiped]     = useState(false)
  const startX                  = useRef(0)
  const dragging                = useRef(false)
  const moved                   = useRef(false)

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX
    dragging.current = true
    moved.current = false
  }

  function onTouchMove(e) {
    if (!dragging.current) return
    const delta = e.touches[0].clientX - startX.current
    if (Math.abs(delta) > 6) moved.current = true
    if (delta < 0) {
      setOffset(Math.max(delta, -SWIPE_THRESHOLD))
      setSwiped(false)
    } else if (swiped) {
      setOffset(Math.min(delta - SWIPE_THRESHOLD, 0))
    }
  }

  function onTouchEnd() {
    dragging.current = false
    if (offset < -SWIPE_THRESHOLD * 0.55) {
      setOffset(-SWIPE_THRESHOLD)
      setSwiped(true)
    } else {
      setOffset(0)
      setSwiped(false)
    }
  }

  function handleCardClick() {
    if (moved.current) return
    if (swiped) { setOffset(0); setSwiped(false); return }
    onEdit()
  }

  return (
    <div className="swipe-wrap">
      <div className="swipe-del-btn" onClick={onDelete}>
        <svg className="swipe-del-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        <span className="swipe-del-label">Eliminar</span>
      </div>
      <div
        className="swipe-card-inner"
        style={{ transform: `translateX(${offset}px)`, transition: dragging.current ? 'none' : 'transform 0.22s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleCardClick}
      >
        {children}
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export default function Registros({ gastos, onEdit, onDelete, onExport }) {
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('all')
  const [filterMat, setFilterMat]   = useState('')
  const [filterFact, setFilterFact] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const materialesUnicos = useMemo(() => {
    const set = new Set(gastos.filter((g) => g.categoria === 'materiales').map((g) => g.descripcion))
    return [...set].sort()
  }, [gastos])

  const facturasUnicas = useMemo(() => {
    const set = new Set(gastos.map((g) => g.factura).filter(Boolean))
    return [...set].sort()
  }, [gastos])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return gastos.filter((g) => {
      if (filterCat !== 'all' && g.categoria !== filterCat) return false
      if (filterMat && g.descripcion !== filterMat) return false
      if (filterFact && g.factura !== filterFact) return false
      if (fechaDesde && g.fecha < fechaDesde) return false
      if (fechaHasta && g.fecha > fechaHasta) return false
      if (q && !g.descripcion.toLowerCase().includes(q) && !g.notas?.toLowerCase().includes(q) && !g.factura?.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id)
  }, [gastos, filterCat, filterMat, filterFact, fechaDesde, fechaHasta, search])

  const filteredTotal = useMemo(() => filtered.reduce((s, g) => s + calcTotal(g), 0), [filtered])
  const hayFiltros = filterCat !== 'all' || filterMat || filterFact || fechaDesde || fechaHasta || search

  function limpiar() {
    setFilterCat('all'); setFilterMat(''); setFilterFact('')
    setFechaDesde(''); setFechaHasta(''); setSearch('')
  }

  const emptyState = (
    <div className="empty">
      <div className="empty-icon">{hayFiltros ? '🔍' : '🏗️'}</div>
      <h3>{hayFiltros ? 'Sin resultados' : 'Sin gastos aún'}</h3>
      <p>{hayFiltros ? 'Intenta con otros filtros.' : 'Toca el botón + para agregar.'}</p>
    </div>
  )

  return (
    <div className="reg-wrap">
      <div className="search-wrap">
        <div className="search-wrap-inner">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Buscar descripción, notas, factura..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="reg-filters">
        <div className="filter-group">
          <div className="filter-label">Categoría</div>
          <div className="filter-chips">
            <button className={`chip ${filterCat === 'all' ? 'chip-active-all' : ''}`} onClick={() => setFilterCat('all')}>Todos</button>
            {CATS.map((cat) => (
              <button key={cat.id} className={`chip ${filterCat === cat.id ? `chip-active-${cat.dotClass}` : ''}`}
                onClick={() => setFilterCat(cat.id)}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {materialesUnicos.length > 0 && (
          <div className="filter-group">
            <div className="filter-label">Material</div>
            <select className={`filter-select ${filterMat ? 'active' : ''}`} value={filterMat} onChange={(e) => setFilterMat(e.target.value)}>
              <option value="">Todos los materiales</option>
              {materialesUnicos.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        {facturasUnicas.length > 0 && (
          <div className="filter-group">
            <div className="filter-label"># Factura</div>
            <select className={`filter-select ${filterFact ? 'active' : ''}`} value={filterFact} onChange={(e) => setFilterFact(e.target.value)}>
              <option value="">Todas las facturas</option>
              {facturasUnicas.map((f) => <option key={f} value={f}>📄 {f}</option>)}
            </select>
          </div>
        )}

        <div className="filter-group">
          <div className="filter-label">Rango de fechas</div>
          <div className="filter-date-row">
            <input type="date" className="filter-date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            <span className="filter-date-sep">→</span>
            <input type="date" className="filter-date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
          </div>
        </div>

        {hayFiltros && (
          <button className="chip chip-clear" onClick={limpiar}>✕ Limpiar filtros</button>
        )}
      </div>

      <div className="reg-toolbar">
        <span className="reg-count">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="reg-subtotal">{COP(filteredTotal)}</span>
          <button className="btn-csv" onClick={onExport}>📊 CSV</button>
        </div>
      </div>

      {/* ── TABLA DESKTOP ── */}
      <div className="reg-table-wrap">
        {filtered.length === 0 ? emptyState : (
          <table className="reg-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cat.</th>
                <th>Descripción</th>
                <th># Factura</th>
                <th style={{ textAlign: 'right' }}>Cantidad</th>
                <th style={{ textAlign: 'right' }}>Precio unit.</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Notas</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => {
                const cat = catOf(g.categoria)
                const qty = esPorMetro(g.unidad)
                  ? `${g.metros} ${g.unidad}${+g.cantidad > 1 ? ` × ${g.cantidad}` : ''}`
                  : `${(+(g.cantidad || 0)).toLocaleString('es-CO')} ${g.unidad}`
                return (
                  <tr key={g.id} className="reg-table-row">
                    <td className="td-fecha">{fmtDate(g.fecha)}</td>
                    <td className="td-cat">
                      <span className={`tbl-cat-badge tbl-cat-${cat.dotClass}`}>{cat.icon} {cat.label}</span>
                    </td>
                    <td className="td-desc">{g.descripcion}</td>
                    <td className="td-fact">{g.factura ? `📄 ${g.factura}` : <span className="td-empty">—</span>}</td>
                    <td className="td-num">{qty}</td>
                    <td className="td-num">{COP(g.precio_unitario)}</td>
                    <td className="td-total">{COP(calcTotal(g))}</td>
                    <td className="td-notes">{g.notas || <span className="td-empty">—</span>}</td>
                    <td className="td-actions">
                      <button className="tbl-btn-edit" onClick={() => onEdit(g)} title="Editar"><PencilIcon /></button>
                      <button className="tbl-btn-del" onClick={() => onDelete(g.id)} title="Eliminar"><TrashIcon /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="reg-table-foot">
                <td colSpan={6} style={{ textAlign: 'right', paddingRight: 16 }}>Total filtrado</td>
                <td className="td-total">{COP(filteredTotal)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ── TARJETAS MOBILE ── */}
      <div className="cards-section" style={{ paddingTop: 0 }}>
        {filtered.length === 0 ? emptyState : (
          filtered.map((g) => {
            const cat = catOf(g.categoria)
            return (
              <SwipeCard key={g.id} onEdit={() => onEdit(g)} onDelete={() => onDelete(g.id)}>
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className={`cat-dot ${cat.dotClass}`}>{cat.icon}</div>
                  <div className="card-body">
                    <div className="card-name">{g.descripcion}</div>
                    <div className="card-sub">
                      {esPorMetro(g.unidad) ? (
                        <span>{g.metros} {g.unidad}{+g.cantidad > 1 ? ` × ${g.cantidad} pzas` : ''}</span>
                      ) : (
                        <span>{(+(g.cantidad || 0)).toLocaleString('es-CO')} {g.unidad}</span>
                      )}
                      <span className="dot-sep">·</span>
                      <span>{COP(g.precio_unitario)}/{g.unidad}</span>
                      {g.factura && <><span className="dot-sep">·</span><span>📄 {g.factura}</span></>}
                    </div>
                    {g.notas && <div className="card-note">{g.notas}</div>}
                  </div>
                  <div className="card-right">
                    <div className="card-total">{COP(calcTotal(g))}</div>
                    <div className="card-date">{fmtDate(g.fecha)}</div>
                  </div>
                </div>
              </SwipeCard>
            )
          })
        )}
      </div>

      <div style={{ height: 16 }} />
    </div>
  )
}
