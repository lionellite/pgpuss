import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi'
import { DASHBOARD_ROLES } from '../../constants/roles'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password)
      toast.success(`Bienvenue, ${user.first_name} !`)
      const isAgent = DASHBOARD_ROLES.includes(user.role)
      navigate(isAgent ? '/dashboard' : '/espace/plaintes')
    } catch (err) {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail) ? detail[0] : detail
      toast.error(msg || 'Identifiants incorrects.')
    }
  }

  return (
    <div className="login-page">
      <header className="login-page-header">
        <h2 id="login-heading" className="login-page-title">
          Connexion
        </h2>
        <p className="login-page-subtitle">Accédez à votre espace sécurisé</p>
      </header>

      <section className="glass-card login-card" aria-labelledby="login-heading">
        <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email ou Téléphone
            </label>
            <div className="login-input-wrap">
              <FiUser aria-hidden className="login-input-icon" />
              <input
                id="email"
                className="form-input login-input"
                type="text"
                autoComplete="username"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-err' : undefined}
                placeholder="votre.email@exemple.bj ou 60123456"
                {...register('email', { required: 'Identifiant requis' })}
              />
            </div>
            {errors.email && (
              <span id="email-err" className="form-error" role="alert">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Mot de passe
            </label>
            <div className="login-input-wrap">
              <FiLock aria-hidden className="login-input-icon" />
              <input
                id="password"
                className="form-input login-input"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'pwd-err' : undefined}
                placeholder="••••••••"
                {...register('password', { required: 'Mot de passe requis' })}
              />
              <button
                type="button"
                className="login-toggle-pwd"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPwd ? <FiEyeOff aria-hidden /> : <FiEye aria-hidden />}
              </button>
            </div>
            {errors.password && (
              <span id="pwd-err" className="form-error" role="alert">
                {errors.password.message}
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary login-submit" disabled={isSubmitting}>
            <FiLogIn aria-hidden />
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="login-demo-hint">
          <p className="login-demo-title">Comptes de démonstration</p>
          <ul className="login-demo-list">
            {[
              { label: 'Usager', email: 'usager@pgpuss.bj', pwd: 'Pgpuss2026!' },
              { label: 'PFE CNHU', email: 'pfe.cnhu@pgpuss.bj', pwd: 'Pgpuss2026!' },
              { label: 'Agent interne', email: 'agent.cnhu@pgpuss.bj', pwd: 'Pgpuss2026!' },
              { label: 'Administrateur', email: 'admin@pgpuss.bj', pwd: 'Pgpuss2026!' },
            ].map((d) => (
              <li key={d.email}>
                <strong>{d.label}</strong> — {d.email} · <span className="login-demo-pwd">{d.pwd}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="login-footer">
        <p>
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="login-footer-link">
            Créer un compte
          </Link>
        </p>
        <p>
          <Link to="/suivi" className="login-footer-muted">
            Suivre une plainte sans compte
          </Link>
        </p>
      </footer>
    </div>
  )
}
