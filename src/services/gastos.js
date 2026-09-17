import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs, writeBatch } from 'firebase/firestore'
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
    cantidad: +(data.cantidad || 1),
    metros: +(data.metros || 0),
    catalogoId: data.catalogoId ?? null,
  })

export const updateGasto = ({ id, ...data }) =>
  updateDoc(doc(db, COLL, id), {
    ...data,
    precio_unitario: +data.precio_unitario,
    cantidad: +(data.cantidad || 1),
    metros: +(data.metros || 0),
    catalogoId: data.catalogoId ?? null,
  })

export const deleteGasto = (id) => deleteDoc(doc(db, COLL, id))

/* Actualiza en lote todos los gastos vinculados a un material del catálogo */
export const syncGastosFromCatalogo = async (catalogoId, { nombre, unidad, precio, porMetro }) => {
  const snap = await getDocs(query(collection(db, COLL), where('catalogoId', '==', catalogoId)))
  if (snap.empty) return 0
  const batch = writeBatch(db)
  snap.docs.forEach((d) =>
    batch.update(d.ref, {
      descripcion:     nombre,
      unidad,
      precio_unitario: +precio,
      porMetro:        !!porMetro,
    })
  )
  await batch.commit()
  return snap.size
}
