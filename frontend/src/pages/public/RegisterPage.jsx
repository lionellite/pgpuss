import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      await authAPI.register(data)
      toast.success('Compte créé. Vous pouvez vous connecter.')
      navigate('/connexion')
    } catch (e) {
      const msg = e.response?.data
      if (msg?.email) toast.error('Cet email est déjà utilisé.')
      else if (msg?.phone) toast.error('Ce numéro de téléphone est déjà utilisé.')
      else if (msg?.non_field_errors) toast.error(msg.non_field_errors)
      else toast.error("Erreur lors de l'inscription. Vérifiez vos informations.")
    }
  }

  return (
    <div>
      <header className="login-page-header">
        <h1 className="login-page-title">Créer un compte</h1>
        <p className="login-page-subtitle">
          Rejoignez la plateforme pour suivre vos plaintes en toute sécurité
        </p>
      </header>

      <section className="glass-card login-card">
        <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="first_name">Prénom</label>
              <input
                id="first_name"
                className="form-input"
                type="text"
                autoComplete="given-name"
                {...register('first_name', { required: 'Requis' })}
              />
              {errors.first_name && <span className="form-error" role="alert">{errors.first_name.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="last_name">Nom</label>
              <input
                id="last_name"
                className="form-input"
                type="text"
                autoComplete="family-name"
                {...register('last_name', { required: 'Requis' })}
              />
              {errors.last_name && <span className="form-error" role="alert">{errors.last_name.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Adresse email</label>
            <input
              id="email"
              className="form-input"
              type="email"
              autoComplete="email"
              placeholder="exemple@email.bj"
              {...register('email', {
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' },
                validate: (val) => {
                  if (!val && !watch('phone')) return 'Indiquez un email ou un téléphone'
                  return true
                },
              })}
            />
            {errors.email && <span className="form-error" role="alert">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Téléphone</label>
            <input
              id="phone"
              className="form-input"
              type="tel"
              autoComplete="tel"
              placeholder="+229 XX XX XX XX"
              {...register('phone')}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <div className="login-input-wrap">
              <input
                id="password"
                className="form-input"
                type={showPwd ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('password', { required: 'Requis', minLength: { value: 8, message: 'Minimum 8 caractères' } })}
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
            {errors.password && <span className="form-error" role="alert">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password_confirm">Confirmer le mot de passe</label>
            <input
              id="password_confirm"
              className="form-input"
              type="password"
              autoComplete="new-password"
              {...register('password_confirm', {
                required: 'Requis',
                validate: (v) => v === watch('password') || 'Les mots de passe ne correspondent pas',
              })}
            />
            {errors.password_confirm && (
              <span className="form-error" role="alert">{errors.password_confirm.message}</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Création en cours…' : 'Créer mon compte'}
          </button>
        </form>
      </section>

      <footer className="login-footer">
        <p>
          Déjà un compte ?{' '}
          <Link to="/connexion" className="login-footer-link">Se connecter</Link>
        </p>
      </footer>
    </div>
  )
}
