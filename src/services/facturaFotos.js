import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'

const COLL = 'facturaFotos'

export const getFotos = async (factura) => {
  const snap = await getDoc(doc(db, COLL, factura))
  return snap.exists() ? (snap.data().fotos ?? []) : []
}

export const subirFoto = async (factura, file) => {
  const nombre = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const storageRef = ref(storage, `facturas/${factura}/${nombre}`)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)

  const docRef = doc(db, COLL, factura)
  const snap = await getDoc(docRef)
  if (snap.exists()) {
    await updateDoc(docRef, { fotos: arrayUnion(url) })
  } else {
    await setDoc(docRef, { factura, fotos: [url] })
  }
  return url
}

export const eliminarFoto = async (factura, url) => {
  await updateDoc(doc(db, COLL, factura), { fotos: arrayRemove(url) })
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch { /* si ya no existe en storage, ignorar */ }
}
