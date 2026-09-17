export const PRESUPUESTO = 120_000_000

export const CATS = [
  { id: 'materiales', label: 'Materiales',   icon: '🧱', dotClass: 'mat',  color: '#2563eb', tabActive: 'active-mat'  },
  { id: 'mano_obra',  label: 'Mano de obra', icon: '👷', dotClass: 'obra', color: '#ea580c', tabActive: 'active-obra' },
  { id: 'otro',       label: 'Otro',          icon: '📦', dotClass: 'otro', color: '#7c3aed', tabActive: 'active-otro' },
]

export const CATALOGO = [
  { nombre: 'Cemento',      unidad: 'bulto',    precio: 36000,  porMetro: false },
  { nombre: 'Concreto',     unidad: 'm³',       precio: 150000, porMetro: true  },
  { nombre: 'Arena peza',   unidad: 'm³',       precio: 150000, porMetro: true  },
  { nombre: 'Barilla 1/2',  unidad: 'm lineal', precio: 27800,  porMetro: true  },
  { nombre: 'Perfil',       unidad: 'm lineal', precio: 24000,  porMetro: true  },
  { nombre: 'Bloquelón',    unidad: 'unidad',   precio: 6200,   porMetro: false },
  { nombre: 'Alambre',      unidad: 'rollo',    precio: 8000,   porMetro: false },
  { nombre: 'Clavo común',  unidad: 'kg',       precio: 6000,   porMetro: false },
  { nombre: 'Acero',        unidad: 'kg',       precio: 11000,  porMetro: false },
  { nombre: 'Tabla 10x25',  unidad: 'unidad',   precio: 240000, porMetro: false },
  { nombre: 'Tabla 10x30',  unidad: 'unidad',   precio: 320000, porMetro: false },
  { nombre: 'Listón',       unidad: 'unidad',   precio: 7000,   porMetro: false },
  { nombre: 'Canes',        unidad: 'unidad',   precio: 33000,  porMetro: false },
  { nombre: 'Estuco',       unidad: 'bulto',    precio: 65000,  porMetro: false },
  { nombre: 'Adobe 15',     unidad: 'unidad',   precio: 3300,   porMetro: false },
  { nombre: 'Adobe 10',     unidad: 'unidad',   precio: 2200,   porMetro: false },
  { nombre: 'Estribo',      unidad: 'unidad',   precio: 2300,   porMetro: false },
  { nombre: 'Malla',        unidad: 'rollo',    precio: 90000,  porMetro: false },
]

export const UNIDADES_MAT  = ['unidad', 'kg', 'ton', 'bulto', 'bolsa', 'm²', 'm³', 'm lineal', 'galón', 'litro', 'caja', 'rollo', 'par', 'otro']
export const UNIDADES_OBRA = ['día', 'hora', 'semana', 'mes', 'jornal', 'obra', 'otro']
export const UNIDADES_OTRO = ['unidad', 'día', 'mes', 'otro']
export const UNIDADES_METRO = ['m', 'm²', 'm³', 'm lineal']

export const esPorMetro = (unidad) => UNIDADES_METRO.includes(unidad)

export const calcTotal = (g) => (g.porMetro ?? esPorMetro(g.unidad))
  ? +g.precio_unitario * +(g.metros || 0) * Math.max(+(g.cantidad || 1), 1)
  : +g.precio_unitario * +(g.cantidad || 0)

export const unidadesFor = (cat) => {
  if (cat === 'mano_obra') return UNIDADES_OBRA
  if (cat === 'otro')      return UNIDADES_OTRO
  return UNIDADES_MAT
}

export const COP = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export const hoy = () => new Date().toISOString().slice(0, 10)

export const fmtDate = (d) => {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export const emptyForm = (cat = 'materiales') => ({
  descripcion: '', categoria: cat, factura: '',
  unidad: cat === 'mano_obra' ? 'día' : 'unidad',
  porMetro: false, catalogoId: null,
  precio_unitario: '', metros: '', cantidad: '', fecha: hoy(), notas: '',
})

export const catOf = (id) => CATS.find((c) => c.id === id) ?? CATS[2]
