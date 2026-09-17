import { useState, useEffect } from 'react'
import './App.css'
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'
import { CATS, PRESUPUESTO, COP, calcTotal, emptyForm, hoy, catOf } from './data'
import Dashboard from './Dashboard'
import Registros from './Registros'
import Modal from './Modal'

function useGastos() {
  const [gastos, setGastos]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'gastos'), (snap) => {
      setGastos(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
      setLoading(false)
    })
    return unsub
  }, [])

  const add = (item) => addDoc(collection(db, 'gastos'), {
    ...item, precio_unitario: +item.precio_unitario,
    cantidad: +(item.cantidad || 1), metros: +(item.metros || 0),
  })

  const save = ({ id, ...data }) => updateDoc(doc(db, 'gastos', id), {
    ...data, precio_unitario: +data.precio_unitario,
    cantidad: +(data.cantidad || 1), metros: +(data.metros || 0),
  })

  const remove = (id) => deleteDoc(doc(db, 'gastos', id))

  return { gastos, loading, add, save, remove }
}

function exportCSV(gastos) {
  const cols = ['# Factura', 'Descripcion', 'Categoria', 'Unidad', 'Precio Unitario', 'Metros', 'Cantidad', 'Total', 'Fecha', 'Notas']
  const rows = gastos.map((g) => [
    g.factura ?? '', g.descripcion,
    CATS.find((c) => c.id === g.categoria)?.label ?? g.categoria,
    g.unidad, g.precio_unitario, g.metros ?? '', g.cantidad,
    calcTotal(g), g.fecha, g.notas ?? '',
  ])
  const csv = [cols, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'gastos_finca.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const { gastos, loading, add, save, remove } = useGastos()
  const [tab, setTab]             = useState('dashboard')
  const [modal, setModal]         = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  function openAdd() {
    setModal({ mode: 'add', form: emptyForm('materiales') })
  }

  function openEdit(g) {
    setModal({ mode: 'edit', form: { ...g, metros: g.metros ?? '', cantidad: g.cantidad ?? '' } })
  }

  function handleSubmit(e) {
    e.preventDefault()
    const { form, mode } = modal
    if (!form.descripcion || !form.precio_unitario) return
    if (mode === 'add') add(form)
    else save(form)
    setModal(null)
  }

  function handleDelete() {
    setConfirmId(modal.form.id)
  }

  function doDelete() {
    remove(confirmId)
    setConfirmId(null)
    setModal(null)
  }

  return (
    <>
      {/* ── HEADER ── */}
      <div className="header">
        <div className="header-top">
          <div>
            <h1>Gastos Finca 🏗️</h1>
            <div className="header-subtitle">Presupuesto: {COP(PRESUPUESTO)}</div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="page-content">
        {loading ? (
          <div className="loading-wrap">
            <div className="loading-spinner" />
            <p>Cargando datos...</p>
          </div>
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard gastos={gastos} />}
            {tab === 'registros' && <Registros gastos={gastos} onEdit={openEdit} onDelete={(id) => setConfirmId(id)} onExport={() => exportCSV(gastos)} />}
          </>
        )}
      </div>

      {/* ── NAV INFERIOR ── */}
      <nav className="bottom-nav">
        <button className={`nav-btn ${tab === 'dashboard' ? 'nav-active' : ''}`} onClick={() => setTab('dashboard')}>
          <span className="nav-icon">📊</span>
          <span className="nav-label">Dashboard</span>
        </button>
        <button className="nav-fab" onClick={openAdd} aria-label="Agregar gasto">
          <span style={{ fontSize: 26, lineHeight: 1 }}>+</span>
        </button>
        <button className={`nav-btn ${tab === 'registros' ? 'nav-active' : ''}`} onClick={() => setTab('registros')}>
          <span className="nav-icon">📋</span>
          <span className="nav-label">Registros</span>
        </button>
      </nav>

      {/* ── MODAL ── */}
      <Modal modal={modal} setModal={setModal} onSubmit={handleSubmit} onDelete={handleDelete} gastos={gastos} />

      {/* ── CONFIRMAR ELIMINAR ── */}
      {confirmId && (
        <div className="confirm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null) }}>
          <div className="confirm-box">
            <div className="confirm-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
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
    </>
  )
}
