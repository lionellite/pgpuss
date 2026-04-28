import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { complaintsAPI, establishmentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { FiUpload, FiX, FiCheckCircle, FiChevronRight, FiChevronLeft, FiVolume2, FiVolumeX, FiCopy, FiCheck } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'

const STEPS = ['Établissement', 'Catégorie', 'Description', 'Identité', 'Confirmation']

const VOCAL_GUIDES = [
  "Étape 1 : Choisissez l'établissement de santé concerné par votre plainte. Vous pouvez filtrer par région.",
  "Étape 2 : Sélectionnez la catégorie qui correspond le mieux à votre problème. Cliquez sur une image.",
  "Étape 3 : Donnez un titre et expliquez ce qui s'est passé en détail. Vous pouvez aussi ajouter des photos.",
  "Étape 4 : Souhaitez-vous rester anonyme ou donner votre nom ? Vos coordonnées nous permettent de vous répondre.",
  "Étape 5 : Vérifiez vos informations une dernière fois avant de valider l'envoi."
]

export default function DepotPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [categories, setCategories] = useState([])
  const [establishments, setEstablishments] = useState([])
  const [regions, setRegions] = useState([])
  const [services, setServices] = useState([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedEst, setSelectedEst] = useState(null)
  const [submitted, setSubmitted] = useState(null)
  const [files, setFiles] = useState([])
  const [vocalEnabled, setVocalEnabled] = useState(false)
  const [copied, setCopied] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      is_anonymous: false,
      channel: 'WEB',
      complainant_name: user ? `${user.first_name} ${user.last_name}` : '',
      complainant_email: user?.email || '',
      complainant_phone: user?.phone || '',
    }
  })

  useEffect(() => {
    Promise.all([
      complaintsAPI.categories(),
      establishmentsAPI.list(),
      establishmentsAPI.regions(),
    ]).then(([cats, ests, regs]) => {
      setCategories(cats.data.results || cats.data)
      setEstablishments(ests.data.results || ests.data)
      setRegions(regs.data.results || regs.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedEst) {
      establishmentsAPI.services(selectedEst).then(({ data }) => {
        setServices(data.results || data)
      }).catch(() => setServices([]))
    }
  }, [selectedEst])

  const estId = watch('establishment')
  useEffect(() => { if (estId) setSelectedEst(estId) }, [estId])

  // Accessibility: Vocal Guide
  useEffect(() => {
    if (vocalEnabled && !submitted) {
      const msg = new SpeechSynthesisUtterance(VOCAL_GUIDES[step])
      msg.lang = 'fr-FR'
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(msg)
    }
  }, [step, vocalEnabled, submitted])

  const toggleVocal = () => {
    if (!vocalEnabled) {
      setVocalEnabled(true)
    } else {
      window.speechSynthesis.cancel()
      setVocalEnabled(false)
    }
  }

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles].slice(0, 5))
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Numéro de ticket copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = async (data) => {
    try {
      const formData = {
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        establishment: data.establishment,
        service: data.service || null,
        is_anonymous: data.is_anonymous,
        complainant_name: data.is_anonymous ? '' : data.complainant_name,
        complainant_email: data.is_anonymous ? '' : data.complainant_email,
        complainant_phone: data.is_anonymous ? '' : data.complainant_phone,
        channel: 'WEB',
      }
      const { data: result } = await complaintsAPI.create(formData)
      setSubmitted(result)
      toast.success('Plainte déposée avec succès!')
      window.scrollTo(0, 0)
    } catch (e) {
      toast.error("Erreur lors du dépôt. Vérifiez tous les champs.")
    }
  }

  const isAnonymous = watch('is_anonymous')
  const catId = watch('category')
  const selectedCategory = categories.find(c => String(c.id) === String(catId))

  if (submitted) {
    return (
      <div style={{ padding: '5rem 0', minHeight: '80vh' }}>
        <div className="page-container">
          <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 2rem',
              background: 'rgba(6,214,160,0.1)', border: '3px solid #06D6A0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem',
            }}>✅</div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: '#F0F4FF', marginBottom: '0.75rem' }}>
              Plainte déposée !
            </h1>
            <p style={{ color: '#8FA3BF', marginBottom: '2rem', lineHeight: 1.7 }}>
              Votre plainte a été enregistrée avec succès. Conservez votre numéro de ticket pour le suivi.
            </p>
            <div style={{
              padding: '1.5rem', background: 'rgba(6,214,160,0.05)',
              border: '2px solid rgba(6,214,160,0.3)', borderRadius: '16px', marginBottom: '2rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#8FA3BF' }}>Votre numéro de ticket</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.5rem', color: '#06D6A0', letterSpacing: '0.1em' }}>
                  {submitted.ticket_number}
                </div>
                <button
                  onClick={() => handleCopy(submitted.ticket_number)}
                  aria-label="Copier le numéro de ticket"
                  style={{
                    background: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.3)',
                    color: '#06D6A0', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(6,214,160,0.2)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(6,214,160,0.1)'}
                >
                  {copied ? <FiCheck size={20} /> : <FiCopy size={20} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate(`/suivi?ticket=${submitted.ticket_number}`)}>
                Suivre ma plainte
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn btn-primary px-8" onClick={() => navigate(`/suivi?ticket=${submitted.ticket_number}`)}>
              Suivre ma plainte
            </button>
            <button className="btn btn-outline px-8" onClick={() => navigate('/')}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-on-surface mb-2">Déposer une plainte</h1>
            <p className="text-on-surface-variant max-w-lg">
              Contribuez à l'amélioration du système de santé en signalant tout dysfonctionnement.
            </p>
          </div>
          <button
            onClick={toggleVocal}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all text-sm font-bold ${
              vocalEnabled ? 'bg-primary text-white' : 'bg-white text-on-surface-variant border border-slate-200 hover:border-primary'
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {vocalEnabled ? 'volume_up' : 'volume_off'}
            </span>
            <span>Aide Vocale</span>
          </button>
        </header>

          {/* Step indicator */}
          <nav aria-label="Étapes de la plainte" className="steps" style={{ marginBottom: '3rem' }}>
            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-primary text-white' : i === step ? 'bg-primary text-white scale-125' : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}>
                  {i < step ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
                </div>
                <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest hidden md:block ${
                  i === step ? 'text-primary' : 'text-slate-400'
                }`}>{s}</span>
              </div>
            ))}
          </nav>

            {/* Step 0 — Établissement */}
            {step === 0 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-on-surface border-l-4 border-primary pl-4">1. Lieu du dysfonctionnement</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-group">
                    <label className="form-label" htmlFor="region-select">Région</label>
                    <select id="region-select" className="form-select" value={selectedRegion} onChange={e => {
                      setSelectedRegion(e.target.value)
                      setValue('establishment', '')
                      setValue('service', '')
                    }}>
                      <option value="">Toutes les régions</option>
                      {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="est-select">Établissement *</label>
                    <select id="est-select" className="form-select" {...register('establishment', { required: 'Requis' })}>
                      <option value="">Sélectionnez un établissement</option>
                      {establishments
                        .filter(e => !selectedRegion || e.region === selectedRegion)
                        .map(e => <option key={e.id} value={e.id}>{e.name} ({e.type_display})</option>)
                      }
                    </select>
                    {errors.establishment && <p className="text-xs text-error mt-2 font-medium">{errors.establishment.message}</p>}
                  </div>
                </div>

                {services.length > 0 && (
                  <div className="form-group animate-in fade-in duration-300">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Service (optionnel)</label>
                    <select className="form-select w-full" {...register('service')}>
                      <option value="">Sélectionnez un service</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

              {/* Step 2 — Description */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: '#111' }}>3. Description de la plainte</h2>
                  <div className="form-group">
                    <label className="form-label" htmlFor="title-input">Titre de la plainte *</label>
                    <input className="form-input" placeholder="Résumez votre plainte en une phrase"
                      {...register('title', { required: 'Titre requis', minLength: { value: 10, message: 'Min. 10 caractères' } })} />
                    {errors.title && <span className="form-error">{errors.title.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description détaillée *</label>
                    <textarea className="form-textarea" style={{ minHeight: 180 }}
                      placeholder="Décrivez le problème en détail : que s'est-il passé ? Quand ? Qui était impliqué ?..."
                      {...register('description', { required: 'Description requise', minLength: { value: 50, message: 'Min. 50 caractères' } })} />
                    {errors.description && <span className="form-error">{errors.description.message}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pièces jointes (optionnel — max 5 fichiers)</label>
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                      padding: '2rem', border: '2px dashed rgba(0,119,182,0.3)', borderRadius: '12px',
                      cursor: 'pointer', background: 'rgba(0,119,182,0.03)',
                      transition: 'all 0.2s',
                    }}>
                      <FiUpload style={{ fontSize: '1.5rem', color: '#8FA3BF' }} aria-hidden="true" />
                      <span style={{ fontSize: '0.875rem', color: '#8FA3BF' }}>Cliquez pour ajouter des fichiers</span>
                      <span style={{ fontSize: '0.75rem', color: '#4A6080' }}>PDF, images — Max 10 MB par fichier</span>
                      <input type="file" multiple onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    </label>
                    {files.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {files.map((f, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.5rem 0.875rem', background: 'rgba(0,119,182,0.05)',
                            borderRadius: '8px', border: '1px solid rgba(0,119,182,0.1)',
                          }}>
                            <span style={{ fontSize: '0.8rem', color: '#8FA3BF' }}>📎 {f.name}</span>
                            <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                              aria-label="Supprimer le fichier"
                              style={{ background: 'none', border: 'none', color: '#EF476F', cursor: 'pointer' }}>
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Description */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-on-surface border-l-4 border-primary pl-4">3. Détails de la situation</h2>

                <div className="form-group">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Objet de la plainte *</label>
                  <input
                    className="form-input w-full"
                    placeholder="Ex: Refus de prise en charge en urgence"
                    {...register('title', { required: 'Un titre est requis', minLength: { value: 10, message: 'Soyez un peu plus précis (min 10 car.)' } })}
                  />
                  {errors.title && <p className="text-xs text-error mt-2 font-medium">{errors.title.message}</p>}
                </div>

                <div className="form-group">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Description détaillée *</label>
                  <textarea
                    className="form-textarea w-full min-h-[160px]"
                    placeholder="Expliquez ce qui s'est passé, quand, et qui était impliqué..."
                    {...register('description', { required: 'La description est obligatoire', minLength: { value: 50, message: 'Donnez plus de détails (min 50 car.)' } })}
                  />
                  {errors.description && <p className="text-xs text-error mt-2 font-medium">{errors.description.message}</p>}
                </div>

                <div className="form-group">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Documents (max 5)</label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl hover:border-primary transition-colors cursor-pointer group relative">
                    <div className="space-y-2 text-center">
                      <span className="material-symbols-outlined text-slate-400 text-4xl group-hover:text-primary transition-colors">cloud_upload</span>
                      <div className="flex text-sm text-slate-600">
                        <span className="font-bold text-primary">Téléverser des fichiers</span>
                        <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                      </div>
                      <p className="text-xs text-slate-400">PDF, JPG, PNG jusqu'à 10MB</p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center">
                            <span className="material-symbols-outlined text-primary mr-2">description</span>
                            <span className="text-xs font-medium text-on-surface truncate max-w-[200px]">{f.name}</span>
                          </div>
                          <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-error hover:bg-error/10 p-1 rounded">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3 — Identité */}
            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-on-surface border-l-4 border-primary pl-4">4. Identité et contact</h2>

                <label className={`flex items-start p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  isAnonymous ? 'border-primary bg-primary/5' : 'border-slate-100 bg-slate-50'
                }`}>
                  <input type="checkbox" {...register('is_anonymous')} className="mt-1 w-5 h-5 rounded text-primary border-slate-300 focus:ring-primary" />
                  <div className="ml-4">
                    <span className="block text-sm font-bold text-on-surface">Déposer de façon anonyme</span>
                    <span className="block text-xs text-on-surface-variant mt-1">Vos données personnelles ne seront pas partagées avec l'établissement.</span>
                  </div>
                </label>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Nom Complet</label>
                      <input className="form-input w-full" placeholder="Prénom et NOM" {...register('complainant_name')} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Email</label>
                      <input className="form-input w-full" type="email" placeholder="votre@email.com" {...register('complainant_email')} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Téléphone</label>
                      <input className="form-input w-full" type="tel" placeholder="+229 00 00 00 00" {...register('complainant_phone')} />
                    </div>
                  </div>
                )}

                {isAnonymous && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start">
                    <span className="material-symbols-outlined text-blue-600 mr-3">info</span>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      L'anonymat protège votre identité mais pourrait ralentir certaines vérifications spécifiques.
                      S'il s'agit d'une urgence vitale, nous recommandons de fournir vos coordonnées.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4 — Confirmation */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-on-surface border-l-4 border-primary pl-4">5. Vérification finale</h2>

                <div className="bg-slate-50 rounded-2xl overflow-hidden divide-y divide-slate-200">
                  {[
                    { label: 'Lieu', value: establishments.find(e => String(e.id) === String(watch('establishment')))?.name },
                    { label: 'Type', value: selectedCategory?.name },
                    { label: 'Sujet', value: watch('title') },
                    { label: 'Anonyme', value: isAnonymous ? 'Oui' : 'Non' },
                    { label: 'Documents', value: files.length > 0 ? `${files.length} fichier(s)` : 'Aucun' },
                  ].map((row, i) => (
                    <div key={i} className="px-6 py-4 flex justify-between gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{row.label}</span>
                      <span className="text-sm font-bold text-on-surface text-right">{row.value || '—'}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <p className="text-[11px] text-primary font-medium leading-relaxed">
                    En soumettant cette plainte, vous certifiez que les informations fournies sont exactes au meilleur de votre connaissance.
                    Toute fausse déclaration intentionnelle peut faire l'objet de poursuites.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-primary py-4 text-lg shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                      Soumission...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="material-symbols-outlined mr-2">send</span>
                      Confirmer et Envoyer
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-12 flex items-center justify-between pt-8 border-t border-slate-100">
              {step > 0 && (
                <button type="button" className="btn btn-ghost px-6" onClick={() => setStep(s => s - 1)}>
                  <span className="material-symbols-outlined mr-2">arrow_back</span>
                  Précédent
                </button>
              )}
              <div className="flex-1"></div>
              {step < 4 && (
                <button
                  type="button"
                  className="btn btn-primary px-8"
                  onClick={() => {
                    // Basic validation before step change
                    if (step === 0 && !watch('establishment')) return toast.error('Choisissez un établissement');
                    if (step === 1 && !watch('category')) return toast.error('Choisissez une catégorie');
                    if (step === 2 && (!watch('title') || !watch('description'))) return toast.error('Complétez la description');
                    setStep(s => s + 1);
                    window.scrollTo(0, 0);
                  }}
                >
                  Suivant
                  <span className="material-symbols-outlined ml-2">arrow_forward</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
