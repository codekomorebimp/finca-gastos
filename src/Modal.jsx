import { useState } from 'react'
import { CATS, COP, calcTotal, esPorMetro, emptyForm, unidadesFor } from './data'

function itemVacio(cat = 'materiales') {
  return {
    descripcion: '', categoria: cat,
    unidad: cat === 'mano_obra' ? 'día' : 'unidad',
    porMetro: false, catalogoId: null,
    precio_unitario: '', metros: '', cantidad: '', notas: '',
  }
}

function ItemForm({ item, onChange, catalogo, gastos, factura }) {
  const showMetros   = item.categoria === 'materiales' ? !!item.porMetro : esPorMetro(item.unidad)
  const totalVal     = calcTotal({ ...item, factura })
  const factDuplicada = factura?.trim() && item.descripcion?.trim() &&
    gastos.some(g =>
      g.factura?.trim() === factura.trim() &&
      g.descripcion?.trim().toLowerCase() === item.descripcion.trim().toLowerCase()
    )

  function ch(field, value) {
    const next = { ...item, [field]: value }
    if (field === 'categoria') {
      const units = unidadesFor(value)
      if (!units.includes(next.unidad)) next.unidad = units[0]
      if (value !== 'materiales') next.catalogoId = null
    }
    onChange(next)
  }

  return (
    <>
      {/* Selector de categoría */}
      <div className="cat-picker">
        {CATS.map(cat => (
          <button key={cat.id} type="button"
            className={`cat-btn ${item.categoria === cat.id ? `sel-${cat.dotClass}` : ''}`}
            onClick={() => ch('categoria', cat.id)}>
            <span className="cat-btn-icon">{cat.icon}</span>
            <span className="cat-btn-label">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="form-body" style={{ paddingTop: 0 }}>
        {item.categoria === 'materiales' ? (
          /* Materiales: el select ES la descripción */
          <div className="field">
            <label>Material</label>
            <select value={item.catalogoId || ''} onChange={e => {
              const found = catalogo.find(c => c.id === e.target.value)
              if (!found) return
              onChange({ ...item, catalogoId: found.id, descripcion: found.nombre, unidad: found.unidad, porMetro: !!found.porMetro, precio_unitario: String(found.precio), metros: '', cantidad: '' })
            }}>
              <option value="">{catalogo.length === 0 ? 'Sin materiales en Catálogo' : 'Selecciona un material...'}</option>
              {catalogo.map(c => <option key={c.id} value={c.id}>{c.nombre}  ({COP(c.precio)} / {c.unidad})</option>)}
            </select>
          </div>
        ) : (
          /* Mano de obra / Otro: descripción libre */
          <div className="field">
            <label>Descripción</label>
            <input placeholder={item.categoria === 'mano_obra' ? 'Ej: Maestro Pedro - cimentación' : 'Ej: Transporte de materiales'}
              value={item.descripcion} onChange={e => ch('descripcion', e.target.value)} required />
          </div>
        )}

        <div className="field-row">
          <div className="field">
            <label>Precio / {item.unidad || 'unidad'} ($)</label>
            <input type="number" min="0" inputMode="numeric" placeholder="0"
              value={item.precio_unitario} onChange={e => ch('precio_unitario', e.target.value)} required />
          </div>
          <div className="field">
            <label>{showMetros ? `Metros (${item.unidad})` : 'Cantidad'}</label>
            <input type="number" min="0" step="any" inputMode="decimal" placeholder="0"
              value={showMetros ? item.metros : item.cantidad}
              onChange={e => ch(showMetros ? 'metros' : 'cantidad', e.target.value)} required />
          </div>
        </div>

        {showMetros && (
          <div className="field">
            <label>Cantidad de piezas</label>
            <input type="number" min="1" step="1" inputMode="numeric" placeholder="1"
              value={item.cantidad} onChange={e => ch('cantidad', e.target.value)} />
          </div>
        )}

        <div className="field-row">
          {item.categoria === 'materiales' ? (
            <div className="field">
              <label>Unidad</label>
              <div className="unit-readonly">
                {item.unidad || '—'}
                {showMetros && <span className="unit-readonly-hint">× metros</span>}
              </div>
            </div>
          ) : (
            <div className="field">
              <label>Unidad</label>
              <select value={item.unidad} onChange={e => ch('unidad', e.target.value)}>
                {unidadesFor(item.categoria).map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          )}
          <div className="field">
            <label>Notas <span className="field-optional">— opcional</span></label>
            <input placeholder="Proveedor, obs..."
              value={item.notas} onChange={e => ch('notas', e.target.value)} />
          </div>
        </div>

        {factDuplicada && (
          <div className="field-error">Este material ya está en la factura {factura}</div>
        )}

        {item.precio_unitario && (showMetros ? item.metros : item.cantidad) && (
          <div className="total-preview">
            <div className="total-preview-label">
              {showMetros
                ? `${COP(item.precio_unitario)} × ${item.metros} ${item.unidad}${+item.cantidad > 1 ? ` × ${item.cantidad} pzas` : ''}`
                : `${COP(item.precio_unitario)} × ${item.cantidad}`}
            </div>
            <div className="total-preview-val">{COP(totalVal)}</div>
          </div>
        )}
      </div>
    </>
  )
}

export default function Modal({ modal, setModal, onSubmit, onBatchSubmit, onDelete, gastos = [], catalogo = [] }) {
  const [batchItems, setBatchItems] = useState([])
  const [curItem,    setCurItem]    = useState(null)

  if (!modal) return null
  const { form, mode } = modal
  const isAdd = mode === 'add'

  // En modo edición usa el flujo original
  if (!isAdd) {
    function change(field, value) {
      setModal(m => {
        const next = { ...m.form, [field]: value }
        if (field === 'categoria') {
          const units = unidadesFor(value)
          if (!units.includes(next.unidad)) next.unidad = units[0]
          if (value !== 'materiales') next.catalogoId = null
        }
        return { ...m, form: next }
      })
    }
    const showMetros   = form.categoria === 'materiales' ? !!form.porMetro : esPorMetro(form.unidad)
    const totalVal     = calcTotal(form)
    const factDuplicada = form.factura?.trim() && form.descripcion?.trim() &&
      gastos.some(g =>
        g.factura?.trim() === form.factura.trim() &&
        g.descripcion?.trim().toLowerCase() === form.descripcion.trim().toLowerCase() &&
        g.id !== form.id
      )

    return (
      <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
        <div className="modal">
          <div className="modal-handle" />
          <div className="modal-header">
            <div className="modal-title">Editar gasto</div>
            <button className="btn-close" onClick={() => setModal(null)}>✕</button>
          </div>
          <div className="cat-picker">
            {CATS.map(cat => (
              <button key={cat.id} type="button"
                className={`cat-btn ${form.categoria === cat.id ? `sel-${cat.dotClass}` : ''}`}
                onClick={() => change('categoria', cat.id)}>
                <span className="cat-btn-icon">{cat.icon}</span>
                <span className="cat-btn-label">{cat.label}</span>
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit}>
            <div className="form-body">
              {form.categoria === 'materiales' ? (
                <div className="field">
                  <label>Material</label>
                  <select value={form.catalogoId || ''} onChange={e => {
                    const found = catalogo.find(c => c.id === e.target.value)
                    if (!found) return
                    setModal(m => ({ ...m, form: { ...m.form, catalogoId: found.id, descripcion: found.nombre, unidad: found.unidad, porMetro: !!found.porMetro, precio_unitario: String(found.precio), metros: '', cantidad: '' } }))
                  }}>
                    <option value="">{catalogo.length === 0 ? 'Sin materiales en Catálogo' : 'Selecciona un material...'}</option>
                    {catalogo.map(c => <option key={c.id} value={c.id}>{c.nombre}  ({COP(c.precio)} / {c.unidad})</option>)}
                  </select>
                </div>
              ) : (
                <div className="field">
                  <label>Descripción</label>
                  <input placeholder="Descripción" value={form.descripcion} onChange={e => change('descripcion', e.target.value)} required autoFocus />
                </div>
              )}
              <div className="field-row">
                <div className="field">
                  <label>Precio / {form.unidad || 'unidad'} ($)</label>
                  <input type="number" min="0" inputMode="numeric" placeholder="0" value={form.precio_unitario} onChange={e => change('precio_unitario', e.target.value)} required />
                </div>
                <div className="field">
                  <label>{showMetros ? `Metros (${form.unidad})` : 'Cantidad'}</label>
                  <input type="number" min="0" step="any" inputMode="decimal" placeholder="0"
                    value={showMetros ? form.metros : form.cantidad}
                    onChange={e => change(showMetros ? 'metros' : 'cantidad', e.target.value)} required />
                </div>
              </div>
              {showMetros && (
                <div className="field">
                  <label>Cantidad de piezas</label>
                  <input type="number" min="1" step="1" inputMode="numeric" placeholder="1"
                    value={form.cantidad} onChange={e => change('cantidad', e.target.value)} />
                </div>
              )}
              <div className="field-row">
                {form.categoria === 'materiales' ? (
                  <div className="field">
                    <label>Unidad</label>
                    <div className="unit-readonly">{form.unidad || '—'}{showMetros && <span className="unit-readonly-hint">× metros</span>}</div>
                  </div>
                ) : (
                  <div className="field">
                    <label>Unidad</label>
                    <select value={form.unidad} onChange={e => change('unidad', e.target.value)}>
                      {unidadesFor(form.categoria).map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                )}
                <div className="field">
                  <label>Fecha <span className="field-required">*</span></label>
                  <input type="date" required value={form.fecha} onChange={e => change('fecha', e.target.value)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label># Factura <span className="field-required">*</span></label>
                  <input placeholder="Ej: 001" required value={form.factura ?? ''} onChange={e => change('factura', e.target.value)}
                    style={factDuplicada ? { borderColor: '#dc2626', background: '#fff5f5' } : {}} />
                  {factDuplicada && <div className="field-error">Ya existe en factura {form.factura}</div>}
                </div>
                <div className="field">
                  <label>Notas <span className="field-optional">— opcional</span></label>
                  <input placeholder="Proveedor, obs..." value={form.notas} onChange={e => change('notas', e.target.value)} />
                </div>
              </div>
              {form.precio_unitario && (showMetros ? form.metros : form.cantidad) && (
                <div className="total-preview">
                  <div className="total-preview-label">
                    {showMetros ? `${COP(form.precio_unitario)} × ${form.metros} ${form.unidad}${+form.cantidad > 1 ? ` × ${form.cantidad} pzas` : ''}` : `${COP(form.precio_unitario)} × ${form.cantidad}`}
                  </div>
                  <div className="total-preview-val">{COP(totalVal)}</div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-del" onClick={onDelete}>🗑️</button>
              <button type="submit" className="btn-main" disabled={!!factDuplicada} style={factDuplicada ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  /* ── MODO ADD: batch ─────────────────────────────────── */
  const shared     = { factura: form.factura ?? '', fecha: form.fecha }
  const activeItem = curItem ?? itemVacio(form.categoria)
  const loteTotal  = batchItems.reduce((s, it) => s + calcTotal({ ...it, ...shared }), 0)

  function changeShared(field, value) {
    setModal(m => ({ ...m, form: { ...m.form, [field]: value } }))
  }

  function agregarAlLote() {
    if (!activeItem.precio_unitario) return
    const showM = activeItem.categoria === 'materiales' ? !!activeItem.porMetro : esPorMetro(activeItem.unidad)
    if (showM && !activeItem.metros) return
    if (!showM && !activeItem.cantidad) return
    setBatchItems(prev => [...prev, { ...activeItem }])
    setCurItem(itemVacio(activeItem.categoria))
  }

  function quitarDelLote(idx) {
    setBatchItems(prev => prev.filter((_, i) => i !== idx))
  }

  function handleGuardar(e) {
    e.preventDefault()
    if (!shared.factura?.trim() || !shared.fecha) return
    const showM = activeItem.categoria === 'materiales' ? !!activeItem.porMetro : esPorMetro(activeItem.unidad)
    const itemOk = activeItem.precio_unitario &&
      (showM ? activeItem.metros : activeItem.cantidad)

    const todos = [
      ...batchItems,
      ...(itemOk ? [activeItem] : []),
    ].map(it => ({ ...emptyForm(it.categoria), ...it, ...shared }))

    if (todos.length === 0) return
    onBatchSubmit(todos)
    setBatchItems([])
    setCurItem(null)
  }

  const canSave = shared.factura?.trim() && shared.fecha && batchItems.length > 0

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) { setBatchItems([]); setCurItem(null); setModal(null) } }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">Nuevo gasto</div>
          <button className="btn-close" onClick={() => { setBatchItems([]); setCurItem(null); setModal(null) }}>✕</button>
        </div>

        <form onSubmit={handleGuardar}>
          {/* Campos compartidos */}
          <div className="batch-shared">
            <div className="field">
              <label># Factura <span className="field-required">*</span></label>
              <input placeholder="Ej: 001" required value={shared.factura}
                onChange={e => changeShared('factura', e.target.value)} />
            </div>
            <div className="field">
              <label>Fecha <span className="field-required">*</span></label>
              <input type="date" required value={shared.fecha}
                onChange={e => changeShared('fecha', e.target.value)} />
            </div>
          </div>

          {/* Lista del lote */}
          {batchItems.length > 0 && (
            <div className="batch-list">
              <div className="batch-list-title">
                {batchItems.length} item{batchItems.length !== 1 ? 's' : ''} agregado{batchItems.length !== 1 ? 's' : ''}
                <span className="batch-list-total">{COP(loteTotal)}</span>
              </div>
              {batchItems.map((it, i) => {
                const showM = it.categoria === 'materiales' ? !!it.porMetro : esPorMetro(it.unidad)
                return (
                  <div key={i} className="batch-item">
                    <div className="batch-item-info">
                      <span className="batch-item-desc">
                        {it.descripcion || catalogo.find(c => c.id === it.catalogoId)?.nombre || '—'}
                      </span>
                      <span className="batch-item-sub">
                        {showM ? `${it.metros} ${it.unidad}` : `${it.cantidad} ${it.unidad}`}
                        {' · '}{COP(calcTotal({ ...it, ...shared }))}
                      </span>
                    </div>
                    <button type="button" className="batch-item-del" onClick={() => quitarDelLote(i)}>✕</button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Separador */}
          <div className="batch-separator">
            <span>{batchItems.length === 0 ? 'Agrega el primer ítem' : 'Agregar otro ítem'}</span>
          </div>

          {/* Formulario del ítem actual */}
          <ItemForm
            item={activeItem}
            onChange={setCurItem}
            catalogo={catalogo}
            gastos={gastos}
            factura={shared.factura}
          />

          <div className="modal-actions batch-actions">
            <button type="button" className="btn-add-lote" onClick={agregarAlLote}>
              + Agregar otro ítem
            </button>
            <button type="submit" className="btn-main">
              {batchItems.length > 0
                ? `💾 Guardar ${batchItems.length + 1} gastos`
                : '💾 Guardar gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
