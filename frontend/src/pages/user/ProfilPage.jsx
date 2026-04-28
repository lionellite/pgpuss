import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { authAPI } from '../../api'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  USAGER: 'Citoyen',
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
    try {
      await authAPI.updateProfile(data)
      toast.success('Profil mis à jour avec succès')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const changePassword = async (data) => {
    try {
      await authAPI.changePassword(data)
      toast.success('Mot de passe modifié avec succès')
    } catch (e) {
      const msg = e.response?.data?.old_password?.[0]
      toast.error(msg || 'Erreur lors du changement de mot de passe')
    }
  }

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-black text-on-surface tracking-tight">Paramètres du compte</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gérez vos informations personnelles et votre sécurité</p>
      </header>

      {/* Identity Card */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-error"></div>
        <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-primary/10 text-primary flex items-center justify-center text-3xl font-black border-4 border-white shadow-md">
          {user?.first_name?.[0]}{user?.last_name?.[0]}
        </div>
        <h2 className="text-xl font-black text-on-surface tracking-tight">{user?.full_name}</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">{user?.email}</p>
        <div className="mt-4 flex justify-center">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-slate-200">
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-xl">
        <button
          onClick={() => setTab('profile')}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
            tab === 'profile' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Informations
        </button>
        <button
          onClick={() => setTab('password')}
          className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${
            tab === 'password' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Sécurité
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        {tab === 'profile' && (
          <form onSubmit={hs1(updateProfile)} className="space-y-6 animate-in slide-in-from-left-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Prénom</label>
                <input className="form-input w-full" {...reg1('first_name')} />
              </div>
              <div className="form-group">
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Nom de famille</label>
                <input className="form-input w-full" {...reg1('last_name')} />
              </div>
            </div>

            <div className="form-group">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Email (non modifiable)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">lock</span>
                <input className="form-input w-full pl-10 bg-slate-50 border-transparent text-slate-400 cursor-not-allowed" value={user?.email} disabled />
              </div>
            </div>

            <div className="form-group">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Téléphone</label>
              <input className="form-input w-full" type="tel" placeholder="+229 00 00 00 00" {...reg1('phone')} />
            </div>

            <button type="submit" className="w-full btn btn-primary py-3 flex justify-center items-center shadow-lg shadow-primary/10" disabled={s1}>
              {s1 ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">save</span>
                  Sauvegarder les modifications
                </>
              )}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={hs2(changePassword)} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="form-group">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Mot de passe actuel</label>
              <input className="form-input w-full" type="password" {...reg2('old_password', { required: 'Mot de passe actuel requis' })} />
              {e2.old_password && <p className="text-[10px] text-error font-bold mt-1 uppercase">{e2.old_password.message}</p>}
            </div>

            <div className="form-group">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Nouveau mot de passe</label>
              <input className="form-input w-full" type="password" placeholder="Min. 8 caractères"
                {...reg2('new_password', { required: 'Nouveau mot de passe requis', minLength: { value: 8, message: 'Min. 8 caractères' } })} />
              {e2.new_password && <p className="text-[10px] text-error font-bold mt-1 uppercase">{e2.new_password.message}</p>}
            </div>

            <div className="form-group">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Confirmation</label>
              <input className="form-input w-full" type="password" placeholder="Confirmez le nouveau mot de passe"
                {...reg2('confirm', { validate: v => v === watch('new_password') || 'Les mots de passe ne correspondent pas' })} />
              {e2.confirm && <p className="text-[10px] text-error font-bold mt-1 uppercase">{e2.confirm.message}</p>}
            </div>

            <button type="submit" className="w-full btn btn-primary py-3 flex justify-center items-center shadow-lg shadow-primary/10" disabled={s2}>
              {s2 ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">security</span>
                  Modifier mon mot de passe
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
