const USERS = [
  { username: 'john',    password: '3368', role: 'admin',    nombre: 'John'    },
  { username: 'cenery',  password: '3368', role: 'admin',    nombre: 'Cenery'  },
  { username: 'mariana', password: '3368', role: 'admin',    nombre: 'Mariana' },
  { username: 'user',    password: '123',  role: 'vendedor', nombre: 'Vendedor' },
]

const KEY = 'finca_session'

export const login = (username, password) => {
  const u = USERS.find(
    (u) => u.username === username.toLowerCase().trim() && u.password === password
  )
  if (!u) return null
  const session = { username: u.username, nombre: u.nombre, role: u.role }
  localStorage.setItem(KEY, JSON.stringify(session))
  return session
}

export const logout = () => localStorage.removeItem(KEY)

export const getSession = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

export const isAdmin = (session) => session?.role === 'admin'
