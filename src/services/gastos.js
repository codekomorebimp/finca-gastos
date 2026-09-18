import {
  collection, onSnapshot, addDoc, doc,
  updateDoc, deleteDoc, query, where,
  getDocs, writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLL = 'gastos'

export const subscribeGastos = (cb) =>
  onSnapshot(collection(db, COLL), (snap) =>
    cb(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
  )

export const addGasto = (data) =>
  addDoc(collection(db, COLL), {
    ...data,
    precio_unitario: +data.precio_unitario,
    cantidad:        +(data.cantidad || 1),
    metros:          +(data.metros || 0),
    catalogoId:      data.catalogoId ?? null,
  })

export const updateGasto = ({ id, ...data }) =>
  updateDoc(doc(db, COLL, id), {
    ...data,
    precio_unitario: +data.precio_unitario,
    cantidad:        +(data.cantidad || 1),
    metros:          +(data.metros || 0),
    catalogoId:      data.catalogoId ?? null,
  })

export const deleteGasto = (id) => deleteDoc(doc(db, COLL, id))

/**
 * Sincroniza en lote todos los gastos vinculados al material.
 *
 * Busca por dos criterios:
 *  1. catalogoId == id  → gastos nuevos correctamente vinculados
 *  2. descripcion == nombreOriginal && sin catalogoId  → gastos legacy
 *
 * A todos les aplica los nuevos valores y les asigna catalogoId para
 * que futuras sincronizaciones los encuentren por ID.
 */
export const syncGastosFromCatalogo = async (catalogoId, nombreOriginal, { nombre, unidad, precio, porMetro }) => {
  // 1) Gastos vinculados por ID
  const snap1 = await getDocs(
    query(collection(db, COLL), where('catalogoId', '==', catalogoId))
  )

  // 2) Gastos legacy que coinciden por descripción y no tienen vínculo
  const snap2 = await getDocs(
    query(collection(db, COLL), where('descripcion', '==', nombreOriginal))
  )

  const yaVinculados = new Set(snap1.docs.map((d) => d.id))

  // Excluir los que ya están en snap1 y los que ya tienen otro catalogoId
  const legacy = snap2.docs.filter((d) => {
    if (yaVinculados.has(d.id)) return false
    const cid = d.data().catalogoId
    return !cid || cid === catalogoId
  })

  const todos = [...snap1.docs, ...legacy]
  if (todos.length === 0) return 0

  const batch = writeBatch(db)
  todos.forEach((d) =>
    batch.update(d.ref, {
      catalogoId,                    // establece/confirma el vínculo
      descripcion:     nombre,
      unidad,
      precio_unitario: +precio,
      porMetro:        !!porMetro,
    })
  )
  await batch.commit()
  return todos.length
}
