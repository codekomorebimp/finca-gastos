import { useState, useEffect, useMemo } from 'react'
import './App.css'
import { CATS, PRESUPUESTO, COP, calcTotal, emptyForm } from './data'
import { subscribeGastos, addGasto, updateGasto, deleteGasto } from './services/gastos'
import { subscribeCatalogo } from './services/catalogo'
import { subscribeCatalogoObra } from './services/catalogoObra'
import { subscribeObraEjecutada } from './services/obraEjecutada'
import { getSession, saveSession, logout, isAdmin } from './auth'
import { loginFirestore, seedAuthData } from './services/usuarios'
import Dashboard from './Dashboard'
import Registros from './Registros'
import Catalogo  from './Catalogo'
import Facturas  from './Facturas'
import ObraPage  from './ObraPage'
import Modal     from './Modal'
import LoginPage from './Login'

function exportCSV(gastos) {
  const cols = ['# Factura','Descripcion','Categoria','Unidad','Precio Unitario','Metros','Cantidad','Total','Fecha','Notas']
  const rows = gastos.map((g) => [
    g.factura ?? '', g.descripcion,
    CATS.find((c) => c.id === g.categoria)?.label ?? g.categoria,
    g.unidad, g.precio_unitario, g.metros ?? '', g.cantidad,
    calcTotal(g), g.fecha, g.notas ?? '',
  ])
  const csv = [cols, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿'+csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a'); a.href=url; a.download='gastos_finca.csv'; a.click()
  URL.revokeObjectURL(url)
}

function Sidebar({ tab, setTab, gastos, onAdd, session, onLogout }) {
  const admin        = isAdmin(session)
  const totalGastado = useMemo(() => gastos.reduce((s,g) => s+calcTotal(g), 0), [gastos])
  const restante     = PRESUPUESTO - totalGastado
  const pct          = Math.min((totalGastado / PRESUPUESTO) * 100, 100)
  const fillClass    = pct > 90 ? 'over' : pct > 70 ? 'warn' : ''

  const NAV = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', badge: null },
    ...(admin ? [
      { id: 'registros', icon: '📋', label: 'Registros', badge: gastos.length },
      { id: 'facturas',  icon: '🧾', label: 'Facturas',  badge: null },
      { id: 'catalogo',  icon: '🧱', label: 'Catálogo',  badge: null },
      { id: 'obra',      icon: '👷', label: 'Obra',      badge: null },
    ] : []),
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">🏗️ Finca JFM</div>
        <div className="sidebar-logo-sub">Control de gastos</div>
      </div>

      <div className="sidebar-budget">
        <div className="sidebar-budget-label">Presupuesto</div>
        <div className="sidebar-budget-val">{COP(totalGastado)}</div>
        <div className={`sidebar-budget-rest ${restante < 0 ? 'rojo' : ''}`}>
          {restante >= 0 ? `${COP(restante)} restante` : `${COP(Math.abs(restante))} excedido`}
        </div>
        <div className="sidebar-progress">
          <div className={`sidebar-progress-fill ${fillClass}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="sidebar-nav-label">Menú</div>
        {NAV.map((item) => (
          <button key={item.id}
            className={`nav-item ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}>
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
            {item.badge !== null && <span className="nav-item-badge">{item.badge}</span>}
          </button>
        ))}
      </div>

      {admin && <button className="sidebar-add-btn" onClick={onAdd}>+ Agregar gasto</button>}

      <div className="sidebar-user">
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{session.nombre}</span>
          <span className={`sidebar-user-role ${session.role}`}>{session.role === 'admin' ? 'Admin' : 'Vendedor'}</span>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout} title="Cerrar sesión">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  )
}

