import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi'

const ROLE_LABELS = {
  USAGER: 'Usager / Plaignant',
  AGENT_RECEPTION: 'Agent de réception',
  GESTIONNAIRE_SERVICE: 'Gestionnaire de service',
  MEDIATEUR: 'Médiateur',
  DIRECTEUR: "Directeur d'établissement",
  RESPONSABLE_QUALITE: 'Responsable qualité',
  ADMIN_NATIONAL: 'Administrateur national',
  AUDITEUR: 'Auditeur',
}

export default function ProfilPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')
  const { register: reg1, handleSubmit: hs1, formState: { isSubmitting: s1 } } = useForm({
    defaultValues: { first_name: user?.first_name, last_name: user?.last_name, phone: user?.phone }
  })
  const { register: reg2, handleSubmit: hs2, watch, formState: { errors: e2, isSubmitting: s2 } } = useForm()

  const updateProfile = async (data) => {
    try { await authAPI.updateProfile(data); toast.success('Profil mis à jour') }
    catch { toast.error('Erreur lors de la mise à jour') }
  }

  const changePassword = async (data) => {
    try { await authAPI.changePassword(data); toast.success('Mot de passe modifié') }
    catch (e) {
      const msg = e.response?.data?.old_password?.[0]
      toast.error(msg || 'Erreur lors du changement de mot de passe')
    }
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="page-container" style={{ maxWidth: 640 }}>
        <h1 className="page-title" style={{ marginBottom: '2rem' }}>Mon profil</h1>

        {/* Profile card */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #0077B6, #06D6A0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', color: 'white', fontFamily: 'Outfit', fontWeight: 800,
          }}>{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.25rem' }}>{user?.full_name}</h2>
          <p style={{ color: '#8FA3BF', fontSize: '0.875rem', marginTop: '0.25rem' }}>{user?.email}</p>
          <span className="badge badge-enregistree" style={{ marginTop: '0.75rem' }}>
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {['profile', 'password'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
              {t === 'profile' ? '👤 Informations' : '🔒 Mot de passe'}
            </button>
          ))}
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          {tab === 'profile' && (
            <form onSubmit={hs1(updateProfile)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label"><FiUser style={{ marginRight: '0.3rem' }} />Prénom</label>
                  <input className="form-input" {...reg1('first_name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input className="form-input" {...reg1('last_name')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label"><FiMail style={{ marginRight: '0.3rem' }} />Email</label>
                <input className="form-input" value={user?.email} disabled style={{ opacity: 0.5 }} />
              </div>
              <div className="form-group">
                <label className="form-label"><FiPhone style={{ marginRight: '0.3rem' }} />Téléphone</label>
                <input className="form-input" type="tel" placeholder="+229 XX XX XX XX" {...reg1('phone')} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={s1}>
                {s1 ? 'Mise à jour...' : 'Enregistrer les modifications'}
              </button>
            </form>
          )}

          {tab === 'password' && (
            <form onSubmit={hs2(changePassword)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label"><FiLock style={{ marginRight: '0.3rem' }} />Mot de passe actuel</label>
                <input className="form-input" type="password" {...reg2('old_password', { required: 'Requis' })} />
                {e2.old_password && <span className="form-error">{e2.old_password.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <input className="form-input" type="password"
                  {...reg2('new_password', { required: 'Requis', minLength: { value: 8, message: 'Min. 8 caractères' } })} />
                {e2.new_password && <span className="form-error">{e2.new_password.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer le nouveau mot de passe</label>
                <input className="form-input" type="password"
                  {...reg2('confirm', { validate: v => v === watch('new_password') || 'Les mots de passe ne correspondent pas' })} />
                {e2.confirm && <span className="form-error">{e2.confirm.message}</span>}
              </div>
              <button type="submit" className="btn btn-primary" disabled={s2}>
                {s2 ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
