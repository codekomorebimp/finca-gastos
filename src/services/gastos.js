import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
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
  })

export const updateGasto = ({ id, ...data }) =>
  updateDoc(doc(db, COLL, id), {
    ...data,
    precio_unitario: +data.precio_unitario,
    cantidad: +(data.cantidad || 1),
    metros: +(data.metros || 0),
  })

export const deleteGasto = (id) => deleteDoc(doc(db, COLL, id))