export default function App() {
  const [session, setSession]       = useState(() => getSession())
  const [gastos, setGastos]         = useState([])
  const [catalogo, setCatalogo]     = useState([])
  const [catalogoObra, setCatalogoObra]     = useState([])
  const [obraEjecutada, setObraEjecutada]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('dashboard')
  const [modal, setModal]           = useState(null)
  const [confirmId, setConfirmId]   = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Sembrar colecciones de auth en Firestore si no existen
  useEffect(() => { seedAuthData().catch(console.error) }, [])

  useEffect(() => subscribeGastos((data) => { setGastos(data); setLoading(false) }), [])
  useEffect(() => subscribeCatalogo((data) =>
    setCatalogo(data.sort((a, b) => a.nombre.localeCompare(b.nombre)))
  ), [])
  useEffect(() => subscribeCatalogoObra((data) =>
    setCatalogoObra(data.sort((a, b) => a.nombre.localeCompare(b.nombre)))
  ), [])
  useEffect(() => subscribeObraEjecutada((data) =>
    setObraEjecutada(data.sort((a, b) => b.fecha.localeCompare(a.fecha)))
  ), [])

  const admin        = isAdmin(session)
  const totalGastado = useMemo(() => gastos.reduce((s,g) => s+calcTotal(g), 0), [gastos])
  const restante     = PRESUPUESTO - totalGastado

  async function handleLogin(username, password) {
    const session = await loginFirestore(username, password)
    if (!session) return false
    saveSession(session)
    setSession(session)
    setTab('dashboard')
    return true
  }
  function handleLogout() { logout(); setSession(null) }

  function openAdd()   { setModal({ mode: 'add', form: emptyForm('materiales') }) }
  function openEdit(g) { setModal({ mode: 'edit', form: { ...g, metros: g.metros ?? '', cantidad: g.cantidad ?? '' } }) }

  function handleSubmit(e) {
    e.preventDefault()
    const { form, mode } = modal
    if (!form.descripcion || !form.precio_unitario || !form.factura?.trim()) return
    mode === 'add' ? addGasto(form) : updateGasto(form)
    setModal(null)
  }

  function handleBatchSubmit(items) {
    items.forEach(f => addGasto(f))
    setModal(null)
  }

  function doDelete() { deleteGasto(confirmId); setConfirmId(null); setModal(null) }

  const PAGE_TITLES = {
    dashboard: { title: 'Dashboard', sub: 'Resumen general y gráficas' },
    registros: { title: 'Registros', sub: 'Todos los gastos registrados' },
    facturas:  { title: 'Facturas',  sub: 'Gastos agrupados por factura' },
    catalogo:  { title: 'Catálogo',  sub: 'Materiales y precios de referencia' },
    obra:      { title: 'Mano de obra', sub: 'Avance de obra ejecutada y tipos de trabajo' },
  }

  if (!session) return <LoginPage onLogin={handleLogin} />

  return (
    <div className="app-shell">
      <Sidebar tab={tab} setTab={setTab} gastos={gastos} onAdd={openAdd} session={session} onLogout={handleLogout} />

      <div className="main-area">
        {/* Header móvil */}
        <div className="mobile-header">
          <div className="mobile-header-left">
            <h1>Gastos Finca 🏗️</h1>
            <p>{COP(PRESUPUESTO)} presupuesto</p>
          </div>
          <div className="mobile-header-right">
            <div className="mobile-header-gastado">{COP(totalGastado)}</div>
            <div className={`mobile-header-rest ${restante < 0 ? 'rojo' : ''}`}>
              {restante >= 0 ? `${COP(restante)} restante` : 'Excedido'}
            </div>
          </div>
          <button className="mobile-logout-btn" onClick={handleLogout} title="Cerrar sesión">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Header desktop */}
        <div className="page-header">
          <div>
            <div className="page-title">{PAGE_TITLES[tab]?.title}</div>
            <div className="page-subtitle">{PAGE_TITLES[tab]?.sub}</div>
          </div>
          {tab === 'registros' && admin && (
            <button className="btn-csv-desk" onClick={() => exportCSV(gastos)}>
              📊 Exportar CSV
            </button>
          )}
        </div>

        {/* Contenido */}
        <div className="page-content">
          {loading ? (
            <div className="loading-wrap">
              <div className="loading-spinner" />
              <p>Cargando datos...</p>
            </div>
          ) : (
            <>
              {tab === 'dashboard' && <Dashboard gastos={gastos} obraEjecutada={obraEjecutada} />}
              {tab === 'registros' && admin && (
                <Registros gastos={gastos} onEdit={openEdit}
                  onDelete={(id) => setConfirmId(id)}
                  onExport={() => exportCSV(gastos)} />
              )}
              {tab === 'facturas'  && admin && <Facturas gastos={gastos} />}
              {tab === 'catalogo'  && admin && <Catalogo />}
              {tab === 'obra'      && admin && <ObraPage catalogoObra={catalogoObra} obraEjecutada={obraEjecutada} />}
            </>
          )}
        </div>

        {/* Nav móvil */}
        <nav className="bottom-nav">
          <button className={`nav-btn ${tab === 'dashboard' ? 'nav-active' : ''}`} onClick={() => setTab('dashboard')}>
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </button>
          {admin && (
            <>
              <button className="nav-fab" onClick={openAdd}>+</button>
              <button className={`nav-btn ${['registros','facturas','catalogo','obra'].includes(tab) ? 'nav-active' : ''}`}
                onClick={() => setDrawerOpen(true)}>
                <span className="nav-icon nav-hamburger">
                  <span /><span /><span />
                </span>
                <span className="nav-label">Menú</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Drawer lateral móvil */}
      {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />}
      <div className={`mobile-drawer ${drawerOpen ? 'drawer-open' : ''}`}>
        <div className="drawer-header">
          <div>
            <div className="drawer-logo">🏗️ Finca JFM</div>
            <div className="drawer-logo-sub">Control de gastos</div>
          </div>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>
        <div className="drawer-nav">
          {[
            { id: 'registros', icon: '📋', label: 'Registros',    color: '#2563eb', bg: '#dbeafe' },
            { id: 'facturas',  icon: '🧾', label: 'Facturas',     color: '#059669', bg: '#d1fae5' },
            { id: 'catalogo',  icon: '🧱', label: 'Catálogo',     color: '#d97706', bg: '#fde68a' },
            { id: 'obra',      icon: '👷', label: 'Mano de obra', color: '#7c3aed', bg: '#ede9fe' },
          ].map(item => (
            <button key={item.id}
              className={`drawer-item ${tab === item.id ? 'drawer-item-active' : ''}`}
              onClick={() => { setTab(item.id); setDrawerOpen(false) }}>
              <span className="drawer-item-badge" style={{ background: item.bg, color: item.color }}>
                {item.icon}
              </span>
              <span className="drawer-item-label">{item.label}</span>
              <span className="drawer-item-arrow">›</span>
            </button>
          ))}
        </div>
        <div className="drawer-footer">
          <div className="drawer-user-info">
            <span className="drawer-user-name">{session?.nombre}</span>
            <span className={`sidebar-user-role ${session?.role}`}>
              {session?.role === 'admin' ? 'Admin' : 'Vendedor'}
            </span>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <Modal modal={modal} setModal={setModal} onSubmit={handleSubmit}
        onBatchSubmit={handleBatchSubmit}
        onDelete={() => setConfirmId(modal.form.id)} gastos={gastos} catalogo={catalogo} />

      {confirmId && (
        <div className="confirm-overlay" onClick={(e) => { if (e.target===e.currentTarget) setConfirmId(null) }}>
          <div className="confirm-box">
            <div className="confirm-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3>¿Eliminar este registro?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className="confirm-btns">
              <button className="btn-cancel-c" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button className="btn-del-c" onClick={doDelete}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
