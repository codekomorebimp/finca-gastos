import { CATS, COP, calcTotal, esPorMetro, emptyForm, unidadesFor } from './data'

export default function Modal({ modal, setModal, onSubmit, onDelete, gastos = [], catalogo = [] }) {
  if (!modal) return null

  const { form, mode } = modal

  function change(field, value) {
    setModal((m) => {
      const next = { ...m.form, [field]: value }
      if (field === 'categoria') {
        const units = unidadesFor(value)
        if (!units.includes(next.unidad)) next.unidad = units[0]
      }
      return { ...m, form: next }
    })
  }

  const totalVal   = calcTotal(form)
  const showMetros = form.categoria === 'materiales' ? !!form.porMetro : esPorMetro(form.unidad)

  const factDuplicada = form.factura?.trim() && form.descripcion?.trim() &&
    gastos.some((g) =>
      g.factura?.trim() === form.factura.trim() &&
      g.descripcion?.trim().toLowerCase() === form.descripcion.trim().toLowerCase() &&
      g.id !== form.id
    )

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">{mode === 'add' ? 'Nuevo gasto' : 'Editar gasto'}</div>
          <button className="btn-close" onClick={() => setModal(null)}>✕</button>
        </div>

        <div className="cat-picker">
          {CATS.map((cat) => (
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
            {form.categoria === 'materiales' && (
              <div className="field">
                <label>Seleccionar del catálogo</label>
                <select value="" onChange={(e) => {
                  const item = catalogo.find((c) => c.nombre === e.target.value)
                  if (!item) return
                  setModal((m) => ({
                    ...m,
                    form: { ...m.form, descripcion: item.nombre, unidad: item.unidad, porMetro: !!item.porMetro, precio_unitario: String(item.precio), metros: '', cantidad: '' },
                  }))
                }}>
                  <option value="">
                    {catalogo.length === 0 ? 'Sin materiales (agrégalos en Catálogo)' : 'Elegir material'}
                  </option>
                  {catalogo.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre} — {COP(c.precio)} / {c.unidad}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="field">
              <label>Descripción</label>
              <input
                placeholder={form.categoria === 'mano_obra' ? 'Ej: Maestro Pedro - cimentación' : 'Ej: Cemento gris x 50kg'}
                value={form.descripcion} onChange={(e) => change('descripcion', e.target.value)} required autoFocus />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Precio / {form.unidad || 'unidad'} ($)</label>
                <input type="number" min="0" inputMode="numeric" placeholder="0"
                  value={form.precio_unitario} onChange={(e) => change('precio_unitario', e.target.value)} required />
              </div>
              <div className="field">
                <label>{showMetros ? `Metros (${form.unidad})` : 'Cantidad'}</label>
                <input type="number" min="0" step="any" inputMode="decimal" placeholder="0"
                  value={showMetros ? form.metros : form.cantidad}
                  onChange={(e) => change(showMetros ? 'metros' : 'cantidad', e.target.value)} required />
              </div>
            </div>

            {showMetros && (
              <div className="field">
                <label>Cantidad de piezas</label>
                <input type="number" min="1" step="1" inputMode="numeric" placeholder="1 (si es un solo pedido)"
                  value={form.cantidad} onChange={(e) => change('cantidad', e.target.value)} />
              </div>
            )}

            <div className="field-row">
              {form.categoria === 'materiales' ? (
                <div className="field">
                  <label>Unidad</label>
                  <div className="unit-readonly">
                    {form.unidad || '—'}
                    {showMetros && <span className="unit-readonly-hint">× metros</span>}
                  </div>
                </div>
              ) : (
                <div className="field">
                  <label>Unidad</label>
                  <select value={form.unidad} onChange={(e) => change('unidad', e.target.value)}>
                    {unidadesFor(form.categoria).map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
              )}
              <div className="field">
                <label>Fecha</label>
                <input type="date" value={form.fecha} onChange={(e) => change('fecha', e.target.value)} />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label># Factura</label>
                <input placeholder="Ej: 001"
                  value={form.factura ?? ''}
                  onChange={(e) => change('factura', e.target.value)}
                  style={factDuplicada ? { borderColor: '#dc2626', background: '#fff5f5' } : {}} />
                {factDuplicada && (
                  <div className="field-error">Este elemento ya está en la factura {form.factura}</div>
                )}
              </div>
              <div className="field">
                <label>Notas</label>
                <input placeholder="Proveedor, obs..."
                  value={form.notas} onChange={(e) => change('notas', e.target.value)} />
              </div>
            </div>

            {form.precio_unitario && (showMetros ? form.metros : form.cantidad) && (
              <div className="total-preview">
                <div className="total-preview-label">
                  {showMetros
                    ? `${COP(form.precio_unitario)} × ${form.metros} ${form.unidad}${+form.cantidad > 1 ? ` × ${form.cantidad} pzas` : ''}`
                    : `${COP(form.precio_unitario)} × ${form.cantidad}`}
                </div>
                <div className="total-preview-val">{COP(totalVal)}</div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            {mode === 'edit' && (
              <button type="button" className="btn-del" onClick={onDelete}>🗑️</button>
            )}
            <button type="submit" className="btn-main"
              disabled={!!factDuplicada}
              style={factDuplicada ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
              {mode === 'add' ? 'Guardar gasto' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
