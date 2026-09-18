import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

const COLL = 'obraEjecutada'

export const subscribeObraEjecutada = (cb) =>
  onSnapshot(collection(db, COLL), (snap) =>
    cb(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
  )

export const addObraReg    = (data)            => addDoc(collection(db, COLL), data)
export const updateObraReg = ({ id, ...data }) => updateDoc(doc(db, COLL, id), data)
export const deleteObraReg = (id)              => deleteDoc(doc(db, COLL, id))
