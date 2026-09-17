import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

const COLL = 'catalogo'

export const subscribeCatalogo = (cb) =>
  onSnapshot(collection(db, COLL), (snap) =>
    cb(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
  )

export const addMaterial    = (data)            => addDoc(collection(db, COLL), data)
export const updateMaterial = ({ id, ...data }) => updateDoc(doc(db, COLL, id), data)
export const deleteMaterial = (id)              => deleteDoc(doc(db, COLL, id))
