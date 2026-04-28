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
      toast.success('Compte créé avec succès ! Vous pouvez vous connecter.')
      navigate('/connexion')
    } catch (e) {
      const msg = e.response?.data
      if (msg?.email) toast.error('Cet email est déjà utilisé.')
      else toast.error("Erreur lors de l'inscription. Vérifiez vos informations.")
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-black text-on-surface tracking-tight">Rejoignez-nous</h2>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Créez votre compte citoyen pour un suivi personnalisé
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Prénom</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                  type="text"
                  placeholder="Jean"
                  {...register('first_name', { required: 'Prénom requis' })}
                />
              </div>
              {errors.first_name && <p className="text-[10px] text-error font-bold mt-1 uppercase tracking-tighter">{errors.first_name.message}</p>}
            </div>
            <div className="form-group">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Nom</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                <input
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                  type="text"
                  placeholder="KOFFI"
                  {...register('last_name', { required: 'Nom requis' })}
                />
              </div>
              {errors.last_name && <p className="text-[10px] text-error font-bold mt-1 uppercase tracking-tighter">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Adresse email</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                type="email"
                placeholder="citoyen@exemple.bj"
                {...register('email', { required: 'Email requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })}
              />
            </div>
            {errors.email && <p className="text-[10px] text-error font-bold mt-1 uppercase tracking-tighter">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Téléphone</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">call</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                type="tel"
                placeholder="+229 00 00 00 00"
                {...register('phone')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Mot de passe</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
              <input
                className="w-full pl-10 pr-10 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', { required: 'Requis', minLength: { value: 8, message: 'Min. 8 caractères' } })}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-lg">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <p className="text-[10px] text-error font-bold mt-1 uppercase tracking-tighter">{errors.password.message}</p>}
          </div>

          <div className="form-group">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Confirmation</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock_reset</span>
              <input
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                type="password"
                placeholder="Répétez le mot de passe"
                {...register('password_confirm', {
                  required: 'Requis',
                  validate: v => v === watch('password') || 'Les mots de passe ne correspondent pas'
                })}
              />
            </div>
            {errors.password_confirm && <p className="text-[10px] text-error font-bold mt-1 uppercase tracking-tighter">{errors.password_confirm.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full btn btn-primary py-3 shadow-lg shadow-primary/20 flex justify-center items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
            ) : (
              <span className="flex items-center">
                <span className="material-symbols-outlined mr-2">person_add</span>
                Créer mon compte
              </span>
            )}
          </button>
        </form>
      </div>

      <p className="text-center mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
        Déjà inscrit ?{' '}
        <Link to="/connexion" className="text-primary hover:underline decoration-2 underline-offset-4">Se connecter</Link>
      </p>
    </div>
  )
}
