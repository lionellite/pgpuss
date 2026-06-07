import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'

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
      if (msg?.email) toast.error(Array.isArray(msg.email) ? msg.email[0] : msg.email)
      else if (msg?.phone) toast.error(Array.isArray(msg.phone) ? msg.phone[0] : msg.phone)
      else if (msg?.password) toast.error(Array.isArray(msg.password) ? msg.password.join(' ') : msg.password)
      else if (msg?.password_confirm) toast.error(msg.password_confirm)
      else if (msg?.non_field_errors) toast.error(Array.isArray(msg.non_field_errors) ? msg.non_field_errors[0] : msg.non_field_errors)
      else toast.error("Erreur lors de l'inscription. Vérifiez vos informations.")
    }
  }

  return (
    <div className="auth-form">
      <header className="auth-form__header">
        <span className="material-symbols-outlined auth-form__icon material-symbols-outlined--filled" aria-hidden>
          person_add
        </span>
        <h1 className="auth-form__title">Créer votre compte</h1>
        <p className="auth-form__subtitle">
          Rejoignez la plateforme pour déposer et suivre vos plaintes en toute sécurité.
        </p>
      </header>

      <form className="auth-form__body" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="auth-form__grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="first_name">Prénom</label>
            <div className="auth-field">
              <span className="material-symbols-outlined auth-field__icon" aria-hidden>badge</span>
              <input
                id="first_name"
                className="form-input auth-field__input"
                type="text"
                autoComplete="given-name"
                {...register('first_name', { required: 'Requis' })}
              />
            </div>
            {errors.first_name && <span className="form-error" role="alert">{errors.first_name.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="last_name">Nom</label>
            <div className="auth-field">
              <span className="material-symbols-outlined auth-field__icon" aria-hidden>badge</span>
              <input
                id="last_name"
                className="form-input auth-field__input"
                type="text"
                autoComplete="family-name"
                {...register('last_name', { required: 'Requis' })}
              />
            </div>
            {errors.last_name && <span className="form-error" role="alert">{errors.last_name.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Adresse email</label>
          <div className="auth-field">
            <span className="material-symbols-outlined auth-field__icon" aria-hidden>mail</span>
            <input
              id="email"
              className="form-input auth-field__input"
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
          </div>
          {errors.email && <span className="form-error" role="alert">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">Téléphone</label>
          <div className="auth-field">
            <span className="material-symbols-outlined auth-field__icon" aria-hidden>phone</span>
            <input
              id="phone"
              className="form-input auth-field__input"
              type="tel"
              autoComplete="tel"
              placeholder="+229 XX XX XX XX"
              {...register('phone')}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Mot de passe</label>
          <div className="auth-field">
            <span className="material-symbols-outlined auth-field__icon" aria-hidden>lock</span>
            <input
              id="password"
              className="form-input auth-field__input"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Minimum 8 caractères"
              {...register('password', { required: 'Requis', minLength: { value: 8, message: 'Minimum 8 caractères' } })}
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
          {errors.password && <span className="form-error" role="alert">{errors.password.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password_confirm">Confirmer le mot de passe</label>
          <div className="auth-field">
            <span className="material-symbols-outlined auth-field__icon" aria-hidden>lock_reset</span>
            <input
              id="password_confirm"
              className="form-input auth-field__input"
              type="password"
              autoComplete="new-password"
              {...register('password_confirm', {
                required: 'Requis',
                validate: (v) => v === watch('password') || 'Les mots de passe ne correspondent pas',
              })}
            />
          </div>
          {errors.password_confirm && (
            <span className="form-error" role="alert">{errors.password_confirm.message}</span>
          )}
        </div>

        <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
          <span className="material-symbols-outlined" aria-hidden>how_to_reg</span>
          {isSubmitting ? 'Création en cours…' : 'Créer mon compte'}
        </button>
      </form>

      <div className="auth-form__divider">
        <p>Déjà un compte ?</p>
        <Link to="/connexion" className="auth-form__secondary-btn">
          <span className="material-symbols-outlined" aria-hidden>login</span>
          Se connecter
        </Link>
      </div>
    </div>
  )
}
