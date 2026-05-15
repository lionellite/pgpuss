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
      toast.success('Compte créé avec succès ! Vous pouvez vous connecter.')
      navigate('/connexion')
    } catch (e) {
      const msg = e.response?.data
      if (msg?.email) toast.error('Cet email est déjà utilisé.')
      else toast.error("Erreur lors de l'inscription. Vérifiez vos informations.")
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.75rem', color: '#F0F4FF' }}>Créer un compte</h2>
        <p style={{ color: '#8FA3BF', fontSize: '0.875rem', marginTop: '0.3rem' }}>
          Rejoignez la plateforme pour suivre vos plaintes
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3BF' }} />
                <input className="form-input" style={{ paddingLeft: '2.5rem' }} type="text" placeholder="Prénom"
                  {...register('first_name', { required: 'Requis' })} />
              </div>
              {errors.first_name && <span className="form-error">{errors.first_name.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3BF' }} />
                <input className="form-input" style={{ paddingLeft: '2.5rem' }} type="text" placeholder="Nom"
                  {...register('last_name', { required: 'Requis' })} />
              </div>
              {errors.last_name && <span className="form-error">{errors.last_name.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse email</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3BF' }} />
              <input className="form-input" style={{ paddingLeft: '2.5rem' }} type="email" placeholder="exemple@email.com"
                {...register('email', { required: 'Email requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })} />
            </div>
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Téléphone (optionnel)</label>
            <div style={{ position: 'relative' }}>
              <FiPhone style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3BF' }} />
              <input className="form-input" style={{ paddingLeft: '2.5rem' }} type="tel" placeholder="+229 XX XX XX XX"
                {...register('phone')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3BF' }} />
              <input className="form-input" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                type={showPwd ? 'text' : 'password'} placeholder="Min. 8 caractères"
                {...register('password', { required: 'Requis', minLength: { value: 8, message: 'Min. 8 caractères' } })} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#8FA3BF', cursor: 'pointer',
              }}>{showPwd ? <FiEyeOff /> : <FiEye />}</button>
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe</label>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3BF' }} />
              <input className="form-input" style={{ paddingLeft: '2.5rem' }}
                type="password" placeholder="Répétez le mot de passe"
                {...register('password_confirm', {
                  required: 'Requis',
                  validate: v => v === watch('password') || 'Les mots de passe ne correspondent pas'
                })} />
            </div>
            {errors.password_confirm && <span className="form-error">{errors.password_confirm.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
            {isSubmitting ? 'Création...' : "Créer mon compte"}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#8FA3BF' }}>
        Déjà un compte ?{' '}
        <Link to="/connexion" style={{ color: '#00B4D8', fontWeight: 600 }}>Se connecter</Link>
      </p>
    </div>
  )
}
