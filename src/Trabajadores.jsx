import { useState, useEffect, useMemo } from 'react'
import {
  subscribeTrabajadores, addTrabajador, updateTrabajador, deleteTrabajador,
  subscribeAsistencias, setAsistencia,
} from './services/trabajadores'
import { COP } from './data'

const ROLES = {
  dueno:      { label: 'Dueño',        icon: '👑', color: '#92400e', bg: '#fef3c7', border: '#f59e0b' },
  jefe:       { label: 'Jefe de obra', icon: '⚙️', color: '#1e40af', bg: '#dbeafe', border: '#3b82f6' },
  trabajador: { label: 'Trabajador',   icon: '🔨', color: '#374151', bg: '#f3f4f6', border: '#9ca3af' },
}

const EMPTY_FORM = { nombre: '', rol: 'trabajador', telefono: '', jornal: '', activo: true }

function hoy()  { return new Date().toISOString().slice(0, 10) }
function mesDe(d) { return d.slice(0, 7) }

function fmtFecha(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function addDias(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function Trabajadores() {
  const [trabajadores, setTrabajadores] = useState([])
  const [asistencias, setAsistencias]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [subTab, setSubTab]             = useState('lista')
  const [selectedDate, setSelectedDate] = useState(hoy())
  const [modal, setModal]               = useState(null)
  const [confirmId, setConfirmId]       = useState(null)

  useEffect(() => {
    let done = { t: false, a: false }
    const check = () => { if (done.t && done.a) setLoading(false) }

    const u1 = subscribeTrabajadores((data) => {
      const order = ['dueno', 'jefe', 'trabajador']
      setTrabajadores(data.sort((a, b) =>
        order.indexOf(a.rol) - order.indexOf(b.rol) || a.nombre.localeCompare(b.nombre)
      ))
      done.t = true; check()
    })
    const u2 = subscribeAsistencias((data) => {
      setAsistencias(data)
      done.a = true; check()
    })
    return () => { u1(); u2() }
  }, [])

  // Días trabajados por persona en el mes actual
  const statsMap = useMemo(() => {
    const mes = mesDe(hoy())
    const map = {}
    asistencias.forEach((a) => {
      if (a.trabajó && a.fecha?.startsWith(mes))
        map[a.trabajadorId] = (map[a.trabajadorId] || 0) + 1
    })
    return map
  }, [asistencias])

  // Asistencia del día seleccionado
  const asistenciaDelDia = useMemo(() => {
    const map = {}
    asistencias.filter((a) => a.fecha === selectedDate).forEach((a) => {
      map[a.trabajadorId] = a.trabajó
    })
    return map
  }, [asistencias, selectedDate])

  const activos   = trabajadores.filter((t) => t.activo !== false)
  const totalDia  = activos.filter((t) => asistenciaDelDia[t.id] === true)
    .reduce((s, t) => s + +(t.jornal || 0), 0)
  const presentesHoy = Object.values(asistenciaDelDia).filter(Boolean).length

  function change(field, val) {
    setModal((m) => ({ ...m, form: { ...m.form, [field]: val } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { form, mode } = modal
    if (!form.nombre.trim()) return
    const data = {
      nombre: form.nombre.trim(),
      rol: form.rol,
      telefono: form.telefono || '',
      jornal: +(form.jornal || 0),
      activo: form.activo !== false,
    }
    mode === 'add' ? await addTrabajador(data) : await updateTrabajador({ id: form.id, ...data })
    setModal(null)
  }

  async function doDelete() {
    await deleteTrabajador(confirmId)
    setConfirmId(null)
  }

  async function togglePresencia(trabajadorId) {
    const actual = asistenciaDelDia[trabajadorId]
    await setAsistencia(trabajadorId, selectedDate, actual !== true)
  }

  if (loading) return <div className="loading-wrap"><div className="loading-spinner" /><p>Cargando...</p></div>

  return (
    <div className="page-wrap">

      {/* Sub-tabs */}
      <div className="sub-tabs">
        <button className={`sub-tab ${subTab === 'lista' ? 'sub-tab-active' : ''}`}
          onClick={() => setSubTab('lista')}>
          👷 Lista ({trabajadores.length})
        </button>
        <button className={`sub-tab ${subTab === 'asistencia' ? 'sub-tab-active' : ''}`}
          onClick={() => setSubTab('asistencia')}>
          📅 Asistencia
        </button>
      </div>

      {/* ── LISTA ── */}
      {subTab === 'lista' && (
        <>
          <div className="pg-toolbar">
            <span className="reg-count">{trabajadores.length} persona{trabajadores.length !== 1 ? 's' : ''}</span>
            <button className="btn-primary-sm"
              onClick={() => setModal({ mode: 'add', form: { ...EMPTY_FORM } })}>
              + Agregar
            </button>
          </div>

          {trabajadores.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">👷</div>
              <h3>Sin personal registrado</h3>
              <p>Agrega los trabajadores para llevar su asistencia.</p>
            </div>
          ) : (
            <div className="worker-list">
              {trabajadores.map((t) => {
                const role     = ROLES[t.rol] ?? ROLES.trabajador
                const diasMes  = statsMap[t.id] || 0
                const totalMes = diasMes * +(t.jornal || 0)
                return (
                  <div key={t.id} className={`worker-card ${t.activo === false ? 'worker-inactive' : ''}`}>
                    <div className="worker-avatar" style={{ background: role.bg, color: role.color }}>
                      {role.icon}
                    </div>
                    <div className="worker-body">
                      <div className="worker-name-row">
                        <span className="worker-name">{t.nombre}</span>
                        {t.activo === false && <span className="badge badge-gray">Inactivo</span>}
                      </div>
                      <span className="role-badge"
                        style={{ background: role.bg, color: role.color, borderColor: role.border }}>
                        {role.label}
                      </span>
                      <div className="worker-details">
                        {t.telefono && <span className="worker-info">📞 {t.telefono}</span>}
                        {t.jornal > 0 && <span className="worker-info">💰 {COP(t.jornal)}/día</span>}
                      </div>
                      <div className="worker-stats">
                        📅 Este mes: <strong>{diasMes} días</strong>
                        {t.jornal > 0 && <> · <strong>{COP(totalMes)}</strong></>}
                      </div>
                    </div>
                    <div className="worker-actions">
                      <button className="tbl-btn-edit" title="Editar"
                        onClick={() => setModal({ mode: 'edit', form: { ...t } })}>✏️</button>
                      <button className="tbl-btn-del" title="Eliminar"
                        onClick={() => setConfirmId(t.id)}>🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── ASISTENCIA ── */}
      {subTab === 'asistencia' && (
        <>
          <div className="asist-date-nav">
            <button className="asist-nav-btn" onClick={() => setSelectedDate(addDias(selectedDate, -1))}>←</button>
            <div className="asist-date-info">
              <span className="asist-date-text">{fmtFecha(selectedDate)}</span>
              {selectedDate === hoy() && <span className="asist-today-badge">Hoy</span>}
            </div>
            <button className="asist-nav-btn" onClick={() => setSelectedDate(addDias(selectedDate, 1))}
              disabled={selectedDate >= hoy()}>→</button>
          </div>

          {activos.length === 0 ? (
            <div className="empty" style={{ paddingTop: 32 }}>
              <div className="empty-icon">📅</div>
              <h3>Sin trabajadores activos</h3>
              <p>Agrégalos en la pestaña Lista.</p>
            </div>
          ) : (
            <>
              <div className="asist-list">
                {activos.map((t) => {
                  const role    = ROLES[t.rol] ?? ROLES.trabajador
                  const trabajó = asistenciaDelDia[t.id] === true
                  return (
                    <div key={t.id} className="asist-row">
                      <div className="asist-worker-info">
                        <span className="asist-worker-icon" style={{ background: role.bg }}>
                          {role.icon}
                        </span>
                        <div>
                          <div className="asist-worker-name">{t.nombre}</div>
                          <div className="asist-worker-role" style={{ color: role.color }}>{role.label}</div>
                        </div>
                      </div>
                      <div className="asist-right">
                        {t.jornal > 0 && <span className="asist-jornal">{COP(t.jornal)}</span>}
                        <button
                          className={`asist-toggle ${trabajó ? 'asist-toggle-on' : ''}`}
                          onClick={() => togglePresencia(t.id)}
                        >
                          {trabajó ? '✓ Trabajó' : 'No marcado'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="asist-summary">
                <span>{presentesHoy} de {activos.length} trabajaron</span>
                {totalDia > 0 && <span className="asist-summary-total">{COP(totalDia)} del día</span>}
              </div>
            </>
          )}
        </>
      )}

      {/* Modal agregar/editar trabajador */}
      {modal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">{modal.mode === 'add' ? '👷 Nuevo trabajador' : '✏️ Editar trabajador'}</div>
              <button className="btn-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-body">
                <div className="field">
                  <label>Nombre completo</label>
                  <input placeholder="Ej: Juan Pérez" required autoFocus
                    value={modal.form.nombre} onChange={(e) => change('nombre', e.target.value)} />
                </div>

                <div className="field">
                  <label>Rol</label>
                  <div className="role-picker">
                    {Object.entries(ROLES).map(([key, role]) => (
                      <button key={key} type="button"
                        className={`role-btn ${modal.form.rol === key ? 'role-btn-active' : ''}`}
                        style={modal.form.rol === key
                          ? { borderColor: role.border, background: role.bg, color: role.color }
                          : {}}
                        onClick={() => change('rol', key)}>
                        <span style={{ fontSize: 20 }}>{role.icon}</span>
                        <span>{role.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label>Teléfono</label>
                    <input type="tel" placeholder="310 000 0000"
                      value={modal.form.telefono} onChange={(e) => change('telefono', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Jornal / día ($)</label>
                    <input type="number" min="0" inputMode="numeric" placeholder="0"
                      value={modal.form.jornal} onChange={(e) => change('jornal', e.target.value)} />
                  </div>
                </div>

                {modal.mode === 'edit' && (
                  <div className="field">
                    <div className="toggle-row">
                      <div>
                        <div className="toggle-main-label">Trabajador activo</div>
                        <div className="toggle-hint">Los inactivos no aparecen en la asistencia</div>
                      </div>
                      <div className={`toggle ${modal.form.activo !== false ? 'toggle-on' : ''}`}
                        onClick={() => change('activo', modal.form.activo === false)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {modal.mode === 'edit' && (
                  <button type="button" className="btn-del"
                    onClick={() => { setConfirmId(modal.form.id); setModal(null) }}>🗑️</button>
                )}
                <button type="submit" className="btn-main">
                  {modal.mode === 'add' ? 'Guardar trabajador' : 'Guardar cambios'}
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
            <h3>¿Eliminar este trabajador?</h3>
            <p>Sus registros de asistencia se conservarán.</p>
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
