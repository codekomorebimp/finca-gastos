import { useState } from 'react'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const ok = await onLogin(username, password)
      if (!ok) setError('Usuario o contraseña incorrectos')
    } catch {
      setError('Error de conexión, intenta de nuevo')
    }
    setLoading(false)
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏗️</div>
          <div className="login-logo-title">Finca JFM</div>
          <div className="login-logo-sub">Control de gastos de construcción</div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Usuario</label>
            <input autoFocus autoComplete="username"
              placeholder="Ingresa tu usuario"
              value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" autoComplete="current-password"
              placeholder="••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <span className="login-spinner" /> : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
