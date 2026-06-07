import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
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
    <div className="auth-form">
      <header className="auth-form__header">
        <span className="material-symbols-outlined auth-form__icon material-symbols-outlined--filled" aria-hidden>
          health_and_safety
        </span>
        <h1 id="login-heading" className="auth-form__title">Bienvenue sur PGP-USS</h1>
        <p className="auth-form__subtitle">Veuillez vous connecter pour accéder à votre espace.</p>
      </header>

      <form className="auth-form__body" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email ou Numéro de téléphone</label>
          <div className="auth-field">
            <span className="material-symbols-outlined auth-field__icon" aria-hidden>person</span>
            <input
              id="email"
              className="form-input auth-field__input"
              type="text"
              autoComplete="username"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-err' : undefined}
              placeholder="Ex: jean.dupont@email.com ou +229..."
              {...register('email', { required: 'Identifiant requis' })}
            />
          </div>
          {errors.email && (
            <span id="email-err" className="form-error" role="alert">{errors.email.message}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Mot de passe</label>
          <div className="auth-field">
            <span className="material-symbols-outlined auth-field__icon" aria-hidden>lock</span>
            <input
              id="password"
              className="form-input auth-field__input"
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'pwd-err' : undefined}
              placeholder="••••••••"
              {...register('password', { required: 'Mot de passe requis' })}
            />
            <button
              type="button"
              className="auth-field__toggle"
              onClick={() => setShowPwd(!showPwd)}
              aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              <span className="material-symbols-outlined" aria-hidden>
                {showPwd ? 'visibility' : 'visibility_off'}
              </span>
            </button>
          </div>
          {errors.password && (
            <span id="pwd-err" className="form-error" role="alert">{errors.password.message}</span>
          )}
        </div>

        <div className="auth-form__row">
          <label className="auth-form__remember">
            <input type="checkbox" {...register('remember')} />
            <span>Se souvenir de moi</span>
          </label>
          <span className="auth-form__forgot">Mot de passe oublié ?</span>
        </div>

        <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
          <span className="material-symbols-outlined" aria-hidden>login</span>
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="auth-form__divider">
        <p>Vous n&apos;avez pas encore de compte ?</p>
        <Link to="/inscription" className="auth-form__secondary-btn">
          <span className="material-symbols-outlined" aria-hidden>person_add</span>
          Créer un compte
        </Link>
        <Link to="/suivi" className="auth-form__muted-link">
          Suivre une plainte sans compte
        </Link>
      </div>

      <details className="auth-form__demo">
        <summary>Comptes de démonstration</summary>
        <ul>
          {[
            { label: 'Usager', email: 'usager@pgpuss.bj', pwd: 'Pgpuss2026!' },
            { label: 'PFE CNHU', email: 'pfe.cnhu@pgpuss.bj', pwd: 'Pgpuss2026!' },
            { label: 'Agent interne', email: 'agent.cnhu@pgpuss.bj', pwd: 'Pgpuss2026!' },
            { label: 'Administrateur', email: 'admin@pgpuss.bj', pwd: 'Pgpuss2026!' },
          ].map((d) => (
            <li key={d.email}>
              <strong>{d.label}</strong> — {d.email} · <code>{d.pwd}</code>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
