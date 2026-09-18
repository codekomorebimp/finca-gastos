import {
  collection, doc, getDoc, getDocs,
  addDoc, query, where,
} from 'firebase/firestore'
import { db } from '../firebase'

const ROLES = 'roles'
const USERS = 'usuarios'

/* ── Login desde Firestore ── */
export const loginFirestore = async (username, password) => {
  const snap = await getDocs(
    query(collection(db, USERS), where('username', '==', username.toLowerCase().trim()))
  )
  if (snap.empty) return null

  const userDoc = snap.docs[0]
  const u = userDoc.data()

  if (u.password !== password || u.activo === false) return null

  // Buscar rol por ID
  const rolDoc = await getDoc(doc(db, ROLES, u.rolId))
  const rolNombre = rolDoc.exists() ? rolDoc.data().nombre : u.rolNombre ?? 'vendedor'

  return {
    id:       userDoc.id,
    username: u.username,
    nombre:   u.nombre,
    role:     rolNombre,   // 'admin' | 'vendedor'
    rolId:    u.rolId,
  }
}

/* ── Siembra inicial de roles y usuarios (una vez por sesión) ── */
let _seeded = false

export const seedAuthData = async () => {
  if (_seeded) return
  _seeded = true

  // ── Roles ──────────────────────────────────────────────
  const rolesSnap = await getDocs(collection(db, ROLES))

  let adminRolId    = rolesSnap.docs.find(d => d.data().nombre === 'admin')?.id
  let vendedorRolId = rolesSnap.docs.find(d => d.data().nombre === 'vendedor')?.id

  if (!adminRolId) {
    const ref = await addDoc(collection(db, ROLES), {
      nombre:      'admin',
      descripcion: 'Acceso completo a todas las secciones',
      permisos:    ['dashboard', 'registros', 'facturas', 'catalogo'],
    })
    adminRolId = ref.id
  }

  if (!vendedorRolId) {
    const ref = await addDoc(collection(db, ROLES), {
      nombre:      'vendedor',
      descripcion: 'Solo puede ver el dashboard',
      permisos:    ['dashboard'],
    })
    vendedorRolId = ref.id
  }

  // ── Usuarios ────────────────────────────────────────────
  const usersSnap = await getDocs(collection(db, USERS))
  if (!usersSnap.empty) return

  const usuarios = [
    { username: 'john',    password: '3368', nombre: 'John',     rolId: adminRolId,    rolNombre: 'admin',    activo: true },
    { username: 'cenery',  password: '3368', nombre: 'Cenery',   rolId: adminRolId,    rolNombre: 'admin',    activo: true },
    { username: 'mariana', password: '3368', nombre: 'Mariana',  rolId: adminRolId,    rolNombre: 'admin',    activo: true },
    { username: 'user',    password: '123',  nombre: 'Vendedor', rolId: vendedorRolId, rolNombre: 'vendedor', activo: true },
  ]

  await Promise.all(usuarios.map(u => addDoc(collection(db, USERS), u)))
}
