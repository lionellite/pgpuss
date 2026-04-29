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
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.75rem', color: '#F0F4FF' }}>Connexion</h2>
        <p style={{ color: '#8FA3BF', fontSize: '0.875rem', marginTop: '0.3rem' }}>
          Accédez à votre espace personnel
        </p>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Adresse email</label>
            <div style={{ position: 'relative' }}>
              <FiMail aria-hidden="true" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3BF' }} />
              <input
                id="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                type="email"
                placeholder="exemple@email.com"
                {...register('email', { required: 'Email requis' })}
              />
            </div>
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <FiLock aria-hidden="true" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#8FA3BF' }} />
              <input
                id="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                type={showPwd ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                {...register('password', { required: 'Mot de passe requis' })}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={{
                  position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#8FA3BF', cursor: 'pointer',
                }}
              >
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
            <FiLogIn /> {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,119,182,0.05)', borderRadius: '10px', border: '1px solid rgba(0,119,182,0.1)' }}>
          <p style={{ fontSize: '0.75rem', color: '#8FA3BF', marginBottom: '0.5rem', fontWeight: 600 }}>Comptes démo :</p>
          {[
            { label: 'Usager', email: 'usager@pgpuss.bj', pwd: 'usager123' },
            { label: 'Agent', email: 'agent@pgpuss.bj', pwd: 'agent123' },
            { label: 'Admin', email: 'admin@pgpuss.bj', pwd: 'admin123' },
          ].map(d => (
            <div key={d.email} style={{ fontSize: '0.75rem', color: '#4A6080', lineHeight: 1.8 }}>
              <span style={{ color: '#00B4D8' }}>{d.label}:</span> {d.email} / {d.pwd}
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#8FA3BF' }}>
        Pas encore de compte ?{' '}
        <Link to="/inscription" style={{ color: '#00B4D8', fontWeight: 600 }}>S'inscrire</Link>
      </p>
      <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.875rem', color: '#8FA3BF' }}>
        <Link to="/suivi" style={{ color: '#8FA3BF' }}>Suivre une plainte sans compte →</Link>
      </p>
    </div>
  )
}
