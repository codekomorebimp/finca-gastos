import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

const COLL = 'catalogoObra'

export const subscribeCatalogoObra = (cb) =>
  onSnapshot(collection(db, COLL), (snap) =>
    cb(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
  )

export const addObraItem    = (data)            => addDoc(collection(db, COLL), data)
export const updateObraItem = ({ id, ...data }) => updateDoc(doc(db, COLL, id), data)
export const deleteObraItem = (id)              => deleteDoc(doc(db, COLL, id))
