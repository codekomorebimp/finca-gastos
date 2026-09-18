import { useState, useEffect, useRef } from 'react'
import { subscribeCatalogo, addMaterial, updateMaterial, deleteMaterial } from './services/catalogo'
import { syncGastosFromCatalogo, migrarCatalogoIds } from './services/gastos'
import { CATALOGO as DEFAULTS, UNIDADES_MAT, COP } from './data'

const EMPTY_FORM = { nombre: '', unidad: 'unidad', precio: '', porMetro: false }

// Flag de sesión: evita re-sembrar si el usuario borra todo manualmente
let _seeded = false

export default function Catalogo() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [syncMsg, setSyncMsg]     = useState(null)
  const seedingRef                = useRef(false)
  const migratedRef               = useRef(false)

  useEffect(() =>
    subscribeCatalogo((data) => {
      // Auto-cargar predeterminados la primera vez que el catálogo esté vacío
      if (data.length === 0 && !_seeded && !seedingRef.current) {
        seedingRef.current = true
        _seeded = true
        Promise.all(
          DEFAULTS.map((m) => addMaterial({ nombre: m.nombre, unidad: m.unidad, precio: m.precio, porMetro: m.porMetro }))
        ).finally(() => { seedingRef.current = false })
      }
      setItems(data.sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setLoading(false)
    }),
  [])

  // Migración automática: asigna catalogoId a gastos viejos (una sola vez por sesión)
  useEffect(() => {
    if (items.length === 0 || migratedRef.current) return
    migratedRef.current = true
    migrarCatalogoIds(items)
      .then((n) => {
        if (n > 0) {
          setSyncMsg(`🔗 ${n} gasto${n !== 1 ? 's' : ''} vinculado${n !== 1 ? 's' : ''} al catálogo automáticamente`)
          setTimeout(() => setSyncMsg(null), 5000)
        }
      })
      .catch(console.error)
  }, [items])

  async function seedDefaults() {
    _seeded = true
    for (const m of DEFAULTS)
      await addMaterial({ nombre: m.nombre, unidad: m.unidad, precio: m.precio, porMetro: m.porMetro })
  }

  function change(field, val) {
    setModal((m) => ({ ...m, form: { ...m.form, [field]: val } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { form, mode } = modal
    if (!form.nombre.trim() || !form.precio) return
    const data = { nombre: form.nombre.trim(), unidad: form.unidad, precio: +form.precio, porMetro: !!form.porMetro }
    if (mode === 'add') {
      await addMaterial(data)
    } else {
      // nombre original antes de editar (para encontrar gastos legacy por descripción)
      const originalNombre = items.find((i) => i.id === form.id)?.nombre ?? form.nombre
      await updateMaterial({ id: form.id, ...data })
      try {
        const n = await syncGastosFromCatalogo(form.id, originalNombre, data)
        setSyncMsg(n > 0
          ? `✅ ${n} gasto${n !== 1 ? 's' : ''} actualizado${n !== 1 ? 's' : ''}`
          : '✅ Material actualizado (sin gastos vinculados aún)')
      } catch (err) {
        setSyncMsg('⚠️ Material actualizado, error al sincronizar gastos')
        console.error('syncGastosFromCatalogo:', err)
      }
      setTimeout(() => setSyncMsg(null), 4000)
    }
    setModal(null)
  }

  async function doDelete() {
    await deleteMaterial(confirmId)
    setConfirmId(null)
  }

  if (loading) return <div className="loading-wrap"><div className="loading-spinner" /><p>Cargando catálogo...</p></div>

  return (
    <div className="page-wrap">
      {syncMsg && <div className="sync-toast">{syncMsg}</div>}
      <div className="pg-toolbar">
        <span className="reg-count">{items.length} material{items.length !== 1 ? 'es' : ''}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {items.length === 0 && (
            <button className="btn-outline" onClick={seedDefaults}>📋 Predeterminados</button>
          )}
          <button className="btn-primary-sm" onClick={() => setModal({ mode: 'add', form: { ...EMPTY_FORM } })}>
            + Agregar
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🧱</div>
          <h3>Sin materiales en catálogo</h3>
          <p>Agrega materiales o carga los predeterminados.</p>
        </div>
      ) : (
        <>
          {/* Tabla desktop */}
          <div className="reg-table-wrap">
            <table className="reg-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Unidad</th>
                  <th style={{ textAlign: 'right' }}>Precio unit.</th>
                  <th style={{ textAlign: 'center' }}>× Metro</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="reg-table-row">
                    <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                    <td className="td-fecha">{item.unidad}</td>
                    <td className="td-total">{COP(item.precio)}</td>
                    <td className="td-actions">
                      {item.porMetro ? <span className="badge badge-blue">Sí</span> : <span className="td-empty">—</span>}
                    </td>
                    <td className="td-actions">
                      <button className="tbl-btn-edit" title="Editar"
                        onClick={() => setModal({ mode: 'edit', form: { ...item } })}>✏️</button>
                      <button className="tbl-btn-del" title="Eliminar"
                        onClick={() => setConfirmId(item.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas móvil */}
          <div className="mat-cards">
            {items.map((item) => (
              <div key={item.id} className="mat-card">
                <div className="mat-card-body">
                  <div className="mat-card-name">{item.nombre}</div>
                  <div className="mat-card-sub">
                    {item.unidad}
                    {item.porMetro && <span className="badge badge-blue" style={{ marginLeft: 6 }}>× metro</span>}
                  </div>
                </div>
                <div className="mat-card-right">
                  <div className="mat-card-price">{COP(item.precio)}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    <button className="tbl-btn-edit"
                      onClick={() => setModal({ mode: 'edit', form: { ...item } })}>✏️</button>
                    <button className="tbl-btn-del"
                      onClick={() => setConfirmId(item.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal agregar/editar */}
      {modal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">{modal.mode === 'add' ? '🧱 Nuevo material' : '✏️ Editar material'}</div>
              <button className="btn-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-body">
                <div className="field">
                  <label>Nombre del material</label>
                  <input placeholder="Ej: Cemento gris" required autoFocus
                    value={modal.form.nombre} onChange={(e) => change('nombre', e.target.value)} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Precio ($)</label>
                    <input type="number" min="0" inputMode="numeric" placeholder="0" required
                      value={modal.form.precio} onChange={(e) => change('precio', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Unidad</label>
                    <select value={modal.form.unidad} onChange={(e) => change('unidad', e.target.value)}>
                      {UNIDADES_MAT.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label>¿Cómo se cobra?</label>
                  <div className="unit-mode-picker">
                    <button type="button"
                      className={`unit-mode-btn ${!modal.form.porMetro ? 'unit-mode-active' : ''}`}
                      onClick={() => change('porMetro', false)}>
                      <span className="unit-mode-icon">📦</span>
                      <span className="unit-mode-label">Por unidad</span>
                      <span className="unit-mode-hint">precio × cantidad</span>
                    </button>
                    <button type="button"
                      className={`unit-mode-btn ${modal.form.porMetro ? 'unit-mode-active unit-mode-active-metro' : ''}`}
                      onClick={() => change('porMetro', true)}>
                      <span className="unit-mode-icon">📐</span>
                      <span className="unit-mode-label">Por metro</span>
                      <span className="unit-mode-hint">precio × metros × cantidad</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                {modal.mode === 'edit' && (
                  <button type="button" className="btn-del"
                    onClick={() => { setConfirmId(modal.form.id); setModal(null) }}>🗑️</button>
                )}
                <button type="submit" className="btn-main">
                  {modal.mode === 'add' ? 'Guardar material' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {confirmId && (
        <div className="confirm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null) }}>
          <div className="confirm-box">
            <div className="confirm-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3>¿Eliminar este material?</h3>
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
