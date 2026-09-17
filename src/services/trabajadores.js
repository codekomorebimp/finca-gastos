import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export const subscribeTrabajadores = (cb) =>
  onSnapshot(collection(db, 'trabajadores'), (snap) =>
    cb(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
  )

export const addTrabajador    = (data)            => addDoc(collection(db, 'trabajadores'), data)
export const updateTrabajador = ({ id, ...data }) => updateDoc(doc(db, 'trabajadores', id), data)
export const deleteTrabajador = (id)              => deleteDoc(doc(db, 'trabajadores', id))

export const subscribeAsistencias = (cb) =>
  onSnapshot(collection(db, 'asistencia'), (snap) =>
    cb(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
  )

// ID compuesto trabajadorId_fecha para upsert sin duplicados
export const setAsistencia = (trabajadorId, fecha, trabajó) =>
  setDoc(doc(db, 'asistencia', `${trabajadorId}_${fecha}`), { trabajadorId, fecha, trabajó })
