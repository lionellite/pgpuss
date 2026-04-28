import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()

  const onSubmit = async (data) => {
    try {
      const user = await login(data.email, data.password)
      toast.success(`Bienvenue, ${user.first_name} !`)
      const isAgent = ['AGENT_RECEPTION','GESTIONNAIRE_SERVICE','MEDIATEUR','DIRECTEUR','RESPONSABLE_QUALITE','ADMIN_NATIONAL','AUDITEUR'].includes(user.role)
      navigate(isAgent ? '/dashboard' : '/espace/plaintes')
    } catch {
      toast.error('Email ou mot de passe incorrect.')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--on-surface)', marginBottom: '0.5rem' }}>Connexion</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem', fontWeight: 500 }}>
          Accédez à votre espace personnel
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)' }} htmlFor="email">Adresse email</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>mail</span>
              <input
                id="email"
                className="form-input"
                style={{ paddingLeft: '3rem' }}
                type="email"
                placeholder="exemple@email.com"
                {...register('email', { required: 'Email requis' })}
              />
            </div>
            {errors.email && <span style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 600 }}>{errors.email.message}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--on-surface)' }} htmlFor="password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: '1.25rem' }}>lock</span>
              <input
                id="password"
                className="form-input"
                style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                type={showPwd ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                {...register('password', { required: 'Mot de passe requis' })}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={{
                  position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--outline)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center'
                }}
              >
                <span className="material-symbols-outlined">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <span style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 600 }}>{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', height: '3rem' }}>
            <span className="material-symbols-outlined">login</span> {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', marginBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Comptes démo :</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { label: 'Usager', email: 'usager@pgpuss.bj', pwd: 'usager123' },
              { label: 'Agent', email: 'agent@pgpuss.bj', pwd: 'agent123' },
              { label: 'Admin', email: 'admin@pgpuss.bj', pwd: 'admin123' },
            ].map(d => (
              <div key={d.email} style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{d.label}:</span>
                <span style={{ fontFamily: 'monospace' }}>{d.email} / {d.pwd}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
        Pas encore de compte ?{' '}
        <Link to="/inscription" style={{ color: 'var(--primary)', fontWeight: 700 }}>S'inscrire</Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
        <Link to="/suivi" style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
          Suivre une plainte sans compte <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
        </Link>
      </p>
    </div>
  )
}
