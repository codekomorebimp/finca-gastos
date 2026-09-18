const KEY = 'finca_session'

export const saveSession = (session) => localStorage.setItem(KEY, JSON.stringify(session))
export const logout      = ()        => localStorage.removeItem(KEY)
export const getSession  = ()        => { try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null } }
export const isAdmin     = (session) => session?.role === 'admin'
