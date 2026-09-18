import { useState } from 'react'
import { COP, fmtDate } from './data'
import { addObraItem, updateObraItem, deleteObraItem } from './services/catalogoObra'
import { addObraReg, updateObraReg, deleteObraReg } from './services/obraEjecutada'

const UNIDADES_OBRA = ['ml', 'm²', 'm³', 'unidad', 'global', 'punto', 'kg']
const EMPTY_CAT  = { nombre: '', unidad: 'ml', precio: '' }
const EMPTY_REG  = { catalogoObraId: '', cantidad: '', fecha: new Date().toISOString().slice(0, 10), notas: '' }

/* ── Catálogo tab ── */
function CatalogoTab({ items, onAdd, onEdit, onDelete }) {
  return (
    <div className="page-wrap">
      <div className="pg-toolbar">
        <span className="reg-count">{items.length} ítem{items.length !== 1 ? 's' : ''}</span>
        <button className="btn-primary-sm" onClick={onAdd}>+ Agregar</button>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">👷</div>
          <h3>Sin trabajos en catálogo</h3>
          <p>Agrega los tipos de trabajo con su precio unitario.</p>
        </div>
      ) : (
        <>
          <div className="reg-table-wrap">
            <table className="reg-table">
              <thead>
                <tr>
                  <th>Trabajo</th>
                  <th>Unidad</th>
                  <th style={{ textAlign: 'right' }}>Precio unit.</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="reg-table-row">
                    <td style={{ fontWeight: 600 }}>{item.nombre}</td>
                    <td className="td-fecha">{item.unidad}</td>
                    <td className="td-total">{COP(item.precio)}</td>
                    <td className="td-actions">
                      <button className="tbl-btn-edit" onClick={() => onEdit(item)}>✏️</button>
                      <button className="tbl-btn-del"  onClick={() => onDelete(item.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mat-cards">
            {items.map(item => (
              <div key={item.id} className="mat-card">
                <div className="mat-card-body">
                  <div className="mat-card-name">{item.nombre}</div>
                  <div className="mat-card-sub">{item.unidad}</div>
                </div>
                <div className="mat-card-right">
                  <div className="mat-card-price">{COP(item.precio)}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    <button className="tbl-btn-edit" onClick={() => onEdit(item)}>✏️</button>
                    <button className="tbl-btn-del"  onClick={() => onDelete(item.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Ejecutado tab ── */
function EjecutadoTab({ records, catalogo, onAdd, onEdit, onDelete }) {
  const totalEjecutado = records.reduce((s, r) => s + r.precio * r.cantidad, 0)
  const sorted = [...records].sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <div className="page-wrap">
      <div className="pg-toolbar">
        <span className="reg-count">{records.length} registro{records.length !== 1 ? 's' : ''}</span>
        <button className="btn-primary-sm" onClick={onAdd} disabled={catalogo.length === 0}
          title={catalogo.length === 0 ? 'Primero crea ítems en Catálogo' : ''}>
          + Registrar
        </button>
      </div>

      {records.length > 0 && (
        <div className="obra-total-banner">
          <span className="obra-total-label">Total ejecutado</span>
          <span className="obra-total-val">{COP(totalEjecutado)}</span>
        </div>
      )}

      {records.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📐</div>
          <h3>Sin avance registrado</h3>
          <p>{catalogo.length === 0
            ? 'Primero crea los tipos de trabajo en la pestaña Catálogo.'
            : 'Registra el avance de los trabajos ejecutados.'}</p>
        </div>
      ) : (
        <>
          <div className="reg-table-wrap">
            <table className="reg-table">
              <thead>
                <tr>
                  <th>Trabajo</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => (
                  <tr key={r.id} className="reg-table-row">
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.descripcion}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{COP(r.precio)} / {r.unidad}</div>
                    </td>
                    <td className="td-fecha">{fmtDate(r.fecha)}</td>
                    <td className="td-total" style={{ color: '#374151' }}>{r.cantidad} {r.unidad}</td>
                    <td className="td-total">{COP(r.precio * r.cantidad)}</td>
                    <td className="td-actions">
                      <button className="tbl-btn-edit" onClick={() => onEdit(r)}>✏️</button>
                      <button className="tbl-btn-del"  onClick={() => onDelete(r.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mat-cards">
            {sorted.map(r => (
              <div key={r.id} className="mat-card">
                <div className="mat-card-body">
                  <div className="mat-card-name">{r.descripcion}</div>
                  <div className="mat-card-sub">{r.cantidad} {r.unidad} · {fmtDate(r.fecha)}</div>
                  <div className="mat-card-sub" style={{ fontSize: 11, color: '#9ca3af' }}>{COP(r.precio)} / {r.unidad}</div>
                  {r.notas && <div className="mat-card-sub" style={{ fontStyle: 'italic' }}>{r.notas}</div>}
                </div>
                <div className="mat-card-right">
                  <div className="mat-card-price">{COP(r.precio * r.cantidad)}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    <button className="tbl-btn-edit" onClick={() => onEdit(r)}>✏️</button>
                    <button className="tbl-btn-del"  onClick={() => onDelete(r.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function ObraPage({ catalogoObra, obraEjecutada }) {
  const [activeTab,  setActiveTab]  = useState('ejecutado')
  const [modal,      setModal]      = useState(null)
  const [confirmId,  setConfirmId]  = useState(null)

  function ch(field, val) {
    setModal(m => ({ ...m, form: { ...m.form, [field]: val } }))
  }

  /* Catálogo CRUD */
  function openAddCat()   { setModal({ type: 'cat', mode: 'add',  form: { ...EMPTY_CAT } }) }
  function openEditCat(i) { setModal({ type: 'cat', mode: 'edit', form: { ...i } }) }

  async function submitCat(e) {
    e.preventDefault()
    const { form, mode } = modal
    if (!form.nombre.trim() || !form.precio) return
    const data = { nombre: form.nombre.trim(), unidad: form.unidad, precio: +form.precio }
    mode === 'add' ? await addObraItem(data) : await updateObraItem({ id: form.id, ...data })
    setModal(null)
  }

  /* Ejecutado CRUD */
  function openAddReg()   { setModal({ type: 'reg', mode: 'add',  form: { ...EMPTY_REG } }) }
  function openEditReg(r) {
    setModal({ type: 'reg', mode: 'edit', form: {
      catalogoObraId: r.catalogoObraId,
      cantidad: String(r.cantidad),
      fecha: r.fecha,
      notas: r.notas || '',
      id: r.id,
    }})
  }

  async function submitReg(e) {
    e.preventDefault()
    const { form, mode } = modal
    const cat = catalogoObra.find(c => c.id === form.catalogoObraId)
    if (!cat || !form.cantidad || !form.fecha) return
    const data = {
      catalogoObraId: cat.id,
      descripcion:    cat.nombre,
      unidad:         cat.unidad,
      precio:         cat.precio,
      cantidad:       +form.cantidad,
      fecha:          form.fecha,
      ...(form.notas?.trim() ? { notas: form.notas.trim() } : {}),
    }
    mode === 'add' ? await addObraReg(data) : await updateObraReg({ id: form.id, ...data })
    setModal(null)
  }

  async function doDelete() {
    if (!confirmId) return
    confirmId.type === 'cat' ? await deleteObraItem(confirmId.id) : await deleteObraReg(confirmId.id)
    setConfirmId(null)
  }

  const selectedCat = modal?.type === 'reg'
    ? catalogoObra.find(c => c.id === modal.form.catalogoObraId)
    : null
  const previewTotal = selectedCat && modal?.form.cantidad
    ? selectedCat.precio * +modal.form.cantidad
    : null

  return (
    <div style={{ minHeight: '100%' }}>

      {/* Internal tabs */}
      <div className="fac-tabs">
        <button
          className={`fac-tab fac-tab-obra ${activeTab === 'ejecutado' ? 'fac-tab-active' : ''}`}
          onClick={() => setActiveTab('ejecutado')}>
          <span className="fac-tab-icon">📐</span>
          <span className="fac-tab-label">Obra ejecutada</span>
        </button>
        <button
          className={`fac-tab fac-tab-obra ${activeTab === 'catalogo' ? 'fac-tab-active' : ''}`}
          onClick={() => setActiveTab('catalogo')}>
          <span className="fac-tab-icon">📋</span>
          <span className="fac-tab-label">Catálogo</span>
        </button>
      </div>

      {activeTab === 'ejecutado' && (
        <EjecutadoTab
          records={obraEjecutada} catalogo={catalogoObra}
          onAdd={openAddReg}
          onEdit={openEditReg}
          onDelete={id => setConfirmId({ type: 'reg', id })}
        />
      )}
      {activeTab === 'catalogo' && (
        <CatalogoTab
          items={catalogoObra}
          onAdd={openAddCat}
          onEdit={openEditCat}
          onDelete={id => setConfirmId({ type: 'cat', id })}
        />
      )}

      {/* Modal */}
      {modal && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">
                {modal.type === 'cat'
                  ? (modal.mode === 'add' ? '👷 Nuevo trabajo' : '✏️ Editar trabajo')
                  : (modal.mode === 'add' ? '📐 Registrar avance' : '✏️ Editar registro')}
              </div>
              <button className="btn-close" onClick={() => setModal(null)}>✕</button>
            </div>

            {modal.type === 'cat' ? (
              <form onSubmit={submitCat}>
                <div className="form-body">
                  <div className="field">
                    <label>Nombre del trabajo</label>
                    <input placeholder="Ej: Columnas, Vigas, Pañete..." required autoFocus
                      value={modal.form.nombre} onChange={e => ch('nombre', e.target.value)} />
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Precio ($)</label>
                      <input type="number" min="0" inputMode="numeric" placeholder="0" required
                        value={modal.form.precio} onChange={e => ch('precio', e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Unidad</label>
                      <select value={modal.form.unidad} onChange={e => ch('unidad', e.target.value)}>
                        {UNIDADES_OBRA.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-actions">
                  {modal.mode === 'edit' && (
                    <button type="button" className="btn-del"
                      onClick={() => { setConfirmId({ type: 'cat', id: modal.form.id }); setModal(null) }}>🗑️</button>
                  )}
                  <button type="submit" className="btn-main">
                    {modal.mode === 'add' ? 'Guardar trabajo' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={submitReg}>
                <div className="form-body">
                  <div className="field">
                    <label>Trabajo</label>
                    <div className="obra-picker">
                      {catalogoObra.map(c => (
                        <button key={c.id} type="button"
                          className={`obra-pick-card ${modal.form.catalogoObraId === c.id ? 'obra-pick-active' : ''}`}
                          onClick={() => ch('catalogoObraId', c.id)}>
                          <span className="obra-pick-name">{c.nombre}</span>
                          <span className="obra-pick-price">{COP(c.precio)}</span>
                          <span className="obra-pick-unit">/ {c.unidad}</span>
                        </button>
                      ))}
                    </div>
                    <input type="text" required readOnly tabIndex={-1}
                      value={modal.form.catalogoObraId}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }} />
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Cantidad{selectedCat ? ` (${selectedCat.unidad})` : ''}</label>
                      <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0" required
                        value={modal.form.cantidad} onChange={e => ch('cantidad', e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Fecha</label>
                      <input type="date" required
                        value={modal.form.fecha} onChange={e => ch('fecha', e.target.value)} />
                    </div>
                  </div>
                  {previewTotal !== null && (
                    <div className="obra-calc-preview">
                      Total a cobrar: <strong>{COP(previewTotal)}</strong>
                    </div>
                  )}
                  <div className="field">
                    <label>Notas (opcional)</label>
                    <input placeholder="Observaciones..."
                      value={modal.form.notas} onChange={e => ch('notas', e.target.value)} />
                  </div>
                </div>
                <div className="modal-actions">
                  {modal.mode === 'edit' && (
                    <button type="button" className="btn-del"
                      onClick={() => { setConfirmId({ type: 'reg', id: modal.form.id }); setModal(null) }}>🗑️</button>
                  )}
                  <button type="submit" className="btn-main">
                    {modal.mode === 'add' ? 'Guardar registro' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {confirmId && (
        <div className="confirm-overlay" onClick={e => { if (e.target === e.currentTarget) setConfirmId(null) }}>
          <div className="confirm-box">
            <div className="confirm-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3>¿Eliminar este {confirmId.type === 'cat' ? 'trabajo' : 'registro'}?</h3>
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
